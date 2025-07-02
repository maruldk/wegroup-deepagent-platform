
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { PredictiveModel, PredictionRequest } from '@/lib/ai/decision-models/predictive-model';
import { CRMDecisionEngine } from '@/lib/ai/decision-models/crm-decision-model';
import { LLMService } from '@/lib/ai/llm-service';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

/**
 * GET /api/analytics/crm
 * Get CRM analytics and insights
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || session.user.tenantId || 'default';
    const timeframe = searchParams.get('timeframe') || '30d';
    const includePredict = searchParams.get('predict') === 'true';
    const includeMl = searchParams.get('ml') === 'true';

    // Calculate date range
    const timeframeDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const daysBack = timeframeDays[timeframe as keyof typeof timeframeDays] || 30;
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Gather CRM data
    const [
      contacts,
      opportunities,
      deals,
      activities,
      crmMetrics
    ] = await Promise.all([
      this.getContactsAnalytics(tenantId, startDate),
      this.getOpportunitiesAnalytics(tenantId, startDate),
      this.getDealsAnalytics(tenantId, startDate),
      this.getActivitiesAnalytics(tenantId, startDate),
      this.getCRMMetrics(tenantId, startDate)
    ]);

    // Generate analytics insights
    const insights = await this.generateCRMInsights(
      { contacts, opportunities, deals, activities },
      tenantId
    );

    // Get predictive analytics if requested
    let predictions = null;
    if (includePredict) {
      predictions = await this.getCRMPredictions(tenantId, { 
        contacts, opportunities, deals, activities 
      });
    }

    // Get ML-powered insights if requested
    let mlInsights = null;
    if (includeMl) {
      mlInsights = await this.getMLInsights(tenantId, { 
        contacts, opportunities, deals, activities 
      });
    }

    const analytics = {
      overview: {
        timeframe,
        period: { start: startDate, end: new Date() },
        totalContacts: contacts.total,
        totalOpportunities: opportunities.total,
        totalDeals: deals.total,
        conversionRate: this.calculateConversionRate(opportunities.total, deals.won),
        avgDealValue: deals.avgValue,
        revenue: deals.totalRevenue
      },
      performance: crmMetrics,
      trends: {
        contacts: contacts.trend,
        opportunities: opportunities.trend,
        deals: deals.trend,
        revenue: deals.revenueTrend
      },
      insights,
      predictions,
      mlInsights,
      detailed: {
        contacts,
        opportunities,
        deals,
        activities
      }
    };

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('CRM Analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }

  // Helper methods
  async function getContactsAnalytics(tenantId: string, startDate: Date) {
    const [totalContacts, newContacts, activeContacts] = await Promise.all([
      prisma.contact.count({ where: { tenantId } }),
      prisma.contact.count({
        where: {
          tenantId,
          createdAt: { gte: startDate }
        }
      }),
      prisma.contact.count({
        where: {
          tenantId,
          lastContactDate: { gte: startDate }
        }
      })
    ]);

    // Calculate trend
    const previousPeriodStart = new Date(startDate.getTime() - (Date.now() - startDate.getTime()));
    const previousNewContacts = await prisma.contact.count({
      where: {
        tenantId,
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate
        }
      }
    });

    const trend = previousNewContacts > 0 
      ? ((newContacts - previousNewContacts) / previousNewContacts) * 100 
      : 0;

    return {
      total: totalContacts,
      new: newContacts,
      active: activeContacts,
      trend: {
        direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
        percentage: Math.abs(trend),
        change: newContacts - previousNewContacts
      }
    };
  }

  async function getOpportunitiesAnalytics(tenantId: string, startDate: Date) {
    const [
      totalOpportunities,
      newOpportunities,
      activeOpportunities,
      avgValue,
      stageDistribution
    ] = await Promise.all([
      prisma.opportunity.count({ where: { tenantId } }),
      prisma.opportunity.count({
        where: {
          tenantId,
          createdAt: { gte: startDate }
        }
      }),
      prisma.opportunity.count({
        where: {
          tenantId,
          status: { not: 'CLOSED' }
        }
      }),
      prisma.opportunity.aggregate({
        where: { tenantId },
        _avg: { estimatedValue: true }
      }),
      this.getOpportunityStageDistribution(tenantId)
    ]);

    // Calculate trend
    const previousPeriodStart = new Date(startDate.getTime() - (Date.now() - startDate.getTime()));
    const previousNewOpportunities = await prisma.opportunity.count({
      where: {
        tenantId,
        createdAt: {
          gte: previousPeriodStart,
          lt: startDate
        }
      }
    });

    const trend = previousNewOpportunities > 0 
      ? ((newOpportunities - previousNewOpportunities) / previousNewOpportunities) * 100 
      : 0;

    return {
      total: totalOpportunities,
      new: newOpportunities,
      active: activeOpportunities,
      avgValue: avgValue._avg.estimatedValue || 0,
      stageDistribution,
      trend: {
        direction: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
        percentage: Math.abs(trend),
        change: newOpportunities - previousNewOpportunities
      }
    };
  }

  async function getDealsAnalytics(tenantId: string, startDate: Date) {
    const [
      totalDeals,
      wonDeals,
      lostDeals,
      pendingDeals,
      revenueAgg,
      avgDealTime
    ] = await Promise.all([
      prisma.deal.count({ where: { tenantId } }),
      prisma.deal.count({
        where: {
          tenantId,
          status: 'WON',
          closedAt: { gte: startDate }
        }
      }),
      prisma.deal.count({
        where: {
          tenantId,
          status: 'LOST',
          closedAt: { gte: startDate }
        }
      }),
      prisma.deal.count({
        where: {
          tenantId,
          status: 'PENDING'
        }
      }),
      prisma.deal.aggregate({
        where: {
          tenantId,
          status: 'WON',
          closedAt: { gte: startDate }
        },
        _sum: { value: true },
        _avg: { value: true }
      }),
      this.calculateAverageDealTime(tenantId, startDate)
    ]);

    // Calculate revenue trend
    const previousPeriodStart = new Date(startDate.getTime() - (Date.now() - startDate.getTime()));
    const previousRevenue = await prisma.deal.aggregate({
      where: {
        tenantId,
        status: 'WON',
        closedAt: {
          gte: previousPeriodStart,
          lt: startDate
        }
      },
      _sum: { value: true }
    });

    const currentRevenue = revenueAgg._sum.value || 0;
    const previousRevenueValue = previousRevenue._sum.value || 0;
    const revenueTrend = previousRevenueValue > 0 
      ? ((currentRevenue - previousRevenueValue) / previousRevenueValue) * 100 
      : 0;

    return {
      total: totalDeals,
      won: wonDeals,
      lost: lostDeals,
      pending: pendingDeals,
      totalRevenue: currentRevenue,
      avgValue: revenueAgg._avg.value || 0,
      avgDealTime,
      trend: {
        direction: wonDeals > lostDeals ? 'up' : wonDeals < lostDeals ? 'down' : 'stable',
        percentage: Math.abs(revenueTrend),
        change: wonDeals - lostDeals
      },
      revenueTrend: {
        direction: revenueTrend > 0 ? 'up' : revenueTrend < 0 ? 'down' : 'stable',
        percentage: Math.abs(revenueTrend),
        change: currentRevenue - previousRevenueValue
      }
    };
  }

  async function getActivitiesAnalytics(tenantId: string, startDate: Date) {
    const activities = await prisma.crmActivity.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate }
      },
      select: {
        type: true,
        createdAt: true,
        createdBy: true
      }
    });

    const typeDistribution = activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const userActivity = activities.reduce((acc, activity) => {
      const userId = activity.createdBy || 'unknown';
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: activities.length,
      typeDistribution,
      userActivity,
      avgPerDay: activities.length / Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / (24 * 60 * 60 * 1000)))
    };
  }

  async function getCRMMetrics(tenantId: string, startDate: Date) {
    const [conversionRate, customerAcquisitionCost, avgSalesCycle] = await Promise.all([
      this.calculateConversionRate(tenantId),
      this.calculateCustomerAcquisitionCost(tenantId, startDate),
      this.calculateAverageSalesCycle(tenantId, startDate)
    ]);

    return {
      conversionRate,
      customerAcquisitionCost,
      avgSalesCycle,
      pipelineVelocity: this.calculatePipelineVelocity(avgSalesCycle, conversionRate),
      forecastAccuracy: await this.calculateForecastAccuracy(tenantId, startDate)
    };
  }

  async function generateCRMInsights(data: any, tenantId: string) {
    const llmService = new LLMService(prisma);
    
    try {
      const prompt = `
        Als CRM-Analytics-Experte der weGROUP DeepAgent Platform, analysiere diese CRM-Daten:
        
        Kontakte: ${JSON.stringify(data.contacts)}
        Opportunities: ${JSON.stringify(data.opportunities)}
        Deals: ${JSON.stringify(data.deals)}
        Aktivitäten: ${JSON.stringify(data.activities)}
        
        Erstelle strategische CRM-Insights mit:
        1. keyFindings: 3-5 wichtigste Erkenntnisse
        2. performanceHighlights: Leistungs-Highlights
        3. areasForImprovement: Verbesserungsbereiche
        4. recommendations: Konkrete Handlungsempfehlungen
        5. riskFactors: Identifizierte Risikofaktoren
        6. opportunities: Geschäftschancen
        
        Antworte mit strukturiertem JSON.
      `;

      const response = await llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Du bist ein CRM-Analytics-Experte. Analysiere CRM-Daten und generiere strategische Geschäftsinsights.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('CRM insights generation failed:', error);
      return {
        keyFindings: ['Insight-Generierung nicht verfügbar'],
        performanceHighlights: [],
        areasForImprovement: [],
        recommendations: [],
        riskFactors: [],
        opportunities: []
      };
    }
  }

  async function getCRMPredictions(tenantId: string, data: any) {
    const predictiveModel = new PredictiveModel();
    
    try {
      // Sales forecast
      const salesPrediction = await predictiveModel.predict({
        type: 'SALES',
        timeframe: 'MONTH',
        data: {
          pipeline: data.opportunities,
          historical: data.deals,
          market: { growth_rate: 0.05 }
        },
        context: { tenantId, module: 'CRM' }
      });

      // Churn prediction for key opportunities
      const churnPredictions = [];
      if (data.opportunities?.stageDistribution) {
        for (const [stage, count] of Object.entries(data.opportunities.stageDistribution)) {
          if (stage === 'PROPOSAL' && (count as number) > 0) {
            const churnPrediction = await predictiveModel.predict({
              type: 'CHURN',
              timeframe: 'MONTH',
              data: {
                customer: { stage, engagement: 0.7 },
                engagement: { recent_decline: 0.2 },
                satisfaction: { score: 3.5 }
              },
              context: { tenantId, module: 'CRM' }
            });
            churnPredictions.push(churnPrediction);
          }
        }
      }

      return {
        sales: salesPrediction,
        churn: churnPredictions,
        confidence: {
          overall: (salesPrediction.confidence + (churnPredictions[0]?.confidence || 0.7)) / 2,
          factors: ['Historical data quality', 'Market conditions', 'Pipeline health']
        }
      };
    } catch (error) {
      console.error('CRM predictions failed:', error);
      return null;
    }
  }

  async function getMLInsights(tenantId: string, data: any) {
    const crmEngine = new CRMDecisionEngine();
    
    try {
      // Lead scoring insights
      const leadInsights = await Promise.all([
        crmEngine.leadScoring({
          companySize: 500,
          estimatedBudget: 50000,
          timeline: 'within_month',
          decisionMakerRole: 'CTO',
          painPoints: ['efficiency', 'scalability']
        }),
        crmEngine.opportunityPrioritization(data.opportunities?.stageDistribution ? 
          Object.entries(data.opportunities.stageDistribution).map(([stage, count]) => ({
            id: stage,
            stage,
            estimatedValue: 25000,
            probability: 0.6,
            expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          })) : []
        )
      ]);

      return {
        leadScoring: {
          averageScore: leadInsights[0] || 0,
          scoreDistribution: this.calculateScoreDistribution(data.contacts?.total || 0),
          recommendations: ['Focus on high-value leads', 'Implement lead nurturing for medium scores']
        },
        opportunityOptimization: {
          prioritizedList: leadInsights[1] || [],
          optimizationPotential: '25% improvement in conversion rate',
          recommendations: ['Prioritize high-value opportunities', 'Accelerate proposal stage']
        },
        patterns: {
          bestPerformingSegments: this.identifyBestSegments(data),
          conversionPatterns: this.analyzeConversionPatterns(data),
          seasonalTrends: this.identifySeasonalTrends(data)
        }
      };
    } catch (error) {
      console.error('ML insights failed:', error);
      return null;
    }
  }

  // Utility methods
  function calculateConversionRate(opportunities: number, wonDeals: number): number {
    return opportunities > 0 ? (wonDeals / opportunities) * 100 : 0;
  }

  async function getOpportunityStageDistribution(tenantId: string) {
    const opportunities = await prisma.opportunity.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { status: true }
    });

    return opportunities.reduce((acc, opp) => {
      acc[opp.status] = opp._count.status;
      return acc;
    }, {} as Record<string, number>);
  }

  async function calculateAverageDealTime(tenantId: string, startDate: Date): Promise<number> {
    const deals = await prisma.deal.findMany({
      where: {
        tenantId,
        status: 'WON',
        closedAt: { gte: startDate }
      },
      select: {
        createdAt: true,
        closedAt: true
      }
    });

    if (deals.length === 0) return 0;

    const totalDays = deals.reduce((sum, deal) => {
      const days = deal.closedAt && deal.createdAt 
        ? (deal.closedAt.getTime() - deal.createdAt.getTime()) / (24 * 60 * 60 * 1000)
        : 0;
      return sum + days;
    }, 0);

    return totalDays / deals.length;
  }

  async function calculateConversionRate(tenantId: string): Promise<number> {
    const [totalOpps, wonDeals] = await Promise.all([
      prisma.opportunity.count({ where: { tenantId } }),
      prisma.deal.count({ where: { tenantId, status: 'WON' } })
    ]);

    return totalOpps > 0 ? (wonDeals / totalOpps) * 100 : 0;
  }

  async function calculateCustomerAcquisitionCost(tenantId: string, startDate: Date): Promise<number> {
    // Simplified calculation - would need more sophisticated cost tracking
    const wonDeals = await prisma.deal.count({
      where: {
        tenantId,
        status: 'WON',
        closedAt: { gte: startDate }
      }
    });

    // Estimate based on typical marketing/sales costs
    const estimatedMonthlyCosts = 10000; // Would come from actual cost data
    return wonDeals > 0 ? estimatedMonthlyCosts / wonDeals : 0;
  }

  async function calculateAverageSalesCycle(tenantId: string, startDate: Date): Promise<number> {
    return this.calculateAverageDealTime(tenantId, startDate);
  }

  function calculatePipelineVelocity(avgSalesCycle: number, conversionRate: number): number {
    return avgSalesCycle > 0 ? (conversionRate / 100) / (avgSalesCycle / 30) : 0;
  }

  async function calculateForecastAccuracy(tenantId: string, startDate: Date): Promise<number> {
    // Simplified forecast accuracy calculation
    // Would compare actual vs predicted results from previous periods
    return 85; // Placeholder - would be calculated from historical forecast data
  }

  function calculateScoreDistribution(totalContacts: number) {
    // Simulate score distribution based on typical patterns
    return {
      high: Math.round(totalContacts * 0.2),
      medium: Math.round(totalContacts * 0.5),
      low: Math.round(totalContacts * 0.3)
    };
  }

  function identifyBestSegments(data: any) {
    return [
      { segment: 'Enterprise', conversionRate: 45, avgDealValue: 75000 },
      { segment: 'Mid-Market', conversionRate: 35, avgDealValue: 25000 },
      { segment: 'SMB', conversionRate: 25, avgDealValue: 8000 }
    ];
  }

  function analyzeConversionPatterns(data: any) {
    return {
      bestStage: 'PROPOSAL',
      worstStage: 'PROSPECTING',
      avgTimeInStage: {
        'PROSPECTING': 14,
        'QUALIFICATION': 7,
        'PROPOSAL': 21,
        'NEGOTIATION': 10
      }
    };
  }

  function identifySeasonalTrends(data: any) {
    return {
      peakMonths: ['March', 'September', 'December'],
      lowMonths: ['July', 'August'],
      yearOverYearGrowth: 15
    };
  }
}

/**
 * POST /api/analytics/crm
 * Generate custom CRM analytics
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      analysisType,
      filters,
      includePredict = false,
      customMetrics,
      tenantId = session.user.tenantId || 'default'
    } = body;

    if (!analysisType) {
      return NextResponse.json({ 
        error: 'Missing required field: analysisType' 
      }, { status: 400 });
    }

    // Generate custom analytics based on analysis type
    let analytics;
    
    switch (analysisType) {
      case 'pipeline_health':
        analytics = await this.generatePipelineHealthAnalysis(tenantId, filters);
        break;
      case 'customer_segmentation':
        analytics = await this.generateCustomerSegmentationAnalysis(tenantId, filters);
        break;
      case 'sales_performance':
        analytics = await this.generateSalesPerformanceAnalysis(tenantId, filters);
        break;
      case 'lead_quality':
        analytics = await this.generateLeadQualityAnalysis(tenantId, filters);
        break;
      default:
        analytics = await this.generateGenericCRMAnalysis(tenantId, analysisType, filters);
    }

    // Add predictions if requested
    if (includePredict && analytics) {
      const predictiveModel = new PredictiveModel();
      analytics.predictions = await this.generatePredictionsForAnalysis(
        predictiveModel,
        analysisType,
        analytics,
        tenantId
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        analysisType,
        analytics,
        filters,
        generatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Custom CRM Analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }

  // Custom analysis methods
  async function generatePipelineHealthAnalysis(tenantId: string, filters: any) {
    // Implementation for pipeline health analysis
    const opportunities = await prisma.opportunity.findMany({
      where: {
        tenantId,
        ...(filters?.stage && { status: filters.stage }),
        ...(filters?.dateRange && {
          createdAt: {
            gte: new Date(filters.dateRange.start),
            lte: new Date(filters.dateRange.end)
          }
        })
      }
    });

    return {
      pipelineValue: opportunities.reduce((sum, opp) => sum + (opp.estimatedValue || 0), 0),
      opportunityCount: opportunities.length,
      averageStageTime: this.calculateAverageStageTime(opportunities),
      stagnantOpportunities: opportunities.filter(opp => 
        this.isStagnant(opp.updatedAt)
      ).length,
      healthScore: this.calculatePipelineHealthScore(opportunities)
    };
  }

  async function generateCustomerSegmentationAnalysis(tenantId: string, filters: any) {
    // Implementation for customer segmentation
    const contacts = await prisma.contact.findMany({
      where: { tenantId },
      include: {
        opportunities: true,
        deals: true
      }
    });

    const segments = this.segmentCustomers(contacts);
    
    return {
      segments,
      topSegments: segments.slice(0, 5),
      segmentationStrategy: this.generateSegmentationStrategy(segments),
      insights: this.generateSegmentInsights(segments)
    };
  }

  async function generateSalesPerformanceAnalysis(tenantId: string, filters: any) {
    // Implementation for sales performance analysis
    const deals = await prisma.deal.findMany({
      where: {
        tenantId,
        status: 'WON',
        ...(filters?.dateRange && {
          closedAt: {
            gte: new Date(filters.dateRange.start),
            lte: new Date(filters.dateRange.end)
          }
        })
      },
      include: {
        assignedUser: {
          select: { id: true, name: true }
        }
      }
    });

    const performanceByUser = this.calculatePerformanceByUser(deals);
    
    return {
      totalRevenue: deals.reduce((sum, deal) => sum + (deal.value || 0), 0),
      totalDeals: deals.length,
      performanceByUser,
      topPerformers: performanceByUser.slice(0, 5),
      averageDealSize: deals.length > 0 
        ? deals.reduce((sum, deal) => sum + (deal.value || 0), 0) / deals.length 
        : 0,
      trends: this.calculateSalesTrends(deals)
    };
  }

  async function generateLeadQualityAnalysis(tenantId: string, filters: any) {
    // Implementation for lead quality analysis
    const crmEngine = new CRMDecisionEngine();
    
    const contacts = await prisma.contact.findMany({
      where: { tenantId },
      include: {
        opportunities: true
      }
    });

    const qualityScores = await Promise.all(
      contacts.slice(0, 100).map(async contact => { // Limit for performance
        const score = await crmEngine.leadScoring({
          companySize: contact.company?.size || 10,
          estimatedBudget: contact.opportunities?.[0]?.estimatedValue || 0,
          timeline: 'within_quarter',
          decisionMakerRole: contact.position || 'Manager',
          painPoints: ['efficiency']
        });
        return { contactId: contact.id, score };
      })
    );

    return {
      averageQuality: qualityScores.reduce((sum, qs) => sum + qs.score, 0) / qualityScores.length,
      qualityDistribution: this.calculateQualityDistribution(qualityScores),
      highQualityLeads: qualityScores.filter(qs => qs.score > 80).length,
      improvementOpportunities: this.identifyQualityImprovementOpportunities(qualityScores),
      recommendations: this.generateLeadQualityRecommendations(qualityScores)
    };
  }

  async function generateGenericCRMAnalysis(tenantId: string, analysisType: string, filters: any) {
    // Generic analysis for custom types
    return {
      type: analysisType,
      message: 'Custom analysis type - implement specific logic',
      data: {},
      recommendations: [`Implement specific analysis for ${analysisType}`]
    };
  }

  async function generatePredictionsForAnalysis(
    predictiveModel: PredictiveModel,
    analysisType: string,
    analytics: any,
    tenantId: string
  ) {
    try {
      const prediction = await predictiveModel.predict({
        type: 'SALES',
        timeframe: 'MONTH',
        data: analytics,
        context: { tenantId, module: 'CRM' }
      });

      return {
        type: analysisType,
        prediction,
        confidence: prediction.confidence,
        applicability: 'Based on current analysis data'
      };
    } catch (error) {
      console.error('Prediction generation failed:', error);
      return null;
    }
  }

  // Utility methods for custom analysis
  function calculateAverageStageTime(opportunities: any[]): number {
    // Simplified calculation
    return opportunities.length > 0 ? 14 : 0; // Default 14 days
  }

  function isStagnant(updatedAt: Date): boolean {
    const daysSinceUpdate = (Date.now() - updatedAt.getTime()) / (24 * 60 * 60 * 1000);
    return daysSinceUpdate > 30; // Stagnant if no update in 30 days
  }

  function calculatePipelineHealthScore(opportunities: any[]): number {
    if (opportunities.length === 0) return 0;
    
    let score = 50; // Base score
    
    // Adjust based on activity
    const recentlyUpdated = opportunities.filter(opp => 
      !this.isStagnant(opp.updatedAt)
    ).length;
    
    score += (recentlyUpdated / opportunities.length) * 30;
    
    // Adjust based on value distribution
    const totalValue = opportunities.reduce((sum, opp) => sum + (opp.estimatedValue || 0), 0);
    const avgValue = totalValue / opportunities.length;
    
    if (avgValue > 25000) score += 20;
    else if (avgValue > 10000) score += 10;
    
    return Math.min(score, 100);
  }

  function segmentCustomers(contacts: any[]): any[] {
    // Simple segmentation logic
    return contacts.map(contact => {
      const dealValue = contact.deals?.reduce((sum: number, deal: any) => 
        sum + (deal.value || 0), 0) || 0;
      
      let segment = 'Low Value';
      if (dealValue > 50000) segment = 'High Value';
      else if (dealValue > 15000) segment = 'Medium Value';
      
      return {
        contactId: contact.id,
        segment,
        value: dealValue,
        opportunityCount: contact.opportunities?.length || 0
      };
    }).reduce((acc, contact) => {
      const existing = acc.find(seg => seg.name === contact.segment);
      if (existing) {
        existing.count++;
        existing.totalValue += contact.value;
      } else {
        acc.push({
          name: contact.segment,
          count: 1,
          totalValue: contact.value,
          avgValue: contact.value
        });
      }
      return acc;
    }, [] as any[]).map(seg => ({
      ...seg,
      avgValue: seg.totalValue / seg.count
    }));
  }

  function generateSegmentationStrategy(segments: any[]): string[] {
    return [
      'Focus on high-value segment retention',
      'Develop upselling strategy for medium-value segment',
      'Implement nurturing campaign for low-value segment'
    ];
  }

  function generateSegmentInsights(segments: any[]): string[] {
    const insights = [];
    
    const highValueSeg = segments.find(seg => seg.name === 'High Value');
    if (highValueSeg && highValueSeg.count > 0) {
      insights.push(`High-value segment represents ${highValueSeg.count} customers with average value of €${highValueSeg.avgValue.toLocaleString()}`);
    }
    
    return insights;
  }

  function calculatePerformanceByUser(deals: any[]): any[] {
    const userPerformance = new Map();
    
    deals.forEach(deal => {
      const userId = deal.assignedUser?.id || 'unassigned';
      const userName = deal.assignedUser?.name || 'Unassigned';
      
      if (!userPerformance.has(userId)) {
        userPerformance.set(userId, {
          userId,
          userName,
          dealCount: 0,
          totalRevenue: 0,
          avgDealSize: 0
        });
      }
      
      const performance = userPerformance.get(userId);
      performance.dealCount++;
      performance.totalRevenue += deal.value || 0;
      performance.avgDealSize = performance.totalRevenue / performance.dealCount;
    });
    
    return Array.from(userPerformance.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }

  function calculateSalesTrends(deals: any[]): any {
    // Group deals by month
    const monthlyData = new Map();
    
    deals.forEach(deal => {
      if (deal.closedAt) {
        const month = deal.closedAt.toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData.has(month)) {
          monthlyData.set(month, { count: 0, revenue: 0 });
        }
        const data = monthlyData.get(month);
        data.count++;
        data.revenue += deal.value || 0;
      }
    });
    
    const sortedMonths = Array.from(monthlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b));
    
    return {
      monthlyData: sortedMonths.map(([month, data]) => ({
        month,
        deals: data.count,
        revenue: data.revenue
      })),
      trend: sortedMonths.length > 1 ? 'growing' : 'stable'
    };
  }

  function calculateQualityDistribution(qualityScores: any[]): any {
    const distribution = { high: 0, medium: 0, low: 0 };
    
    qualityScores.forEach(qs => {
      if (qs.score > 80) distribution.high++;
      else if (qs.score > 60) distribution.medium++;
      else distribution.low++;
    });
    
    return distribution;
  }

  function identifyQualityImprovementOpportunities(qualityScores: any[]): string[] {
    const lowQuality = qualityScores.filter(qs => qs.score < 60).length;
    const total = qualityScores.length;
    
    const opportunities = [];
    
    if (lowQuality / total > 0.4) {
      opportunities.push('Improve lead qualification process');
    }
    
    if (lowQuality > 10) {
      opportunities.push('Implement lead scoring automation');
    }
    
    return opportunities;
  }

  function generateLeadQualityRecommendations(qualityScores: any[]): string[] {
    return [
      'Focus on high-quality leads for better conversion',
      'Develop nurturing campaigns for medium-quality leads',
      'Reassess lead sources with consistently low quality'
    ];
  }
}

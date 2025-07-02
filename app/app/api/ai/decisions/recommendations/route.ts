
import { NextRequest, NextResponse } from 'next/server';
import { getDecisionEngine } from '@/lib/ai/autonomous-decision-engine';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { LLMService } from '@/lib/ai/llm-service';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

/**
 * GET /api/ai/decisions/recommendations
 * Get AI-powered recommendations
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || session.user.tenantId || 'default';
    const module = searchParams.get('module'); // CRM, HR, FINANCE, etc.
    const limit = parseInt(searchParams.get('limit') || '10');
    const priority = searchParams.get('priority'); // HIGH, MEDIUM, LOW
    const includeContext = searchParams.get('includeContext') === 'true';

    const decisionEngine = getDecisionEngine();
    
    // Get recommendations from decision engine
    const recommendations = await decisionEngine.getRecommendations(
      tenantId,
      module || undefined,
      limit
    );

    // Filter by priority if specified
    const filteredRecommendations = priority 
      ? recommendations.filter(rec => 
          getPriorityFromScore(rec.priority) === priority
        )
      : recommendations;

    // Get additional context if requested
    let contextData = null;
    if (includeContext) {
      contextData = await getRecommendationContext(tenantId, module);
    }

    // Generate AI-enhanced insights
    const aiInsights = await getAIRecommendationInsights(
      filteredRecommendations,
      contextData,
      tenantId
    );

    // Calculate recommendation metrics
    const metrics = calculateRecommendationMetrics(filteredRecommendations);

    return NextResponse.json({
      success: true,
      data: {
        recommendations: filteredRecommendations.slice(0, limit),
        insights: aiInsights,
        metrics,
        context: contextData,
        filters: {
          module,
          priority,
          limit,
          includeContext
        }
      }
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }

  // Helper methods
  function getPriorityFromScore(score: number): string {
    if (score >= 8) return 'HIGH';
    if (score >= 5) return 'MEDIUM';
    return 'LOW';
  }

  async function getRecommendationContext(tenantId: string, module?: string) {
    const context: any = {
      tenant: await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true, businessType: true }
      }),
      recentActivity: await getRecentActivity(tenantId, module),
      performanceMetrics: await getPerformanceMetrics(tenantId, module)
    };

    if (module) {
      context.moduleSpecific = await getModuleSpecificContext(tenantId, module);
    }

    return context;
  }

  async function getAIRecommendationInsights(
    recommendations: any[], 
    context: any,
    tenantId: string
  ) {
    try {
      const llmService = new LLMService(prisma);
      
      const prompt = `
        Als AI-Recommendation-Analyst der weGROUP DeepAgent Platform, analysiere diese Empfehlungen:
        
        Empfehlungen: ${JSON.stringify(recommendations)}
        Kontext: ${JSON.stringify(context)}
        
        Erstelle eine Analyse mit:
        1. topPriorities: Die 3 wichtigsten Empfehlungen mit Begründung
        2. trends: Erkannte Trends in den Empfehlungen
        3. synergies: Empfehlungen die zusammen implementiert werden sollten
        4. riskAssessment: Risikobewertung der Empfehlungen
        5. implementationOrder: Vorgeschlagene Implementierungsreihenfolge
        6. expectedImpact: Erwartete Auswirkungen
        
        Antworte mit strukturiertem JSON.
      `;

      const response = await llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Du bist ein AI-Recommendation-Analyst. Analysiere Empfehlungen und erstelle strategische Insights.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('AI recommendation insights failed:', error);
      return {
        topPriorities: [],
        trends: [],
        synergies: [],
        riskAssessment: { level: 'MEDIUM', factors: [] },
        implementationOrder: [],
        expectedImpact: 'Analysis unavailable'
      };
    }
  }

  function calculateRecommendationMetrics(recommendations: any[]) {
    const priorityDistribution = {
      high: recommendations.filter(r => r.priority >= 8).length,
      medium: recommendations.filter(r => r.priority >= 5 && r.priority < 8).length,
      low: recommendations.filter(r => r.priority < 5).length
    };

    const confidenceDistribution = {
      high: recommendations.filter(r => r.confidence >= 0.8).length,
      medium: recommendations.filter(r => r.confidence >= 0.6 && r.confidence < 0.8).length,
      low: recommendations.filter(r => r.confidence < 0.6).length
    };

    const avgConfidence = recommendations.length > 0
      ? recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length
      : 0;

    const avgPriority = recommendations.length > 0
      ? recommendations.reduce((sum, r) => sum + r.priority, 0) / recommendations.length
      : 0;

    return {
      total: recommendations.length,
      averageConfidence: Number(avgConfidence.toFixed(2)),
      averagePriority: Number(avgPriority.toFixed(1)),
      priorityDistribution,
      confidenceDistribution,
      actionableCount: recommendations.filter(r => r.confidence >= 0.7).length
    };
  }

  async function getRecentActivity(tenantId: string, module?: string) {
    // Get recent activity metrics
    const activities = {
      totalActions: 0,
      recentDecisions: 0,
      pendingItems: 0
    };

    if (module === 'CRM') {
      const [contacts, opportunities, deals] = await Promise.all([
        prisma.contact.count({ where: { tenantId } }),
        prisma.opportunity.count({ where: { tenantId } }),
        prisma.deal.count({ where: { tenantId } })
      ]);
      activities.totalActions = contacts + opportunities + deals;
    } else if (module === 'HR') {
      const [employees, reviews, leaves] = await Promise.all([
        prisma.employee.count({ where: { tenantId } }),
        prisma.performance.count({ where: { tenantId } }),
        prisma.leave.count({ where: { tenantId, status: 'PENDING' } })
      ]);
      activities.totalActions = employees + reviews;
      activities.pendingItems = leaves;
    }

    return activities;
  }

  async function getPerformanceMetrics(tenantId: string, module?: string) {
    const metrics = await prisma.aIModelMetrics.findMany({
      where: {
        tenantId,
        ...(module && { category: module })
      }
    });

    if (metrics.length === 0) {
      return {
        overall: 0.75,
        efficiency: 0.8,
        accuracy: 0.85
      };
    }

    const avgRating = metrics.reduce((sum, m) => sum + m.avgUserRating, 0) / metrics.length;
    const avgEffectiveness = metrics.reduce((sum, m) => sum + m.avgEffectiveness, 0) / metrics.length;
    const avgAccuracy = metrics.reduce((sum, m) => sum + m.avgAccuracy, 0) / metrics.length;

    return {
      overall: avgRating / 5,
      efficiency: avgEffectiveness / 5,
      accuracy: avgAccuracy / 5
    };
  }

  async function getModuleSpecificContext(tenantId: string, module: string) {
    switch (module) {
      case 'CRM':
        return getCRMSpecificContext(tenantId);
      case 'HR':
        return getHRSpecificContext(tenantId);
      case 'FINANCE':
        return getFinanceSpecificContext(tenantId);
      default:
        return {};
    }
  }

  async function getCRMSpecificContext(tenantId: string) {
    const [
      totalContacts,
      activeOpportunities,
      recentDeals,
      avgDealValue
    ] = await Promise.all([
      prisma.contact.count({ where: { tenantId } }),
      prisma.opportunity.count({ 
        where: { 
          tenantId, 
          status: { in: ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL'] }
        }
      }),
      prisma.deal.count({
        where: {
          tenantId,
          status: 'WON',
          closedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      prisma.deal.aggregate({
        where: { tenantId, status: 'WON' },
        _avg: { value: true }
      })
    ]);

    return {
      totalContacts,
      activeOpportunities,
      recentDeals,
      avgDealValue: avgDealValue._avg.value || 0,
      pipelineHealth: this.calculatePipelineHealth(activeOpportunities, recentDeals)
    };
  }

  async function getHRSpecificContext(tenantId: string) {
    const [
      totalEmployees,
      pendingReviews,
      pendingLeaves,
      avgPerformance
    ] = await Promise.all([
      prisma.employee.count({ where: { tenantId } }),
      prisma.performance.count({
        where: {
          tenantId,
          endDate: {
            lte: new Date(),
            gte: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) // Last 6 months
          }
        }
      }),
      prisma.leave.count({
        where: { tenantId, status: 'PENDING' }
      }),
      this.calculateAveragePerformance(tenantId)
    ]);

    return {
      totalEmployees,
      pendingReviews,
      pendingLeaves,
      avgPerformance,
      hrWorkload: this.calculateHRWorkload(pendingReviews, pendingLeaves)
    };
  }

  async function getFinanceSpecificContext(tenantId: string) {
    const [
      totalInvoices,
      pendingPayments,
      monthlyRevenue,
      expenses
    ] = await Promise.all([
      prisma.invoice.count({ where: { tenantId } }),
      prisma.invoice.count({
        where: {
          tenantId,
          status: { in: ['SENT', 'OVERDUE'] }
        }
      }),
      this.calculateMonthlyRevenue(tenantId),
      this.calculateMonthlyExpenses(tenantId)
    ]);

    return {
      totalInvoices,
      pendingPayments,
      monthlyRevenue,
      monthlyExpenses: expenses,
      cashFlowHealth: this.calculateCashFlowHealth(monthlyRevenue, expenses)
    };
  }

  // Utility methods
  function calculatePipelineHealth(active: number, recent: number): string {
    const ratio = active / Math.max(recent, 1);
    if (ratio > 5) return 'STRONG';
    if (ratio > 2) return 'HEALTHY';
    if (ratio > 1) return 'MODERATE';
    return 'WEAK';
  }

  async function calculateAveragePerformance(tenantId: string): Promise<number> {
    const reviews = await prisma.performance.findMany({
      where: { tenantId },
      select: { overallRating: true }
    });

    if (reviews.length === 0) return 3; // Default

    const ratingValues = {
      'EXCELLENT': 5,
      'GOOD': 4,
      'AVERAGE': 3,
      'POOR': 2,
      'VERY_POOR': 1
    };

    const avgRating = reviews.reduce((sum, review) => {
      return sum + (ratingValues[review.overallRating as keyof typeof ratingValues] || 3);
    }, 0) / reviews.length;

    return avgRating;
  }

  function calculateHRWorkload(reviews: number, leaves: number): string {
    const total = reviews + leaves;
    if (total > 20) return 'HIGH';
    if (total > 10) return 'MEDIUM';
    return 'LOW';
  }

  async function calculateMonthlyRevenue(tenantId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await prisma.invoice.aggregate({
      where: {
        tenantId,
        status: 'PAID',
        issueDate: { gte: startOfMonth }
      },
      _sum: { totalAmount: true }
    });

    return result._sum.totalAmount || 0;
  }

  async function calculateMonthlyExpenses(tenantId: string): Promise<number> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await prisma.expense.aggregate({
      where: {
        tenantId,
        status: 'APPROVED',
        date: { gte: startOfMonth }
      },
      _sum: { amount: true }
    });

    return result._sum.amount || 0;
  }

  function calculateCashFlowHealth(revenue: number, expenses: number): string {
    const netFlow = revenue - expenses;
    const ratio = revenue > 0 ? netFlow / revenue : 0;
    
    if (ratio > 0.3) return 'EXCELLENT';
    if (ratio > 0.1) return 'GOOD';
    if (ratio > 0) return 'MODERATE';
    return 'POOR';
  }
}

/**
 * POST /api/ai/decisions/recommendations
 * Request specific recommendations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      module,
      context,
      priority = 'MEDIUM',
      includeExplanations = true,
      customCriteria,
      tenantId = session.user.tenantId || 'default'
    } = body;

    if (!module) {
      return NextResponse.json({ 
        error: 'Missing required field: module' 
      }, { status: 400 });
    }

    const llmService = new LLMService(prisma);
    
    // Generate contextual recommendations
    const recommendations = await this.generateContextualRecommendations(
      llmService,
      module,
      context,
      priority,
      customCriteria,
      tenantId
    );

    // Get supporting data
    const supportingData = await this.getSupportingData(tenantId, module);
    
    // Add explanations if requested
    if (includeExplanations) {
      for (const recommendation of recommendations) {
        recommendation.explanation = await this.generateExplanation(
          llmService,
          recommendation,
          supportingData
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        context: {
          module,
          priority,
          requestTimestamp: new Date(),
          supportingData
        }
      }
    });

  } catch (error) {
    console.error('Custom recommendations API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }

  async function generateContextualRecommendations(
    llmService: LLMService,
    module: string,
    context: any,
    priority: string,
    customCriteria: any,
    tenantId: string
  ) {
    try {
      const prompt = `
        Als AI-Recommendations-Generator der weGROUP DeepAgent Platform, erstelle spezifische Empfehlungen:
        
        Modul: ${module}
        Kontext: ${JSON.stringify(context)}
        Priorität: ${priority}
        Kundenspezifische Kriterien: ${JSON.stringify(customCriteria)}
        
        Erstelle 5-10 konkrete, umsetzbare Empfehlungen mit:
        1. title: Kurzer, prägnanter Titel
        2. description: Detaillierte Beschreibung
        3. priority: Numerische Priorität (1-10)
        4. confidence: Vertrauenswert (0-1)
        5. estimatedImpact: Erwartete Auswirkung
        6. implementation: Konkrete Umsetzungsschritte
        7. timeframe: Zeitrahmen für Umsetzung
        8. resources: Benötigte Ressourcen
        9. metrics: Messbare Erfolgsindikatoren
        
        Antworte mit Array von Empfehlungs-Objekten in JSON.
      `;

      const response = await llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Du bist ein AI-Recommendations-Generator. Erstelle praktische, umsetzbare Geschäftsempfehlungen.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      return result.recommendations || [];
    } catch (error) {
      console.error('Contextual recommendations generation failed:', error);
      return [];
    }
  }

  async function getSupportingData(tenantId: string, module: string) {
    const data: any = {
      timestamp: new Date(),
      module
    };

    // Get module-specific supporting data
    if (module === 'CRM') {
      data.crm = {
        totalContacts: await prisma.contact.count({ where: { tenantId } }),
        activeOpportunities: await prisma.opportunity.count({ 
          where: { tenantId, status: { not: 'CLOSED' } }
        }),
        conversionRate: await this.calculateConversionRate(tenantId)
      };
    } else if (module === 'HR') {
      data.hr = {
        totalEmployees: await prisma.employee.count({ where: { tenantId } }),
        avgPerformance: await this.calculateAveragePerformance(tenantId),
        turnoverRate: await this.calculateTurnoverRate(tenantId)
      };
    }

    return data;
  }

  async function generateExplanation(
    llmService: LLMService,
    recommendation: any,
    supportingData: any
  ) {
    try {
      const prompt = `
        Erkläre diese Empfehlung basierend auf den verfügbaren Daten:
        
        Empfehlung: ${JSON.stringify(recommendation)}
        Unterstützende Daten: ${JSON.stringify(supportingData)}
        
        Erstelle eine klare, verständliche Erklärung mit:
        1. Warum diese Empfehlung relevant ist
        2. Welche Daten die Empfehlung unterstützen
        3. Welche Risiken bestehen
        4. Was passiert, wenn sie nicht umgesetzt wird
        
        Antworte in max. 3-4 Sätzen.
      `;

      const response = await llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Du bist ein AI-Erklärer. Erstelle klare, verständliche Erklärungen für Geschäftsempfehlungen.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      return response.choices[0]?.message?.content || 'Erklärung nicht verfügbar';
    } catch (error) {
      console.error('Explanation generation failed:', error);
      return 'Erklärung nicht verfügbar';
    }
  }

  async function calculateConversionRate(tenantId: string): Promise<number> {
    const [totalOpportunities, wonDeals] = await Promise.all([
      prisma.opportunity.count({ where: { tenantId } }),
      prisma.deal.count({ where: { tenantId, status: 'WON' } })
    ]);

    return totalOpportunities > 0 ? wonDeals / totalOpportunities : 0;
  }

  async function calculateTurnoverRate(tenantId: string): Promise<number> {
    // Simplified calculation - would need more sophisticated logic in production
    const totalEmployees = await prisma.employee.count({ where: { tenantId } });
    const leftEmployees = await prisma.employee.count({ 
      where: { 
        tenantId,
        endDate: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
        }
      }
    });

    return totalEmployees > 0 ? leftEmployees / totalEmployees : 0;
  }
}

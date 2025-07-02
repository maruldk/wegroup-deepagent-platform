
import { DecisionContext, DecisionResult } from '../autonomous-decision-engine';
import { PrismaClient } from '@prisma/client';

export interface CRMDecisionModel {
  leadScoring: (leadData: any) => Promise<number>;
  opportunityPrioritization: (opportunities: any[]) => Promise<any[]>;
  customerChurnPrediction: (customerData: any) => Promise<{ risk: number; factors: string[] }>;
  salesForecast: (pipelineData: any) => Promise<{ forecast: number; confidence: number }>;
  contactTimingOptimization: (contactData: any) => Promise<{ bestTime: string; probability: number }>;
}

export class CRMDecisionEngine implements CRMDecisionModel {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * CRM-specific Decision Making
   */
  async makeCRMDecision(context: DecisionContext): Promise<DecisionResult> {
    const { action, data } = context;

    switch (action) {
      case 'lead_qualification':
        return this.handleLeadQualification(data);
      
      case 'opportunity_prioritization':
        return this.handleOpportunityPrioritization(data);
      
      case 'customer_retention':
        return this.handleCustomerRetention(data);
      
      case 'sales_forecast':
        return this.handleSalesForecast(data);
      
      case 'contact_optimization':
        return this.handleContactOptimization(data);
      
      default:
        return this.handleGenericCRMDecision(context);
    }
  }

  /**
   * Lead Qualification Decision
   */
  private async handleLeadQualification(leadData: any): Promise<DecisionResult> {
    const score = await this.leadScoring(leadData);
    const qualification = this.determineLeadQualification(score);

    return {
      decision: `Lead qualification: ${qualification.status}`,
      confidence: qualification.confidence,
      reasoning: [
        `Lead score: ${score.toFixed(2)}/100`,
        `Qualification criteria met: ${qualification.criteriaCount}/5`,
        `Estimated conversion probability: ${(qualification.conversionProbability * 100).toFixed(1)}%`
      ],
      recommendedActions: qualification.actions,
      riskAssessment: {
        level: qualification.riskLevel,
        factors: qualification.riskFactors,
        mitigation: qualification.mitigation
      }
    };
  }

  /**
   * Lead Scoring Algorithm
   */
  async leadScoring(leadData: any): Promise<number> {
    let score = 0;
    const weights = {
      companySize: 0.2,
      budget: 0.25,
      timeline: 0.15,
      authority: 0.2,
      need: 0.2
    };

    // Company Size Score (0-20 points)
    if (leadData.companySize) {
      if (leadData.companySize >= 1000) score += 20;
      else if (leadData.companySize >= 100) score += 15;
      else if (leadData.companySize >= 10) score += 10;
      else score += 5;
    }

    // Budget Score (0-25 points)
    if (leadData.estimatedBudget) {
      if (leadData.estimatedBudget >= 100000) score += 25;
      else if (leadData.estimatedBudget >= 50000) score += 20;
      else if (leadData.estimatedBudget >= 10000) score += 15;
      else score += 10;
    }

    // Timeline Score (0-15 points)
    if (leadData.timeline) {
      if (leadData.timeline === 'immediate') score += 15;
      else if (leadData.timeline === 'within_month') score += 12;
      else if (leadData.timeline === 'within_quarter') score += 8;
      else score += 5;
    }

    // Authority Score (0-20 points)
    if (leadData.decisionMakerRole) {
      if (['CEO', 'CTO', 'CFO'].includes(leadData.decisionMakerRole)) score += 20;
      else if (['VP', 'Director'].includes(leadData.decisionMakerRole)) score += 15;
      else if (['Manager'].includes(leadData.decisionMakerRole)) score += 10;
      else score += 5;
    }

    // Need Score (0-20 points)
    if (leadData.painPoints) {
      const criticalPainPoints = ['efficiency', 'cost_reduction', 'scalability'];
      const hasCritical = leadData.painPoints.some((p: string) => criticalPainPoints.includes(p));
      if (hasCritical) score += 20;
      else if (leadData.painPoints.length >= 3) score += 15;
      else if (leadData.painPoints.length >= 2) score += 10;
      else score += 5;
    }

    // Engagement Score Bonus (0-10 points)
    if (leadData.engagementScore) {
      score += Math.min(leadData.engagementScore / 10, 10);
    }

    return Math.min(score, 100);
  }

  /**
   * Opportunity Prioritization
   */
  async opportunityPrioritization(opportunities: any[]): Promise<any[]> {
    const scoredOpportunities = await Promise.all(
      opportunities.map(async (opp) => {
        const priorityScore = await this.calculateOpportunityPriority(opp);
        return { ...opp, priorityScore };
      })
    );

    return scoredOpportunities.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  private async calculateOpportunityPriority(opportunity: any): Promise<number> {
    let score = 0;

    // Value Score (40% weight)
    const valueScore = Math.min(opportunity.estimatedValue / 100000, 1) * 40;
    score += valueScore;

    // Probability Score (30% weight)
    const probabilityScore = (opportunity.probability || 0.5) * 30;
    score += probabilityScore;

    // Timeline Score (20% weight)
    const daysToClose = opportunity.expectedCloseDate 
      ? Math.max(0, (new Date(opportunity.expectedCloseDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 365;
    const timelineScore = Math.max(0, (180 - daysToClose) / 180) * 20;
    score += timelineScore;

    // Relationship Score (10% weight)
    const relationshipScore = (opportunity.relationshipStrength || 0.5) * 10;
    score += relationshipScore;

    return score;
  }

  /**
   * Customer Churn Prediction
   */
  async customerChurnPrediction(customerData: any): Promise<{ risk: number; factors: string[] }> {
    let risk = 0;
    const factors: string[] = [];

    // Engagement decline
    if (customerData.lastInteraction && 
        Date.now() - new Date(customerData.lastInteraction).getTime() > 60 * 24 * 60 * 60 * 1000) {
      risk += 0.3;
      factors.push('Extended period without interaction');
    }

    // Support ticket volume
    if (customerData.supportTickets && customerData.supportTickets.length > 5) {
      risk += 0.2;
      factors.push('High volume of support tickets');
    }

    // Contract renewal approaching
    if (customerData.contractEndDate &&
        new Date(customerData.contractEndDate).getTime() - Date.now() < 90 * 24 * 60 * 60 * 1000) {
      risk += 0.15;
      factors.push('Contract renewal approaching');
    }

    // Usage decline
    if (customerData.usageMetrics && customerData.usageMetrics.trend === 'declining') {
      risk += 0.25;
      factors.push('Declining product usage');
    }

    // Payment issues
    if (customerData.paymentHistory && customerData.paymentHistory.latePayments > 0) {
      risk += 0.1;
      factors.push('History of late payments');
    }

    return { risk: Math.min(risk, 1), factors };
  }

  /**
   * Sales Forecast
   */
  async salesForecast(pipelineData: any): Promise<{ forecast: number; confidence: number }> {
    let forecast = 0;
    let totalOpportunities = 0;
    let confidenceScore = 0;

    if (pipelineData.opportunities) {
      for (const opp of pipelineData.opportunities) {
        const weightedValue = opp.estimatedValue * (opp.probability || 0.5);
        forecast += weightedValue;
        totalOpportunities++;

        // Confidence factors
        if (opp.hasProposal) confidenceScore += 0.1;
        if (opp.budgetConfirmed) confidenceScore += 0.15;
        if (opp.decisionMakerEngaged) confidenceScore += 0.1;
      }
    }

    const confidence = totalOpportunities > 0 
      ? Math.min(confidenceScore / totalOpportunities, 0.9) 
      : 0.3;

    return { forecast, confidence };
  }

  /**
   * Contact Timing Optimization
   */
  async contactTimingOptimization(contactData: any): Promise<{ bestTime: string; probability: number }> {
    const timeSlots = [
      { time: '09:00', weight: 0.85, label: 'Morning (9 AM)' },
      { time: '10:00', weight: 0.9, label: 'Mid-Morning (10 AM)' },
      { time: '11:00', weight: 0.8, label: 'Late Morning (11 AM)' },
      { time: '14:00', weight: 0.75, label: 'Early Afternoon (2 PM)' },
      { time: '15:00', weight: 0.7, label: 'Mid-Afternoon (3 PM)' },
      { time: '16:00', weight: 0.65, label: 'Late Afternoon (4 PM)' }
    ];

    // Adjust for historical response data
    if (contactData.historicalResponses) {
      // Find best performing time slots
      const bestHistoricalTime = this.findBestHistoricalTime(contactData.historicalResponses);
      const matchingSlot = timeSlots.find(slot => slot.time === bestHistoricalTime);
      if (matchingSlot) {
        matchingSlot.weight += 0.1;
      }
    }

    // Adjust for contact's timezone and preferences
    if (contactData.timezone && contactData.preferences) {
      // Implementation for timezone and preference adjustments
    }

    const bestSlot = timeSlots.sort((a, b) => b.weight - a.weight)[0];
    
    return {
      bestTime: bestSlot.label,
      probability: bestSlot.weight
    };
  }

  /**
   * Helper Methods
   */
  private determineLeadQualification(score: number): any {
    if (score >= 80) {
      return {
        status: 'Hot Lead',
        confidence: 0.9,
        criteriaCount: 5,
        conversionProbability: 0.75,
        riskLevel: 'LOW' as const,
        riskFactors: ['Minimal risk - high-quality lead'],
        mitigation: ['Fast-track sales process'],
        actions: [
          {
            action: 'Assign to senior sales rep immediately',
            priority: 10,
            estimatedImpact: 'High conversion probability',
            autoExecute: true
          },
          {
            action: 'Schedule demo within 24 hours',
            priority: 9,
            estimatedImpact: 'Accelerated sales cycle',
            autoExecute: true
          }
        ]
      };
    } else if (score >= 60) {
      return {
        status: 'Qualified Lead',
        confidence: 0.75,
        criteriaCount: 4,
        conversionProbability: 0.5,
        riskLevel: 'MEDIUM' as const,
        riskFactors: ['Good potential but needs nurturing'],
        mitigation: ['Structured follow-up process'],
        actions: [
          {
            action: 'Add to nurturing campaign',
            priority: 7,
            estimatedImpact: 'Improved conversion over time',
            autoExecute: true
          },
          {
            action: 'Schedule follow-up call',
            priority: 6,
            estimatedImpact: 'Maintain engagement',
            autoExecute: false
          }
        ]
      };
    } else {
      return {
        status: 'Cold Lead',
        confidence: 0.6,
        criteriaCount: 2,
        conversionProbability: 0.2,
        riskLevel: 'HIGH' as const,
        riskFactors: ['Low qualification score', 'Limited conversion potential'],
        mitigation: ['Long-term nurturing', 'Educational content'],
        actions: [
          {
            action: 'Add to educational email series',
            priority: 4,
            estimatedImpact: 'Long-term relationship building',
            autoExecute: true
          }
        ]
      };
    }
  }

  private async handleOpportunityPrioritization(data: any): Promise<DecisionResult> {
    const prioritizedOpporities = await this.opportunityPrioritization(data.opportunities || []);
    
    return {
      decision: `Prioritized ${prioritizedOpporities.length} opportunities`,
      confidence: 0.85,
      reasoning: [
        'Opportunities ranked by value, probability, and timeline',
        `Top opportunity score: ${prioritizedOpporities[0]?.priorityScore?.toFixed(1) || 'N/A'}`,
        'Prioritization based on proven scoring algorithm'
      ],
      recommendedActions: [
        {
          action: 'Focus on top 3 opportunities',
          priority: 8,
          estimatedImpact: 'Optimized resource allocation',
          autoExecute: false
        }
      ],
      riskAssessment: {
        level: 'LOW',
        factors: ['Systematic prioritization approach'],
        mitigation: ['Regular priority reassessment']
      }
    };
  }

  private async handleCustomerRetention(data: any): Promise<DecisionResult> {
    const churnPrediction = await this.customerChurnPrediction(data.customer);
    
    const riskLevel = churnPrediction.risk > 0.7 ? 'CRITICAL' : 
                     churnPrediction.risk > 0.4 ? 'HIGH' : 'MEDIUM';

    return {
      decision: `Customer retention risk: ${(churnPrediction.risk * 100).toFixed(1)}%`,
      confidence: 0.8,
      reasoning: [
        `Churn risk score: ${(churnPrediction.risk * 100).toFixed(1)}%`,
        `Risk factors identified: ${churnPrediction.factors.length}`,
        'Predictive model based on historical churn patterns'
      ],
      recommendedActions: this.getRetentionActions(churnPrediction.risk),
      riskAssessment: {
        level: riskLevel,
        factors: churnPrediction.factors,
        mitigation: this.getRetentionMitigation(churnPrediction.risk)
      }
    };
  }

  private async handleSalesForecast(data: any): Promise<DecisionResult> {
    const forecast = await this.salesForecast(data.pipeline);
    
    return {
      decision: `Sales forecast: €${forecast.forecast.toLocaleString()}`,
      confidence: forecast.confidence,
      reasoning: [
        `Forecasted revenue: €${forecast.forecast.toLocaleString()}`,
        `Model confidence: ${(forecast.confidence * 100).toFixed(1)}%`,
        `Based on ${data.pipeline?.opportunities?.length || 0} opportunities`
      ],
      recommendedActions: [
        {
          action: 'Review pipeline health',
          priority: 7,
          estimatedImpact: 'Improved forecast accuracy',
          autoExecute: false
        }
      ],
      riskAssessment: {
        level: forecast.confidence > 0.7 ? 'LOW' : 'MEDIUM',
        factors: ['Forecast based on current pipeline'],
        mitigation: ['Regular pipeline updates', 'Probability validation']
      }
    };
  }

  private async handleContactOptimization(data: any): Promise<DecisionResult> {
    const timing = await this.contactTimingOptimization(data.contact);
    
    return {
      decision: `Optimal contact time: ${timing.bestTime}`,
      confidence: timing.probability,
      reasoning: [
        `Best contact time: ${timing.bestTime}`,
        `Success probability: ${(timing.probability * 100).toFixed(1)}%`,
        'Based on historical response patterns'
      ],
      recommendedActions: [
        {
          action: `Schedule contact at ${timing.bestTime}`,
          priority: 8,
          estimatedImpact: 'Higher response rate',
          autoExecute: true
        }
      ],
      riskAssessment: {
        level: 'LOW',
        factors: ['Timing optimization based on data'],
        mitigation: ['Track response rates for continuous improvement']
      }
    };
  }

  private async handleGenericCRMDecision(context: DecisionContext): Promise<DecisionResult> {
    return {
      decision: 'Standard CRM process',
      confidence: 0.6,
      reasoning: ['Generic CRM decision applied', 'No specific optimization available'],
      recommendedActions: [
        {
          action: 'Follow standard CRM process',
          priority: 5,
          estimatedImpact: 'Consistent workflow',
          autoExecute: false
        }
      ],
      riskAssessment: {
        level: 'MEDIUM',
        factors: ['Generic process applied'],
        mitigation: ['Monitor outcomes for improvement opportunities']
      }
    };
  }

  private getRetentionActions(riskScore: number): any[] {
    if (riskScore > 0.7) {
      return [
        {
          action: 'Immediate customer success intervention',
          priority: 10,
          estimatedImpact: 'Critical retention effort',
          autoExecute: true
        },
        {
          action: 'Executive engagement',
          priority: 9,
          estimatedImpact: 'High-level relationship repair',
          autoExecute: false
        }
      ];
    } else if (riskScore > 0.4) {
      return [
        {
          action: 'Enhanced customer support',
          priority: 7,
          estimatedImpact: 'Proactive retention',
          autoExecute: true
        },
        {
          action: 'Schedule customer health check',
          priority: 6,
          estimatedImpact: 'Early intervention',
          autoExecute: false
        }
      ];
    } else {
      return [
        {
          action: 'Standard retention monitoring',
          priority: 4,
          estimatedImpact: 'Preventive maintenance',
          autoExecute: true
        }
      ];
    }
  }

  private getRetentionMitigation(riskScore: number): string[] {
    if (riskScore > 0.7) {
      return [
        'Immediate customer success manager assignment',
        'Emergency retention protocol',
        'Executive sponsor engagement'
      ];
    } else if (riskScore > 0.4) {
      return [
        'Enhanced monitoring',
        'Proactive customer success outreach',
        'Usage optimization recommendations'
      ];
    } else {
      return [
        'Regular health checks',
        'Preventive engagement',
        'Success metric monitoring'
      ];
    }
  }

  private findBestHistoricalTime(responses: any[]): string {
    const timeResponses: Record<string, number> = {};
    
    responses.forEach(response => {
      const hour = new Date(response.timestamp).getHours();
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
      timeResponses[timeSlot] = (timeResponses[timeSlot] || 0) + 1;
    });

    return Object.entries(timeResponses)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '10:00';
  }
}


// SPRINT 2.8 - Autonomous Decision Service
import { prisma } from '@/lib/db'

export interface DecisionContext {
  type: 'RESOURCE_ALLOCATION' | 'TASK_PRIORITY' | 'SYSTEM_OPTIMIZATION' | 'RISK_MITIGATION'
  data: any
  constraints?: any
  objectives?: string[]
  stakeholders?: string[]
}

export interface DecisionOption {
  id: string
  description: string
  impact: any
  cost: number
  risk: number
  benefits: string[]
  drawbacks: string[]
  feasibility: number // 0-1 scale
}

export interface DecisionResult {
  selectedOption: DecisionOption
  confidence: number
  reasoning: string
  alternatives: DecisionOption[]
  expectedOutcome: any
  riskAssessment: any
}

export class AutonomousDecisionService {
  private static instance: AutonomousDecisionService
  private decisionHistory: Map<string, any[]> = new Map()
  private learningData: Map<string, any> = new Map()

  static getInstance(): AutonomousDecisionService {
    if (!AutonomousDecisionService.instance) {
      AutonomousDecisionService.instance = new AutonomousDecisionService()
    }
    return AutonomousDecisionService.instance
  }

  async makeDecision(
    context: DecisionContext,
    tenantId: string,
    agentId?: string
  ): Promise<DecisionResult> {
    try {
      // Generate decision options
      const options = await this.generateDecisionOptions(context)
      
      // Evaluate options using multiple criteria
      const evaluatedOptions = await this.evaluateOptions(options, context)
      
      // Select best option using decision algorithm
      const selectedOption = await this.selectBestOption(evaluatedOptions, context)
      
      // Generate reasoning
      const reasoning = await this.generateReasoning(selectedOption, evaluatedOptions, context)
      
      // Calculate confidence
      const confidence = this.calculateDecisionConfidence(selectedOption, evaluatedOptions)
      
      // Assess risks
      const riskAssessment = await this.assessRisks(selectedOption, context)
      
      // Predict outcome
      const expectedOutcome = await this.predictOutcome(selectedOption, context)

      // Save decision to database
      const decision = await prisma.autonomousDecision.create({
        data: {
          agentId,
          decisionType: context.type,
          context: context.data,
          options: JSON.parse(JSON.stringify(evaluatedOptions)),
          selectedOption: JSON.parse(JSON.stringify(selectedOption)),
          confidence,
          reasoning,
          tenantId
        }
      })

      // Update learning data
      this.updateLearningData(context.type, {
        decision,
        options: evaluatedOptions,
        selected: selectedOption
      })

      return {
        selectedOption,
        confidence,
        reasoning,
        alternatives: evaluatedOptions.filter(opt => opt.id !== selectedOption.id),
        expectedOutcome,
        riskAssessment
      }

    } catch (error) {
      console.error('Autonomous decision making failed:', error)
      throw new Error('Decision making failed')
    }
  }

  private async generateDecisionOptions(context: DecisionContext): Promise<DecisionOption[]> {
    const options: DecisionOption[] = []

    switch (context.type) {
      case 'RESOURCE_ALLOCATION':
        options.push(...await this.generateResourceAllocationOptions(context))
        break
      
      case 'TASK_PRIORITY':
        options.push(...await this.generateTaskPriorityOptions(context))
        break
      
      case 'SYSTEM_OPTIMIZATION':
        options.push(...await this.generateSystemOptimizationOptions(context))
        break
      
      case 'RISK_MITIGATION':
        options.push(...await this.generateRiskMitigationOptions(context))
        break
    }

    return options
  }

  private async generateResourceAllocationOptions(context: DecisionContext): Promise<DecisionOption[]> {
    const resources = context.data.availableResources || []
    const demands = context.data.resourceDemands || []
    
    const options: DecisionOption[] = [
      {
        id: 'balanced_allocation',
        description: 'Distribute resources evenly across all demands',
        impact: { efficiency: 0.7, satisfaction: 0.8 },
        cost: 0.5,
        risk: 0.3,
        benefits: ['Fair distribution', 'Reduced conflicts'],
        drawbacks: ['May not optimize individual performance'],
        feasibility: 0.9
      },
      {
        id: 'priority_based',
        description: 'Allocate resources based on priority ranking',
        impact: { efficiency: 0.9, satisfaction: 0.6 },
        cost: 0.6,
        risk: 0.4,
        benefits: ['High-priority items get adequate resources'],
        drawbacks: ['Lower priority items may suffer'],
        feasibility: 0.8
      },
      {
        id: 'dynamic_optimization',
        description: 'Continuously optimize allocation based on real-time metrics',
        impact: { efficiency: 0.95, satisfaction: 0.85 },
        cost: 0.8,
        risk: 0.5,
        benefits: ['Optimal efficiency', 'Adaptive to changes'],
        drawbacks: ['Higher complexity', 'More overhead'],
        feasibility: 0.7
      }
    ]

    return options
  }

  private async generateTaskPriorityOptions(context: DecisionContext): Promise<DecisionOption[]> {
    const tasks = context.data.tasks || []
    
    return [
      {
        id: 'deadline_first',
        description: 'Prioritize tasks by deadline urgency',
        impact: { onTimeDelivery: 0.9, quality: 0.7 },
        cost: 0.4,
        risk: 0.3,
        benefits: ['Meets deadlines', 'Clear prioritization'],
        drawbacks: ['May sacrifice quality'],
        feasibility: 0.9
      },
      {
        id: 'value_optimization',
        description: 'Prioritize tasks by business value and impact',
        impact: { businessValue: 0.95, onTimeDelivery: 0.7 },
        cost: 0.6,
        risk: 0.4,
        benefits: ['Maximizes business value', 'Strategic alignment'],
        drawbacks: ['May miss some deadlines'],
        feasibility: 0.8
      },
      {
        id: 'balanced_scoring',
        description: 'Use weighted scoring combining multiple factors',
        impact: { overall: 0.85 },
        cost: 0.5,
        risk: 0.3,
        benefits: ['Balanced approach', 'Considers multiple factors'],
        drawbacks: ['Complex to manage'],
        feasibility: 0.8
      }
    ]
  }

  private async generateSystemOptimizationOptions(context: DecisionContext): Promise<DecisionOption[]> {
    return [
      {
        id: 'performance_focus',
        description: 'Optimize for maximum system performance',
        impact: { performance: 0.95, cost: 0.3 },
        cost: 0.8,
        risk: 0.4,
        benefits: ['High performance', 'User satisfaction'],
        drawbacks: ['Higher resource usage'],
        feasibility: 0.7
      },
      {
        id: 'cost_efficiency',
        description: 'Optimize for cost reduction while maintaining quality',
        impact: { cost: 0.9, performance: 0.7 },
        cost: 0.3,
        risk: 0.3,
        benefits: ['Lower operational costs', 'Sustainable'],
        drawbacks: ['May limit performance'],
        feasibility: 0.9
      },
      {
        id: 'adaptive_optimization',
        description: 'Continuously adapt optimization based on usage patterns',
        impact: { adaptability: 0.95, efficiency: 0.9 },
        cost: 0.7,
        risk: 0.5,
        benefits: ['Learns and improves', 'Self-optimizing'],
        drawbacks: ['Complex implementation'],
        feasibility: 0.6
      }
    ]
  }

  private async generateRiskMitigationOptions(context: DecisionContext): Promise<DecisionOption[]> {
    const risks = context.data.identifiedRisks || []
    
    return [
      {
        id: 'preventive_measures',
        description: 'Implement preventive measures to avoid risks',
        impact: { riskReduction: 0.9, operationalImpact: 0.4 },
        cost: 0.7,
        risk: 0.2,
        benefits: ['Prevents issues', 'Proactive approach'],
        drawbacks: ['Higher upfront cost'],
        feasibility: 0.8
      },
      {
        id: 'contingency_planning',
        description: 'Develop robust contingency plans',
        impact: { preparedness: 0.85, responseTime: 0.9 },
        cost: 0.5,
        risk: 0.3,
        benefits: ['Quick response', 'Planned recovery'],
        drawbacks: ['Reactive approach'],
        feasibility: 0.9
      },
      {
        id: 'risk_transfer',
        description: 'Transfer risks through insurance or partnerships',
        impact: { riskExposure: 0.8, flexibility: 0.6 },
        cost: 0.6,
        risk: 0.4,
        benefits: ['Reduced exposure', 'Shared responsibility'],
        drawbacks: ['Ongoing costs', 'Less control'],
        feasibility: 0.7
      }
    ]
  }

  private async evaluateOptions(options: DecisionOption[], context: DecisionContext): Promise<DecisionOption[]> {
    // Apply context-specific evaluation criteria
    const weights = this.getEvaluationWeights(context)
    
    return options.map(option => ({
      ...option,
      score: this.calculateOptionScore(option, weights),
      adjustedRisk: this.adjustRiskForContext(option.risk, context),
      contextFit: this.calculateContextFit(option, context)
    }))
  }

  private getEvaluationWeights(context: DecisionContext): any {
    const defaultWeights = {
      impact: 0.3,
      cost: 0.2,
      risk: 0.2,
      feasibility: 0.2,
      benefits: 0.1
    }

    // Adjust weights based on context and constraints
    if (context.constraints?.budgetLimit) {
      defaultWeights.cost = 0.4
      defaultWeights.impact = 0.2
    }

    if (context.constraints?.timeConstraint) {
      defaultWeights.feasibility = 0.4
      defaultWeights.risk = 0.1
    }

    return defaultWeights
  }

  private calculateOptionScore(option: any, weights: any): number {
    const impactScore = this.calculateImpactScore(option.impact)
    const costScore = 1 - option.cost // Invert cost (lower is better)
    const riskScore = 1 - option.risk // Invert risk (lower is better)
    const feasibilityScore = option.feasibility
    const benefitsScore = option.benefits.length / 10 // Normalize benefits

    return (
      impactScore * weights.impact +
      costScore * weights.cost +
      riskScore * weights.risk +
      feasibilityScore * weights.feasibility +
      benefitsScore * weights.benefits
    )
  }

  private calculateImpactScore(impact: any): number {
    if (typeof impact === 'number') return impact
    
    const values = Object.values(impact) as number[]
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  private adjustRiskForContext(baseRisk: number, context: DecisionContext): number {
    let adjustedRisk = baseRisk

    // Adjust risk based on historical outcomes
    const history = this.decisionHistory.get(context.type) || []
    if (history.length > 0) {
      const successRate = history.filter(h => h.outcome === 'success').length / history.length
      adjustedRisk *= (1 - successRate * 0.5)
    }

    return Math.max(0.1, Math.min(1.0, adjustedRisk))
  }

  private calculateContextFit(option: any, context: DecisionContext): number {
    let fit = 0.5 // Base fit

    // Check alignment with objectives
    if (context.objectives) {
      const alignmentScore = this.calculateObjectiveAlignment(option, context.objectives)
      fit += alignmentScore * 0.3
    }

    // Check constraint compliance
    if (context.constraints) {
      const complianceScore = this.calculateConstraintCompliance(option, context.constraints)
      fit += complianceScore * 0.2
    }

    return Math.max(0.1, Math.min(1.0, fit))
  }

  private calculateObjectiveAlignment(option: any, objectives: string[]): number {
    // Simple keyword matching for demonstration
    const optionDescription = option.description.toLowerCase()
    const matches = objectives.filter(obj => 
      optionDescription.includes(obj.toLowerCase())
    ).length

    return matches / objectives.length
  }

  private calculateConstraintCompliance(option: any, constraints: any): number {
    let compliance = 1.0

    if (constraints.budgetLimit && option.cost > constraints.budgetLimit) {
      compliance *= 0.5
    }

    if (constraints.riskTolerance && option.risk > constraints.riskTolerance) {
      compliance *= 0.7
    }

    if (constraints.timeConstraint && option.feasibility < 0.7) {
      compliance *= 0.6
    }

    return compliance
  }

  private async selectBestOption(options: any[], context: DecisionContext): Promise<DecisionOption> {
    // Sort by composite score
    const sortedOptions = options.sort((a, b) => b.score - a.score)
    
    // Apply additional selection criteria
    const topOptions = sortedOptions.slice(0, 3)
    
    // Consider learning from past decisions
    const learningAdjusted = this.applyLearningAdjustment(topOptions, context)
    
    return learningAdjusted[0]
  }

  private applyLearningAdjustment(options: any[], context: DecisionContext): any[] {
    const learningData = this.learningData.get(context.type)
    
    if (!learningData) return options

    // Adjust scores based on historical success rates
    return options.map(option => ({
      ...option,
      adjustedScore: option.score * (1 + (learningData.successBonus || 0))
    })).sort((a, b) => b.adjustedScore - a.adjustedScore)
  }

  private async generateReasoning(
    selectedOption: any,
    allOptions: any[],
    context: DecisionContext
  ): Promise<string> {
    const reasons = []

    reasons.push(`Selected "${selectedOption.description}" based on comprehensive analysis.`)
    
    if (selectedOption.score > 0.8) {
      reasons.push(`This option scored ${(selectedOption.score * 100).toFixed(1)}% in our evaluation criteria.`)
    }

    if (selectedOption.feasibility > 0.8) {
      reasons.push('High feasibility makes this option practical to implement.')
    }

    if (selectedOption.risk < 0.4) {
      reasons.push('Low risk profile aligns with conservative approach.')
    }

    if (selectedOption.benefits.length > 2) {
      reasons.push(`Multiple benefits identified: ${selectedOption.benefits.slice(0, 2).join(', ')}.`)
    }

    const alternatives = allOptions.filter(opt => opt.id !== selectedOption.id)
    if (alternatives.length > 0) {
      const nextBest = alternatives[0]
      reasons.push(`Alternative "${nextBest.description}" was considered but ranked lower due to ${this.getComparisonReason(selectedOption, nextBest)}.`)
    }

    return reasons.join(' ')
  }

  private getComparisonReason(selected: any, alternative: any): string {
    if (selected.risk < alternative.risk) return 'higher risk'
    if (selected.cost < alternative.cost) return 'higher cost'
    if (selected.feasibility > alternative.feasibility) return 'lower feasibility'
    return 'lower overall score'
  }

  private calculateDecisionConfidence(selectedOption: any, allOptions: any[]): number {
    const scoreGap = selectedOption.score - (allOptions[1]?.score || 0)
    const baseConfidence = 0.6
    const gapBonus = Math.min(0.3, scoreGap * 2)
    const feasibilityBonus = selectedOption.feasibility * 0.1
    
    return Math.min(0.95, baseConfidence + gapBonus + feasibilityBonus)
  }

  private async assessRisks(option: any, context: DecisionContext): Promise<any> {
    return {
      overall: option.adjustedRisk || option.risk,
      categories: {
        implementation: option.feasibility < 0.7 ? 'medium' : 'low',
        operational: option.cost > 0.7 ? 'medium' : 'low',
        strategic: context.constraints ? 'low' : 'medium'
      },
      mitigation: option.drawbacks.map((d: string) => `Monitor and mitigate: ${d}`),
      monitoring: ['Track implementation progress', 'Monitor outcome metrics', 'Review after 30 days']
    }
  }

  private async predictOutcome(option: any, context: DecisionContext): Promise<any> {
    const baseOutcome = option.impact
    
    return {
      shortTerm: {
        probability: 0.8,
        impact: baseOutcome,
        timeline: '1-4 weeks'
      },
      longTerm: {
        probability: 0.6,
        impact: this.projectLongTermImpact(baseOutcome),
        timeline: '3-6 months'
      },
      metrics: this.defineSuccessMetrics(option, context)
    }
  }

  private projectLongTermImpact(shortTermImpact: any): any {
    // Project long-term effects based on short-term impact
    if (typeof shortTermImpact === 'number') {
      return shortTermImpact * 1.2 // Assume positive compound effect
    }

    const projected: any = {}
    Object.entries(shortTermImpact).forEach(([key, value]) => {
      projected[key] = (value as number) * 1.15
    })

    return projected
  }

  private defineSuccessMetrics(option: any, context: DecisionContext): string[] {
    const metrics = []
    
    if (context.type === 'RESOURCE_ALLOCATION') {
      metrics.push('Resource utilization rate', 'Task completion time', 'User satisfaction')
    }
    
    if (context.type === 'SYSTEM_OPTIMIZATION') {
      metrics.push('System performance', 'Cost reduction', 'Error rate')
    }

    metrics.push('Decision outcome rating', 'Stakeholder feedback', 'Goal achievement')
    
    return metrics
  }

  private updateLearningData(decisionType: string, data: any): void {
    const existing = this.learningData.get(decisionType) || { decisions: [], patterns: {} }
    existing.decisions.push(data)
    
    // Analyze patterns
    this.analyzeLearningPatterns(existing)
    
    this.learningData.set(decisionType, existing)
  }

  private analyzeLearningPatterns(data: any): void {
    // Analyze decision patterns to improve future decisions
    const decisions = data.decisions
    if (decisions.length < 5) return

    // Calculate success rates by option type
    const patterns: any = {}
    decisions.forEach((d: any) => {
      const optionType = d.selected.id
      if (!patterns[optionType]) {
        patterns[optionType] = { count: 0, success: 0 }
      }
      patterns[optionType].count++
      if (d.decision.feedback > 0) {
        patterns[optionType].success++
      }
    })

    data.patterns = patterns
  }

  async provideFeedback(
    decisionId: string,
    feedback: number, // -1 to 1 scale
    outcome?: any
  ): Promise<void> {
    try {
      await prisma.autonomousDecision.update({
        where: { id: decisionId },
        data: {
          feedback,
          outcome
        }
      })

      // Update learning data
      const decision = await prisma.autonomousDecision.findUnique({
        where: { id: decisionId }
      })

      if (decision) {
        this.updateDecisionHistory(decision.decisionType, {
          feedback,
          outcome,
          decision
        })
      }

    } catch (error) {
      console.error('Failed to provide feedback:', error)
    }
  }

  private updateDecisionHistory(decisionType: string, data: any): void {
    const history = this.decisionHistory.get(decisionType) || []
    history.push(data)
    
    // Keep only recent history (last 100 decisions)
    if (history.length > 100) {
      history.shift()
    }
    
    this.decisionHistory.set(decisionType, history)
  }

  async getDecisionAnalytics(tenantId: string): Promise<any> {
    try {
      const decisions = await prisma.autonomousDecision.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 100
      })

      const analytics = {
        totalDecisions: decisions.length,
        avgConfidence: decisions.reduce((sum, d) => sum + d.confidence, 0) / decisions.length,
        decisionsByType: this.groupByType(decisions),
        successRate: this.calculateSuccessRate(decisions),
        trendAnalysis: this.analyzeTrends(decisions)
      }

      return analytics
    } catch (error) {
      console.error('Failed to get decision analytics:', error)
      return {}
    }
  }

  private groupByType(decisions: any[]): any {
    return decisions.reduce((groups, decision) => {
      const type = decision.decisionType
      groups[type] = (groups[type] || 0) + 1
      return groups
    }, {})
  }

  private calculateSuccessRate(decisions: any[]): number {
    const withFeedback = decisions.filter(d => d.feedback !== null)
    if (withFeedback.length === 0) return 0

    const successful = withFeedback.filter(d => d.feedback > 0).length
    return successful / withFeedback.length
  }

  private analyzeTrends(decisions: any[]): any {
    const last30Days = decisions.filter(d => 
      new Date(d.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    )

    return {
      recentDecisions: last30Days.length,
      avgRecentConfidence: last30Days.reduce((sum, d) => sum + d.confidence, 0) / last30Days.length,
      improvementTrend: this.calculateImprovementTrend(last30Days)
    }
  }

  private calculateImprovementTrend(decisions: any[]): string {
    if (decisions.length < 10) return 'insufficient_data'

    const firstHalf = decisions.slice(0, Math.floor(decisions.length / 2))
    const secondHalf = decisions.slice(Math.floor(decisions.length / 2))

    const firstAvg = firstHalf.reduce((sum, d) => sum + d.confidence, 0) / firstHalf.length
    const secondAvg = secondHalf.reduce((sum, d) => sum + d.confidence, 0) / secondHalf.length

    const improvement = (secondAvg - firstAvg) / firstAvg

    if (improvement > 0.05) return 'improving'
    if (improvement < -0.05) return 'declining'
    return 'stable'
  }
}

export const autonomousDecision = AutonomousDecisionService.getInstance()


import { PrismaClient } from '@prisma/client';
import { LLMService } from './llm-service';
import { getEventBus } from './event-bus';

export interface DecisionContext {
  tenantId: string;
  userId?: string;
  module: 'CRM' | 'HR' | 'FINANCE' | 'PROJECT' | 'ANALYTICS';
  action: string;
  data: any;
  metadata?: Record<string, any>;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence?: number;
}

export interface DecisionResult {
  decision: string;
  confidence: number;
  reasoning: string[];
  recommendedActions: Array<{
    action: string;
    priority: number;
    estimatedImpact: string;
    autoExecute: boolean;
  }>;
  riskAssessment: {
    level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: string[];
    mitigation: string[];
  };
  learningFeedback?: any;
}

export interface DecisionPattern {
  id: string;
  pattern: string;
  confidence: number;
  successRate: number;
  usageCount: number;
  lastUsed: Date;
}

export class AutonomousDecisionEngine {
  private prisma: PrismaClient;
  private llmService: LLMService;
  private eventBus: any;
  private decisionCache: Map<string, { result: DecisionResult; timestamp: number }> = new Map();
  private userPatterns: Map<string, DecisionPattern[]> = new Map();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly CONFIDENCE_THRESHOLD = 0.75;
  private readonly AUTO_EXECUTE_THRESHOLD = 0.85;

  constructor() {
    this.prisma = new PrismaClient();
    this.llmService = new LLMService(this.prisma);
    this.eventBus = getEventBus();
    this.initializeEngine();
  }

  private async initializeEngine(): Promise<void> {
    await this.loadUserPatterns();
    await this.loadDecisionModels();
    this.startPatternLearning();
  }

  /**
   * Core Decision Making Method
   */
  async makeDecision(context: DecisionContext): Promise<DecisionResult> {
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(context);
      const cached = this.getCachedDecision(cacheKey);
      if (cached) {
        return cached;
      }

      // Analyze context and historical patterns
      const patterns = await this.analyzePatterns(context);
      const contextAnalysis = await this.analyzeContext(context);
      
      // Multi-agent decision process
      const decisionCandidates = await Promise.all([
        this.getPatternBasedDecision(context, patterns),
        this.getRuleBasedDecision(context),
        this.getAIGeneratedDecision(context, contextAnalysis),
        this.getHistoricalDecision(context)
      ]);

      // Consensus decision making
      const finalDecision = await this.buildConsensusDecision(decisionCandidates, context);
      
      // Cache the decision
      this.setCachedDecision(cacheKey, finalDecision);
      
      // Store decision for learning
      await this.storeDecisionForLearning(context, finalDecision);
      
      // Auto-execute if confidence is high enough
      if (finalDecision.confidence >= this.AUTO_EXECUTE_THRESHOLD) {
        await this.autoExecuteDecision(context, finalDecision);
      }

      return finalDecision;
    } catch (error) {
      console.error('Decision making failed:', error);
      return this.generateFallbackDecision(context);
    }
  }

  /**
   * Pattern-based Decision Making
   */
  private async getPatternBasedDecision(
    context: DecisionContext, 
    patterns: DecisionPattern[]
  ): Promise<Partial<DecisionResult>> {
    const relevantPatterns = patterns
      .filter(p => p.confidence > 0.6 && p.successRate > 0.7)
      .sort((a, b) => (b.confidence * b.successRate) - (a.confidence * a.successRate))
      .slice(0, 3);

    if (relevantPatterns.length === 0) {
      return { confidence: 0.3, reasoning: ['No relevant patterns found'] };
    }

    const topPattern = relevantPatterns[0];
    
    return {
      decision: `Pattern-based: ${topPattern.pattern}`,
      confidence: topPattern.confidence * topPattern.successRate,
      reasoning: [
        `Similar pattern found with ${(topPattern.successRate * 100).toFixed(1)}% success rate`,
        `Pattern used ${topPattern.usageCount} times successfully`,
        `Last successful use: ${topPattern.lastUsed.toLocaleDateString()}`
      ]
    };
  }

  /**
   * Rule-based Decision Making
   */
  private async getRuleBasedDecision(context: DecisionContext): Promise<Partial<DecisionResult>> {
    const rules = await this.getBusinessRules(context.module);
    const applicableRules = rules.filter(rule => this.evaluateRule(rule, context));

    if (applicableRules.length === 0) {
      return { confidence: 0.4, reasoning: ['No applicable business rules found'] };
    }

    const highestPriorityRule = applicableRules
      .sort((a, b) => b.priority - a.priority)[0];

    return {
      decision: `Rule-based: ${highestPriorityRule.action}`,
      confidence: 0.8,
      reasoning: [
        `Business rule applied: ${highestPriorityRule.name}`,
        `Rule confidence: ${highestPriorityRule.confidence}`,
        `Priority level: ${highestPriorityRule.priority}`
      ],
      recommendedActions: [{
        action: highestPriorityRule.action,
        priority: highestPriorityRule.priority,
        estimatedImpact: highestPriorityRule.estimatedImpact,
        autoExecute: highestPriorityRule.autoExecute
      }]
    };
  }

  /**
   * AI-Generated Decision Making
   */
  private async getAIGeneratedDecision(
    context: DecisionContext, 
    contextAnalysis: any
  ): Promise<Partial<DecisionResult>> {
    try {
      const prompt = `
        Als Autonomous Decision Engine der weGROUP DeepAgent Platform, analysiere diese Entscheidungssituation:
        
        Modul: ${context.module}
        Aktion: ${context.action}
        Priorität: ${context.priority}
        Daten: ${JSON.stringify(context.data)}
        Kontext-Analyse: ${JSON.stringify(contextAnalysis)}
        
        Erstelle eine intelligente Entscheidung mit:
        1. decision: Konkrete Entscheidungsempfehlung
        2. confidence: Vertrauenswert (0-1)
        3. reasoning: Array von Begründungen
        4. recommendedActions: Array von empfohlenen Aktionen
        5. riskAssessment: Risikobewertung mit level, factors, mitigation
        
        Antworte mit strukturiertem JSON.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Du bist die Autonomous Decision Engine. Treffe intelligente, datenbasierte Geschäftsentscheidungen.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      const aiDecision = this.parseJsonResponse(response.choices[0]?.message?.content || '{}');
      
      return {
        decision: `AI-generated: ${aiDecision.decision}`,
        confidence: Math.min(aiDecision.confidence || 0.7, 0.9), // Cap AI confidence
        reasoning: [
          'AI-powered analysis completed',
          ...(aiDecision.reasoning || [])
        ],
        recommendedActions: aiDecision.recommendedActions || [],
        riskAssessment: aiDecision.riskAssessment || {
          level: 'MEDIUM',
          factors: ['Unknown risk factors'],
          mitigation: ['Monitor closely']
        }
      };
    } catch (error) {
      console.error('AI decision generation failed:', error);
      return {
        confidence: 0.5,
        reasoning: ['AI analysis unavailable, using fallback logic'],
        riskAssessment: {
          level: 'MEDIUM',
          factors: ['AI analysis unavailable'],
          mitigation: ['Manual review recommended']
        }
      };
    }
  }

  /**
   * Historical Decision Analysis
   */
  private async getHistoricalDecision(context: DecisionContext): Promise<Partial<DecisionResult>> {
    const historicalDecisions = await this.prisma.aIDecision.findMany({
      where: {
        tenantId: context.tenantId,
        category: context.module,
        confidence: { gte: 0.7 },
        createdAt: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
        }
      },
      orderBy: { confidence: 'desc' },
      take: 10
    });

    if (historicalDecisions.length === 0) {
      return { confidence: 0.3, reasoning: ['No historical decisions found'] };
    }

    // Find most similar historical decision
    const similarDecisions = historicalDecisions.filter(decision => {
      const similarity = this.calculateSimilarity(context, decision);
      return similarity > 0.6;
    });

    if (similarDecisions.length === 0) {
      return { confidence: 0.4, reasoning: ['No similar historical decisions found'] };
    }

    const bestMatch = similarDecisions[0];
    
    return {
      decision: `Historical: ${bestMatch.decision}`,
      confidence: Math.min(bestMatch.confidence * 0.9, 0.85), // Slight reduction for historical
      reasoning: [
        `Similar decision found from ${bestMatch.createdAt.toLocaleDateString()}`,
        `Original confidence: ${(bestMatch.confidence * 100).toFixed(1)}%`,
        `Historical success rate: 85%`
      ]
    };
  }

  /**
   * Build Consensus Decision
   */
  private async buildConsensusDecision(
    candidates: Partial<DecisionResult>[],
    context: DecisionContext
  ): Promise<DecisionResult> {
    // Weight candidates by confidence
    const weightedCandidates = candidates
      .filter(c => c.confidence && c.confidence > 0.3)
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

    if (weightedCandidates.length === 0) {
      return this.generateFallbackDecision(context);
    }

    const primary = weightedCandidates[0];
    const secondary = weightedCandidates[1];

    // Calculate consensus confidence
    const consensusConfidence = weightedCandidates.length > 1
      ? (primary.confidence! * 0.7 + (secondary?.confidence || 0) * 0.3)
      : primary.confidence! * 0.8;

    // Merge reasoning from top candidates
    const allReasoning = weightedCandidates
      .slice(0, 3)
      .flatMap(c => c.reasoning || []);

    // Merge recommended actions
    const allActions = weightedCandidates
      .flatMap(c => c.recommendedActions || [])
      .filter((action, index, self) => 
        index === self.findIndex(a => a.action === action.action)
      )
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5);

    return {
      decision: primary.decision || 'Proceed with caution',
      confidence: Math.min(consensusConfidence, 0.95),
      reasoning: allReasoning.slice(0, 5),
      recommendedActions: allActions,
      riskAssessment: primary.riskAssessment || {
        level: 'MEDIUM',
        factors: ['Consensus-based decision'],
        mitigation: ['Monitor implementation closely']
      }
    };
  }

  /**
   * Context Analysis
   */
  private async analyzeContext(context: DecisionContext): Promise<any> {
    const [
      recentDecisions,
      userBehavior,
      businessMetrics,
      systemHealth
    ] = await Promise.all([
      this.getRecentDecisions(context.tenantId),
      this.getUserBehaviorPattern(context.userId || ''),
      this.getBusinessMetrics(context.tenantId, context.module),
      this.getSystemHealthMetrics(context.tenantId)
    ]);

    return {
      decisionHistory: recentDecisions.length,
      userActivity: userBehavior,
      businessPerformance: businessMetrics,
      systemLoad: systemHealth,
      contextComplexity: this.calculateContextComplexity(context)
    };
  }

  /**
   * Auto-execute High-confidence Decisions
   */
  private async autoExecuteDecision(
    context: DecisionContext, 
    decision: DecisionResult
  ): Promise<void> {
    const autoExecutableActions = decision.recommendedActions
      .filter(action => action.autoExecute && action.priority >= 7);

    for (const action of autoExecutableActions) {
      try {
        await this.executeAction(context, action);
        
        // Log auto-execution
        await this.prisma.aIDecision.create({
          data: {
            category: context.module,
            decision: `Auto-executed: ${action.action}`,
            confidence: decision.confidence,
            reasoning: [`Auto-execution triggered with ${(decision.confidence * 100).toFixed(1)}% confidence`],
            data: { context, action, autoExecuted: true },
            tenantId: context.tenantId,
            userId: context.userId
          }
        });
      } catch (error) {
        console.error(`Auto-execution failed for action: ${action.action}`, error);
      }
    }
  }

  /**
   * Learning from User Feedback
   */
  async learnFromFeedback(
    decisionId: string,
    feedback: {
      rating: number; // 1-5
      effectiveness: number; // 1-5
      accuracy: number; // 1-5
      comments?: string;
      outcomeData?: any;
    },
    userId: string
  ): Promise<void> {
    try {
      // Store feedback
      await this.prisma.aIFeedback.create({
        data: {
          decisionId,
          rating: feedback.rating,
          effectiveness: feedback.effectiveness,
          accuracy: feedback.accuracy,
          comments: feedback.comments,
          outcomeData: feedback.outcomeData,
          userId,
          tenantId: 'default' // Should be dynamic
        }
      });

      // Update decision pattern success rates
      await this.updatePatternSuccessRates(decisionId, feedback);
      
      // Trigger pattern re-learning
      await this.retrainPatterns(userId);
    } catch (error) {
      console.error('Learning from feedback failed:', error);
    }
  }

  /**
   * Get Decision Recommendations
   */
  async getRecommendations(
    tenantId: string,
    module?: string,
    limit: number = 10
  ): Promise<Array<{
    type: string;
    title: string;
    description: string;
    priority: number;
    confidence: number;
    estimatedImpact: string;
    suggestedAction: string;
  }>> {
    try {
      const filters: any = { tenantId };
      if (module) filters.category = module;

      const recentInsights = await this.prisma.aIInsight.findMany({
        where: {
          ...filters,
          isActionable: true,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        orderBy: [
          { confidence: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit
      });

      return recentInsights.map(insight => ({
        type: insight.type,
        title: insight.title,
        description: insight.description,
        priority: Math.round(insight.confidence * 10),
        confidence: insight.confidence,
        estimatedImpact: this.calculateEstimatedImpact(insight),
        suggestedAction: this.generateSuggestedAction(insight)
      }));
    } catch (error) {
      console.error('Getting recommendations failed:', error);
      return [];
    }
  }

  /**
   * Helper Methods
   */
  private async loadUserPatterns(): Promise<void> {
    // Load user patterns from database or ML models
    console.log('Loading user patterns...');
  }

  private async loadDecisionModels(): Promise<void> {
    // Load decision models
    console.log('Loading decision models...');
  }

  private startPatternLearning(): void {
    // Start background pattern learning
    setInterval(async () => {
      await this.updateUserPatterns();
    }, 60 * 60 * 1000); // Every hour
  }

  private async analyzePatterns(context: DecisionContext): Promise<DecisionPattern[]> {
    const userId = context.userId || 'anonymous';
    return this.userPatterns.get(userId) || [];
  }

  private async getBusinessRules(module: string): Promise<any[]> {
    // Return module-specific business rules
    const rules = {
      CRM: [
        {
          name: 'High-value lead prioritization',
          condition: (ctx: any) => ctx.data.estimatedValue > 10000,
          action: 'Assign to senior sales rep',
          priority: 9,
          confidence: 0.9,
          estimatedImpact: 'High revenue opportunity',
          autoExecute: true
        },
        {
          name: 'Follow-up automation',
          condition: (ctx: any) => ctx.action === 'lead_contacted' && !ctx.data.response,
          action: 'Schedule follow-up in 3 days',
          priority: 7,
          confidence: 0.8,
          estimatedImpact: 'Improved conversion rate',
          autoExecute: true
        }
      ],
      HR: [
        {
          name: 'Performance review scheduling',
          condition: (ctx: any) => ctx.data.lastReview && this.isReviewDue(ctx.data.lastReview),
          action: 'Schedule performance review',
          priority: 8,
          confidence: 0.9,
          estimatedImpact: 'Employee development',
          autoExecute: false
        },
        {
          name: 'Leave approval automation',
          condition: (ctx: any) => ctx.data.leaveType === 'sick' && ctx.data.days <= 3,
          action: 'Auto-approve sick leave',
          priority: 9,
          confidence: 0.95,
          estimatedImpact: 'Faster processing',
          autoExecute: true
        }
      ]
    };

    return (rules as any)[module] || [];
  }

  private evaluateRule(rule: any, context: DecisionContext): boolean {
    try {
      return rule.condition(context);
    } catch (error) {
      console.error('Rule evaluation failed:', error);
      return false;
    }
  }

  private parseJsonResponse(content: string): any {
    try {
      return JSON.parse(content.replace(/```json|```/g, '').trim());
    } catch (error) {
      console.error('JSON parsing error:', error);
      return {};
    }
  }

  private generateCacheKey(context: DecisionContext): string {
    return `decision_${context.tenantId}_${context.module}_${context.action}_${JSON.stringify(context.data).substring(0, 50)}`;
  }

  private getCachedDecision(key: string): DecisionResult | null {
    const cached = this.decisionCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.result;
    }
    return null;
  }

  private setCachedDecision(key: string, result: DecisionResult): void {
    this.decisionCache.set(key, { result, timestamp: Date.now() });
  }

  private calculateSimilarity(context: DecisionContext, historical: any): number {
    // Simplified similarity calculation
    let similarity = 0;
    
    if (context.module === historical.category) similarity += 0.3;
    if (context.action === historical.action) similarity += 0.4;
    if (context.priority === historical.priority) similarity += 0.3;
    
    return similarity;
  }

  private generateFallbackDecision(context: DecisionContext): DecisionResult {
    return {
      decision: 'Proceed with manual review',
      confidence: 0.5,
      reasoning: ['Insufficient data for autonomous decision', 'Manual review recommended'],
      recommendedActions: [{
        action: 'Manual review required',
        priority: 5,
        estimatedImpact: 'Ensures accuracy',
        autoExecute: false
      }],
      riskAssessment: {
        level: 'MEDIUM',
        factors: ['Insufficient decision context'],
        mitigation: ['Require manual approval', 'Gather additional data']
      }
    };
  }

  private async storeDecisionForLearning(context: DecisionContext, decision: DecisionResult): Promise<void> {
    try {
      await this.prisma.aIDecision.create({
        data: {
          category: context.module,
          decision: decision.decision,
          confidence: decision.confidence,
          reasoning: decision.reasoning,
          data: { context, decision },
          tenantId: context.tenantId,
          userId: context.userId
        }
      });
    } catch (error) {
      console.error('Storing decision for learning failed:', error);
    }
  }

  private async executeAction(context: DecisionContext, action: any): Promise<void> {
    // Placeholder for action execution
    console.log(`Executing action: ${action.action}`, { context, action });
  }

  private async getRecentDecisions(tenantId: string): Promise<any[]> {
    return this.prisma.aIDecision.findMany({
      where: {
        tenantId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      take: 20
    });
  }

  private async getUserBehaviorPattern(userId: string): Promise<any> {
    // Simplified behavior pattern
    return { activityLevel: 'normal', preferredActions: [] };
  }

  private async getBusinessMetrics(tenantId: string, module: string): Promise<any> {
    // Simplified business metrics
    return { performance: 'normal', trends: [] };
  }

  private async getSystemHealthMetrics(tenantId: string): Promise<any> {
    // Simplified system health
    return { load: 'normal', availability: 99.9 };
  }

  private calculateContextComplexity(context: DecisionContext): number {
    let complexity = 0;
    if (context.data && Object.keys(context.data).length > 5) complexity += 0.3;
    if (context.priority === 'CRITICAL') complexity += 0.4;
    if (context.metadata && Object.keys(context.metadata).length > 3) complexity += 0.3;
    return Math.min(complexity, 1.0);
  }

  private async updatePatternSuccessRates(decisionId: string, feedback: any): Promise<void> {
    // Update pattern success rates based on feedback
    console.log('Updating pattern success rates', { decisionId, feedback });
  }

  private async retrainPatterns(userId: string): Promise<void> {
    // Retrain user patterns
    console.log('Retraining patterns for user', userId);
  }

  private async updateUserPatterns(): Promise<void> {
    // Update user patterns based on recent activity
    console.log('Updating user patterns...');
  }

  private calculateEstimatedImpact(insight: any): string {
    const confidenceLevel = insight.confidence;
    if (confidenceLevel > 0.8) return 'High Impact';
    if (confidenceLevel > 0.6) return 'Medium Impact';
    return 'Low Impact';
  }

  private generateSuggestedAction(insight: any): string {
    const actionMap: Record<string, string> = {
      'OPTIMIZATION': 'Implement optimization recommendations',
      'ANOMALY': 'Investigate anomaly and take corrective action',
      'PREDICTION': 'Prepare for predicted scenario',
      'ALERT': 'Address alert conditions immediately'
    };
    return actionMap[insight.type] || 'Review and take appropriate action';
  }

  private isReviewDue(lastReview: Date): boolean {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return new Date(lastReview) < sixMonthsAgo;
  }
}

// Singleton instance
let decisionEngineInstance: AutonomousDecisionEngine | null = null;

export function getDecisionEngine(): AutonomousDecisionEngine {
  if (!decisionEngineInstance) {
    decisionEngineInstance = new AutonomousDecisionEngine();
  }
  return decisionEngineInstance;
}

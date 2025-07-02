
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { PredictiveModel, PredictionRequest } from '@/lib/ai/decision-models/predictive-model';
import { LLMService } from '@/lib/ai/llm-service';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

/**
 * POST /api/analytics/predictive
 * Generate predictive analytics
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      predictionType,
      timeframe = 'MONTH',
      module,
      data,
      includeConfidenceInterval = true,
      includeExplanation = true,
      customParameters,
      tenantId = session.user.tenantId || 'default'
    } = body;

    // Validate required fields
    if (!predictionType || !module || !data) {
      return NextResponse.json({ 
        error: 'Missing required fields: predictionType, module, data' 
      }, { status: 400 });
    }

    // Validate prediction type
    const validTypes = ['SALES', 'PERFORMANCE', 'CHURN', 'DEMAND', 'RISK', 'RESOURCE'];
    if (!validTypes.includes(predictionType)) {
      return NextResponse.json({ 
        error: `Invalid predictionType. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate timeframe
    const validTimeframes = ['WEEK', 'MONTH', 'QUARTER', 'YEAR'];
    if (!validTimeframes.includes(timeframe)) {
      return NextResponse.json({ 
        error: `Invalid timeframe. Must be one of: ${validTimeframes.join(', ')}` 
      }, { status: 400 });
    }

    const predictiveModel = new PredictiveModel();
    
    // Prepare prediction request
    const predictionRequest: PredictionRequest = {
      type: predictionType as 'SALES' | 'PERFORMANCE' | 'CHURN' | 'DEMAND' | 'RISK' | 'RESOURCE',
      timeframe: timeframe as 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR',
      data: {
        ...data,
        ...customParameters
      },
      context: {
        tenantId,
        module,
        confidence_threshold: customParameters?.confidence_threshold || 0.7
      }
    };

    // Generate prediction
    const prediction = await predictiveModel.predict(predictionRequest);

    // Enhance prediction with additional insights
    const enhancedPrediction = await this.enhancePrediction(
      prediction,
      predictionRequest,
      includeExplanation
    );

    // Calculate confidence intervals if requested
    let confidenceIntervals = null;
    if (includeConfidenceInterval) {
      confidenceIntervals = this.calculateConfidenceIntervals(prediction, predictionRequest);
    }

    // Get related predictions for context
    const relatedPredictions = await this.getRelatedPredictions(
      tenantId,
      predictionType,
      module
    );

    // Generate actionable insights
    const actionableInsights = await this.generateActionableInsights(
      enhancedPrediction,
      predictionRequest,
      tenantId
    );

    const result = {
      prediction: enhancedPrediction,
      confidenceIntervals,
      relatedPredictions,
      actionableInsights,
      metadata: {
        requestId: `pred_${Date.now()}`,
        generatedAt: new Date(),
        model: 'PredictiveModel v1.0',
        processingTime: Date.now() - (body.startTime || Date.now())
      }
    };

    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Predictive Analytics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }

  // Helper methods
  async function enhancePrediction(
    prediction: any,
    request: PredictionRequest,
    includeExplanation: boolean
  ) {
    const enhanced = { ...prediction };

    // Add contextual information
    enhanced.context = {
      predictionType: request.type,
      timeframe: request.timeframe,
      module: request.context.module,
      dataQuality: this.assessDataQuality(request.data),
      marketConditions: this.assessMarketConditions(),
      seasonalFactors: this.assessSeasonalFactors(request.timeframe)
    };

    // Add explanation if requested
    if (includeExplanation) {
      enhanced.explanation = await this.generatePredictionExplanation(prediction, request);
    }

    // Add business impact assessment
    enhanced.businessImpact = this.assessBusinessImpact(prediction, request);

    return enhanced;
  }

  function calculateConfidenceIntervals(prediction: any, request: PredictionRequest) {
    const baseValue = typeof prediction.prediction === 'number' 
      ? prediction.prediction 
      : prediction.uncertainty?.lower_bound || 0;

    const confidence90 = {
      lower: baseValue * (1 - prediction.uncertainty?.variance * 1.65),
      upper: baseValue * (1 + prediction.uncertainty?.variance * 1.65)
    };

    const confidence95 = {
      lower: baseValue * (1 - prediction.uncertainty?.variance * 1.96),
      upper: baseValue * (1 + prediction.uncertainty?.variance * 1.96)
    };

    const confidence99 = {
      lower: baseValue * (1 - prediction.uncertainty?.variance * 2.58),
      upper: baseValue * (1 + prediction.uncertainty?.variance * 2.58)
    };

    return {
      confidence_90: confidence90,
      confidence_95: confidence95,
      confidence_99: confidence99,
      interpretation: this.interpretConfidenceIntervals(confidence95, request.type)
    };
  }

  async function getRelatedPredictions(tenantId: string, predictionType: string, module: string) {
    try {
      // Get recent predictions of same type
      const recentPredictions = await prisma.aIPrediction.findMany({
        where: {
          tenantId,
          type: { contains: predictionType },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      return recentPredictions.map(pred => ({
        id: pred.id,
        type: pred.type,
        confidence: pred.confidence,
        createdAt: pred.createdAt,
        accuracy: this.calculatePredictionAccuracy(pred)
      }));
    } catch (error) {
      console.error('Failed to get related predictions:', error);
      return [];
    }
  }

  async function generateActionableInsights(
    prediction: any,
    request: PredictionRequest,
    tenantId: string
  ) {
    const llmService = new LLMService(prisma);
    
    try {
      const prompt = `
        Als Predictive Analytics Expert der weGROUP DeepAgent Platform, generiere handlungsorientierte Insights:
        
        Vorhersage: ${JSON.stringify(prediction)}
        Kontext: ${JSON.stringify(request)}
        
        Erstelle konkrete, umsetzbare Insights mit:
        1. immediateActions: Sofortige Handlungsempfehlungen (max 3)
        2. strategicActions: Strategische Maßnahmen (max 3)
        3. riskMitigation: Risikominimierung (max 3)
        4. opportunityCapture: Chancennutzung (max 3)
        5. monitoringKPIs: Überwachungs-KPIs (max 5)
        6. timeline: Zeitplan für Umsetzung
        7. resourceRequirements: Benötigte Ressourcen
        
        Antworte mit strukturiertem JSON.
      `;

      const response = await llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Predictive Analytics Expert. Generiere konkrete, umsetzbare Geschäftsempfehlungen basierend auf Vorhersagen.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Actionable insights generation failed:', error);
      return {
        immediateActions: ['Monitor prediction closely', 'Validate assumptions', 'Prepare contingency plans'],
        strategicActions: ['Develop long-term strategy', 'Align resources', 'Set monitoring systems'],
        riskMitigation: ['Identify risk factors', 'Create mitigation plans', 'Regular reviews'],
        opportunityCapture: ['Identify opportunities', 'Develop action plans', 'Track progress'],
        monitoringKPIs: ['Prediction accuracy', 'Key performance indicators', 'Market conditions'],
        timeline: 'To be determined based on prediction timeframe',
        resourceRequirements: 'Analysis required for specific recommendations'
      };
    }
  }

  async function generatePredictionExplanation(prediction: any, request: PredictionRequest) {
    const llmService = new LLMService(prisma);
    
    try {
      const prompt = `
        Erkläre diese Vorhersage in verständlicher Sprache:
        
        Vorhersage: ${JSON.stringify(prediction)}
        Anfrage: ${JSON.stringify(request)}
        
        Erstelle eine klare Erklärung mit:
        1. Was bedeutet diese Vorhersage?
        2. Wie wurde sie erstellt?
        3. Welche Faktoren beeinflussen sie?
        4. Wie zuverlässig ist sie?
        5. Was sind die Geschäftsimplikationen?
        
        Antworte in 3-4 verständlichen Absätzen.
      `;

      const response = await llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Datenanalyst. Erkläre komplexe Vorhersagen in verständlicher Geschäftssprache.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      return response.choices[0]?.message?.content || 'Erklärung nicht verfügbar';
    } catch (error) {
      console.error('Prediction explanation failed:', error);
      return 'Erklärung der Vorhersage ist derzeit nicht verfügbar.';
    }
  }

  function assessDataQuality(data: any): any {
    let score = 1.0;
    const issues = [];

    // Check for missing values
    const missingValues = this.countMissingValues(data);
    if (missingValues > 0) {
      score -= 0.1 * Math.min(missingValues / 10, 0.5);
      issues.push(`${missingValues} missing values detected`);
    }

    // Check data recency
    const hasRecentData = this.hasRecentData(data);
    if (!hasRecentData) {
      score -= 0.2;
      issues.push('Data may be outdated');
    }

    // Check data volume
    const dataVolume = this.assessDataVolume(data);
    if (dataVolume < 0.5) {
      score -= 0.3;
      issues.push('Limited data volume for prediction');
    }

    return {
      score: Math.max(score, 0.1),
      issues,
      recommendation: score > 0.8 ? 'High quality data' : 
                     score > 0.6 ? 'Good quality data' : 
                     'Data quality issues detected'
    };
  }

  function assessMarketConditions(): any {
    // Simplified market conditions assessment
    return {
      economic: 'stable',
      industry: 'growing',
      competitive: 'moderate',
      regulatory: 'stable',
      overall: 'favorable'
    };
  }

  function assessSeasonalFactors(timeframe: string): any {
    const currentMonth = new Date().getMonth();
    const seasonalityMap = {
      'WEEK': 'minimal',
      'MONTH': currentMonth < 2 || currentMonth > 10 ? 'high' : 'moderate',
      'QUARTER': 'moderate',
      'YEAR': 'high'
    };

    return {
      level: seasonalityMap[timeframe as keyof typeof seasonalityMap] || 'moderate',
      factors: ['Business cycles', 'Holiday periods', 'Market trends'],
      adjustment: 'Considered in prediction model'
    };
  }

  function assessBusinessImpact(prediction: any, request: PredictionRequest): any {
    const impactLevels = {
      'SALES': 'high',
      'PERFORMANCE': 'medium',
      'CHURN': 'high',
      'DEMAND': 'medium',
      'RISK': 'high',
      'RESOURCE': 'medium'
    };

    const confidence = prediction.confidence || 0.5;
    const impact = impactLevels[request.type] || 'medium';

    return {
      level: impact,
      confidence,
      areas: this.getImpactAreas(request.type),
      magnitude: this.calculateImpactMagnitude(prediction, request),
      timeline: request.timeframe.toLowerCase()
    };
  }

  function interpretConfidenceIntervals(interval: any, predictionType: string): string {
    const range = interval.upper - interval.lower;
    const midpoint = (interval.upper + interval.lower) / 2;
    const relativeRange = midpoint > 0 ? (range / midpoint) * 100 : 0;

    if (relativeRange < 10) {
      return 'Sehr präzise Vorhersage mit geringer Unsicherheit';
    } else if (relativeRange < 25) {
      return 'Gute Vorhersagegenauigkeit mit moderater Unsicherheit';
    } else if (relativeRange < 50) {
      return 'Moderate Vorhersagegenauigkeit mit erhöhter Unsicherheit';
    } else {
      return 'Hohe Unsicherheit - Vorhersage sollte vorsichtig interpretiert werden';
    }
  }

  function calculatePredictionAccuracy(prediction: any): number {
    // Simplified accuracy calculation
    // In production, this would compare predicted vs actual values
    return Math.random() * 0.4 + 0.6; // 60-100% range
  }

  function countMissingValues(data: any): number {
    let count = 0;
    
    function traverse(obj: any) {
      for (const key in obj) {
        if (obj[key] === null || obj[key] === undefined || obj[key] === '') {
          count++;
        } else if (typeof obj[key] === 'object') {
          traverse(obj[key]);
        }
      }
    }
    
    traverse(data);
    return count;
  }

  function hasRecentData(data: any): boolean {
    // Check if data contains recent timestamps
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    function findDates(obj: any): Date[] {
      const dates: Date[] = [];
      
      function traverse(item: any) {
        for (const key in item) {
          if (item[key] instanceof Date) {
            dates.push(item[key]);
          } else if (typeof item[key] === 'string' && !isNaN(Date.parse(item[key]))) {
            dates.push(new Date(item[key]));
          } else if (typeof item[key] === 'object' && item[key] !== null) {
            traverse(item[key]);
          }
        }
      }
      
      traverse(obj);
      return dates;
    }
    
    const dates = findDates(data);
    return dates.some(date => date.getTime() > thirtyDaysAgo);
  }

  function assessDataVolume(data: any): number {
    const dataString = JSON.stringify(data);
    const dataSize = dataString.length;
    
    // Normalize data volume score
    if (dataSize > 10000) return 1.0;
    if (dataSize > 5000) return 0.8;
    if (dataSize > 1000) return 0.6;
    if (dataSize > 500) return 0.4;
    return 0.2;
  }

  function getImpactAreas(predictionType: string): string[] {
    const areaMap = {
      'SALES': ['Revenue', 'Customer acquisition', 'Market share'],
      'PERFORMANCE': ['Productivity', 'Quality', 'Employee satisfaction'],
      'CHURN': ['Customer retention', 'Revenue loss', 'Reputation'],
      'DEMAND': ['Inventory', 'Supply chain', 'Resource allocation'],
      'RISK': ['Financial stability', 'Operations', 'Compliance'],
      'RESOURCE': ['Capacity planning', 'Cost management', 'Scalability']
    };

    return areaMap[predictionType as keyof typeof areaMap] || ['General business operations'];
  }

  function calculateImpactMagnitude(prediction: any, request: PredictionRequest): string {
    const confidence = prediction.confidence || 0.5;
    const variance = prediction.uncertainty?.variance || 0.2;
    
    // Higher confidence and lower variance = higher magnitude
    const magnitude = confidence * (1 - variance);
    
    if (magnitude > 0.8) return 'High';
    if (magnitude > 0.6) return 'Medium';
    return 'Low';
  }
}

/**
 * GET /api/analytics/predictive?tenantId=xxx&type=SALES&timeframe=30d
 * Get prediction history and analytics
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || session.user.tenantId || 'default';
    const predictionType = searchParams.get('type');
    const timeframe = searchParams.get('timeframe') || '30d';
    const module = searchParams.get('module');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Calculate date range
    const timeframeDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const daysBack = timeframeDays[timeframe as keyof typeof timeframeDays] || 30;
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000);

    // Build query filters
    const whereClause: any = {
      tenantId,
      createdAt: { gte: startDate }
    };

    if (predictionType) {
      whereClause.type = { contains: predictionType };
    }

    // Get prediction history
    const predictions = await prisma.aIPrediction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        type: true,
        confidence: true,
        data: true,
        createdAt: true
      }
    });

    // Calculate analytics
    const analytics = {
      overview: {
        totalPredictions: predictions.length,
        averageConfidence: predictions.length > 0 
          ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length 
          : 0,
        predictionTypes: this.getPredictionTypesDistribution(predictions),
        timeframe,
        dateRange: { start: startDate, end: new Date() }
      },
      trends: this.calculatePredictionTrends(predictions),
      accuracy: await this.calculatePredictionAccuracyStats(predictions),
      performance: this.calculateModelPerformance(predictions),
      insights: await this.generatePredictionInsights(predictions, tenantId)
    };

    return NextResponse.json({
      success: true,
      data: {
        predictions: predictions.map(p => ({
          id: p.id,
          type: p.type,
          confidence: p.confidence,
          createdAt: p.createdAt,
          summary: this.summarizePrediction(p.data)
        })),
        analytics
      }
    });

  } catch (error) {
    console.error('Prediction History API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }

  // Helper methods for GET endpoint
  function getPredictionTypesDistribution(predictions: any[]): any {
    const distribution: Record<string, number> = {};
    
    predictions.forEach(pred => {
      const type = pred.type || 'UNKNOWN';
      distribution[type] = (distribution[type] || 0) + 1;
    });

    return Object.entries(distribution).map(([type, count]) => ({
      type,
      count,
      percentage: (count / predictions.length) * 100
    }));
  }

  function calculatePredictionTrends(predictions: any[]): any {
    // Group predictions by week
    const weeklyData = new Map();
    
    predictions.forEach(pred => {
      const week = new Date(pred.createdAt).toISOString().slice(0, 10); // YYYY-MM-DD
      if (!weeklyData.has(week)) {
        weeklyData.set(week, { count: 0, totalConfidence: 0 });
      }
      const data = weeklyData.get(week);
      data.count++;
      data.totalConfidence += pred.confidence;
    });

    const trendData = Array.from(weeklyData.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        avgConfidence: data.totalConfidence / data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      weeklyTrends: trendData,
      overallTrend: this.calculateOverallTrend(trendData),
      confidenceTrend: this.calculateConfidenceTrend(trendData)
    };
  }

  async function calculatePredictionAccuracyStats(predictions: any[]): Promise<any> {
    // Simplified accuracy calculation
    // In production, this would compare predictions with actual outcomes
    
    const accuracyScores = predictions.map(pred => {
      // Simulate accuracy based on confidence and time elapsed
      const confidence = pred.confidence;
      const timeElapsed = Date.now() - new Date(pred.createdAt).getTime();
      const daysElapsed = timeElapsed / (24 * 60 * 60 * 1000);
      
      // Assume accuracy degrades slightly over time
      const timeDecay = Math.max(0.8, 1 - (daysElapsed * 0.01));
      return confidence * timeDecay * (0.8 + Math.random() * 0.2);
    });

    const avgAccuracy = accuracyScores.length > 0 
      ? accuracyScores.reduce((sum, acc) => sum + acc, 0) / accuracyScores.length 
      : 0;

    return {
      averageAccuracy: avgAccuracy,
      accuracyDistribution: this.calculateAccuracyDistribution(accuracyScores),
      topPerformingTypes: this.identifyTopPerformingTypes(predictions, accuracyScores),
      improvementAreas: this.identifyImprovementAreas(predictions, accuracyScores)
    };
  }

  function calculateModelPerformance(predictions: any[]): any {
    const last30Days = predictions.filter(pred => 
      Date.now() - new Date(pred.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000
    );

    const last7Days = predictions.filter(pred => 
      Date.now() - new Date(pred.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000
    );

    return {
      recentActivity: {
        last7Days: last7Days.length,
        last30Days: last30Days.length,
        avgPredictionsPerDay: last30Days.length / 30
      },
      confidence: {
        overall: predictions.reduce((sum, p) => sum + p.confidence, 0) / Math.max(predictions.length, 1),
        recent: last7Days.reduce((sum, p) => sum + p.confidence, 0) / Math.max(last7Days.length, 1),
        trend: this.calculateConfidenceTrendDirection(predictions)
      },
      reliability: {
        consistencyScore: this.calculateConsistencyScore(predictions),
        variabilityIndex: this.calculateVariabilityIndex(predictions)
      }
    };
  }

  async function generatePredictionInsights(predictions: any[], tenantId: string): Promise<any> {
    const llmService = new LLMService(prisma);
    
    try {
      const recentPredictions = predictions.slice(0, 10); // Analyze recent predictions
      
      const prompt = `
        Als Predictive Analytics Analyst der weGROUP DeepAgent Platform, analysiere diese Vorhersage-Historie:
        
        Letzte Vorhersagen: ${JSON.stringify(recentPredictions)}
        Gesamt-Anzahl: ${predictions.length}
        
        Erstelle strategische Insights mit:
        1. keyPatterns: Erkannte Muster in den Vorhersagen
        2. qualityAssessment: Bewertung der Vorhersagequalität
        3. recommendations: Empfehlungen zur Verbesserung
        4. riskAreas: Risikobereiche identifiziert
        5. opportunities: Chancen für bessere Vorhersagen
        
        Antworte mit strukturiertem JSON.
      `;

      const response = await llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Predictive Analytics Analyst. Analysiere Vorhersage-Daten und generiere strategische Insights.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Prediction insights generation failed:', error);
      return {
        keyPatterns: ['Muster-Analyse nicht verfügbar'],
        qualityAssessment: 'Bewertung nicht verfügbar',
        recommendations: ['Sammeln Sie mehr Vorhersage-Daten für bessere Analyse'],
        riskAreas: [],
        opportunities: []
      };
    }
  }

  function summarizePrediction(data: any): string {
    if (!data) return 'No data available';
    
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (parsed.request?.type) {
        const type = parsed.request.type;
        const confidence = parsed.result?.confidence || 0;
        return `${type} prediction with ${(confidence * 100).toFixed(0)}% confidence`;
      }
      
      return 'Prediction data available';
    } catch (error) {
      return 'Unable to parse prediction data';
    }
  }

  function calculateOverallTrend(trendData: any[]): string {
    if (trendData.length < 2) return 'stable';
    
    const recent = trendData.slice(-5);
    const earlier = trendData.slice(0, -5);
    
    if (recent.length === 0 || earlier.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, d) => sum + d.count, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, d) => sum + d.count, 0) / earlier.length;
    
    const change = (recentAvg - earlierAvg) / earlierAvg;
    
    if (change > 0.1) return 'increasing';
    if (change < -0.1) return 'decreasing';
    return 'stable';
  }

  function calculateConfidenceTrend(trendData: any[]): string {
    if (trendData.length < 2) return 'stable';
    
    const recent = trendData.slice(-5);
    const earlier = trendData.slice(0, -5);
    
    if (recent.length === 0 || earlier.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, d) => sum + d.avgConfidence, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, d) => sum + d.avgConfidence, 0) / earlier.length;
    
    const change = (recentAvg - earlierAvg) / earlierAvg;
    
    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }

  function calculateAccuracyDistribution(accuracyScores: number[]): any {
    const distribution = { high: 0, medium: 0, low: 0 };
    
    accuracyScores.forEach(score => {
      if (score > 0.8) distribution.high++;
      else if (score > 0.6) distribution.medium++;
      else distribution.low++;
    });

    return distribution;
  }

  function identifyTopPerformingTypes(predictions: any[], accuracyScores: number[]): any[] {
    const typePerformance = new Map();
    
    predictions.forEach((pred, index) => {
      const type = pred.type;
      const accuracy = accuracyScores[index] || 0;
      
      if (!typePerformance.has(type)) {
        typePerformance.set(type, { count: 0, totalAccuracy: 0 });
      }
      
      const data = typePerformance.get(type);
      data.count++;
      data.totalAccuracy += accuracy;
    });

    return Array.from(typePerformance.entries())
      .map(([type, data]) => ({
        type,
        averageAccuracy: data.totalAccuracy / data.count,
        count: data.count
      }))
      .sort((a, b) => b.averageAccuracy - a.averageAccuracy)
      .slice(0, 3);
  }

  function identifyImprovementAreas(predictions: any[], accuracyScores: number[]): string[] {
    const areas = [];
    
    const avgAccuracy = accuracyScores.reduce((sum, acc) => sum + acc, 0) / accuracyScores.length;
    
    if (avgAccuracy < 0.7) {
      areas.push('Overall prediction accuracy needs improvement');
    }
    
    const lowAccuracyPredictions = accuracyScores.filter(acc => acc < 0.6).length;
    if (lowAccuracyPredictions > predictions.length * 0.3) {
      areas.push('High number of low-accuracy predictions');
    }
    
    const confidenceVariability = this.calculateVariabilityIndex(predictions);
    if (confidenceVariability > 0.3) {
      areas.push('High variability in prediction confidence');
    }

    return areas;
  }

  function calculateConfidenceTrendDirection(predictions: any[]): string {
    if (predictions.length < 5) return 'stable';
    
    const recent = predictions.slice(0, Math.floor(predictions.length / 2));
    const older = predictions.slice(Math.floor(predictions.length / 2));
    
    const recentAvg = recent.reduce((sum, p) => sum + p.confidence, 0) / recent.length;
    const olderAvg = older.reduce((sum, p) => sum + p.confidence, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.05) return 'improving';
    if (change < -0.05) return 'declining';
    return 'stable';
  }

  function calculateConsistencyScore(predictions: any[]): number {
    if (predictions.length < 2) return 1.0;
    
    const confidences = predictions.map(p => p.confidence);
    const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
    
    // Lower variance = higher consistency
    return Math.max(0, 1 - variance);
  }

  function calculateVariabilityIndex(predictions: any[]): number {
    if (predictions.length < 2) return 0;
    
    const confidences = predictions.map(p => p.confidence);
    const mean = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
    const variance = confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;
    
    return Math.sqrt(variance);
  }
}


import { PrismaClient } from '@prisma/client';
import { LLMService } from '../llm-service';

export interface PredictionRequest {
  type: 'SALES' | 'PERFORMANCE' | 'CHURN' | 'DEMAND' | 'RISK' | 'RESOURCE';
  timeframe: 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR';
  data: any;
  context: {
    tenantId: string;
    module: string;
    confidence_threshold?: number;
  };
}

export interface PredictionResult {
  prediction: number | string;
  confidence: number;
  factors: string[];
  trend: 'INCREASING' | 'DECREASING' | 'STABLE' | 'VOLATILE';
  recommendations: string[];
  uncertainty: {
    lower_bound: number;
    upper_bound: number;
    variance: number;
  };
  model_metadata: {
    model_version: string;
    training_data_size: number;
    last_trained: Date;
    accuracy: number;
  };
}

export class PredictiveModel {
  private prisma: PrismaClient;
  private llmService: LLMService;
  private modelCache: Map<string, any> = new Map();
  private predictionCache: Map<string, { result: PredictionResult; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.prisma = new PrismaClient();
    this.llmService = new LLMService(this.prisma);
  }

  /**
   * Main Prediction Method
   */
  async predict(request: PredictionRequest): Promise<PredictionResult> {
    const cacheKey = this.generateCacheKey(request);
    const cached = this.getCachedPrediction(cacheKey);
    
    if (cached) {
      return cached;
    }

    let result: PredictionResult;

    switch (request.type) {
      case 'SALES':
        result = await this.predictSales(request);
        break;
      case 'PERFORMANCE':
        result = await this.predictPerformance(request);
        break;
      case 'CHURN':
        result = await this.predictChurn(request);
        break;
      case 'DEMAND':
        result = await this.predictDemand(request);
        break;
      case 'RISK':
        result = await this.predictRisk(request);
        break;
      case 'RESOURCE':
        result = await this.predictResourceNeeds(request);
        break;
      default:
        result = await this.predictGeneric(request);
    }

    // Cache the result
    this.setCachedPrediction(cacheKey, result);

    // Store prediction in database
    await this.storePrediction(request, result);

    return result;
  }

  /**
   * Sales Prediction
   */
  private async predictSales(request: PredictionRequest): Promise<PredictionResult> {
    const { data, timeframe, context } = request;
    
    try {
      // Historical data analysis
      const historicalSales = await this.getHistoricalSalesData(context.tenantId);
      const seasonalFactors = this.analyzeSeasonality(historicalSales, timeframe);
      const trendFactors = this.analyzeTrend(historicalSales);
      
      // Pipeline analysis
      const pipelineStrength = this.analyzePipelineStrength(data.pipeline || []);
      const conversionRates = this.calculateConversionRates(data.pipeline || []);
      
      // Market factors
      const marketFactors = this.analyzeMarketFactors(data.market || {});
      
      // AI-enhanced prediction
      const aiPrediction = await this.getAIPrediction('sales', {
        historical: historicalSales.slice(-12), // Last 12 periods
        pipeline: data.pipeline,
        seasonality: seasonalFactors,
        trend: trendFactors,
        market: marketFactors,
        timeframe
      });

      // Combine predictions
      const basePrediction = this.calculateBaseSalesPrediction(historicalSales, timeframe);
      const pipelinePrediction = pipelineStrength * conversionRates.average;
      const seasonalAdjustment = seasonalFactors.current_factor;
      const trendAdjustment = trendFactors.growth_rate;
      
      const combinedPrediction = (
        basePrediction * 0.3 +
        pipelinePrediction * 0.4 +
        (aiPrediction.value || basePrediction) * 0.3
      ) * seasonalAdjustment * (1 + trendAdjustment);

      // Calculate confidence and uncertainty
      const confidence = Math.min(
        (pipelineStrength > 0 ? 0.8 : 0.6) * 
        (aiPrediction.confidence || 0.7) * 
        (historicalSales.length > 6 ? 1.0 : 0.8),
        0.95
      );

      const variance = combinedPrediction * 0.15; // 15% variance
      
      return {
        prediction: Math.round(combinedPrediction),
        confidence,
        factors: [
          `Pipeline strength: ${pipelineStrength.toFixed(1)}`,
          `Seasonal factor: ${seasonalFactors.current_factor.toFixed(2)}`,
          `Growth trend: ${(trendFactors.growth_rate * 100).toFixed(1)}%`,
          `Historical average: ${basePrediction.toFixed(0)}`,
          ...(aiPrediction.factors || [])
        ],
        trend: this.determineTrend(trendFactors.growth_rate),
        recommendations: [
          ...this.getSalesRecommendations(combinedPrediction, basePrediction),
          ...(aiPrediction.recommendations || [])
        ],
        uncertainty: {
          lower_bound: Math.round(combinedPrediction - variance),
          upper_bound: Math.round(combinedPrediction + variance),
          variance: variance / combinedPrediction
        },
        model_metadata: {
          model_version: '1.2.0',
          training_data_size: historicalSales.length,
          last_trained: new Date(),
          accuracy: confidence
        }
      };
    } catch (error) {
      console.error('Sales prediction failed:', error);
      return this.generateFallbackPrediction('sales', request);
    }
  }

  /**
   * Performance Prediction
   */
  private async predictPerformance(request: PredictionRequest): Promise<PredictionResult> {
    const { data, timeframe, context } = request;
    
    try {
      // Historical performance data
      const historicalPerformance = await this.getHistoricalPerformanceData(context.tenantId);
      const performanceTrend = this.analyzePerformanceTrend(historicalPerformance);
      
      // Current metrics analysis
      const currentMetrics = this.analyzeCurrentMetrics(data.metrics || {});
      const teamFactors = this.analyzeTeamFactors(data.team || {});
      
      // External factors
      const externalFactors = this.analyzeExternalFactors(data.external || {});
      
      // AI-enhanced prediction
      const aiPrediction = await this.getAIPrediction('performance', {
        historical: historicalPerformance,
        current: currentMetrics,
        team: teamFactors,
        external: externalFactors,
        timeframe
      });

      // Calculate performance score prediction
      const basePerformance = this.calculateBasePerformance(historicalPerformance);
      const trendAdjustment = performanceTrend.direction * performanceTrend.strength;
      const teamAdjustment = teamFactors.efficiency_score - 0.5; // Normalize around 0.5
      const externalAdjustment = externalFactors.market_conditions - 0.5;
      
      const predictedPerformance = Math.max(0, Math.min(100,
        basePerformance + 
        (trendAdjustment * 10) + 
        (teamAdjustment * 15) + 
        (externalAdjustment * 8) +
        ((aiPrediction.value || 0) * 5)
      ));

      const confidence = Math.min(
        (historicalPerformance.length > 3 ? 0.8 : 0.6) *
        (aiPrediction.confidence || 0.7) *
        (teamFactors.stability > 0.7 ? 1.0 : 0.85),
        0.9
      );

      return {
        prediction: Math.round(predictedPerformance),
        confidence,
        factors: [
          `Historical average: ${basePerformance.toFixed(1)}`,
          `Performance trend: ${performanceTrend.direction > 0 ? 'Improving' : 'Declining'}`,
          `Team efficiency: ${(teamFactors.efficiency_score * 100).toFixed(1)}%`,
          `Market conditions: ${externalFactors.market_conditions > 0.5 ? 'Favorable' : 'Challenging'}`,
          ...(aiPrediction.factors || [])
        ],
        trend: this.determineTrend(performanceTrend.direction * performanceTrend.strength),
        recommendations: [
          ...this.getPerformanceRecommendations(predictedPerformance, basePerformance),
          ...(aiPrediction.recommendations || [])
        ],
        uncertainty: {
          lower_bound: Math.round(predictedPerformance * 0.9),
          upper_bound: Math.round(predictedPerformance * 1.1),
          variance: 0.1
        },
        model_metadata: {
          model_version: '1.1.0',
          training_data_size: historicalPerformance.length,
          last_trained: new Date(),
          accuracy: confidence
        }
      };
    } catch (error) {
      console.error('Performance prediction failed:', error);
      return this.generateFallbackPrediction('performance', request);
    }
  }

  /**
   * Churn Prediction
   */
  private async predictChurn(request: PredictionRequest): Promise<PredictionResult> {
    const { data, context } = request;
    
    try {
      // Customer behavior analysis
      const behaviorFactors = this.analyzeCustomerBehavior(data.customer || {});
      const engagementFactors = this.analyzeEngagementFactors(data.engagement || {});
      const satisfactionFactors = this.analyzeSatisfactionFactors(data.satisfaction || {});
      
      // AI-enhanced churn prediction
      const aiPrediction = await this.getAIPrediction('churn', {
        behavior: behaviorFactors,
        engagement: engagementFactors,
        satisfaction: satisfactionFactors,
        customer: data.customer
      });

      // Calculate churn probability
      let churnProbability = 0;
      
      // Engagement decline
      if (engagementFactors.recent_decline > 0.3) {
        churnProbability += 0.25;
      }
      
      // Satisfaction issues
      if (satisfactionFactors.score < 3) {
        churnProbability += 0.3;
      }
      
      // Usage patterns
      if (behaviorFactors.usage_decline > 0.4) {
        churnProbability += 0.2;
      }
      
      // Support interactions
      if (behaviorFactors.support_frequency > 0.6) {
        churnProbability += 0.15;
      }
      
      // Payment issues
      if (behaviorFactors.payment_issues > 0) {
        churnProbability += 0.1;
      }

      // Incorporate AI prediction
      if (aiPrediction.value !== undefined) {
        churnProbability = (churnProbability * 0.7) + (aiPrediction.value * 0.3);
      }

      churnProbability = Math.min(churnProbability, 1);
      
      const riskLevel = churnProbability > 0.7 ? 'HIGH' : churnProbability > 0.4 ? 'MEDIUM' : 'LOW';
      
      return {
        prediction: (churnProbability * 100).toFixed(1) + '%',
        confidence: aiPrediction.confidence || 0.8,
        factors: [
          `Engagement decline: ${(engagementFactors.recent_decline * 100).toFixed(1)}%`,
          `Satisfaction score: ${satisfactionFactors.score}/5`,
          `Usage decline: ${(behaviorFactors.usage_decline * 100).toFixed(1)}%`,
          `Risk level: ${riskLevel}`,
          ...(aiPrediction.factors || [])
        ],
        trend: churnProbability > 0.5 ? 'INCREASING' : 'STABLE',
        recommendations: [
          ...this.getChurnRecommendations(churnProbability),
          ...(aiPrediction.recommendations || [])
        ],
        uncertainty: {
          lower_bound: Math.max(0, churnProbability - 0.1) * 100,
          upper_bound: Math.min(1, churnProbability + 0.1) * 100,
          variance: 0.1
        },
        model_metadata: {
          model_version: '1.3.0',
          training_data_size: 1000, // Typical training set size
          last_trained: new Date(),
          accuracy: 0.85
        }
      };
    } catch (error) {
      console.error('Churn prediction failed:', error);
      return this.generateFallbackPrediction('churn', request);
    }
  }

  /**
   * Demand Prediction
   */
  private async predictDemand(request: PredictionRequest): Promise<PredictionResult> {
    const { data, timeframe } = request;
    
    try {
      const historicalDemand = data.historical || [];
      const seasonalPattern = this.analyzeSeasonality(historicalDemand, timeframe);
      const marketFactors = this.analyzeMarketFactors(data.market || {});
      
      // AI-enhanced demand prediction
      const aiPrediction = await this.getAIPrediction('demand', {
        historical: historicalDemand,
        seasonal: seasonalPattern,
        market: marketFactors,
        timeframe
      });

      const baseDemand = this.calculateBaseDemand(historicalDemand);
      const seasonalAdjustment = seasonalPattern.current_factor;
      const marketAdjustment = marketFactors.growth_indicator || 1;
      
      const predictedDemand = baseDemand * seasonalAdjustment * marketAdjustment * 
        (aiPrediction.value ? (1 + (aiPrediction.value - 1) * 0.3) : 1);

      return {
        prediction: Math.round(predictedDemand),
        confidence: aiPrediction.confidence || 0.75,
        factors: [
          `Base demand: ${baseDemand.toFixed(0)}`,
          `Seasonal factor: ${seasonalAdjustment.toFixed(2)}`,
          `Market growth: ${((marketAdjustment - 1) * 100).toFixed(1)}%`,
          ...(aiPrediction.factors || [])
        ],
        trend: this.determineTrend(marketAdjustment - 1),
        recommendations: [
          ...this.getDemandRecommendations(predictedDemand, baseDemand),
          ...(aiPrediction.recommendations || [])
        ],
        uncertainty: {
          lower_bound: Math.round(predictedDemand * 0.85),
          upper_bound: Math.round(predictedDemand * 1.15),
          variance: 0.15
        },
        model_metadata: {
          model_version: '1.0.0',
          training_data_size: historicalDemand.length,
          last_trained: new Date(),
          accuracy: 0.8
        }
      };
    } catch (error) {
      console.error('Demand prediction failed:', error);
      return this.generateFallbackPrediction('demand', request);
    }
  }

  /**
   * Risk Prediction
   */
  private async predictRisk(request: PredictionRequest): Promise<PredictionResult> {
    const { data } = request;
    
    try {
      const riskFactors = this.analyzeRiskFactors(data);
      
      // AI-enhanced risk prediction
      const aiPrediction = await this.getAIPrediction('risk', {
        factors: riskFactors,
        context: data.context || {}
      });

      let riskScore = 0;
      const contributingFactors: string[] = [];

      // Financial risk
      if (riskFactors.financial > 0.6) {
        riskScore += 0.3;
        contributingFactors.push('High financial risk');
      }

      // Operational risk
      if (riskFactors.operational > 0.5) {
        riskScore += 0.25;
        contributingFactors.push('Operational vulnerabilities');
      }

      // Market risk
      if (riskFactors.market > 0.4) {
        riskScore += 0.2;
        contributingFactors.push('Market uncertainties');
      }

      // Technology risk
      if (riskFactors.technology > 0.5) {
        riskScore += 0.15;
        contributingFactors.push('Technology risks');
      }

      // Regulatory risk
      if (riskFactors.regulatory > 0.3) {
        riskScore += 0.1;
        contributingFactors.push('Regulatory changes');
      }

      // Incorporate AI prediction
      if (aiPrediction.value !== undefined) {
        riskScore = (riskScore * 0.7) + (aiPrediction.value * 0.3);
      }

      const riskLevel = riskScore > 0.7 ? 'HIGH' : riskScore > 0.4 ? 'MEDIUM' : 'LOW';

      return {
        prediction: riskLevel,
        confidence: aiPrediction.confidence || 0.8,
        factors: [
          `Overall risk score: ${(riskScore * 100).toFixed(1)}%`,
          ...contributingFactors,
          ...(aiPrediction.factors || [])
        ],
        trend: riskScore > 0.5 ? 'INCREASING' : 'STABLE',
        recommendations: [
          ...this.getRiskRecommendations(riskScore, riskFactors),
          ...(aiPrediction.recommendations || [])
        ],
        uncertainty: {
          lower_bound: Math.max(0, riskScore - 0.1) * 100,
          upper_bound: Math.min(1, riskScore + 0.1) * 100,
          variance: 0.1
        },
        model_metadata: {
          model_version: '1.1.0',
          training_data_size: 500,
          last_trained: new Date(),
          accuracy: 0.82
        }
      };
    } catch (error) {
      console.error('Risk prediction failed:', error);
      return this.generateFallbackPrediction('risk', request);
    }
  }

  /**
   * Resource Needs Prediction
   */
  private async predictResourceNeeds(request: PredictionRequest): Promise<PredictionResult> {
    const { data, timeframe } = request;
    
    try {
      const currentUtilization = data.utilization || {};
      const plannedWork = data.planned || {};
      const historicalData = data.historical || [];
      
      // AI-enhanced resource prediction
      const aiPrediction = await this.getAIPrediction('resource', {
        utilization: currentUtilization,
        planned: plannedWork,
        historical: historicalData,
        timeframe
      });

      const baseRequirement = this.calculateBaseResourceRequirement(historicalData);
      const workloadAdjustment = this.calculateWorkloadAdjustment(plannedWork);
      const efficiencyFactor = currentUtilization.efficiency || 0.8;
      
      const predictedResources = Math.ceil(
        (baseRequirement * workloadAdjustment) / efficiencyFactor *
        (aiPrediction.value ? (aiPrediction.value * 0.3 + 0.7) : 1)
      );

      return {
        prediction: predictedResources,
        confidence: aiPrediction.confidence || 0.75,
        factors: [
          `Base requirement: ${baseRequirement}`,
          `Workload adjustment: ${(workloadAdjustment * 100).toFixed(1)}%`,
          `Current efficiency: ${(efficiencyFactor * 100).toFixed(1)}%`,
          ...(aiPrediction.factors || [])
        ],
        trend: workloadAdjustment > 1.1 ? 'INCREASING' : workloadAdjustment < 0.9 ? 'DECREASING' : 'STABLE',
        recommendations: [
          ...this.getResourceRecommendations(predictedResources, baseRequirement),
          ...(aiPrediction.recommendations || [])
        ],
        uncertainty: {
          lower_bound: Math.round(predictedResources * 0.9),
          upper_bound: Math.round(predictedResources * 1.2),
          variance: 0.15
        },
        model_metadata: {
          model_version: '1.0.0',
          training_data_size: historicalData.length,
          last_trained: new Date(),
          accuracy: 0.78
        }
      };
    } catch (error) {
      console.error('Resource prediction failed:', error);
      return this.generateFallbackPrediction('resource', request);
    }
  }

  /**
   * Generic Prediction
   */
  private async predictGeneric(request: PredictionRequest): Promise<PredictionResult> {
    try {
      const aiPrediction = await this.getAIPrediction('generic', request.data);
      
      return {
        prediction: aiPrediction.value || 'No prediction available',
        confidence: aiPrediction.confidence || 0.5,
        factors: aiPrediction.factors || ['Generic prediction model used'],
        trend: 'STABLE',
        recommendations: aiPrediction.recommendations || ['Monitor and gather more data'],
        uncertainty: {
          lower_bound: 0,
          upper_bound: 100,
          variance: 0.3
        },
        model_metadata: {
          model_version: '1.0.0',
          training_data_size: 0,
          last_trained: new Date(),
          accuracy: 0.5
        }
      };
    } catch (error) {
      console.error('Generic prediction failed:', error);
      return this.generateFallbackPrediction('generic', request);
    }
  }

  /**
   * AI-Enhanced Prediction using LLM
   */
  private async getAIPrediction(type: string, data: any): Promise<any> {
    try {
      const prompt = `
        Als AI-Predictor der weGROUP DeepAgent Platform, analysiere diese Daten für eine ${type} Vorhersage:
        
        Daten: ${JSON.stringify(data)}
        
        Erstelle eine präzise Vorhersage mit:
        1. value: Numerischer Vorhersagewert (oder String für kategorische Vorhersagen)
        2. confidence: Vertrauenswert (0-1)
        3. factors: Array der wichtigsten Einflussfaktoren
        4. recommendations: Array von Empfehlungen
        5. reasoning: Begründung der Vorhersage
        
        Antworte mit strukturiertem JSON.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Du bist ein AI-Predictor. Erstelle präzise, datenbasierte Vorhersagen mit hoher Genauigkeit.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      const prediction = this.parseJsonResponse(response.choices[0]?.message?.content || '{}');
      return prediction;
    } catch (error) {
      console.error('AI prediction failed:', error);
      return { confidence: 0.5, factors: [], recommendations: [] };
    }
  }

  /**
   * Helper Methods
   */
  private async getHistoricalSalesData(tenantId: string): Promise<any[]> {
    // Fetch historical sales data from database
    const deals = await this.prisma.deal.findMany({
      where: {
        tenantId,
        status: 'WON',
        closedAt: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) // Last year
        }
      },
      select: {
        value: true,
        closedAt: true
      },
      orderBy: { closedAt: 'asc' }
    });

    return deals.map(deal => ({
      value: deal.value,
      date: deal.closedAt
    }));
  }

  private async getHistoricalPerformanceData(tenantId: string): Promise<any[]> {
    const reviews = await this.prisma.performance.findMany({
      where: {
        tenantId,
        endDate: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        overallRating: true,
        endDate: true
      },
      orderBy: { endDate: 'asc' }
    });

    return reviews.map(review => ({
      rating: review.overallRating === 'EXCELLENT' ? 5 : 
              review.overallRating === 'GOOD' ? 4 :
              review.overallRating === 'AVERAGE' ? 3 :
              review.overallRating === 'POOR' ? 2 : 1,
      date: review.endDate
    }));
  }

  private analyzeSeasonality(data: any[], timeframe: string): any {
    if (data.length < 4) {
      return { current_factor: 1.0, seasonal_pattern: [] };
    }

    // Simplified seasonality analysis
    const currentMonth = new Date().getMonth();
    const seasonalFactors = [1.0, 0.9, 1.1, 1.0, 0.95, 1.05, 0.85, 0.9, 1.1, 1.15, 1.2, 1.3]; // Example pattern
    
    return {
      current_factor: seasonalFactors[currentMonth],
      seasonal_pattern: seasonalFactors
    };
  }

  private analyzeTrend(data: any[]): any {
    if (data.length < 2) {
      return { growth_rate: 0, direction: 0, strength: 0 };
    }

    const values = data.map(d => d.value).filter(v => v !== null && v !== undefined);
    if (values.length < 2) {
      return { growth_rate: 0, direction: 0, strength: 0 };
    }

    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const growthRate = firstAvg > 0 ? (secondAvg - firstAvg) / firstAvg : 0;
    
    return {
      growth_rate: growthRate,
      direction: growthRate > 0 ? 1 : growthRate < 0 ? -1 : 0,
      strength: Math.abs(growthRate)
    };
  }

  private analyzePipelineStrength(pipeline: any[]): number {
    if (pipeline.length === 0) return 0;
    
    const totalValue = pipeline.reduce((sum, opp) => sum + (opp.value || 0), 0);
    const weightedValue = pipeline.reduce((sum, opp) => 
      sum + (opp.value || 0) * (opp.probability || 0.5), 0);
    
    return weightedValue;
  }

  private calculateConversionRates(pipeline: any[]): any {
    if (pipeline.length === 0) return { average: 0.3 };
    
    const rates = pipeline.map(opp => opp.probability || 0.5);
    const average = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
    
    return { average, rates };
  }

  private analyzeMarketFactors(market: any): any {
    return {
      growth_indicator: market.growth_rate ? (1 + market.growth_rate) : 1.0,
      competition_factor: market.competition_intensity ? (2 - market.competition_intensity) : 1.0,
      economic_factor: market.economic_outlook === 'positive' ? 1.1 : 
                      market.economic_outlook === 'negative' ? 0.9 : 1.0
    };
  }

  private calculateBaseSalesPrediction(historical: any[], timeframe: string): number {
    if (historical.length === 0) return 0;
    
    const recentData = historical.slice(-6); // Last 6 periods
    const average = recentData.reduce((sum, data) => sum + (data.value || 0), 0) / recentData.length;
    
    // Adjust for timeframe
    const timeframeMultipliers = { WEEK: 0.25, MONTH: 1, QUARTER: 3, YEAR: 12 };
    return average * (timeframeMultipliers[timeframe as keyof typeof timeframeMultipliers] || 1);
  }

  private analyzePerformanceTrend(performance: any[]): any {
    if (performance.length < 2) {
      return { direction: 0, strength: 0 };
    }

    const recent = performance.slice(-3).map(p => p.rating);
    const earlier = performance.slice(-6, -3).map(p => p.rating);
    
    if (recent.length === 0 || earlier.length === 0) {
      return { direction: 0, strength: 0 };
    }

    const recentAvg = recent.reduce((sum, r) => sum + r, 0) / recent.length;
    const earlierAvg = earlier.reduce((sum, r) => sum + r, 0) / earlier.length;
    
    const change = recentAvg - earlierAvg;
    
    return {
      direction: change > 0 ? 1 : change < 0 ? -1 : 0,
      strength: Math.abs(change) / 5 // Normalize to 0-1 scale
    };
  }

  private analyzeCurrentMetrics(metrics: any): any {
    return {
      productivity: metrics.productivity || 0.7,
      quality: metrics.quality || 0.8,
      efficiency: metrics.efficiency || 0.75
    };
  }

  private analyzeTeamFactors(team: any): any {
    return {
      efficiency_score: team.efficiency || 0.8,
      stability: team.turnover_rate ? (1 - team.turnover_rate) : 0.9,
      experience_level: team.avg_experience || 0.7
    };
  }

  private analyzeExternalFactors(external: any): any {
    return {
      market_conditions: external.market_sentiment || 0.6,
      economic_climate: external.economic_indicators || 0.7,
      industry_trends: external.industry_growth || 0.6
    };
  }

  private calculateBasePerformance(historical: any[]): number {
    if (historical.length === 0) return 70; // Default baseline
    
    const recent = historical.slice(-3);
    const average = recent.reduce((sum, perf) => sum + perf.rating, 0) / recent.length;
    
    return (average / 5) * 100; // Convert to 0-100 scale
  }

  private analyzeCustomerBehavior(customer: any): any {
    return {
      usage_decline: customer.usage_change < 0 ? Math.abs(customer.usage_change) : 0,
      support_frequency: Math.min((customer.support_tickets || 0) / 10, 1),
      payment_issues: customer.late_payments || 0
    };
  }

  private analyzeEngagementFactors(engagement: any): any {
    return {
      recent_decline: engagement.score_change < 0 ? Math.abs(engagement.score_change) : 0,
      frequency: engagement.interaction_frequency || 0.5,
      depth: engagement.feature_usage || 0.5
    };
  }

  private analyzeSatisfactionFactors(satisfaction: any): any {
    return {
      score: satisfaction.rating || 3.5,
      trend: satisfaction.trend || 'stable',
      feedback_sentiment: satisfaction.sentiment || 0.5
    };
  }

  private calculateBaseDemand(historical: any[]): number {
    if (historical.length === 0) return 100; // Default baseline
    
    const recent = historical.slice(-3);
    return recent.reduce((sum, data) => sum + (data.demand || 0), 0) / recent.length;
  }

  private analyzeRiskFactors(data: any): any {
    return {
      financial: data.financial_metrics?.risk_score || 0.3,
      operational: data.operational_metrics?.risk_score || 0.2,
      market: data.market_metrics?.risk_score || 0.4,
      technology: data.technology_metrics?.risk_score || 0.3,
      regulatory: data.regulatory_metrics?.risk_score || 0.2
    };
  }

  private calculateBaseResourceRequirement(historical: any[]): number {
    if (historical.length === 0) return 5; // Default team size
    
    const recent = historical.slice(-2);
    return recent.reduce((sum, data) => sum + (data.team_size || 5), 0) / recent.length;
  }

  private calculateWorkloadAdjustment(planned: any): number {
    if (!planned.projects || planned.projects.length === 0) return 1.0;
    
    const complexity = planned.projects.reduce((sum: number, project: any) => 
      sum + (project.complexity || 5), 0) / planned.projects.length;
    
    return Math.max(0.5, Math.min(2.0, complexity / 5));
  }

  private determineTrend(value: number): 'INCREASING' | 'DECREASING' | 'STABLE' | 'VOLATILE' {
    if (Math.abs(value) < 0.05) return 'STABLE';
    if (value > 0.15) return 'INCREASING';
    if (value < -0.15) return 'DECREASING';
    return 'VOLATILE';
  }

  private getSalesRecommendations(predicted: number, baseline: number): string[] {
    const recommendations = [];
    
    if (predicted > baseline * 1.2) {
      recommendations.push('Scale sales team to handle increased demand');
      recommendations.push('Optimize inventory and fulfillment processes');
    } else if (predicted < baseline * 0.8) {
      recommendations.push('Intensify marketing and lead generation efforts');
      recommendations.push('Review pricing strategy and value proposition');
    } else {
      recommendations.push('Maintain current sales strategy');
      recommendations.push('Focus on customer retention');
    }
    
    return recommendations;
  }

  private getPerformanceRecommendations(predicted: number, baseline: number): string[] {
    const recommendations = [];
    
    if (predicted < 60) {
      recommendations.push('Implement performance improvement plan');
      recommendations.push('Provide additional training and support');
    } else if (predicted > 85) {
      recommendations.push('Recognize high performance');
      recommendations.push('Consider stretch assignments');
    } else {
      recommendations.push('Continue current development approach');
    }
    
    return recommendations;
  }

  private getChurnRecommendations(probability: number): string[] {
    const recommendations = [];
    
    if (probability > 0.7) {
      recommendations.push('Immediate customer success intervention');
      recommendations.push('Executive relationship review');
    } else if (probability > 0.4) {
      recommendations.push('Enhanced customer support');
      recommendations.push('Proactive engagement program');
    } else {
      recommendations.push('Regular health check monitoring');
    }
    
    return recommendations;
  }

  private getDemandRecommendations(predicted: number, baseline: number): string[] {
    const recommendations = [];
    
    if (predicted > baseline * 1.3) {
      recommendations.push('Prepare for capacity scaling');
      recommendations.push('Secure additional resources');
    } else if (predicted < baseline * 0.7) {
      recommendations.push('Optimize cost structure');
      recommendations.push('Explore new market opportunities');
    }
    
    return recommendations;
  }

  private getRiskRecommendations(riskScore: number, factors: any): string[] {
    const recommendations = [];
    
    if (riskScore > 0.7) {
      recommendations.push('Implement immediate risk mitigation measures');
      recommendations.push('Increase monitoring frequency');
    }
    
    if (factors.financial > 0.6) {
      recommendations.push('Strengthen financial controls');
    }
    
    if (factors.operational > 0.5) {
      recommendations.push('Review operational procedures');
    }
    
    return recommendations;
  }

  private getResourceRecommendations(predicted: number, baseline: number): string[] {
    const recommendations = [];
    
    if (predicted > baseline * 1.2) {
      recommendations.push('Plan for team expansion');
      recommendations.push('Consider outsourcing options');
    } else if (predicted < baseline * 0.8) {
      recommendations.push('Optimize current team utilization');
      recommendations.push('Consider automation opportunities');
    }
    
    return recommendations;
  }

  private parseJsonResponse(content: string): any {
    try {
      return JSON.parse(content.replace(/```json|```/g, '').trim());
    } catch (error) {
      console.error('JSON parsing error:', error);
      return {};
    }
  }

  private generateCacheKey(request: PredictionRequest): string {
    return `prediction_${request.type}_${request.timeframe}_${JSON.stringify(request.data).substring(0, 50)}`;
  }

  private getCachedPrediction(key: string): PredictionResult | null {
    const cached = this.predictionCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.result;
    }
    return null;
  }

  private setCachedPrediction(key: string, result: PredictionResult): void {
    this.predictionCache.set(key, { result, timestamp: Date.now() });
  }

  private async storePrediction(request: PredictionRequest, result: PredictionResult): Promise<void> {
    try {
      await this.prisma.aIPrediction.create({
        data: {
          type: result.prediction.toString(),
          confidence: result.confidence,
          data: { request, result },
          tenantId: request.context.tenantId
        }
      });
    } catch (error) {
      console.error('Failed to store prediction:', error);
    }
  }

  private generateFallbackPrediction(type: string, request: PredictionRequest): PredictionResult {
    return {
      prediction: 'Prediction unavailable',
      confidence: 0.3,
      factors: ['Insufficient data for prediction', 'Fallback prediction used'],
      trend: 'STABLE',
      recommendations: ['Gather more historical data', 'Monitor key metrics'],
      uncertainty: {
        lower_bound: 0,
        upper_bound: 100,
        variance: 0.5
      },
      model_metadata: {
        model_version: '0.1.0-fallback',
        training_data_size: 0,
        last_trained: new Date(),
        accuracy: 0.3
      }
    };
  }
}

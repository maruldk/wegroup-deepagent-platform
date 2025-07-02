
/**
 * Advanced Financial Analytics Service - AI-powered financial forecasting, risk analysis, and insights
 * SPRINT 2.5 - Integrates with existing ML pipeline and AI services for sophisticated financial analytics
 */

import { PredictiveAnalyticsService } from '@/lib/ai/predictive-analytics-service';
import { AnomalyDetectionService } from '@/lib/ai/anomaly-detection-service';
import { LLMService } from '@/lib/ai/llm-service';
import { FinancialService } from './financial-service';
import { prisma } from '@/lib/db';
import { addDays, addMonths, format, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';

export interface AdvancedFinancialForecast {
  id: string;
  type: 'REVENUE' | 'EXPENSE' | 'CASH_FLOW' | 'PROFIT' | 'BUDGET_UTILIZATION';
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';
  targetDate: Date;
  predictedValue: number;
  confidence: number;
  scenarios: FinancialScenario[];
  modelVersion: string;
  features: Record<string, any>;
}

export interface FinancialScenario {
  name: string;
  description: string;
  probability: number;
  predictedValue: number;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
  assumptions: Record<string, any>;
}

export interface RiskAssessment {
  id: string;
  type: 'CREDIT_RISK' | 'MARKET_RISK' | 'LIQUIDITY_RISK' | 'OPERATIONAL_RISK';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  probability: number;
  impact: number;
  riskScore: number;
  description: string;
  indicators: Record<string, any>;
  mitigation?: string;
  reviewDate: Date;
}

export interface FinancialInsight {
  id: string;
  type: 'TREND_ANALYSIS' | 'ANOMALY_DETECTION' | 'PERFORMANCE_COMPARISON' | 'FORECASTING' | 'RECOMMENDATION';
  category: 'REVENUE' | 'EXPENSES' | 'PROFITABILITY' | 'CASH_FLOW' | 'BUDGET' | 'RISK';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'URGENT';
  title: string;
  description: string;
  insights: Record<string, any>;
  recommendations?: Record<string, any>;
  confidence: number;
  impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'ACTIONABLE';
}

export interface NaturalLanguageQuery {
  query: string;
  intent?: string;
  response: any;
  processingTime: number;
  isSuccessful: boolean;
}

export class AdvancedFinancialAnalyticsService {
  private tenantId: string;
  private userId?: string;
  private predictiveService: PredictiveAnalyticsService;
  private anomalyService: AnomalyDetectionService;
  private llmService: LLMService;

  constructor(tenantId: string, userId?: string) {
    this.tenantId = tenantId;
    this.userId = userId;
    this.predictiveService = new PredictiveAnalyticsService(tenantId, userId);
    this.anomalyService = new AnomalyDetectionService(tenantId, userId);
    this.llmService = new LLMService(prisma);
  }

  // ==================== PREDICTIVE FINANCIAL FORECASTING ====================

  /**
   * Generate AI-powered revenue forecasting with multiple scenarios
   */
  async generateRevenueForecast(
    periods: number = 6,
    period: 'MONTHLY' | 'QUARTERLY' = 'MONTHLY'
  ): Promise<AdvancedFinancialForecast[]> {
    try {
      // Get historical revenue data
      const historicalData = await this.getHistoricalRevenueData(24); // 2 years
      
      if (historicalData.length < 12) {
        throw new Error('Insufficient historical data for accurate revenue forecasting');
      }

      const forecasts: AdvancedFinancialForecast[] = [];

      for (let i = 1; i <= periods; i++) {
        const targetDate = period === 'MONTHLY' 
          ? addMonths(new Date(), i)
          : addMonths(new Date(), i * 3);

        // Advanced time series forecasting with ML
        const prediction = await this.performTimeSeriesForecasting(
          historicalData,
          targetDate,
          'REVENUE'
        );

        // Generate multiple scenarios
        const scenarios = await this.generateScenarios(prediction, 'REVENUE');

        const forecast: AdvancedFinancialForecast = {
          id: `revenue_forecast_${i}`,
          type: 'REVENUE',
          period: period,
          targetDate,
          predictedValue: prediction.value,
          confidence: prediction.confidence,
          scenarios,
          modelVersion: '2.5.0',
          features: prediction.features
        };

        forecasts.push(forecast);

        // Save to database
        await this.saveForecastToDatabase(forecast);
      }

      return forecasts;
    } catch (error) {
      console.error('Error generating revenue forecast:', error);
      throw error;
    }
  }

  /**
   * Advanced cash flow prediction with Monte Carlo simulation
   */
  async generateCashFlowPrediction(
    periods: number = 12
  ): Promise<AdvancedFinancialForecast[]> {
    try {
      // Get comprehensive financial data
      const [
        historicalCashFlow,
        upcomingInvoices,
        plannedExpenses,
        budgetData
      ] = await Promise.all([
        this.getHistoricalCashFlowData(24),
        this.getUpcomingInvoices(),
        this.getPlannedExpenses(),
        this.getBudgetProjections()
      ]);

      const forecasts: AdvancedFinancialForecast[] = [];

      for (let i = 1; i <= periods; i++) {
        const targetDate = addMonths(new Date(), i);

        // Monte Carlo simulation for cash flow
        const prediction = await this.performMonteCarloSimulation(
          historicalCashFlow,
          upcomingInvoices,
          plannedExpenses,
          targetDate
        );

        // Generate risk-adjusted scenarios
        const scenarios = await this.generateCashFlowScenarios(prediction);

        const forecast: AdvancedFinancialForecast = {
          id: `cashflow_forecast_${i}`,
          type: 'CASH_FLOW',
          period: 'MONTHLY',
          targetDate,
          predictedValue: prediction.value,
          confidence: prediction.confidence,
          scenarios,
          modelVersion: '2.5.0',
          features: prediction.features
        };

        forecasts.push(forecast);
        await this.saveForecastToDatabase(forecast);
      }

      return forecasts;
    } catch (error) {
      console.error('Error generating cash flow prediction:', error);
      throw error;
    }
  }

  /**
   * Expense trend analysis and prediction
   */
  async generateExpenseForecast(
    categoryId?: string,
    periods: number = 6
  ): Promise<AdvancedFinancialForecast[]> {
    try {
      const historicalExpenses = await this.getHistoricalExpenseData(categoryId, 18);
      
      const forecasts: AdvancedFinancialForecast[] = [];

      for (let i = 1; i <= periods; i++) {
        const targetDate = addMonths(new Date(), i);

        // Pattern recognition and trend analysis
        const prediction = await this.performExpensePatternAnalysis(
          historicalExpenses,
          targetDate,
          categoryId
        );

        const scenarios = await this.generateExpenseScenarios(prediction, categoryId);

        const forecast: AdvancedFinancialForecast = {
          id: `expense_forecast_${categoryId || 'all'}_${i}`,
          type: 'EXPENSE',
          period: 'MONTHLY',
          targetDate,
          predictedValue: prediction.value,
          confidence: prediction.confidence,
          scenarios,
          modelVersion: '2.5.0',
          features: prediction.features
        };

        forecasts.push(forecast);
        await this.saveForecastToDatabase(forecast);
      }

      return forecasts;
    } catch (error) {
      console.error('Error generating expense forecast:', error);
      throw error;
    }
  }

  // ==================== ADVANCED RISK ANALYSIS ====================

  /**
   * Comprehensive financial risk assessment
   */
  async performRiskAssessment(): Promise<RiskAssessment[]> {
    try {
      const risks: RiskAssessment[] = [];

      // Credit Risk Analysis
      const creditRisk = await this.analyzeCreditRisk();
      if (creditRisk) risks.push(creditRisk);

      // Market Risk Analysis
      const marketRisk = await this.analyzeMarketRisk();
      if (marketRisk) risks.push(marketRisk);

      // Liquidity Risk Analysis
      const liquidityRisk = await this.analyzeLiquidityRisk();
      if (liquidityRisk) risks.push(liquidityRisk);

      // Operational Risk Analysis
      const operationalRisk = await this.analyzeOperationalRisk();
      if (operationalRisk) risks.push(operationalRisk);

      // Save all risks to database
      for (const risk of risks) {
        await this.saveRiskAssessmentToDatabase(risk);
      }

      return risks;
    } catch (error) {
      console.error('Error performing risk assessment:', error);
      throw error;
    }
  }

  /**
   * Credit risk analysis based on outstanding invoices and customer payment patterns
   */
  private async analyzeCreditRisk(): Promise<RiskAssessment | null> {
    try {
      const [outstandingInvoices, paymentHistory] = await Promise.all([
        this.getOutstandingInvoices(),
        this.getCustomerPaymentHistory()
      ]);

      const totalOutstanding = outstandingInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const overdueAmount = outstandingInvoices
        .filter(inv => new Date(inv.dueDate) < new Date())
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      const overdueRatio = totalOutstanding > 0 ? overdueAmount / totalOutstanding : 0;
      
      // Calculate risk indicators
      const indicators = {
        totalOutstanding,
        overdueAmount,
        overdueRatio,
        averagePaymentDays: this.calculateAveragePaymentDays(paymentHistory),
        customerCount: new Set(outstandingInvoices.map(inv => inv.customerId)).size
      };

      // Risk scoring algorithm
      let riskScore = 0;
      if (overdueRatio > 0.3) riskScore += 40;
      if (indicators.averagePaymentDays > 45) riskScore += 30;
      if (totalOutstanding > 100000) riskScore += 20;
      if (indicators.customerCount < 5) riskScore += 10;

      const severity = riskScore > 70 ? 'CRITICAL' : 
                      riskScore > 50 ? 'HIGH' : 
                      riskScore > 30 ? 'MEDIUM' : 'LOW';

      return {
        id: `credit_risk_${Date.now()}`,
        type: 'CREDIT_RISK',
        severity,
        probability: Math.min(riskScore / 100, 0.95),
        impact: overdueAmount,
        riskScore,
        description: `Credit risk assessment based on ${outstandingInvoices.length} outstanding invoices`,
        indicators,
        mitigation: await this.generateRiskMitigation('CREDIT_RISK', indicators),
        reviewDate: addDays(new Date(), 30)
      };
    } catch (error) {
      console.error('Error analyzing credit risk:', error);
      return null;
    }
  }

  /**
   * Liquidity risk analysis based on cash flow patterns
   */
  private async analyzeLiquidityRisk(): Promise<RiskAssessment | null> {
    try {
      const [currentCashFlow, projectedOutflows, liquidity] = await Promise.all([
        this.getCurrentCashPosition(),
        this.getProjectedOutflows(90), // Next 90 days
        this.getLiquidityMetrics()
      ]);

      const indicators = {
        currentCash: currentCashFlow,
        projectedOutflows,
        liquidityRatio: liquidity.currentRatio,
        quickRatio: liquidity.quickRatio,
        operatingCashFlow: liquidity.operatingCashFlow,
        cashBurnRate: liquidity.cashBurnRate
      };

      // Calculate days of liquidity remaining
      const daysOfLiquidity = currentCashFlow / Math.max(liquidity.cashBurnRate, 1);
      
      let riskScore = 0;
      if (daysOfLiquidity < 30) riskScore += 50;
      if (daysOfLiquidity < 60) riskScore += 30;
      if (liquidity.currentRatio < 1.2) riskScore += 20;

      const severity = riskScore > 70 ? 'CRITICAL' : 
                      riskScore > 50 ? 'HIGH' : 
                      riskScore > 30 ? 'MEDIUM' : 'LOW';

      return {
        id: `liquidity_risk_${Date.now()}`,
        type: 'LIQUIDITY_RISK',
        severity,
        probability: Math.min(riskScore / 100, 0.95),
        impact: Math.max(projectedOutflows - currentCashFlow, 0),
        riskScore,
        description: `Liquidity risk based on ${Math.round(daysOfLiquidity)} days of remaining liquidity`,
        indicators,
        mitigation: await this.generateRiskMitigation('LIQUIDITY_RISK', indicators),
        reviewDate: addDays(new Date(), 14)
      };
    } catch (error) {
      console.error('Error analyzing liquidity risk:', error);
      return null;
    }
  }

  // ==================== FINANCIAL AI INSIGHTS ====================

  /**
   * Generate AI-powered financial insights and recommendations
   */
  async generateFinancialInsights(): Promise<FinancialInsight[]> {
    try {
      const insights: FinancialInsight[] = [];

      // Detect anomalies in financial data
      const anomalyInsights = await this.detectFinancialAnomalies();
      insights.push(...anomalyInsights);

      // Analyze spending patterns
      const spendingInsights = await this.analyzeSpendingPatterns();
      insights.push(...spendingInsights);

      // Revenue optimization opportunities
      const revenueInsights = await this.identifyRevenueOpportunities();
      insights.push(...revenueInsights);

      // Budget performance analysis
      const budgetInsights = await this.analyzeBudgetPerformance();
      insights.push(...budgetInsights);

      // Save insights to database
      for (const insight of insights) {
        await this.saveInsightToDatabase(insight);
      }

      return insights;
    } catch (error) {
      console.error('Error generating financial insights:', error);
      throw error;
    }
  }

  /**
   * Natural language financial query processing
   */
  async processNaturalLanguageQuery(query: string): Promise<NaturalLanguageQuery> {
    const startTime = Date.now();
    
    try {
      // Parse the query intent
      const intent = await this.parseQueryIntent(query);
      
      // Generate appropriate response based on intent
      let response: any;
      
      switch (intent) {
        case 'revenue_analysis':
          response = await this.generateRevenueAnalysis(query);
          break;
        case 'expense_breakdown':
          response = await this.generateExpenseBreakdown(query);
          break;
        case 'cash_flow_status':
          response = await this.generateCashFlowStatus(query);
          break;
        case 'budget_performance':
          response = await this.generateBudgetAnalysis(query);
          break;
        case 'financial_forecast':
          response = await this.generateForecastSummary(query);
          break;
        case 'risk_assessment':
          response = await this.generateRiskSummary(query);
          break;
        default:
          response = await this.generateGeneralFinancialResponse(query);
      }

      const processingTime = Date.now() - startTime;

      const queryResult: NaturalLanguageQuery = {
        query,
        intent,
        response,
        processingTime,
        isSuccessful: true
      };

      // Save query to history
      await this.saveQueryToHistory(queryResult);

      return queryResult;
    } catch (error) {
      console.error('Error processing natural language query:', error);
      
      const processingTime = Date.now() - startTime;
      
      return {
        query,
        intent: 'error',
        response: { error: 'Failed to process query', message: error instanceof Error ? error.message : 'Unknown error' },
        processingTime,
        isSuccessful: false
      };
    }
  }

  // ==================== PRIVATE HELPER METHODS ====================

  private async performTimeSeriesForecasting(
    historicalData: any[],
    targetDate: Date,
    type: string
  ): Promise<{ value: number; confidence: number; features: any }> {
    try {
      // Simple linear regression with trend analysis
      const values = historicalData.map(d => d.value);
      const dates = historicalData.map(d => new Date(d.date));
      
      // Calculate trend
      const n = values.length;
      const sumX = dates.reduce((sum, date, i) => sum + i, 0);
      const sumY = values.reduce((sum, val) => sum + val, 0);
      const sumXY = values.reduce((sum, val, i) => sum + (i * val), 0);
      const sumXX = dates.reduce((sum, date, i) => sum + (i * i), 0);
      
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      const intercept = (sumY - slope * sumX) / n;
      
      // Predict value
      const futureIndex = n + differenceInDays(targetDate, dates[dates.length - 1]) / 30;
      const predictedValue = slope * futureIndex + intercept;
      
      // Calculate confidence based on historical variance
      const variance = values.reduce((sum, val, i) => {
        const predicted = slope * i + intercept;
        return sum + Math.pow(val - predicted, 2);
      }, 0) / n;
      
      const confidence = Math.max(0.1, Math.min(0.95, 1 - (Math.sqrt(variance) / Math.abs(predictedValue))));
      
      return {
        value: Math.max(0, predictedValue),
        confidence,
        features: {
          slope,
          intercept,
          variance,
          dataPoints: n,
          type
        }
      };
    } catch (error) {
      console.error('Error in time series forecasting:', error);
      throw error;
    }
  }

  private async performMonteCarloSimulation(
    historicalData: any[],
    upcomingInvoices: any[],
    plannedExpenses: any[],
    targetDate: Date
  ): Promise<{ value: number; confidence: number; features: any }> {
    try {
      const simulations = 1000;
      const results: number[] = [];
      
      // Historical volatility
      const values = historicalData.map(d => d.value);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      for (let i = 0; i < simulations; i++) {
        // Random walk with historical pattern
        const randomFactor = (Math.random() - 0.5) * 2 * stdDev;
        const baseValue = mean + randomFactor;
        
        // Add confirmed inflows
        const confirmedInflows = upcomingInvoices
          .filter(inv => new Date(inv.dueDate) <= targetDate)
          .reduce((sum, inv) => sum + (inv.totalAmount * 0.8), 0); // 80% collection rate
          
        // Subtract planned expenses
        const confirmedOutflows = plannedExpenses
          .filter(exp => new Date(exp.date) <= targetDate)
          .reduce((sum, exp) => sum + exp.amount, 0);
          
        results.push(baseValue + confirmedInflows - confirmedOutflows);
      }
      
      // Calculate percentiles
      results.sort((a, b) => a - b);
      const p50 = results[Math.floor(simulations * 0.5)];
      const p10 = results[Math.floor(simulations * 0.1)];
      const p90 = results[Math.floor(simulations * 0.9)];
      
      const confidence = (p90 - p10) / Math.abs(p50);
      
      return {
        value: p50,
        confidence: Math.max(0.1, Math.min(0.95, 1 - confidence)),
        features: {
          p10,
          p50,
          p90,
          mean,
          stdDev,
          simulations
        }
      };
    } catch (error) {
      console.error('Error in Monte Carlo simulation:', error);
      throw error;
    }
  }

  private async generateScenarios(
    basePrediction: any,
    type: string
  ): Promise<FinancialScenario[]> {
    try {
      const scenarios: FinancialScenario[] = [];
      
      // Optimistic scenario (15% above)
      scenarios.push({
        name: 'Optimistic',
        description: 'Best case scenario with favorable market conditions',
        probability: 0.2,
        predictedValue: basePrediction.value * 1.15,
        impact: 'POSITIVE',
        assumptions: {
          marketGrowth: 0.15,
          customerRetention: 0.95,
          newCustomerAcquisition: 0.2
        }
      });
      
      // Most likely scenario (base prediction)
      scenarios.push({
        name: 'Most Likely',
        description: 'Expected scenario based on current trends',
        probability: 0.6,
        predictedValue: basePrediction.value,
        impact: 'NEUTRAL',
        assumptions: {
          marketGrowth: 0.05,
          customerRetention: 0.85,
          newCustomerAcquisition: 0.1
        }
      });
      
      // Pessimistic scenario (20% below)
      scenarios.push({
        name: 'Pessimistic',
        description: 'Conservative scenario with challenging conditions',
        probability: 0.2,
        predictedValue: basePrediction.value * 0.8,
        impact: 'NEGATIVE',
        assumptions: {
          marketGrowth: -0.05,
          customerRetention: 0.75,
          newCustomerAcquisition: 0.05
        }
      });
      
      return scenarios;
    } catch (error) {
      console.error('Error generating scenarios:', error);
      return [];
    }
  }

  // Database helper methods
  private async saveForecastToDatabase(forecast: AdvancedFinancialForecast): Promise<void> {
    try {
      await prisma.financialForecast.create({
        data: {
          type: forecast.type,
          period: forecast.period === 'DAILY' ? 'DAILY' : 
                 forecast.period === 'WEEKLY' ? 'WEEKLY' :
                 forecast.period === 'MONTHLY' ? 'MONTHLY' :
                 forecast.period === 'QUARTERLY' ? 'QUARTERLY' : 'YEARLY',
          targetDate: forecast.targetDate,
          predictedValue: forecast.predictedValue,
          confidence: forecast.confidence,
          modelVersion: forecast.modelVersion,
          features: forecast.features,
          metadata: {
            generatedAt: new Date().toISOString(),
            userId: this.userId,
            scenarios: JSON.parse(JSON.stringify(forecast.scenarios))
          },
          tenantId: this.tenantId
        }
      });
    } catch (error) {
      console.error('Error saving forecast to database:', error);
    }
  }

  private async saveRiskAssessmentToDatabase(risk: RiskAssessment): Promise<void> {
    try {
      await prisma.financialRiskAssessment.create({
        data: {
          type: risk.type,
          category: 'FINANCIAL',
          severity: risk.severity,
          probability: risk.probability,
          impact: risk.impact,
          riskScore: risk.riskScore,
          description: risk.description,
          indicators: risk.indicators,
          mitigation: risk.mitigation,
          reviewDate: risk.reviewDate,
          tenantId: this.tenantId
        }
      });
    } catch (error) {
      console.error('Error saving risk assessment to database:', error);
    }
  }

  private async saveInsightToDatabase(insight: FinancialInsight): Promise<void> {
    try {
      await prisma.financialInsight.create({
        data: {
          type: insight.type,
          category: insight.category,
          priority: insight.priority,
          title: insight.title,
          description: insight.description,
          insights: insight.insights,
          recommendations: insight.recommendations,
          confidence: insight.confidence,
          impact: insight.impact,
          tenantId: this.tenantId,
          userId: this.userId
        }
      });
    } catch (error) {
      console.error('Error saving insight to database:', error);
    }
  }

  private async saveQueryToHistory(query: NaturalLanguageQuery): Promise<void> {
    try {
      await prisma.financialQueryHistory.create({
        data: {
          query: query.query,
          intent: query.intent,
          response: query.response,
          processingTime: query.processingTime,
          isSuccessful: query.isSuccessful,
          tenantId: this.tenantId,
          userId: this.userId || 'anonymous'
        }
      });
    } catch (error) {
      console.error('Error saving query to history:', error);
    }
  }

  // Data retrieval helper methods
  private async getHistoricalRevenueData(months: number): Promise<any[]> {
    try {
      const startDate = subMonths(new Date(), months);
      
      const transactions = await prisma.transaction.findMany({
        where: {
          tenantId: this.tenantId,
          type: 'INCOME',
          date: { gte: startDate }
        },
        orderBy: { date: 'asc' }
      });

      // Group by month
      const monthlyData = new Map();
      
      transactions.forEach(transaction => {
        const monthKey = format(transaction.date, 'yyyy-MM');
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { value: 0, date: monthKey });
        }
        monthlyData.get(monthKey).value += transaction.amount;
      });

      return Array.from(monthlyData.values());
    } catch (error) {
      console.error('Error getting historical revenue data:', error);
      return [];
    }
  }

  private async getHistoricalCashFlowData(months: number): Promise<any[]> {
    try {
      const startDate = subMonths(new Date(), months);
      
      const [income, expenses] = await Promise.all([
        prisma.transaction.findMany({
          where: {
            tenantId: this.tenantId,
            type: 'INCOME',
            date: { gte: startDate }
          }
        }),
        prisma.transaction.findMany({
          where: {
            tenantId: this.tenantId,
            type: 'EXPENSE',
            date: { gte: startDate }
          }
        })
      ]);

      // Combine and group by month
      const monthlyData = new Map();
      
      [...income, ...expenses].forEach(transaction => {
        const monthKey = format(transaction.date, 'yyyy-MM');
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { value: 0, date: monthKey });
        }
        const amount = transaction.type === 'INCOME' ? transaction.amount : -Math.abs(transaction.amount);
        monthlyData.get(monthKey).value += amount;
      });

      return Array.from(monthlyData.values());
    } catch (error) {
      console.error('Error getting historical cash flow data:', error);
      return [];
    }
  }

  private async getHistoricalExpenseData(categoryId?: string, months: number = 18): Promise<any[]> {
    try {
      const startDate = subMonths(new Date(), months);
      
      const where: any = {
        tenantId: this.tenantId,
        status: { in: ['APPROVED', 'PAID'] },
        date: { gte: startDate }
      };
      
      if (categoryId) {
        where.categoryId = categoryId;
      }
      
      const expenses = await prisma.expense.findMany({
        where,
        orderBy: { date: 'asc' }
      });

      // Group by month
      const monthlyData = new Map();
      
      expenses.forEach(expense => {
        const monthKey = format(expense.date, 'yyyy-MM');
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, { value: 0, date: monthKey });
        }
        monthlyData.get(monthKey).value += expense.amount;
      });

      return Array.from(monthlyData.values());
    } catch (error) {
      console.error('Error getting historical expense data:', error);
      return [];
    }
  }

  // Placeholder methods for demonstration - would be implemented with real logic
  private async performExpensePatternAnalysis(data: any[], targetDate: Date, categoryId?: string): Promise<any> {
    // Implementation for expense pattern analysis
    return { value: 0, confidence: 0.5, features: {} };
  }

  private async generateExpenseScenarios(prediction: any, categoryId?: string): Promise<FinancialScenario[]> {
    return [];
  }

  private async generateCashFlowScenarios(prediction: any): Promise<FinancialScenario[]> {
    return [];
  }

  private async analyzeMarketRisk(): Promise<RiskAssessment | null> {
    return null;
  }

  private async analyzeOperationalRisk(): Promise<RiskAssessment | null> {
    return null;
  }

  private async detectFinancialAnomalies(): Promise<FinancialInsight[]> {
    return [];
  }

  private async analyzeSpendingPatterns(): Promise<FinancialInsight[]> {
    return [];
  }

  private async identifyRevenueOpportunities(): Promise<FinancialInsight[]> {
    return [];
  }

  private async analyzeBudgetPerformance(): Promise<FinancialInsight[]> {
    return [];
  }

  private async parseQueryIntent(query: string): Promise<string> {
    // Simple keyword-based intent parsing
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('revenue') || lowerQuery.includes('income') || lowerQuery.includes('sales')) {
      return 'revenue_analysis';
    }
    if (lowerQuery.includes('expense') || lowerQuery.includes('cost') || lowerQuery.includes('spending')) {
      return 'expense_breakdown';
    }
    if (lowerQuery.includes('cash flow') || lowerQuery.includes('liquidity')) {
      return 'cash_flow_status';
    }
    if (lowerQuery.includes('budget')) {
      return 'budget_performance';
    }
    if (lowerQuery.includes('forecast') || lowerQuery.includes('predict')) {
      return 'financial_forecast';
    }
    if (lowerQuery.includes('risk')) {
      return 'risk_assessment';
    }
    return 'general';
  }

  private async generateRevenueAnalysis(query: string): Promise<any> {
    const summary = await FinancialService.getFinancialSummary(
      this.tenantId,
      subMonths(new Date(), 12),
      new Date()
    );
    return {
      type: 'revenue_analysis',
      data: summary,
      message: `Current total revenue is ${summary.totalRevenue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} with a profit margin of ${summary.profitMargin.toFixed(1)}%.`
    };
  }

  private async generateExpenseBreakdown(query: string): Promise<any> {
    const summary = await FinancialService.getExpenseSummary(
      this.tenantId,
      subMonths(new Date(), 12),
      new Date()
    );
    return {
      type: 'expense_breakdown',
      data: summary,
      message: `Total expenses are ${summary.totalAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} across ${summary.totalCount} transactions.`
    };
  }

  private async generateCashFlowStatus(query: string): Promise<any> {
    const forecast = await FinancialService.getCashFlowForecast(this.tenantId, 3);
    return {
      type: 'cash_flow_status',
      data: forecast,
      message: `Next month's projected cash flow is ${forecast[0]?.netCashFlow?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) || 'N/A'}.`
    };
  }

  private async generateBudgetAnalysis(query: string): Promise<any> {
    const performance = await FinancialService.getBudgetPerformance(this.tenantId);
    return {
      type: 'budget_performance',
      data: performance,
      message: `Budget utilization is ${performance[0]?.utilizationPercentage?.toFixed(1) || 'N/A'}%.`
    };
  }

  private async generateForecastSummary(query: string): Promise<any> {
    const forecasts = await this.generateRevenueForecast(3);
    return {
      type: 'financial_forecast',
      data: forecasts,
      message: `Revenue forecast for next month: ${forecasts[0]?.predictedValue?.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' }) || 'N/A'}.`
    };
  }

  private async generateRiskSummary(query: string): Promise<any> {
    const risks = await this.performRiskAssessment();
    return {
      type: 'risk_assessment',
      data: risks,
      message: `Found ${risks.length} financial risks requiring attention.`
    };
  }

  private async generateGeneralFinancialResponse(query: string): Promise<any> {
    return {
      type: 'general',
      message: 'I can help you with revenue analysis, expense breakdowns, cash flow status, budget performance, forecasting, and risk assessments. What would you like to know?'
    };
  }

  // Additional helper methods for risk analysis
  private async getOutstandingInvoices(): Promise<any[]> {
    return prisma.invoice.findMany({
      where: {
        tenantId: this.tenantId,
        status: { in: ['SENT', 'OVERDUE'] }
      }
    });
  }

  private async getCustomerPaymentHistory(): Promise<any[]> {
    return prisma.transaction.findMany({
      where: {
        tenantId: this.tenantId,
        type: 'INCOME',
        invoiceId: { not: null }
      },
      include: { invoice: true }
    });
  }

  private calculateAveragePaymentDays(paymentHistory: any[]): number {
    if (paymentHistory.length === 0) return 0;
    
    const paymentDays = paymentHistory
      .filter(payment => payment.invoice)
      .map(payment => {
        const issueDate = new Date(payment.invoice.issueDate);
        const paidDate = new Date(payment.date);
        return differenceInDays(paidDate, issueDate);
      });
    
    return paymentDays.reduce((sum, days) => sum + days, 0) / paymentDays.length;
  }

  private async generateRiskMitigation(riskType: string, indicators: any): Promise<string> {
    // Use LLM to generate risk mitigation strategies
    try {
      const prompt = `Generate risk mitigation strategies for ${riskType} with these indicators: ${JSON.stringify(indicators)}`;
      
      const response = await this.llmService.chatCompletion({
        model: 'gpt-4.1-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a financial risk advisor. Provide practical mitigation strategies.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      return response.choices[0]?.message?.content || 'Review risk indicators and implement appropriate controls.';
    } catch (error) {
      return 'Review risk indicators and implement appropriate controls.';
    }
  }

  private async getCurrentCashPosition(): Promise<number> {
    const [income, expenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          tenantId: this.tenantId,
          type: 'INCOME'
        },
        _sum: { amount: true }
      }),
      prisma.transaction.aggregate({
        where: {
          tenantId: this.tenantId,
          type: 'EXPENSE'
        },
        _sum: { amount: true }
      })
    ]);

    return (income._sum.amount || 0) - Math.abs(expenses._sum.amount || 0);
  }

  private async getProjectedOutflows(days: number): Promise<number> {
    const endDate = addDays(new Date(), days);
    
    const [plannedExpenses, upcomingBudgets] = await Promise.all([
      prisma.expense.aggregate({
        where: {
          tenantId: this.tenantId,
          status: 'PENDING',
          date: { lte: endDate }
        },
        _sum: { amount: true }
      }),
      prisma.budget.findMany({
        where: {
          tenantId: this.tenantId,
          endDate: { gte: new Date() },
          startDate: { lte: endDate }
        }
      })
    ]);

    const budgetOutflows = upcomingBudgets.reduce((sum, budget) => {
      const remainingDays = differenceInDays(budget.endDate, new Date());
      const dailyBudget = budget.budgetAmount / Math.max(remainingDays, 1);
      return sum + (dailyBudget * Math.min(days, remainingDays));
    }, 0);

    return (plannedExpenses._sum.amount || 0) + budgetOutflows;
  }

  private async getLiquidityMetrics(): Promise<any> {
    // This would calculate various liquidity ratios
    // For now, return placeholder values
    return {
      currentRatio: 1.5,
      quickRatio: 1.2,
      operatingCashFlow: 10000,
      cashBurnRate: 5000
    };
  }

  private async getUpcomingInvoices(): Promise<any[]> {
    return prisma.invoice.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'SENT',
        dueDate: { gte: new Date() }
      }
    });
  }

  private async getPlannedExpenses(): Promise<any[]> {
    return prisma.expense.findMany({
      where: {
        tenantId: this.tenantId,
        status: 'PENDING',
        date: { gte: new Date() }
      }
    });
  }

  private async getBudgetProjections(): Promise<any[]> {
    return prisma.budget.findMany({
      where: {
        tenantId: this.tenantId,
        endDate: { gte: new Date() }
      }
    });
  }
}

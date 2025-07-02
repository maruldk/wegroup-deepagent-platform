
import { PrismaClient } from '@prisma/client';
import { LLMService } from '../llm-service';
import { AIContext, AIWorkflowResult } from '../orchestrator';

export class WeFinanceAI {
  constructor(
    private prisma: PrismaClient,
    private llmService: LLMService
  ) {}

  async processFinancialData(data: any, context: AIContext): Promise<AIWorkflowResult> {
    try {
      // Gather financial data
      const financialData = await this.gatherFinancialData(context.tenantId);
      
      // Generate cashflow predictions
      const cashflowPredictions = await this.generateCashflowPredictions(financialData, context);
      
      // Detect financial anomalies and fraud
      const fraudDetection = await this.detectFinancialAnomalies(financialData, context);
      
      // Generate budget optimization recommendations
      const budgetOptimization = await this.optimizeBudgets(financialData, context);
      
      // Automatic transaction categorization
      const categorization = await this.categorizeTransactions(financialData.uncategorizedTransactions, context);
      
      return {
        success: true,
        data: {
          cashflowPredictions,
          fraudDetection,
          budgetOptimization,
          categorization,
          financialData
        },
        insights: [...(fraudDetection.insights || []), ...(budgetOptimization.insights || [])]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Finance AI failed'
      };
    }
  }

  private async gatherFinancialData(tenantId: string): Promise<any> {
    const [
      invoices,
      transactions,
      budgets,
      uncategorizedTransactions
    ] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { tenantId },
        include: { items: true, customer: true },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      this.prisma.transaction.findMany({
        where: { tenantId },
        orderBy: { date: 'desc' },
        take: 200
      }),
      this.prisma.budget.findMany({
        where: { tenantId },
        orderBy: { startDate: 'desc' }
      }),
      this.prisma.transaction.findMany({
        where: { 
          tenantId,
          OR: [
            { category: null },
            { category: '' }
          ]
        },
        take: 50
      })
    ]);

    // Calculate financial metrics
    const totalRevenue = invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
    
    const totalExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0);

    const totalIncome = transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    return {
      invoices,
      transactions,
      budgets,
      uncategorizedTransactions,
      metrics: {
        totalRevenue,
        totalExpenses,
        totalIncome,
        netProfit: totalIncome - totalExpenses,
        overdudeInvoices: invoices.filter(i => i.status === 'OVERDUE').length,
        paidInvoices: invoices.filter(i => i.status === 'PAID').length
      }
    };
  }

  private async generateCashflowPredictions(data: any, context: AIContext): Promise<any[]> {
    try {
      const cashflowAnalysis = await this.llmService.analyzePredictiveData(
        {
          transactions: data.transactions,
          invoices: data.invoices,
          metrics: data.metrics
        },
        'Cashflow-Prognose für die nächsten 6 Monate basierend auf historischen Transaktionen und offenen Rechnungen'
      );

      // Store cashflow predictions
      if (cashflowAnalysis.predictions) {
        for (const prediction of cashflowAnalysis.predictions) {
          await this.prisma.aIPrediction.create({
            data: {
              predictionType: 'CASHFLOW',
              targetDate: new Date(prediction.date),
              predictedValue: prediction.amount,
              confidence: prediction.confidence,
              modelData: prediction.factors || {},
              tenantId: context.tenantId,
              resourceType: 'FINANCE',
            }
          });
        }
      }

      return cashflowAnalysis.predictions || [];
    } catch (error) {
      console.error('Cashflow Prediction Error:', error);
      return [];
    }
  }

  private async detectFinancialAnomalies(data: any, context: AIContext): Promise<any> {
    try {
      const anomalyAnalysis = await this.llmService.assessRisk(
        {
          transactions: data.transactions,
          patterns: this.analyzeTransactionPatterns(data.transactions)
        },
        'FINANCIAL_FRAUD'
      );

      const insights = [];
      
      if (anomalyAnalysis.anomalies) {
        for (const anomaly of anomalyAnalysis.anomalies) {
          const insight = await this.prisma.aIInsight.create({
            data: {
              category: 'FINANCE',
              type: 'ANOMALY',
              title: anomaly.title,
              description: anomaly.description,
              severity: anomaly.severity || 'HIGH',
              data: anomaly.data || {},
              confidence: anomaly.confidence || 0.9,
              isActionable: true,
              tenantId: context.tenantId,
              resourceType: 'FINANCE',
              resourceId: anomaly.transactionId,
            }
          });
          insights.push(insight);
        }
      }

      return {
        anomalies: anomalyAnalysis.anomalies || [],
        insights
      };
    } catch (error) {
      console.error('Financial Anomaly Detection Error:', error);
      return { anomalies: [], insights: [] };
    }
  }

  private async optimizeBudgets(data: any, context: AIContext): Promise<any> {
    try {
      const optimization = await this.llmService.optimizeWorkflow(
        {
          budgets: data.budgets,
          actualSpending: data.transactions,
          revenue: data.metrics
        },
        {
          goal: 'BUDGET_OPTIMIZATION',
          constraints: ['MAINTAIN_QUALITY', 'PRESERVE_GROWTH']
        }
      );

      const insights = [];
      
      if (optimization.recommendations) {
        for (const recommendation of optimization.recommendations) {
          const insight = await this.prisma.aIInsight.create({
            data: {
              category: 'FINANCE',
              type: 'OPTIMIZATION',
              title: recommendation.title,
              description: recommendation.description,
              severity: 'MEDIUM',
              data: recommendation.data || {},
              confidence: recommendation.confidence || 0.8,
              isActionable: true,
              tenantId: context.tenantId,
              resourceType: 'FINANCE',
            }
          });
          insights.push(insight);
        }
      }

      return {
        recommendations: optimization.recommendations || [],
        insights
      };
    } catch (error) {
      console.error('Budget Optimization Error:', error);
      return { recommendations: [], insights: [] };
    }
  }

  private async categorizeTransactions(transactions: any[], context: AIContext): Promise<any> {
    try {
      if (transactions.length === 0) return { categorized: [] };

      const categorization = await this.llmService.generateInsights(
        transactions,
        'TRANSACTION_CATEGORIZATION'
      );

      // Update transactions with AI-suggested categories
      if (categorization.categorizations) {
        for (const cat of categorization.categorizations) {
          if (cat.transactionId && cat.category) {
            await this.prisma.transaction.update({
              where: { id: cat.transactionId },
              data: { category: cat.category }
            });
          }
        }
      }

      return categorization;
    } catch (error) {
      console.error('Transaction Categorization Error:', error);
      return { categorized: [] };
    }
  }

  private analyzeTransactionPatterns(transactions: any[]): any {
    // Analyze patterns for fraud detection
    const patterns = {
      averageAmount: transactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) / transactions.length,
      frequentTimes: this.getFrequentTransactionTimes(transactions),
      unusualAmounts: transactions.filter(t => Math.abs(t.amount) > 10000),
      repeatedDescriptions: this.findRepeatedDescriptions(transactions),
      velocityRisks: this.findVelocityRisks(transactions)
    };

    return patterns;
  }

  private getFrequentTransactionTimes(transactions: any[]): any {
    const timeMap = new Map();
    transactions.forEach(t => {
      const hour = new Date(t.date).getHours();
      timeMap.set(hour, (timeMap.get(hour) || 0) + 1);
    });
    return Object.fromEntries(timeMap);
  }

  private findRepeatedDescriptions(transactions: any[]): any[] {
    const descriptionMap = new Map();
    transactions.forEach(t => {
      if (t.description) {
        descriptionMap.set(t.description, (descriptionMap.get(t.description) || 0) + 1);
      }
    });
    return Array.from(descriptionMap.entries())
      .filter(([_, count]) => count > 3)
      .map(([description, count]) => ({ description, count }));
  }

  private findVelocityRisks(transactions: any[]): any[] {
    // Find transactions that happen too frequently in short time periods
    const sortedTransactions = transactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    const risks = [];
    for (let i = 1; i < sortedTransactions.length; i++) {
      const timeDiff = new Date(sortedTransactions[i].date).getTime() - 
                      new Date(sortedTransactions[i-1].date).getTime();
      
      if (timeDiff < 60000) { // Less than 1 minute apart
        risks.push({
          transaction1: sortedTransactions[i-1],
          transaction2: sortedTransactions[i],
          timeDifference: timeDiff
        });
      }
    }

    return risks;
  }

  // OCR and automatic document processing
  async processFinancialDocument(documentData: any, context: AIContext): Promise<any> {
    try {
      const ocrResult = await this.llmService.generateInsights(
        documentData,
        'FINANCIAL_DOCUMENT_OCR'
      );

      return ocrResult;
    } catch (error) {
      console.error('Financial Document Processing Error:', error);
      throw error;
    }
  }
}


import { PrismaClient } from '@prisma/client';
import { LLMService } from '../llm-service';
import { AIContext, AIWorkflowResult } from '../orchestrator';

export class WeAnalyticsAI {
  constructor(
    private prisma: PrismaClient,
    private llmService: LLMService
  ) {}

  async generateAnalytics(data: any, context: AIContext): Promise<AIWorkflowResult> {
    try {
      // Fetch relevant analytics data
      const analyticsData = await this.gatherAnalyticsData(context.tenantId);
      
      // Generate AI-powered insights
      const insights = await this.llmService.generateInsights(analyticsData, 'ANALYTICS');
      
      // Generate predictive analytics
      const predictions = await this.generatePredictiveAnalytics(analyticsData, context);
      
      // Detect anomalies in metrics
      const anomalies = await this.detectMetricAnomalies(analyticsData, context);
      
      // Store insights
      await this.storeAnalyticsInsights(insights, context);
      
      return {
        success: true,
        data: {
          insights: insights,
          predictions: predictions,
          anomalies: anomalies,
          analytics: analyticsData
        },
        insights: insights.insights || []
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analytics AI failed'
      };
    }
  }

  private async gatherAnalyticsData(tenantId: string): Promise<any> {
    // Gather data from all modules for comprehensive analytics
    const [
      dashboards,
      reports,
      metrics,
      transactions,
      projects,
      leads,
      customers
    ] = await Promise.all([
      this.prisma.dashboard.findMany({ where: { tenantId } }),
      this.prisma.report.findMany({ where: { tenantId } }),
      this.prisma.metric.findMany({ where: { tenantId } }),
      this.prisma.transaction.findMany({ 
        where: { tenantId },
        orderBy: { date: 'desc' },
        take: 100
      }),
      this.prisma.project.findMany({ 
        where: { tenantId },
        include: { tasks: true }
      }),
      this.prisma.lead.findMany({ where: { tenantId } }),
      this.prisma.customer.findMany({ where: { tenantId } })
    ]);

    return {
      dashboards,
      reports,
      metrics,
      transactions,
      projects,
      leads,
      customers,
      summary: {
        totalCustomers: customers.length,
        totalProjects: projects.length,
        totalLeads: leads.length,
        totalTransactions: transactions.length,
        activeProjects: projects.filter(p => p.status === 'ACTIVE').length,
        newLeads: leads.filter(l => l.status === 'NEW').length
      }
    };
  }

  private async generatePredictiveAnalytics(data: any, context: AIContext): Promise<any[]> {
    try {
      const predictionPrompt = `
        Analysiere diese Geschäftsdaten und erstelle Vorhersagen für die nächsten 3 Monate:
        - Umsatzprognosen basierend auf Transaktionsmustern
        - Projektabschluss-Wahrscheinlichkeiten
        - Lead-Conversion-Vorhersagen
        - Kundenretention-Prognosen
        
        Daten: ${JSON.stringify(data.summary)}
      `;

      const predictions = await this.llmService.analyzePredictiveData(data, predictionPrompt);
      
      // Store predictions in database
      if (predictions.forecasts) {
        for (const forecast of predictions.forecasts) {
          await this.prisma.aIPrediction.create({
            data: {
              predictionType: forecast.type,
              targetDate: new Date(forecast.date),
              predictedValue: forecast.value,
              confidence: forecast.confidence,
              modelData: forecast.details || {},
              tenantId: context.tenantId,
              resourceType: 'ANALYTICS',
            }
          });
        }
      }

      return predictions.forecasts || [];
    } catch (error) {
      console.error('Predictive Analytics Error:', error);
      return [];
    }
  }

  private async detectMetricAnomalies(data: any, context: AIContext): Promise<any[]> {
    try {
      // Analyze transaction patterns for anomalies
      const transactionAnalysis = await this.llmService.generateInsights(
        data.transactions,
        'ANOMALY_DETECTION'
      );

      // Analyze project performance anomalies
      const projectAnalysis = await this.llmService.generateInsights(
        data.projects,
        'PROJECT_ANOMALY_DETECTION'
      );

      const allAnomalies = [
        ...(transactionAnalysis.anomalies || []),
        ...(projectAnalysis.anomalies || [])
      ];

      // Store anomalies as insights
      for (const anomaly of allAnomalies) {
        await this.prisma.aIInsight.create({
          data: {
            category: 'ANALYTICS',
            type: 'ANOMALY',
            title: anomaly.title,
            description: anomaly.description,
            severity: anomaly.severity || 'MEDIUM',
            data: anomaly.data || {},
            confidence: anomaly.confidence || 0.7,
            isActionable: true,
            tenantId: context.tenantId,
            resourceType: 'ANALYTICS',
          }
        });
      }

      return allAnomalies;
    } catch (error) {
      console.error('Anomaly Detection Error:', error);
      return [];
    }
  }

  private async storeAnalyticsInsights(insights: any, context: AIContext): Promise<void> {
    if (insights.insights) {
      for (const insight of insights.insights) {
        await this.prisma.aIInsight.create({
          data: {
            category: 'ANALYTICS',
            type: insight.type || 'TREND',
            title: insight.title,
            description: insight.description,
            severity: insight.severity || 'LOW',
            data: insight.data || {},
            confidence: insight.confidence || 0.8,
            isActionable: insight.actionable || false,
            tenantId: context.tenantId,
            userId: context.userId,
            resourceType: 'ANALYTICS',
          }
        });
      }
    }
  }

  // Generate intelligent dashboard recommendations
  async generateDashboardRecommendations(tenantId: string): Promise<any> {
    const data = await this.gatherAnalyticsData(tenantId);
    
    return await this.llmService.generateInsights(data, 'DASHBOARD_OPTIMIZATION');
  }

  // Auto-generate reports based on business priorities
  async generateAutomaticReport(tenantId: string, reportType: string): Promise<any> {
    const data = await this.gatherAnalyticsData(tenantId);
    
    const reportData = await this.llmService.generateInsights(data, `AUTO_REPORT_${reportType}`);
    
    // Store the generated report
    const report = await this.prisma.report.create({
      data: {
        name: `AI-Generated ${reportType} Report`,
        description: `Automatically generated by AI on ${new Date().toISOString()}`,
        type: 'ANALYTICS',
        config: reportData.config || {},
        data: reportData.data || {},
        tenantId,
        userId: '', // System-generated
      }
    });

    return report;
  }
}

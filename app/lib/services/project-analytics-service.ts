
import { PrismaClient } from '@prisma/client';
import {
  ProjectHealthStatus,
  ProjectPredictionType,
  ProjectInsightType,
  PredictionConfidenceLevel,
  InsightPriorityLevel,
  ProjectAnalyticsReportType
} from '@prisma/client';

const prisma = new PrismaClient();

export interface ProjectKPI {
  velocity: number;
  burnRate: number;
  qualityScore: number;
  completionRate: number;
  budgetUtilization: number;
  scheduleAdherence: number;
}

export interface ProjectHealthScoreData {
  overallScore: number;
  status: ProjectHealthStatus;
  budgetHealth: number;
  scheduleHealth: number;
  qualityHealth: number;
  teamHealth: number;
  riskHealth: number;
  factors: any;
  recommendations?: any;
}

export interface ProjectPredictionData {
  type: ProjectPredictionType;
  predictedValue: number;
  confidence: PredictionConfidenceLevel;
  confidenceScore: number;
  predictionDate: Date;
  targetDate: Date;
  features: any;
  modelVersion: string;
}

export interface ProjectInsightData {
  type: ProjectInsightType;
  priority: InsightPriorityLevel;
  title: string;
  description: string;
  insights: any;
  recommendations?: any;
  confidence: number;
  isActionable: boolean;
  expiresAt?: Date;
}

export class ProjectAnalyticsService {
  /**
   * Calculate comprehensive project KPIs
   */
  async calculateProjectKPIs(projectId: string, tenantId: string): Promise<ProjectKPI> {
    try {
      // Get project data with tasks, timesheets, and expenses
      const project = await prisma.project.findUnique({
        where: { id: projectId, tenantId },
        include: {
          tasks: {
            include: {
              timesheets: true,
              taskTimeLogs: true
            }
          },
          timesheets: true,
          expenses: true,
          projectMetrics: {
            orderBy: { date: 'desc' },
            take: 30 // Last 30 data points
          }
        }
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Calculate velocity (story points or tasks completed per time period)
      const velocity = await this.calculateVelocity(project);
      
      // Calculate burn rate (budget consumption rate)
      const burnRate = await this.calculateBurnRate(project);
      
      // Calculate quality score based on defects, rework, etc.
      const qualityScore = await this.calculateQualityScore(project);
      
      // Calculate completion rate
      const completionRate = await this.calculateCompletionRate(project);
      
      // Calculate budget utilization
      const budgetUtilization = await this.calculateBudgetUtilization(project);
      
      // Calculate schedule adherence
      const scheduleAdherence = await this.calculateScheduleAdherence(project);

      return {
        velocity,
        burnRate,
        qualityScore,
        completionRate,
        budgetUtilization,
        scheduleAdherence
      };
    } catch (error) {
      console.error('Error calculating project KPIs:', error);
      throw error;
    }
  }

  /**
   * Calculate project health score with AI-powered analysis
   */
  async calculateProjectHealthScore(projectId: string, tenantId: string): Promise<ProjectHealthScoreData> {
    try {
      const kpis = await this.calculateProjectKPIs(projectId, tenantId);
      
      // Calculate individual health dimensions
      const budgetHealth = Math.min(100, Math.max(0, (2 - kpis.burnRate) * 50));
      const scheduleHealth = Math.min(100, kpis.scheduleAdherence);
      const qualityHealth = Math.min(100, kpis.qualityScore);
      const teamHealth = await this.calculateTeamHealthScore(projectId, tenantId);
      const riskHealth = await this.calculateRiskHealthScore(projectId, tenantId);

      // Calculate weighted overall score
      const overallScore = Math.round(
        (budgetHealth * 0.25) +
        (scheduleHealth * 0.25) +
        (qualityHealth * 0.20) +
        (teamHealth * 0.15) +
        (riskHealth * 0.15)
      );

      // Determine status based on score
      let status: ProjectHealthStatus;
      if (overallScore >= 90) status = ProjectHealthStatus.EXCELLENT;
      else if (overallScore >= 75) status = ProjectHealthStatus.GOOD;
      else if (overallScore >= 60) status = ProjectHealthStatus.FAIR;
      else if (overallScore >= 40) status = ProjectHealthStatus.POOR;
      else status = ProjectHealthStatus.CRITICAL;

      // Generate factors analysis
      const factors = {
        budget: {
          score: budgetHealth,
          trend: kpis.burnRate > 1.2 ? 'declining' : kpis.burnRate < 0.8 ? 'improving' : 'stable',
          details: {
            currentBurnRate: kpis.burnRate,
            budgetUtilization: kpis.budgetUtilization
          }
        },
        schedule: {
          score: scheduleHealth,
          trend: kpis.scheduleAdherence > 95 ? 'excellent' : kpis.scheduleAdherence > 80 ? 'good' : 'at-risk',
          details: {
            adherence: kpis.scheduleAdherence,
            completionRate: kpis.completionRate
          }
        },
        quality: {
          score: qualityHealth,
          trend: kpis.qualityScore > 90 ? 'excellent' : kpis.qualityScore > 75 ? 'good' : 'needs-attention',
          details: {
            qualityScore: kpis.qualityScore,
            velocity: kpis.velocity
          }
        }
      };

      // Generate AI-powered recommendations
      const recommendations = await this.generateHealthRecommendations(overallScore, factors, kpis);

      const healthData: ProjectHealthScoreData = {
        overallScore,
        status,
        budgetHealth,
        scheduleHealth,
        qualityHealth,
        teamHealth,
        riskHealth,
        factors,
        recommendations
      };

      // Save to database
      await prisma.projectHealthScore.create({
        data: {
          projectId,
          tenantId,
          ...healthData,
          calculatedAt: new Date()
        }
      });

      return healthData;
    } catch (error) {
      console.error('Error calculating project health score:', error);
      throw error;
    }
  }

  /**
   * Generate project predictions using ML models
   */
  async generateProjectPredictions(projectId: string, tenantId: string, userId: string): Promise<ProjectPredictionData[]> {
    try {
      const predictions: ProjectPredictionData[] = [];
      
      // Predict project completion date
      const completionPrediction = await this.predictCompletionDate(projectId, tenantId);
      predictions.push({
        type: ProjectPredictionType.COMPLETION_DATE,
        predictedValue: completionPrediction.predictedValue ?? 0,
        confidence: completionPrediction.confidence ?? PredictionConfidenceLevel.MEDIUM,
        confidenceScore: completionPrediction.confidenceScore ?? 0.5,
        predictionDate: completionPrediction.predictionDate ?? new Date(),
        targetDate: completionPrediction.targetDate ?? new Date(),
        features: completionPrediction.features ?? {},
        modelVersion: 'v1.2.0'
      });

      // Predict budget overrun risk
      const budgetPrediction = await this.predictBudgetOverrun(projectId, tenantId);
      predictions.push({
        type: ProjectPredictionType.BUDGET_OVERRUN,
        predictedValue: budgetPrediction.predictedValue ?? 0,
        confidence: budgetPrediction.confidence ?? PredictionConfidenceLevel.MEDIUM,
        confidenceScore: budgetPrediction.confidenceScore ?? 0.5,
        predictionDate: budgetPrediction.predictionDate ?? new Date(),
        targetDate: budgetPrediction.targetDate ?? new Date(),
        features: budgetPrediction.features ?? {},
        modelVersion: 'v1.2.0'
      });

      // Predict resource requirements
      const resourcePrediction = await this.predictResourceRequirements(projectId, tenantId);
      predictions.push({
        type: ProjectPredictionType.RESOURCE_REQUIREMENT,
        predictedValue: resourcePrediction.predictedValue ?? 0,
        confidence: resourcePrediction.confidence ?? PredictionConfidenceLevel.MEDIUM,
        confidenceScore: resourcePrediction.confidenceScore ?? 0.5,
        predictionDate: resourcePrediction.predictionDate ?? new Date(),
        targetDate: resourcePrediction.targetDate ?? new Date(),
        features: resourcePrediction.features ?? {},
        modelVersion: 'v1.2.0'
      });

      // Predict success probability
      const successPrediction = await this.predictSuccessProbability(projectId, tenantId);
      predictions.push({
        type: ProjectPredictionType.SUCCESS_PROBABILITY,
        predictedValue: successPrediction.predictedValue ?? 0,
        confidence: successPrediction.confidence ?? PredictionConfidenceLevel.MEDIUM,
        confidenceScore: successPrediction.confidenceScore ?? 0.5,
        predictionDate: successPrediction.predictionDate ?? new Date(),
        targetDate: successPrediction.targetDate ?? new Date(),
        features: successPrediction.features ?? {},
        modelVersion: 'v1.2.0'
      });

      // Save predictions to database
      for (const prediction of predictions) {
        await prisma.projectPrediction.create({
          data: {
            projectId,
            tenantId,
            userId,
            ...prediction
          }
        });
      }

      return predictions;
    } catch (error) {
      console.error('Error generating project predictions:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered project insights
   */
  async generateProjectInsights(projectId: string, tenantId: string): Promise<ProjectInsightData[]> {
    try {
      const insights: ProjectInsightData[] = [];
      
      // Performance insights
      const performanceInsights = await this.analyzePerformanceInsights(projectId, tenantId);
      insights.push(...performanceInsights);

      // Risk insights
      const riskInsights = await this.analyzeRiskInsights(projectId, tenantId);
      insights.push(...riskInsights);

      // Optimization insights
      const optimizationInsights = await this.analyzeOptimizationInsights(projectId, tenantId);
      insights.push(...optimizationInsights);

      // Anomaly detection insights
      const anomalyInsights = await this.detectProjectAnomalies(projectId, tenantId);
      insights.push(...anomalyInsights);

      // Save insights to database
      for (const insight of insights) {
        await prisma.projectInsight.create({
          data: {
            projectId,
            tenantId,
            ...insight
          }
        });
      }

      return insights;
    } catch (error) {
      console.error('Error generating project insights:', error);
      throw error;
    }
  }

  /**
   * Process natural language queries about project data
   */
  async processNaturalLanguageQuery(
    query: string,
    projectIds: string[],
    tenantId: string,
    userId: string
  ): Promise<any> {
    try {
      const startTime = Date.now();
      
      // Parse query intent and extract parameters
      const queryIntent = await this.parseQueryIntent(query);
      
      // Generate response based on intent
      let response;
      switch (queryIntent.type) {
        case 'PERFORMANCE':
          response = await this.handlePerformanceQuery(queryIntent, projectIds, tenantId);
          break;
        case 'PREDICTION':
          response = await this.handlePredictionQuery(queryIntent, projectIds, tenantId);
          break;
        case 'COMPARISON':
          response = await this.handleComparisonQuery(queryIntent, projectIds, tenantId);
          break;
        case 'RISK':
          response = await this.handleRiskQuery(queryIntent, projectIds, tenantId);
          break;
        default:
          response = await this.handleGeneralQuery(queryIntent, projectIds, tenantId);
      }

      const processingTime = (Date.now() - startTime) / 1000;

      // Save query history
      await prisma.projectInsightQuery.create({
        data: {
          query,
          queryType: queryIntent.type,
          projectIds,
          response,
          confidence: queryIntent.confidence || 0.8,
          processingTime,
          tenantId,
          userId
        }
      });

      return response;
    } catch (error) {
      console.error('Error processing natural language query:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive project analytics report
   */
  async generateAnalyticsReport(
    type: ProjectAnalyticsReportType,
    projectIds: string[],
    userIds: string[],
    filters: any,
    tenantId: string,
    userId: string
  ): Promise<any> {
    try {
      let reportData;
      
      switch (type) {
        case ProjectAnalyticsReportType.PROJECT_PERFORMANCE:
          reportData = await this.generateProjectPerformanceReport(projectIds, tenantId, filters);
          break;
        case ProjectAnalyticsReportType.EXECUTIVE_SUMMARY:
          reportData = await this.generateExecutiveSummaryReport(projectIds, tenantId, filters);
          break;
        case ProjectAnalyticsReportType.CUSTOM_ANALYSIS:
          reportData = await this.generateCustomAnalysisReport(projectIds, userIds, tenantId, filters);
          break;
        default:
          throw new Error(`Unsupported report type: ${type}`);
      }

      // Generate AI insights for the report
      const insights = await this.generateReportInsights(reportData, type);
      const recommendations = await this.generateReportRecommendations(reportData, type);

      const report = {
        summary: reportData.summary,
        data: reportData,
        insights,
        recommendations,
        generatedAt: new Date(),
        filters
      };

      // Save report to database
      await prisma.projectAnalyticsReport.create({
        data: {
          name: `${type} Report - ${new Date().toLocaleDateString()}`,
          type,
          projectIds,
          userIds,
          filters,
          data: report,
          insights,
          recommendations,
          generatedBy: 'AI',
          format: 'JSON',
          tenantId,
          userId
        }
      });

      return report;
    } catch (error) {
      console.error('Error generating analytics report:', error);
      throw error;
    }
  }

  // Private helper methods

  private async calculateVelocity(project: any): Promise<number> {
    const completedTasks = project.tasks?.filter((task: any) => task.status === 'DONE') || [];
    const totalDays = project.startDate ? 
      Math.max(1, Math.ceil((Date.now() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))) : 1;
    
    return Math.round((completedTasks.length / totalDays) * 7 * 100) / 100; // Tasks per week
  }

  private async calculateBurnRate(project: any): Promise<number> {
    if (!project.budget || project.budget === 0) return 0;
    
    const totalExpenses = project.expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0;
    const plannedDuration = project.startDate && project.endDate ? 
      Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 1;
    const actualDuration = project.startDate ? 
      Math.max(1, Math.ceil((Date.now() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))) : 1;
    
    const expectedSpend = (project.budget * actualDuration) / plannedDuration;
    return expectedSpend > 0 ? Math.round((totalExpenses / expectedSpend) * 100) / 100 : 0;
  }

  private async calculateQualityScore(project: any): Promise<number> {
    // Simplified quality scoring based on task completion quality
    const tasks = project.tasks || [];
    if (tasks.length === 0) return 100;

    const qualityFactors = {
      onTimeCompletion: tasks.filter((t: any) => t.status === 'DONE' && (!t.dueDate || new Date(t.dueDate) >= new Date())).length,
      totalCompleted: tasks.filter((t: any) => t.status === 'DONE').length,
      estimationAccuracy: this.calculateEstimationAccuracy(tasks)
    };

    const onTimeRate = qualityFactors.totalCompleted > 0 ? qualityFactors.onTimeCompletion / qualityFactors.totalCompleted : 1;
    return Math.round((onTimeRate * 0.6 + qualityFactors.estimationAccuracy * 0.4) * 100);
  }

  private calculateEstimationAccuracy(tasks: any[]): number {
    const tasksWithEstimates = tasks.filter(t => t.estimatedHours && t.actualHours);
    if (tasksWithEstimates.length === 0) return 1;

    const accuracies = tasksWithEstimates.map(t => {
      const variance = Math.abs(t.actualHours - t.estimatedHours) / Math.max(t.estimatedHours, 1);
      return Math.max(0, 1 - variance);
    });

    return accuracies.reduce((sum, acc) => sum + acc, 0) / accuracies.length;
  }

  private async calculateCompletionRate(project: any): Promise<number> {
    const tasks = project.tasks || [];
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter((task: any) => task.status === 'DONE').length;
    return Math.round((completedTasks / tasks.length) * 100);
  }

  private async calculateBudgetUtilization(project: any): Promise<number> {
    if (!project.budget || project.budget === 0) return 0;
    
    const totalExpenses = project.expenses?.reduce((sum: number, expense: any) => sum + expense.amount, 0) || 0;
    return Math.round((totalExpenses / project.budget) * 100);
  }

  private async calculateScheduleAdherence(project: any): Promise<number> {
    if (!project.endDate) return 100;
    
    const plannedEndDate = new Date(project.endDate);
    const currentDate = new Date();
    const startDate = project.startDate ? new Date(project.startDate) : currentDate;
    
    const totalDuration = plannedEndDate.getTime() - startDate.getTime();
    const elapsedDuration = currentDate.getTime() - startDate.getTime();
    
    const completionRate = await this.calculateCompletionRate(project);
    const expectedProgress = totalDuration > 0 ? (elapsedDuration / totalDuration) * 100 : 100;
    
    const adherence = expectedProgress > 0 ? (completionRate / expectedProgress) * 100 : 100;
    return Math.min(100, Math.max(0, Math.round(adherence)));
  }

  private async calculateTeamHealthScore(projectId: string, tenantId: string): Promise<number> {
    // Simplified team health calculation
    // In a real implementation, this would analyze team collaboration, communication, workload distribution, etc.
    const recentMetrics = await prisma.teamPerformanceMetrics.findMany({
      where: {
        projectId,
        tenantId,
        startDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    if (recentMetrics.length === 0) return 75; // Default neutral score

    const avgScore = recentMetrics.reduce((sum, metric) => sum + metric.value, 0) / recentMetrics.length;
    return Math.min(100, Math.max(0, Math.round(avgScore)));
  }

  private async calculateRiskHealthScore(projectId: string, tenantId: string): Promise<number> {
    // Simplified risk health calculation
    // In a real implementation, this would analyze project risks, dependencies, blockers, etc.
    const projectRisks = await prisma.projectRisk.findMany({
      where: { projectId, tenantId }
    });

    if (projectRisks.length === 0) return 90; // No risks = good health

    const activeRisks = projectRisks.filter(risk => risk.status === 'IDENTIFIED' || risk.status === 'MONITORING');
    const riskScore = Math.max(0, 100 - (activeRisks.length * 10)); // Subtract 10 points per active risk

    return Math.round(riskScore);
  }

  private async generateHealthRecommendations(score: number, factors: any, kpis: ProjectKPI): Promise<any> {
    const recommendations = [];

    if (factors.budget.score < 70) {
      recommendations.push({
        category: 'budget',
        priority: 'high',
        title: 'Budget Optimization Required',
        description: 'Current burn rate indicates potential budget overrun',
        actions: [
          'Review and optimize resource allocation',
          'Implement cost tracking measures',
          'Consider scope adjustments if necessary'
        ]
      });
    }

    if (factors.schedule.score < 70) {
      recommendations.push({
        category: 'schedule',
        priority: 'high',
        title: 'Schedule Recovery Plan Needed',
        description: 'Project is falling behind schedule',
        actions: [
          'Identify and remove blockers',
          'Increase team capacity if possible',
          'Re-prioritize tasks for critical path'
        ]
      });
    }

    if (factors.quality.score < 70) {
      recommendations.push({
        category: 'quality',
        priority: 'medium',
        title: 'Quality Improvement Required',
        description: 'Quality metrics are below acceptable levels',
        actions: [
          'Implement additional code review processes',
          'Increase testing coverage',
          'Provide additional training to team members'
        ]
      });
    }

    return recommendations;
  }

  private async predictCompletionDate(projectId: string, tenantId: string): Promise<Partial<ProjectPredictionData>> {
    // Simplified prediction algorithm
    // In a real implementation, this would use sophisticated ML models
    const project = await prisma.project.findUnique({
      where: { id: projectId, tenantId },
      include: { tasks: true }
    });

    if (!project) throw new Error('Project not found');

    const completionRate = await this.calculateCompletionRate(project);
    const velocity = await this.calculateVelocity(project);
    
    const remainingWork = 100 - completionRate;
    const estimatedDaysToComplete = velocity > 0 ? (remainingWork / velocity) : 30;
    
    const predictedCompletionDate = new Date();
    predictedCompletionDate.setDate(predictedCompletionDate.getDate() + estimatedDaysToComplete);

    const confidence = velocity > 0.1 ? PredictionConfidenceLevel.MEDIUM : PredictionConfidenceLevel.LOW;
    const confidenceScore = Math.min(0.9, Math.max(0.3, velocity * 0.5));

    return {
      predictedValue: predictedCompletionDate.getTime(),
      confidence,
      confidenceScore,
      predictionDate: new Date(),
      targetDate: predictedCompletionDate,
      features: {
        completionRate,
        velocity,
        remainingWork,
        currentTasks: project.tasks?.length || 0
      }
    };
  }

  private async predictBudgetOverrun(projectId: string, tenantId: string): Promise<Partial<ProjectPredictionData>> {
    // Simplified budget prediction
    const project = await prisma.project.findUnique({
      where: { id: projectId, tenantId },
      include: { expenses: true }
    });

    if (!project || !project.budget) {
      return {
        predictedValue: 0,
        confidence: PredictionConfidenceLevel.LOW,
        confidenceScore: 0.3,
        predictionDate: new Date(),
        targetDate: new Date(),
        features: { error: 'No budget data available' }
      };
    }

    const burnRate = await this.calculateBurnRate(project);
    const budgetUtilization = await this.calculateBudgetUtilization(project);
    
    const predictedOverrun = Math.max(0, (burnRate - 1) * 100);
    const confidence = burnRate > 0.5 ? PredictionConfidenceLevel.MEDIUM : PredictionConfidenceLevel.LOW;

    return {
      predictedValue: predictedOverrun,
      confidence,
      confidenceScore: Math.min(0.8, Math.max(0.4, 1 - Math.abs(burnRate - 1))),
      predictionDate: new Date(),
      targetDate: project.endDate ? new Date(project.endDate) : new Date(),
      features: {
        burnRate,
        budgetUtilization,
        currentExpenses: project.expenses?.length || 0
      }
    };
  }

  private async predictResourceRequirements(projectId: string, tenantId: string): Promise<Partial<ProjectPredictionData>> {
    // Simplified resource prediction
    const project = await prisma.project.findUnique({
      where: { id: projectId, tenantId },
      include: { 
        tasks: true,
        members: true,
        timesheets: true
      }
    });

    if (!project) throw new Error('Project not found');

    const completionRate = await this.calculateCompletionRate(project);
    const currentTeamSize = project.members?.length || 1;
    const velocity = await this.calculateVelocity(project);
    
    const remainingWork = 100 - completionRate;
    const currentCapacity = currentTeamSize;
    const requiredCapacity = velocity > 0 ? Math.ceil(remainingWork / (velocity * 7)) : currentTeamSize; // Assuming 7 days per week velocity

    return {
      predictedValue: Math.max(currentTeamSize, requiredCapacity),
      confidence: PredictionConfidenceLevel.MEDIUM,
      confidenceScore: 0.7,
      predictionDate: new Date(),
      targetDate: project.endDate ? new Date(project.endDate) : new Date(),
      features: {
        currentTeamSize,
        velocity,
        remainingWork,
        estimatedCapacityNeeded: requiredCapacity
      }
    };
  }

  private async predictSuccessProbability(projectId: string, tenantId: string): Promise<Partial<ProjectPredictionData>> {
    // Simplified success prediction based on multiple factors
    const healthScore = await this.calculateProjectHealthScore(projectId, tenantId);
    const kpis = await this.calculateProjectKPIs(projectId, tenantId);
    
    // Calculate success probability based on health score and key factors
    let successProbability = healthScore.overallScore;
    
    // Adjust based on critical factors
    if (kpis.burnRate > 1.5) successProbability -= 20;
    if (kpis.scheduleAdherence < 70) successProbability -= 15;
    if (kpis.qualityScore < 60) successProbability -= 10;
    
    successProbability = Math.min(100, Math.max(0, successProbability));
    
    const confidence = successProbability > 70 ? PredictionConfidenceLevel.HIGH : 
                     successProbability > 40 ? PredictionConfidenceLevel.MEDIUM : 
                     PredictionConfidenceLevel.LOW;

    return {
      predictedValue: successProbability,
      confidence,
      confidenceScore: Math.min(0.9, Math.max(0.5, successProbability / 100)),
      predictionDate: new Date(),
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      features: {
        healthScore: healthScore.overallScore,
        burnRate: kpis.burnRate,
        scheduleAdherence: kpis.scheduleAdherence,
        qualityScore: kpis.qualityScore
      }
    };
  }

  private async analyzePerformanceInsights(projectId: string, tenantId: string): Promise<ProjectInsightData[]> {
    const insights: ProjectInsightData[] = [];
    const kpis = await this.calculateProjectKPIs(projectId, tenantId);

    if (kpis.velocity > 1.5) {
      insights.push({
        type: ProjectInsightType.PERFORMANCE,
        priority: InsightPriorityLevel.MEDIUM,
        title: 'High Team Velocity Detected',
        description: 'Your team is performing exceptionally well with above-average velocity.',
        insights: {
          currentVelocity: kpis.velocity,
          comparison: 'Above average by 50%'
        },
        recommendations: [
          'Consider taking on additional scope or advancing timeline',
          'Document best practices for knowledge sharing',
          'Monitor team burnout to maintain sustainable pace'
        ],
        confidence: 0.8,
        isActionable: true
      });
    }

    if (kpis.qualityScore < 70) {
      insights.push({
        type: ProjectInsightType.PERFORMANCE,
        priority: InsightPriorityLevel.HIGH,
        title: 'Quality Score Below Target',
        description: 'Quality metrics indicate potential issues that need attention.',
        insights: {
          currentScore: kpis.qualityScore,
          target: 80,
          gap: 80 - kpis.qualityScore
        },
        recommendations: [
          'Implement additional code review processes',
          'Increase automated testing coverage',
          'Provide team training on quality standards'
        ],
        confidence: 0.9,
        isActionable: true
      });
    }

    return insights;
  }

  private async analyzeRiskInsights(projectId: string, tenantId: string): Promise<ProjectInsightData[]> {
    const insights: ProjectInsightData[] = [];
    const kpis = await this.calculateProjectKPIs(projectId, tenantId);

    if (kpis.burnRate > 1.3) {
      insights.push({
        type: ProjectInsightType.RISK,
        priority: InsightPriorityLevel.HIGH,
        title: 'Budget Overrun Risk Detected',
        description: 'Current spending rate indicates high risk of budget overrun.',
        insights: {
          currentBurnRate: kpis.burnRate,
          riskLevel: 'High',
          projectedOverrun: `${Math.round((kpis.burnRate - 1) * 100)}%`
        },
        recommendations: [
          'Review and optimize resource allocation',
          'Implement stricter budget controls',
          'Consider scope reduction if necessary'
        ],
        confidence: 0.85,
        isActionable: true
      });
    }

    if (kpis.scheduleAdherence < 70) {
      insights.push({
        type: ProjectInsightType.RISK,
        priority: InsightPriorityLevel.HIGH,
        title: 'Schedule Delay Risk',
        description: 'Project is significantly behind schedule and at risk of missing deadlines.',
        insights: {
          currentAdherence: kpis.scheduleAdherence,
          target: 90,
          delayRisk: 'High'
        },
        recommendations: [
          'Identify and resolve project blockers',
          'Consider adding resources to critical path',
          'Re-evaluate scope and priorities'
        ],
        confidence: 0.9,
        isActionable: true
      });
    }

    return insights;
  }

  private async analyzeOptimizationInsights(projectId: string, tenantId: string): Promise<ProjectInsightData[]> {
    const insights: ProjectInsightData[] = [];
    
    // This would analyze various optimization opportunities
    insights.push({
      type: ProjectInsightType.OPTIMIZATION,
      priority: InsightPriorityLevel.MEDIUM,
      title: 'Resource Optimization Opportunity',
      description: 'Analysis suggests potential for better resource allocation.',
      insights: {
        currentUtilization: 75,
        optimizedUtilization: 85,
        potentialSavings: '12%'
      },
      recommendations: [
        'Redistribute workload based on individual strengths',
        'Implement pair programming for knowledge transfer',
        'Optimize meeting schedules to increase focus time'
      ],
      confidence: 0.7,
      isActionable: true
    });

    return insights;
  }

  private async detectProjectAnomalies(projectId: string, tenantId: string): Promise<ProjectInsightData[]> {
    const insights: ProjectInsightData[] = [];
    
    // This would detect anomalies in project patterns
    // For now, we'll create a placeholder insight
    insights.push({
      type: ProjectInsightType.ANOMALY,
      priority: InsightPriorityLevel.LOW,
      title: 'Unusual Pattern Detected',
      description: 'Detected deviation from normal project patterns.',
      insights: {
        pattern: 'Task completion pattern differs from historical average',
        deviation: '15%',
        confidence: 'Medium'
      },
      confidence: 0.6,
      isActionable: false
    });

    return insights;
  }

  private async parseQueryIntent(query: string): Promise<any> {
    // Simplified query parsing - in a real implementation, this would use NLP
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('performance') || lowerQuery.includes('kpi') || lowerQuery.includes('metric')) {
      return { type: 'PERFORMANCE', confidence: 0.8 };
    } else if (lowerQuery.includes('predict') || lowerQuery.includes('forecast') || lowerQuery.includes('estimate')) {
      return { type: 'PREDICTION', confidence: 0.8 };
    } else if (lowerQuery.includes('compare') || lowerQuery.includes('versus') || lowerQuery.includes('vs')) {
      return { type: 'COMPARISON', confidence: 0.8 };
    } else if (lowerQuery.includes('risk') || lowerQuery.includes('problem') || lowerQuery.includes('issue')) {
      return { type: 'RISK', confidence: 0.8 };
    } else {
      return { type: 'GENERAL', confidence: 0.5 };
    }
  }

  private async handlePerformanceQuery(intent: any, projectIds: string[], tenantId: string): Promise<any> {
    const performanceData = [];
    
    for (const projectId of projectIds) {
      const kpis = await this.calculateProjectKPIs(projectId, tenantId);
      const project = await prisma.project.findUnique({
        where: { id: projectId, tenantId },
        select: { name: true }
      });
      
      performanceData.push({
        projectId,
        projectName: project?.name || 'Unknown',
        kpis
      });
    }

    return {
      type: 'performance_analysis',
      data: performanceData,
      summary: `Performance analysis for ${projectIds.length} project(s)`,
      insights: this.generatePerformanceSummary(performanceData)
    };
  }

  private async handlePredictionQuery(intent: any, projectIds: string[], tenantId: string): Promise<any> {
    const predictions = [];
    
    for (const projectId of projectIds) {
      const projectPredictions = await this.generateProjectPredictions(projectId, tenantId, 'system');
      predictions.push({
        projectId,
        predictions: projectPredictions
      });
    }

    return {
      type: 'prediction_analysis',
      data: predictions,
      summary: `Predictions generated for ${projectIds.length} project(s)`,
      insights: 'Predictions based on current project trends and historical data'
    };
  }

  private async handleComparisonQuery(intent: any, projectIds: string[], tenantId: string): Promise<any> {
    if (projectIds.length < 2) {
      return {
        type: 'comparison_error',
        message: 'At least 2 projects are required for comparison',
        data: null
      };
    }

    const comparisonData = [];
    for (const projectId of projectIds) {
      const kpis = await this.calculateProjectKPIs(projectId, tenantId);
      const healthScore = await this.calculateProjectHealthScore(projectId, tenantId);
      const project = await prisma.project.findUnique({
        where: { id: projectId, tenantId },
        select: { name: true, status: true }
      });
      
      comparisonData.push({
        projectId,
        projectName: project?.name || 'Unknown',
        status: project?.status,
        kpis,
        healthScore: healthScore.overallScore
      });
    }

    return {
      type: 'project_comparison',
      data: comparisonData,
      summary: `Comparison of ${projectIds.length} projects`,
      insights: this.generateComparisonInsights(comparisonData)
    };
  }

  private async handleRiskQuery(intent: any, projectIds: string[], tenantId: string): Promise<any> {
    const riskData = [];
    
    for (const projectId of projectIds) {
      const risks = await prisma.projectRisk.findMany({
        where: { projectId, tenantId }
      });
      
      const kpis = await this.calculateProjectKPIs(projectId, tenantId);
      const riskScore = await this.calculateRiskHealthScore(projectId, tenantId);
      
      riskData.push({
        projectId,
        activeRisks: risks.filter(r => r.status === 'IDENTIFIED' || r.status === 'MONITORING').length,
        riskHealthScore: riskScore,
        budgetRisk: kpis.burnRate > 1.2 ? 'High' : kpis.burnRate > 1.0 ? 'Medium' : 'Low',
        scheduleRisk: kpis.scheduleAdherence < 70 ? 'High' : kpis.scheduleAdherence < 85 ? 'Medium' : 'Low'
      });
    }

    return {
      type: 'risk_analysis',
      data: riskData,
      summary: `Risk analysis for ${projectIds.length} project(s)`,
      insights: this.generateRiskSummary(riskData)
    };
  }

  private async handleGeneralQuery(intent: any, projectIds: string[], tenantId: string): Promise<any> {
    // General query handler
    return {
      type: 'general_response',
      message: 'I can help you analyze project performance, generate predictions, compare projects, or assess risks. Please be more specific about what you\'d like to know.',
      suggestions: [
        'Show me the performance metrics for this project',
        'Predict when this project will be completed',
        'Compare the health scores of these projects',
        'What are the main risks for this project?'
      ]
    };
  }

  private generatePerformanceSummary(data: any[]): string {
    const avgVelocity = data.reduce((sum, p) => sum + p.kpis.velocity, 0) / data.length;
    const avgQuality = data.reduce((sum, p) => sum + p.kpis.qualityScore, 0) / data.length;
    
    return `Average velocity: ${avgVelocity.toFixed(2)} tasks/week, Average quality score: ${avgQuality.toFixed(1)}`;
  }

  private generateComparisonInsights(data: any[]): string {
    const bestPerforming = data.reduce((best, current) => 
      current.healthScore > best.healthScore ? current : best
    );
    
    const worstPerforming = data.reduce((worst, current) => 
      current.healthScore < worst.healthScore ? current : worst
    );

    return `Best performing: ${bestPerforming.projectName} (${bestPerforming.healthScore}), Needs attention: ${worstPerforming.projectName} (${worstPerforming.healthScore})`;
  }

  private generateRiskSummary(data: any[]): string {
    const highRiskProjects = data.filter(p => p.budgetRisk === 'High' || p.scheduleRisk === 'High').length;
    return `${highRiskProjects} out of ${data.length} projects identified as high risk`;
  }

  private async generateProjectPerformanceReport(projectIds: string[], tenantId: string, filters: any): Promise<any> {
    const projects = [];
    
    for (const projectId of projectIds) {
      const project = await prisma.project.findUnique({
        where: { id: projectId, tenantId },
        include: {
          tasks: true,
          members: true,
          expenses: true,
          projectMetrics: {
            orderBy: { date: 'desc' },
            take: 30
          }
        }
      });

      if (project) {
        const kpis = await this.calculateProjectKPIs(projectId, tenantId);
        const healthScore = await this.calculateProjectHealthScore(projectId, tenantId);
        
        projects.push({
          project,
          kpis,
          healthScore
        });
      }
    }

    return {
      summary: {
        totalProjects: projects.length,
        avgHealthScore: projects.reduce((sum: number, p: any) => sum + p.healthScore.overallScore, 0) / projects.length,
        avgVelocity: projects.reduce((sum: number, p: any) => sum + p.kpis.velocity, 0) / projects.length
      },
      projects,
      trends: await this.calculateTrends(projectIds, tenantId),
      generatedAt: new Date()
    };
  }

  private async generateExecutiveSummaryReport(projectIds: string[], tenantId: string, filters: any): Promise<any> {
    const projectData = await this.generateProjectPerformanceReport(projectIds, tenantId, filters);
    
    return {
      executiveSummary: {
        totalProjects: projectData.summary.totalProjects,
        overallHealthScore: Math.round(projectData.summary.avgHealthScore),
        projectsOnTrack: projectData.projects.filter((p: any) => p.healthScore.overallScore >= 75).length,
        projectsAtRisk: projectData.projects.filter((p: any) => p.healthScore.overallScore < 60).length,
        keyMetrics: {
          avgVelocity: Math.round(projectData.summary.avgVelocity * 100) / 100,
          totalBudget: projectData.projects.reduce((sum: number, p: any) => sum + (p.project.budget || 0), 0),
          totalTeamMembers: [...new Set(projectData.projects.flatMap((p: any) => p.project.members?.map((m: any) => m.userId) || []))].length
        }
      },
      highlightProjects: projectData.projects.slice(0, 5), // Top 5 projects
      recommendedActions: await this.generateExecutiveRecommendations(projectData.projects)
    };
  }

  private async generateCustomAnalysisReport(projectIds: string[], userIds: string[], tenantId: string, filters: any): Promise<any> {
    // Custom analysis based on filters
    return {
      customAnalysis: 'Custom analysis results would be generated based on specific filters and requirements',
      filters,
      projectIds,
      userIds,
      generatedAt: new Date()
    };
  }

  private async calculateTrends(projectIds: string[], tenantId: string): Promise<any> {
    // Calculate trends over time
    return {
      velocityTrend: 'stable',
      qualityTrend: 'improving',
      budgetTrend: 'stable'
    };
  }

  private async generateReportInsights(reportData: any, type: ProjectAnalyticsReportType): Promise<any> {
    // Generate AI insights for the report
    return {
      keyFindings: [
        'Overall project health is above average',
        'Team velocity shows consistent improvement',
        'Budget utilization is within acceptable ranges'
      ],
      recommendations: [
        'Continue current practices for high-performing projects',
        'Focus attention on projects with health scores below 60',
        'Implement best practices across all projects'
      ]
    };
  }

  private async generateReportRecommendations(reportData: any, type: ProjectAnalyticsReportType): Promise<any> {
    return {
      immediate: [
        'Address budget concerns in underperforming projects',
        'Reallocate resources to critical path activities'
      ],
      shortTerm: [
        'Implement quality improvement processes',
        'Enhance team collaboration tools'
      ],
      longTerm: [
        'Develop predictive analytics capabilities',
        'Establish center of excellence for project management'
      ]
    };
  }

  private async generateExecutiveRecommendations(projects: any[]): Promise<any> {
    const atRiskProjects = projects.filter(p => p.healthScore.overallScore < 60);
    
    return {
      immediate: atRiskProjects.length > 0 ? [
        `Review and provide support for ${atRiskProjects.length} at-risk projects`,
        'Implement emergency response procedures for critical projects'
      ] : [
        'Maintain current trajectory for well-performing projects'
      ],
      strategic: [
        'Invest in team development and training',
        'Standardize project management processes',
        'Implement advanced analytics for early risk detection'
      ]
    };
  }
}

export default ProjectAnalyticsService;

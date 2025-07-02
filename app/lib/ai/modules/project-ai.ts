
import { PrismaClient } from '@prisma/client';
import { LLMService } from '../llm-service';
import { AIContext, AIWorkflowResult } from '../orchestrator';

export class WeProjectAI {
  constructor(
    private prisma: PrismaClient,
    private llmService: LLMService
  ) {}

  async optimizeProject(data: any, context: AIContext): Promise<AIWorkflowResult> {
    try {
      // Gather project data
      const projectData = await this.gatherProjectData(context.tenantId, data.projectId);
      
      // Generate resource optimization recommendations
      const resourceOptimization = await this.optimizeResources(projectData, context);
      
      // Assess project risks
      const riskAssessment = await this.assessProjectRisks(projectData, context);
      
      // Generate intelligent time estimations
      const timeEstimations = await this.generateTimeEstimations(projectData, context);
      
      // Predict project health and completion probability
      const healthPrediction = await this.predictProjectHealth(projectData, context);
      
      // Optimize task prioritization
      const taskPrioritization = await this.optimizeTaskPriorities(projectData, context);
      
      return {
        success: true,
        data: {
          resourceOptimization,
          riskAssessment,
          timeEstimations,
          healthPrediction,
          taskPrioritization,
          projectData
        },
        insights: [
          ...(riskAssessment.insights || []),
          ...(resourceOptimization.insights || []),
          ...(healthPrediction.insights || [])
        ]
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Project AI failed'
      };
    }
  }

  private async gatherProjectData(tenantId: string, projectId?: string): Promise<any> {
    const where = projectId ? { tenantId, id: projectId } : { tenantId };
    
    const [
      projects,
      tasks,
      timesheets,
      milestones,
      projectMembers
    ] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: {
          tasks: {
            include: {
              assignee: true,
              timesheets: true
            }
          },
          members: {
            include: {
              user: true
            }
          },
          milestones: true,
          manager: true
        }
      }),
      this.prisma.task.findMany({
        where: { tenantId },
        include: {
          assignee: true,
          timesheets: true,
          project: true
        }
      }),
      this.prisma.timesheet.findMany({
        where: { tenantId },
        include: {
          user: true,
          project: true,
          task: true
        }
      }),
      this.prisma.milestone.findMany({ where: { tenantId } }),
      this.prisma.projectMember.findMany({
        where: { tenantId },
        include: { user: true }
      })
    ]);

    // Calculate project metrics
    const projectMetrics = projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id);
      const completedTasks = projectTasks.filter(t => t.status === 'DONE');
      const overdueTasks = projectTasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE'
      );
      
      const totalEstimatedHours = projectTasks.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
      const totalActualHours = projectTasks.reduce((sum, t) => sum + (t.actualHours || 0), 0);
      
      return {
        ...project,
        metrics: {
          completionRate: projectTasks.length > 0 ? completedTasks.length / projectTasks.length : 0,
          overdueTasksCount: overdueTasks.length,
          totalTasks: projectTasks.length,
          estimatedHours: totalEstimatedHours,
          actualHours: totalActualHours,
          efficiency: totalEstimatedHours > 0 ? totalActualHours / totalEstimatedHours : 1
        }
      };
    });

    return {
      projects: projectMetrics,
      tasks,
      timesheets,
      milestones,
      projectMembers
    };
  }

  private async optimizeResources(data: any, context: AIContext): Promise<any> {
    try {
      const optimization = await this.llmService.optimizeWorkflow(
        {
          projects: data.projects,
          tasks: data.tasks,
          members: data.projectMembers,
          timesheets: data.timesheets
        },
        {
          goal: 'RESOURCE_OPTIMIZATION',
          constraints: ['SKILL_MATCHING', 'WORKLOAD_BALANCE', 'DEADLINE_PRIORITY']
        }
      );

      const insights = [];
      
      if (optimization.recommendations) {
        for (const recommendation of optimization.recommendations) {
          const insight = await this.prisma.aIInsight.create({
            data: {
              category: 'PROJECT',
              type: 'OPTIMIZATION',
              title: recommendation.title,
              description: recommendation.description,
              severity: recommendation.severity || 'MEDIUM',
              data: recommendation.data || {},
              confidence: recommendation.confidence || 0.8,
              isActionable: true,
              tenantId: context.tenantId,
              resourceType: 'PROJECT',
              resourceId: recommendation.projectId,
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
      console.error('Resource Optimization Error:', error);
      return { recommendations: [], insights: [] };
    }
  }

  private async assessProjectRisks(data: any, context: AIContext): Promise<any> {
    try {
      const riskAnalysis = await this.llmService.assessRisk(
        {
          projects: data.projects,
          tasks: data.tasks,
          milestones: data.milestones
        },
        'PROJECT_DELIVERY'
      );

      const insights = [];
      
      if (riskAnalysis.risks) {
        for (const risk of riskAnalysis.risks) {
          const insight = await this.prisma.aIInsight.create({
            data: {
              category: 'PROJECT',
              type: 'RISK',
              title: risk.title,
              description: risk.description,
              severity: risk.severity || 'HIGH',
              data: risk.data || {},
              confidence: risk.confidence || 0.9,
              isActionable: true,
              tenantId: context.tenantId,
              resourceType: 'PROJECT',
              resourceId: risk.projectId,
            }
          });
          insights.push(insight);
        }
      }

      return {
        risks: riskAnalysis.risks || [],
        insights
      };
    } catch (error) {
      console.error('Project Risk Assessment Error:', error);
      return { risks: [], insights: [] };
    }
  }

  private async generateTimeEstimations(data: any, context: AIContext): Promise<any> {
    try {
      const estimations = await this.llmService.analyzePredictiveData(
        {
          historicalTasks: data.tasks,
          projects: data.projects,
          timesheets: data.timesheets
        },
        'Intelligente Zeitschätzung für Tasks und Projekte basierend auf historischen Daten und Teammitglied-Performance'
      );

      const predictions = [];
      
      if (estimations.predictions) {
        for (const prediction of estimations.predictions) {
          const aiPrediction = await this.prisma.aIPrediction.create({
            data: {
              predictionType: 'PROJECT_COMPLETION',
              targetDate: new Date(prediction.completionDate),
              predictedValue: prediction.hoursRequired,
              confidence: prediction.confidence,
              modelData: prediction.factors || {},
              tenantId: context.tenantId,
              resourceType: 'PROJECT',
              resourceId: prediction.projectId || prediction.taskId,
            }
          });
          predictions.push(aiPrediction);
        }
      }

      return {
        estimations: estimations.estimations || [],
        predictions
      };
    } catch (error) {
      console.error('Time Estimation Error:', error);
      return { estimations: [], predictions: [] };
    }
  }

  private async predictProjectHealth(data: any, context: AIContext): Promise<any> {
    try {
      const healthAnalysis = await this.llmService.analyzePredictiveData(
        {
          projects: data.projects.map((p: any) => ({
            ...p,
            metrics: p.metrics
          })),
          tasks: data.tasks,
          milestones: data.milestones
        },
        'Projektgesundheit-Vorhersage und Erfolgsprognose basierend auf aktuellen Metriken und Trends'
      );

      const insights = [];
      const predictions = [];
      
      if (healthAnalysis.healthScores) {
        for (const score of healthAnalysis.healthScores) {
          // Create insight for project health
          const insight = await this.prisma.aIInsight.create({
            data: {
              category: 'PROJECT',
              type: 'PREDICTION',
              title: `Projektgesundheit: ${score.projectName}`,
              description: score.healthAssessment,
              severity: score.healthScore < 0.5 ? 'HIGH' : score.healthScore < 0.7 ? 'MEDIUM' : 'LOW',
              data: score.factors || {},
              confidence: score.confidence || 0.8,
              isActionable: score.healthScore < 0.7,
              tenantId: context.tenantId,
              resourceType: 'PROJECT',
              resourceId: score.projectId,
            }
          });
          insights.push(insight);

          // Create prediction for project completion
          if (score.completionPrediction) {
            const prediction = await this.prisma.aIPrediction.create({
              data: {
                predictionType: 'PROJECT_COMPLETION',
                targetDate: new Date(score.completionPrediction.date),
                predictedValue: score.completionPrediction.probability,
                confidence: score.confidence || 0.8,
                modelData: score.factors || {},
                tenantId: context.tenantId,
                resourceType: 'PROJECT',
                resourceId: score.projectId,
              }
            });
            predictions.push(prediction);
          }
        }
      }

      return {
        healthScores: healthAnalysis.healthScores || [],
        insights,
        predictions
      };
    } catch (error) {
      console.error('Project Health Prediction Error:', error);
      return { healthScores: [], insights: [], predictions: [] };
    }
  }

  private async optimizeTaskPriorities(data: any, context: AIContext): Promise<any> {
    try {
      const prioritization = await this.llmService.optimizeWorkflow(
        {
          tasks: data.tasks,
          projects: data.projects,
          deadlines: data.milestones
        },
        {
          goal: 'TASK_PRIORITIZATION',
          constraints: ['DEADLINE_IMPACT', 'RESOURCE_AVAILABILITY', 'DEPENDENCY_ORDER']
        }
      );

      // Update task priorities based on AI recommendations
      if (prioritization.taskPriorities) {
        for (const taskPriority of prioritization.taskPriorities) {
          if (taskPriority.taskId && taskPriority.priority) {
            await this.prisma.task.update({
              where: { id: taskPriority.taskId },
              data: { 
                priority: taskPriority.priority.toUpperCase() as any
              }
            });
          }
        }
      }

      return prioritization;
    } catch (error) {
      console.error('Task Prioritization Error:', error);
      return { taskPriorities: [] };
    }
  }

  // AI-powered project planning assistant
  async generateProjectPlan(projectRequirements: any, context: AIContext): Promise<any> {
    try {
      const plan = await this.llmService.optimizeWorkflow(
        projectRequirements,
        {
          goal: 'PROJECT_PLANNING',
          constraints: ['RESOURCE_CONSTRAINTS', 'TIMELINE_REQUIREMENTS', 'SKILL_REQUIREMENTS']
        }
      );

      return plan;
    } catch (error) {
      console.error('Project Planning Error:', error);
      throw error;
    }
  }

  // Intelligent task assignment based on team member skills and availability
  async optimizeTaskAssignment(projectId: string, context: AIContext): Promise<any> {
    try {
      const projectData = await this.gatherProjectData(context.tenantId, projectId);
      
      const assignment = await this.llmService.optimizeWorkflow(
        {
          tasks: projectData.tasks.filter((t: any) => !t.assigneeId),
          members: projectData.projectMembers,
          workload: projectData.timesheets
        },
        {
          goal: 'TASK_ASSIGNMENT',
          constraints: ['SKILL_MATCHING', 'WORKLOAD_BALANCE', 'AVAILABILITY']
        }
      );

      return assignment;
    } catch (error) {
      console.error('Task Assignment Error:', error);
      throw error;
    }
  }
}

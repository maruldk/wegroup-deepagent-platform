
import { PrismaClient, Project, ProjectStatus, Task, TaskStatus, TaskPriority, ProjectTemplate, ProjectMember, ProjectResourceAllocation, ProjectRisk, RiskLevel, RiskStatus } from '@prisma/client';

const db = new PrismaClient();

export interface CreateProjectData {
  name: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  managerId: string;
  tenantId: string;
  templateId?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  managerId?: string;
}

export interface ProjectWithDetails extends Project {
  manager: {
    id: string;
    name: string | null;
    email: string;
  };
  members: (ProjectMember & {
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  })[];
  tasks: Task[];
  _count: {
    tasks: number;
    members: number;
    milestones: number;
  };
}

export interface CreateProjectTemplateData {
  name: string;
  description?: string;
  category: string;
  estimatedDuration?: number;
  defaultBudget?: number;
  config?: any;
  tenantId: string;
  createdBy: string;
  taskTemplates?: {
    name: string;
    description?: string;
    estimatedHours?: number;
    priority: TaskPriority;
    assigneeRole?: string;
    dependencies?: string[];
    orderIndex?: number;
  }[];
}

export class ProjectManagementService {
  /**
   * Create a new project
   */
  static async createProject(data: CreateProjectData): Promise<Project> {
    try {
      // If template is provided, use it to populate default values
      if (data.templateId) {
        const template = await db.projectTemplate.findUnique({
          where: { id: data.templateId },
          include: { taskTemplates: true },
        });

        if (template) {
          // Create project with template defaults
          const project = await db.project.create({
            data: {
              name: data.name,
              description: data.description || template.description,
              budget: data.budget || template.defaultBudget,
              startDate: data.startDate,
              endDate: data.endDate || (data.startDate && template.estimatedDuration 
                ? new Date(data.startDate.getTime() + template.estimatedDuration * 24 * 60 * 60 * 1000)
                : undefined),
              managerId: data.managerId,
              tenantId: data.tenantId,
            },
          });

          // Create tasks from template
          if (template.taskTemplates?.length > 0) {
            const taskPromises = template.taskTemplates.map((taskTemplate) =>
              db.task.create({
                data: {
                  name: taskTemplate.name,
                  description: taskTemplate.description,
                  estimatedHours: taskTemplate.estimatedHours,
                  priority: taskTemplate.priority,
                  projectId: project.id,
                  tenantId: data.tenantId,
                },
              })
            );
            await Promise.all(taskPromises);
          }

          return project;
        }
      }

      // Create project without template
      return await db.project.create({
        data: {
          name: data.name,
          description: data.description,
          startDate: data.startDate,
          endDate: data.endDate,
          budget: data.budget,
          managerId: data.managerId,
          tenantId: data.tenantId,
        },
      });
    } catch (error) {
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get project by ID with details
   */
  static async getProjectById(id: string, tenantId: string): Promise<ProjectWithDetails | null> {
    try {
      return await db.project.findFirst({
        where: { id, tenantId },
        include: {
          manager: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          tasks: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
          _count: {
            select: {
              tasks: true,
              members: true,
              milestones: true,
            },
          },
        },
      }) as ProjectWithDetails | null;
    } catch (error) {
      throw new Error(`Failed to get project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get all projects for a tenant
   */
  static async getProjects(tenantId: string, options?: {
    status?: ProjectStatus;
    managerId?: string;
    limit?: number;
    offset?: number;
  }): Promise<ProjectWithDetails[]> {
    try {
      const where: any = { tenantId };
      
      if (options?.status) {
        where.status = options.status;
      }
      
      if (options?.managerId) {
        where.managerId = options.managerId;
      }

      return await db.project.findMany({
        where,
        include: {
          manager: {
            select: { id: true, name: true, email: true },
          },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          tasks: {
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          _count: {
            select: {
              tasks: true,
              members: true,
              milestones: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }) as ProjectWithDetails[];
    } catch (error) {
      throw new Error(`Failed to get projects: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update project
   */
  static async updateProject(id: string, tenantId: string, data: UpdateProjectData): Promise<Project> {
    try {
      return await db.project.update({
        where: { id, tenantId },
        data,
      });
    } catch (error) {
      throw new Error(`Failed to update project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete project
   */
  static async deleteProject(id: string, tenantId: string): Promise<void> {
    try {
      await db.project.delete({
        where: { id, tenantId },
      });
    } catch (error) {
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add member to project
   */
  static async addProjectMember(projectId: string, userId: string, role: string, tenantId: string): Promise<ProjectMember> {
    try {
      return await db.projectMember.create({
        data: {
          projectId,
          userId,
          role,
          tenantId,
        },
      });
    } catch (error) {
      throw new Error(`Failed to add project member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove member from project
   */
  static async removeProjectMember(projectId: string, userId: string, tenantId: string): Promise<void> {
    try {
      await db.projectMember.deleteMany({
        where: { projectId, userId, tenantId },
      });
    } catch (error) {
      throw new Error(`Failed to remove project member: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get project analytics
   */
  static async getProjectAnalytics(projectId: string, tenantId: string) {
    try {
      // Get project basic info
      const project = await db.project.findFirst({
        where: { id: projectId, tenantId },
        include: {
          tasks: true,
          members: true,
          expenses: true,
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // Calculate task statistics
      const totalTasks = project.tasks?.length || 0;
      const completedTasks = project.tasks?.filter(task => task.status === TaskStatus.DONE)?.length || 0;
      const inProgressTasks = project.tasks?.filter(task => task.status === TaskStatus.IN_PROGRESS)?.length || 0;
      const todoTasks = project.tasks?.filter(task => task.status === TaskStatus.TODO)?.length || 0;

      // Calculate budget usage
      const totalExpenses = project.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
      const budgetUsagePercentage = project.budget ? (totalExpenses / project.budget) * 100 : 0;

      // Calculate progress percentage
      const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      // Calculate estimated completion date based on current velocity
      let estimatedCompletion: Date | null = null;
      if (inProgressTasks + todoTasks > 0 && completedTasks > 0) {
        const daysElapsed = project.startDate 
          ? Math.ceil((new Date().getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        if (daysElapsed > 0) {
          const tasksPerDay = completedTasks / daysElapsed;
          const remainingDays = Math.ceil((inProgressTasks + todoTasks) / tasksPerDay);
          estimatedCompletion = new Date(Date.now() + remainingDays * 24 * 60 * 60 * 1000);
        }
      }

      return {
        project: {
          id: project.id,
          name: project.name,
          status: project.status,
          startDate: project.startDate,
          endDate: project.endDate,
          budget: project.budget,
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          inProgress: inProgressTasks,
          todo: todoTasks,
          progressPercentage,
        },
        budget: {
          allocated: project.budget || 0,
          spent: totalExpenses,
          remaining: (project.budget || 0) - totalExpenses,
          usagePercentage: budgetUsagePercentage,
        },
        team: {
          totalMembers: project.members?.length || 0,
        },
        timeline: {
          estimatedCompletion,
          daysUntilDeadline: project.endDate 
            ? Math.ceil((project.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
            : null,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get project analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create project template
   */
  static async createProjectTemplate(data: CreateProjectTemplateData): Promise<ProjectTemplate> {
    try {
      return await db.projectTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          estimatedDuration: data.estimatedDuration,
          defaultBudget: data.defaultBudget,
          config: data.config || {},
          tenantId: data.tenantId,
          createdBy: data.createdBy,
          taskTemplates: data.taskTemplates ? {
            create: data.taskTemplates.map((task, index) => ({
              name: task.name,
              description: task.description,
              estimatedHours: task.estimatedHours,
              priority: task.priority,
              assigneeRole: task.assigneeRole,
              dependencies: task.dependencies || [],
              orderIndex: task.orderIndex ?? index,
            })),
          } : undefined,
        },
        include: {
          taskTemplates: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to create project template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get project templates
   */
  static async getProjectTemplates(tenantId: string, category?: string): Promise<ProjectTemplate[]> {
    try {
      const where: any = { 
        OR: [
          { tenantId },
          { isPublic: true },
        ],
      };
      
      if (category) {
        where.category = category;
      }

      return await db.projectTemplate.findMany({
        where,
        include: {
          taskTemplates: true,
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to get project templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create resource allocation
   */
  static async createResourceAllocation(data: {
    projectId: string;
    userId: string;
    allocatedHours: number;
    startDate: Date;
    endDate?: Date;
    role?: string;
    hourlyRate?: number;
    tenantId: string;
  }): Promise<ProjectResourceAllocation> {
    try {
      return await db.projectResourceAllocation.create({
        data,
      });
    } catch (error) {
      throw new Error(`Failed to create resource allocation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get resource allocations for project
   */
  static async getProjectResourceAllocations(projectId: string, tenantId: string): Promise<ProjectResourceAllocation[]> {
    try {
      return await db.projectResourceAllocation.findMany({
        where: { projectId, tenantId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { startDate: 'asc' },
      });
    } catch (error) {
      throw new Error(`Failed to get resource allocations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create project risk
   */
  static async createProjectRisk(data: {
    projectId: string;
    title: string;
    description: string;
    probability: RiskLevel;
    impact: RiskLevel;
    mitigation?: string;
    owner?: string;
    tenantId: string;
  }): Promise<ProjectRisk> {
    try {
      // Calculate risk score (1-9 scale)
      const probabilityScore = this.getRiskLevelScore(data.probability);
      const impactScore = this.getRiskLevelScore(data.impact);
      const riskScore = probabilityScore * impactScore;

      return await db.projectRisk.create({
        data: {
          ...data,
          riskScore,
        },
      });
    } catch (error) {
      throw new Error(`Failed to create project risk: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get project risks
   */
  static async getProjectRisks(projectId: string, tenantId: string): Promise<ProjectRisk[]> {
    try {
      return await db.projectRisk.findMany({
        where: { projectId, tenantId },
        include: {
          ownerUser: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { riskScore: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to get project risks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update risk status
   */
  static async updateRiskStatus(riskId: string, status: RiskStatus, tenantId: string): Promise<ProjectRisk> {
    try {
      return await db.projectRisk.update({
        where: { id: riskId, tenantId },
        data: { status },
      });
    } catch (error) {
      throw new Error(`Failed to update risk status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper method to convert risk level to numeric score
  private static getRiskLevelScore(level: RiskLevel): number {
    switch (level) {
      case RiskLevel.LOW: return 1;
      case RiskLevel.MEDIUM: return 2;
      case RiskLevel.HIGH: return 3;
      case RiskLevel.CRITICAL: return 4;
      default: return 1;
    }
  }
}


// @ts-nocheck
import { PrismaClient, Task, TaskStatus, TaskPriority, TaskComment, TaskDependency, DependencyType, TaskTimeLog } from '@prisma/client';

const db = new PrismaClient();

export interface CreateTaskData {
  name: string;
  description?: string;
  projectId: string;
  assigneeId?: string;
  priority?: TaskPriority;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  parentTaskId?: string;
  tenantId: string;
}

export interface UpdateTaskData {
  name?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  startDate?: Date;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  parentTaskId?: string;
}

export interface TaskWithDetails extends Task {
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  project: {
    id: string;
    name: string;
  };
  parentTask?: {
    id: string;
    name: string;
  } | null;
  subtasks: Task[];
  taskComments: (TaskComment & {
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  })[];
  taskDependencies: (TaskDependency & {
    dependsOnTask: {
      id: string;
      name: string;
      status: TaskStatus;
    };
  })[];
  taskDependents: (TaskDependency & {
    task: {
      id: string;
      name: string;
      status: TaskStatus;
    };
  })[];
  _count: {
    subtasks: number;
    taskComments: number;
  };
}

export interface CreateTaskCommentData {
  taskId: string;
  userId: string;
  content: string;
  isInternal?: boolean;
  tenantId: string;
}

export interface CreateTaskDependencyData {
  taskId: string;
  dependsOnTaskId: string;
  dependencyType?: DependencyType;
  lag?: number;
  tenantId: string;
}

export interface TaskTimeEntry {
  taskId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  description?: string;
  tenantId: string;
}

export class TaskManagementService {
  /**
   * Create a new task
   */
  static async createTask(data: CreateTaskData): Promise<Task> {
    try {
      return await db.task.create({
        data: {
          name: data.name,
          description: data.description,
          projectId: data.projectId,
          assigneeId: data.assigneeId,
          priority: data.priority || TaskPriority.MEDIUM,
          startDate: data.startDate,
          dueDate: data.dueDate,
          estimatedHours: data.estimatedHours,
          parentTaskId: data.parentTaskId,
          tenantId: data.tenantId,
        },
      });
    } catch (error) {
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get task by ID with details
   */
  static async getTaskById(id: string, tenantId: string): Promise<TaskWithDetails | null> {
    try {
      return await db.task.findFirst({
        where: { id, tenantId },
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
          project: {
            select: { id: true, name: true },
          },
          parentTask: {
            select: { id: true, name: true },
          },
          subtasks: {
            orderBy: { createdAt: 'asc' },
          },
          taskComments: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          taskDependencies: {
            include: {
              dependsOnTask: {
                select: { id: true, name: true, status: true },
              },
            },
          },
          taskDependents: {
            include: {
              task: {
                select: { id: true, name: true, status: true },
              },
            },
          },
          _count: {
            select: {
              subtasks: true,
              taskComments: true,
            },
          },
        },
      }) as TaskWithDetails | null;
    } catch (error) {
      throw new Error(`Failed to get task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get tasks with filters
   */
  static async getTasks(tenantId: string, options?: {
    projectId?: string;
    assigneeId?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    parentTaskId?: string | null;
    dueDateBefore?: Date;
    dueDateAfter?: Date;
    limit?: number;
    offset?: number;
  }): Promise<TaskWithDetails[]> {
    try {
      const where: any = { tenantId };
      
      if (options?.projectId) {
        where.projectId = options.projectId;
      }
      
      if (options?.assigneeId) {
        where.assigneeId = options.assigneeId;
      }
      
      if (options?.status) {
        where.status = options.status;
      }
      
      if (options?.priority) {
        where.priority = options.priority;
      }
      
      if (options?.parentTaskId !== undefined) {
        where.parentTaskId = options.parentTaskId;
      }
      
      if (options?.dueDateBefore || options?.dueDateAfter) {
        where.dueDate = {};
        if (options.dueDateBefore) {
          where.dueDate.lte = options.dueDateBefore;
        }
        if (options.dueDateAfter) {
          where.dueDate.gte = options.dueDateAfter;
        }
      }

      return await db.task.findMany({
        where,
        include: {
          assignee: {
            select: { id: true, name: true, email: true },
          },
          project: {
            select: { id: true, name: true },
          },
          parentTask: {
            select: { id: true, name: true },
          },
          subtasks: true,
          taskComments: {
            include: {
              user: {
                select: { id: true, name: true, email: true },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
          taskDependencies: {
            include: {
              dependsOnTask: {
                select: { id: true, name: true, status: true },
              },
            },
          },
          taskDependents: {
            include: {
              task: {
                select: { id: true, name: true, status: true },
              },
            },
          },
          _count: {
            select: {
              subtasks: true,
              taskComments: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }) as TaskWithDetails[];
    } catch (error) {
      throw new Error(`Failed to get tasks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update task
   */
  static async updateTask(id: string, tenantId: string, data: UpdateTaskData): Promise<Task> {
    try {
      return await db.task.update({
        where: { id, tenantId },
        data,
      });
    } catch (error) {
      throw new Error(`Failed to update task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete task
   */
  static async deleteTask(id: string, tenantId: string): Promise<void> {
    try {
      await db.task.delete({
        where: { id, tenantId },
      });
    } catch (error) {
      throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Assign task to user
   */
  static async assignTask(taskId: string, assigneeId: string, tenantId: string): Promise<Task> {
    try {
      return await db.task.update({
        where: { id: taskId, tenantId },
        data: { assigneeId },
      });
    } catch (error) {
      throw new Error(`Failed to assign task: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update task status
   */
  static async updateTaskStatus(taskId: string, status: TaskStatus, tenantId: string): Promise<Task> {
    try {
      const updateData: any = { status };
      
      // If marking as done, update actual hours if not set
      if (status === TaskStatus.DONE) {
        const task = await db.task.findFirst({
          where: { id: taskId, tenantId },
          include: { taskTimeLogs: true },
        });
        
        if (task && !task.actualHours && task.taskTimeLogs?.length > 0) {
          const totalHours = task.taskTimeLogs.reduce((sum, log) => {
            if (log.endTime) {
              const hours = (log.endTime.getTime() - log.startTime.getTime()) / (1000 * 60 * 60);
              return sum + hours;
            }
            return sum;
          }, 0);
          
          updateData.actualHours = totalHours;
        }
      }

      return await db.task.update({
        where: { id: taskId, tenantId },
        data: updateData,
      });
    } catch (error) {
      throw new Error(`Failed to update task status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add comment to task
   */
  static async addTaskComment(data: CreateTaskCommentData): Promise<TaskComment> {
    try {
      return await db.taskComment.create({
        data: {
          taskId: data.taskId,
          userId: data.userId,
          content: data.content,
          isInternal: data.isInternal || false,
          tenantId: data.tenantId,
        },
      });
    } catch (error) {
      throw new Error(`Failed to add task comment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get task comments
   */
  static async getTaskComments(taskId: string, tenantId: string, includeInternal: boolean = true): Promise<TaskComment[]> {
    try {
      const where: any = { taskId, tenantId };
      
      if (!includeInternal) {
        where.isInternal = false;
      }

      return await db.taskComment.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to get task comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Add task dependency
   */
  static async addTaskDependency(data: CreateTaskDependencyData): Promise<TaskDependency> {
    try {
      // Check if dependency would create a cycle
      const wouldCreateCycle = await this.checkDependencyCycle(data.dependsOnTaskId, data.taskId, data.tenantId);
      if (wouldCreateCycle) {
        throw new Error('Cannot create dependency: would create a circular dependency');
      }

      return await db.taskDependency.create({
        data: {
          taskId: data.taskId,
          dependsOnTaskId: data.dependsOnTaskId,
          dependencyType: data.dependencyType || DependencyType.FINISH_TO_START,
          lag: data.lag || 0,
          tenantId: data.tenantId,
        },
      });
    } catch (error) {
      throw new Error(`Failed to add task dependency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Remove task dependency
   */
  static async removeTaskDependency(taskId: string, dependsOnTaskId: string, tenantId: string): Promise<void> {
    try {
      await db.taskDependency.deleteMany({
        where: { taskId, dependsOnTaskId, tenantId },
      });
    } catch (error) {
      throw new Error(`Failed to remove task dependency: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start time tracking for task
   */
  static async startTimeTracking(data: TaskTimeEntry): Promise<TaskTimeLog> {
    try {
      // Check if user already has an active time entry
      const activeEntry = await db.taskTimeLog.findFirst({
        where: {
          userId: data.userId,
          tenantId: data.tenantId,
          endTime: null,
        },
      });

      if (activeEntry) {
        throw new Error('User already has an active time tracking session');
      }

      return await db.taskTimeLog.create({
        data: {
          taskId: data.taskId,
          userId: data.userId,
          startTime: data.startTime,
          description: data.description,
          tenantId: data.tenantId,
        },
      });
    } catch (error) {
      throw new Error(`Failed to start time tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Stop time tracking for task
   */
  static async stopTimeTracking(timeLogId: string, endTime: Date, tenantId: string): Promise<TaskTimeLog> {
    try {
      return await db.taskTimeLog.update({
        where: { id: timeLogId, tenantId },
        data: { endTime },
      });
    } catch (error) {
      throw new Error(`Failed to stop time tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get time logs for task
   */
  static async getTaskTimeLogs(taskId: string, tenantId: string): Promise<TaskTimeLog[]> {
    try {
      return await db.taskTimeLog.findMany({
        where: { taskId, tenantId },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { startTime: 'desc' },
      });
    } catch (error) {
      throw new Error(`Failed to get task time logs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's active time tracking session
   */
  static async getActiveTimeTracking(userId: string, tenantId: string): Promise<TaskTimeLog | null> {
    try {
      return await db.taskTimeLog.findFirst({
        where: {
          userId,
          tenantId,
          endTime: null,
        },
        include: {
          task: {
            select: { id: true, name: true, projectId: true },
          },
        },
      });
    } catch (error) {
      throw new Error(`Failed to get active time tracking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get task analytics
   */
  static async getTaskAnalytics(projectId: string, tenantId: string) {
    try {
      const tasks = await db.task.findMany({
        where: { projectId, tenantId },
        include: {
          taskTimeLogs: true,
        },
      });

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.status === TaskStatus.DONE).length;
      const inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
      const todoTasks = tasks.filter(task => task.status === TaskStatus.TODO).length;
      const blockedTasks = tasks.filter(task => task.status === TaskStatus.REVIEW).length;

      // Calculate estimated vs actual hours
      const totalEstimatedHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 0), 0);
      const totalActualHours = tasks.reduce((sum, task) => {
        if (task.actualHours) return sum + task.actualHours;
        
        // Calculate from time logs if actual hours not set
        const timeLogHours = task.taskTimeLogs?.reduce((logSum, log) => {
          if (log.endTime) {
            const hours = (log.endTime.getTime() - log.startTime.getTime()) / (1000 * 60 * 60);
            return logSum + hours;
          }
          return logSum;
        }, 0) || 0;
        
        return sum + timeLogHours;
      }, 0);

      // Priority breakdown
      const priorityBreakdown = {
        urgent: tasks.filter(task => task.priority === TaskPriority.URGENT).length,
        high: tasks.filter(task => task.priority === TaskPriority.HIGH).length,
        medium: tasks.filter(task => task.priority === TaskPriority.MEDIUM).length,
        low: tasks.filter(task => task.priority === TaskPriority.LOW).length,
      };

      // Overdue tasks
      const now = new Date();
      const overdueTasks = tasks.filter(task => 
        task.dueDate && 
        task.dueDate < now && 
        task.status !== TaskStatus.DONE
      ).length;

      // Average completion time for completed tasks
      const completedTasksWithTimes = tasks.filter(task => 
        task.status === TaskStatus.DONE && 
        task.createdAt && 
        task.updatedAt
      );
      
      const avgCompletionTime = completedTasksWithTimes.length > 0
        ? completedTasksWithTimes.reduce((sum, task) => {
            const completionTime = task.updatedAt.getTime() - task.createdAt.getTime();
            return sum + completionTime;
          }, 0) / completedTasksWithTimes.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      return {
        overview: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          todoTasks,
          blockedTasks,
          overdueTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
        },
        timeTracking: {
          totalEstimatedHours,
          totalActualHours,
          hoursVariance: totalActualHours - totalEstimatedHours,
          hoursVariancePercentage: totalEstimatedHours > 0 
            ? ((totalActualHours - totalEstimatedHours) / totalEstimatedHours) * 100 
            : 0,
          avgCompletionTimeDays: avgCompletionTime,
        },
        priorityBreakdown,
        performance: {
          onTimeCompletionRate: completedTasksWithTimes.length > 0
            ? (completedTasksWithTimes.filter(task => 
                !task.dueDate || task.updatedAt <= task.dueDate
              ).length / completedTasksWithTimes.length) * 100
            : 0,
        },
      };
    } catch (error) {
      throw new Error(`Failed to get task analytics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if adding a dependency would create a cycle
   */
  private static async checkDependencyCycle(
    startTaskId: string, 
    targetTaskId: string, 
    tenantId: string, 
    visited: Set<string> = new Set()
  ): Promise<boolean> {
    if (startTaskId === targetTaskId) {
      return true;
    }

    if (visited.has(startTaskId)) {
      return false;
    }

    visited.add(startTaskId);

    const dependencies = await db.taskDependency.findMany({
      where: { taskId: startTaskId, tenantId },
      select: { dependsOnTaskId: true },
    });

    for (const dep of dependencies) {
      if (await this.checkDependencyCycle(dep.dependsOnTaskId, targetTaskId, tenantId, visited)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get task kanban board data
   */
  static async getKanbanBoardData(projectId: string, tenantId: string) {
    try {
      const tasks = await this.getTasks(tenantId, { 
        projectId, 
        parentTaskId: null, // Only get top-level tasks
        limit: 200 
      });

      return {
        todo: tasks.filter(task => task.status === TaskStatus.TODO),
        inProgress: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS),
        review: tasks.filter(task => task.status === TaskStatus.REVIEW),
        done: tasks.filter(task => task.status === TaskStatus.DONE),
      };
    } catch (error) {
      throw new Error(`Failed to get kanban board data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

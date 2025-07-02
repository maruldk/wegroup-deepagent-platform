// @ts-nocheck
import { PrismaClient, ProjectActivity, ActivityType, ProjectFile, RealTimeNotification, NotificationType } from '@prisma/client';

const db = new PrismaClient();

export interface CreateActivityData {
  projectId: string;
  userId?: string;
  activityType: ActivityType;
  description: string;
  metadata?: any;
  entityType?: string;
  entityId?: string;
  tenantId: string;
}

export interface UploadFileData {
  projectId: string;
  name: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  tenantId: string;
}

export interface CreateNotificationData {
  userId?: string; // null for broadcast notifications
  title: string;
  message: string;
  type: NotificationType;
  data?: any;
  isPersistent?: boolean;
  channel?: string;
  expiresAt?: Date;
  tenantId: string;
}

export interface ActivityWithDetails extends ProjectActivity {
  user?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  project: {
    id: string;
    name: string;
  };
}

export interface FileWithDetails extends ProjectFile {
  uploadedByUser: {
    id: string;
    name: string | null;
    email: string;
  };
  project: {
    id: string;
    name: string;
  };
}

export class TeamCollaborationService {
  /**
   * Create project activity log entry
   */
  static async createActivity(data: CreateActivityData): Promise<ProjectActivity> {
    try {
      return await db.projectActivity.create({
        data: {
          projectId: data.projectId,
          userId: data.userId,
          activityType: data.activityType,
          description: data.description,
          metadata: data.metadata || {},
          entityType: data.entityType,
          entityId: data.entityId,
          tenantId: data.tenantId,
        },
      });
    } catch (error) {
      throw new Error(`Failed to create activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get project activity feed
   */
  static async getProjectActivityFeed(projectId: string, tenantId: string, options?: {
    limit?: number;
    offset?: number;
    activityTypes?: ActivityType[];
    startDate?: Date;
    endDate?: Date;
  }): Promise<ActivityWithDetails[]> {
    try {
      const where: any = { projectId, tenantId };
      
      if (options?.activityTypes?.length) {
        where.activityType = { in: options.activityTypes };
      }
      
      if (options?.startDate || options?.endDate) {
        where.createdAt = {};
        if (options.startDate) {
          where.createdAt.gte = options.startDate;
        }
        if (options.endDate) {
          where.createdAt.lte = options.endDate;
        }
      }

      return await db.projectActivity.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          project: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }) as ActivityWithDetails[];
    } catch (error) {
      throw new Error(`Failed to get activity feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user activity across all projects
   */
  static async getUserActivityFeed(userId: string, tenantId: string, options?: {
    limit?: number;
    offset?: number;
    projectIds?: string[];
  }): Promise<ActivityWithDetails[]> {
    try {
      const where: any = { userId, tenantId };
      
      if (options?.projectIds?.length) {
        where.projectId = { in: options.projectIds };
      }

      return await db.projectActivity.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          project: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }) as ActivityWithDetails[];
    } catch (error) {
      throw new Error(`Failed to get user activity feed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload file to project
   */
  static async uploadProjectFile(data: UploadFileData): Promise<ProjectFile> {
    try {
      const file = await db.projectFile.create({
        data: {
          projectId: data.projectId,
          name: data.name,
          originalName: data.originalName,
          fileType: data.fileType,
          fileSize: data.fileSize,
          fileUrl: data.fileUrl,
          uploadedBy: data.uploadedBy,
          tenantId: data.tenantId,
        },
      });

      // Create activity log entry
      await this.createActivity({
        projectId: data.projectId,
        userId: data.uploadedBy,
        activityType: ActivityType.FILE_UPLOADED,
        description: `Uploaded file: ${data.originalName}`,
        metadata: { 
          fileId: file.id, 
          fileName: data.originalName, 
          fileType: data.fileType,
          fileSize: data.fileSize 
        },
        entityType: 'FILE',
        entityId: file.id,
        tenantId: data.tenantId,
      });

      return file;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get project files
   */
  static async getProjectFiles(projectId: string, tenantId: string, options?: {
    fileType?: string;
    limit?: number;
    offset?: number;
  }): Promise<FileWithDetails[]> {
    try {
      const where: any = { projectId, tenantId };
      
      if (options?.fileType) {
        where.fileType = options.fileType;
      }

      return await db.projectFile.findMany({
        where,
        include: {
          uploadedByUser: {
            select: { id: true, name: true, email: true },
          },
          project: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }) as FileWithDetails[];
    } catch (error) {
      throw new Error(`Failed to get project files: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete project file
   */
  static async deleteProjectFile(fileId: string, userId: string, tenantId: string): Promise<void> {
    try {
      const file = await db.projectFile.findFirst({
        where: { id: fileId, tenantId },
        include: { project: true },
      });

      if (!file) {
        throw new Error('File not found');
      }

      await db.projectFile.delete({
        where: { id: fileId, tenantId },
      });

      // Create activity log entry
      await this.createActivity({
        projectId: file.projectId,
        userId: userId,
        activityType: ActivityType.FILE_DELETED,
        description: `Deleted file: ${file.originalName}`,
        metadata: { 
          fileName: file.originalName, 
          fileType: file.fileType 
        },
        entityType: 'FILE',
        entityId: fileId,
        tenantId,
      });
    } catch (error) {
      throw new Error(`Failed to delete file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create notification
   */
  static async createNotification(data: CreateNotificationData): Promise<RealTimeNotification> {
    try {
      return await db.realTimeNotification.create({
        data: {
          userId: data.userId,
          title: data.title,
          message: data.message,
          type: data.type,
          data: data.data || {},
          isPersistent: data.isPersistent || true,
          channel: data.channel,
          expiresAt: data.expiresAt,
          tenantId: data.tenantId,
        },
      });
    } catch (error) {
      throw new Error(`Failed to create notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send project notification to all members
   */
  static async sendProjectNotification(
    projectId: string, 
    title: string, 
    message: string, 
    type: NotificationType,
    tenantId: string,
    excludeUserId?: string,
    data?: any
  ): Promise<void> {
    try {
      // Get all project members
      const members = await db.projectMember.findMany({
        where: { projectId, tenantId },
        select: { userId: true },
      });

      // Create notifications for all members
      const notificationPromises = members
        .filter(member => member.userId !== excludeUserId)
        .map(member => 
          this.createNotification({
            userId: member.userId,
            title,
            message,
            type,
            data: { projectId, ...data },
            tenantId,
          })
        );

      await Promise.all(notificationPromises);
    } catch (error) {
      throw new Error(`Failed to send project notification: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user notifications
   */
  static async getUserNotifications(userId: string, tenantId: string, options?: {
    isRead?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<RealTimeNotification[]> {
    try {
      const where: any = { userId, tenantId };
      
      if (options?.isRead !== undefined) {
        where.isRead = options.isRead;
      }

      return await db.realTimeNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      });
    } catch (error) {
      throw new Error(`Failed to get user notifications: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark notification as read
   */
  static async markNotificationRead(notificationId: string, tenantId: string): Promise<void> {
    try {
      await db.realTimeNotification.update({
        where: { id: notificationId, tenantId },
        data: { isRead: true },
      });
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark all notifications as read for user
   */
  static async markAllNotificationsRead(userId: string, tenantId: string): Promise<void> {
    try {
      await db.realTimeNotification.updateMany({
        where: { userId, tenantId, isRead: false },
        data: { isRead: true },
      });
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get team collaboration statistics
   */
  static async getTeamCollaborationStats(projectId: string, tenantId: string, timeframe?: {
    startDate: Date;
    endDate: Date;
  }) {
    try {
      const where: any = { projectId, tenantId };
      
      if (timeframe) {
        where.createdAt = {
          gte: timeframe.startDate,
          lte: timeframe.endDate,
        };
      }

      // Get activity statistics
      const activities = await db.projectActivity.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
      });

      // Get file statistics
      const files = await db.projectFile.findMany({
        where: timeframe ? {
          projectId,
          tenantId,
          createdAt: {
            gte: timeframe.startDate,
            lte: timeframe.endDate,
          },
        } : { projectId, tenantId },
        include: {
          uploadedByUser: {
            select: { id: true, name: true },
          },
        },
      });

      // Calculate activity breakdown by type
      const activityBreakdown = activities.reduce((acc, activity) => {
        acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate user activity levels
      const userActivityLevels = activities.reduce((acc, activity) => {
        if (activity.userId) {
          const userName = activity.user?.name || 'Unknown User';
          acc[userName] = (acc[userName] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Calculate file type breakdown
      const fileTypeBreakdown = files.reduce((acc, file) => {
        acc[file.fileType] = (acc[file.fileType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Calculate daily activity (for last 7 days if no timeframe specified)
      const activityDate = timeframe?.startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const dailyActivity = activities.reduce((acc, activity) => {
        const date = activity.createdAt.toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        overview: {
          totalActivities: activities.length,
          totalFiles: files.length,
          activeUsers: Object.keys(userActivityLevels).length,
          totalFileSize: files.reduce((sum, file) => sum + file.fileSize, 0),
        },
        activityBreakdown,
        userActivityLevels,
        fileTypeBreakdown,
        dailyActivity,
        recentActivities: activities.slice(0, 10).map(activity => ({
          type: activity.activityType,
          description: activity.description,
          user: activity.user?.name || 'System',
          createdAt: activity.createdAt,
        })),
      };
    } catch (error) {
      throw new Error(`Failed to get team collaboration stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get project communication summary
   */
  static async getProjectCommunicationSummary(projectId: string, tenantId: string) {
    try {
      // Get task comments count
      const taskComments = await db.taskComment.count({
        where: {
          tenantId,
          task: {
            projectId,
          },
        },
      });

      // Get recent activities
      const recentActivities = await this.getProjectActivityFeed(projectId, tenantId, { limit: 10 });

      // Get file sharing activity
      const recentFiles = await this.getProjectFiles(projectId, tenantId, { limit: 5 });

      // Get active discussions (tasks with recent comments)
      const activeTasks = await db.task.findMany({
        where: {
          projectId,
          tenantId,
          taskComments: {
            some: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
              },
            },
          },
        },
        include: {
          _count: {
            select: { taskComments: true },
          },
          taskComments: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              user: {
                select: { name: true },
              },
            },
          },
        },
        take: 5,
      });

      return {
        summary: {
          totalComments: taskComments,
          recentActivitiesCount: recentActivities.length,
          recentFilesCount: recentFiles.length,
          activeDiscussionsCount: activeTasks.length,
        },
        recentActivities: recentActivities.slice(0, 5),
        recentFiles: recentFiles.slice(0, 3),
        activeDiscussions: activeTasks.map(task => ({
          taskId: task.id,
          taskName: task.name,
          commentsCount: task._count.taskComments,
          lastComment: task.taskComments[0],
        })),
      };
    } catch (error) {
      throw new Error(`Failed to get communication summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

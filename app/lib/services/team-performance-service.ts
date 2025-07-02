
import { PrismaClient } from '@prisma/client';
import {
  TeamPerformanceCategory,
  InsightPriorityLevel
} from '@prisma/client';

const prisma = new PrismaClient();

export interface TeamMemberPerformance {
  userId: string;
  userName: string;
  productivityScore: number;
  qualityScore: number;
  collaborationScore: number;
  efficiencyScore: number;
  deliveryScore: number;
  overallScore: number;
  trends: {
    productivity: 'improving' | 'stable' | 'declining';
    quality: 'improving' | 'stable' | 'declining';
    collaboration: 'improving' | 'stable' | 'declining';
  };
  strengths: string[];
  improvementAreas: string[];
  workloadStatus: 'underutilized' | 'optimal' | 'overloaded';
  burnoutRisk: 'low' | 'medium' | 'high';
}

export interface TeamCollaborationAnalysis {
  overallScore: number;
  communicationScore: number;
  coordinationScore: number;
  knowledgeSharingScore: number;
  conflictResolutionScore: number;
  teamDynamics: {
    cohesion: number;
    diversity: number;
    leadership: number;
    autonomy: number;
  };
  collaborationPatterns: {
    pairings: Array<{ users: string[]; frequency: number; effectiveness: number }>;
    isolatedMembers: string[];
    communicationHubs: string[];
  };
  recommendations: string[];
}

export interface WorkloadDistribution {
  userId: string;
  userName: string;
  currentWorkload: number; // Hours per week
  capacity: number; // Available hours per week
  utilizationRate: number; // 0-1
  taskCount: number;
  avgTaskComplexity: number;
  skillMatch: number; // How well tasks match skills 0-1
  stress: number; // 0-1 stress indicator
}

export interface TeamProductivityMetrics {
  velocity: number;
  throughput: number;
  cycleTime: number;
  leadTime: number;
  qualityIndex: number;
  innovationIndex: number;
  teamSatisfaction: number;
  knowledgeSharing: number;
  crossTraining: number;
  mentoring: number;
}

export interface PerformanceReviewData {
  userId: string;
  period: string;
  performanceScore: number;
  productivityScore: number;
  qualityScore: number;
  collaborationScore: number;
  strengths: string[];
  improvementAreas: string[];
  goals: any;
  feedback: string;
  actionItems: any;
}

export interface SkillGapAnalysis {
  requiredSkills: Array<{ skill: string; importance: number; currentLevel: number; targetLevel: number }>;
  teamSkillMatrix: Array<{ userId: string; skills: Array<{ skill: string; level: number; certified: boolean }> }>;
  gaps: Array<{ skill: string; gap: number; priority: 'low' | 'medium' | 'high'; recommendedActions: string[] }>;
  trainingRecommendations: Array<{ userId: string; skills: string[]; priority: 'low' | 'medium' | 'high' }>;
  crossTrainingOpportunities: Array<{ mentor: string; mentee: string; skill: string; benefit: number }>;
}

export interface BurnoutRiskAssessment {
  userId: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number; // 0-100
  factors: {
    workload: number;
    workLifeBalance: number;
    jobSatisfaction: number;
    stress: number;
    supportSystem: number;
    growth: number;
  };
  indicators: string[];
  recommendations: string[];
  interventions: Array<{ action: string; priority: 'immediate' | 'short-term' | 'long-term' }>;
}

export class TeamPerformanceService {
  /**
   * Calculate comprehensive team member performance metrics
   */
  async calculateTeamMemberPerformance(
    userId: string,
    tenantId: string,
    period: string = 'MONTHLY',
    projectId?: string
  ): Promise<TeamMemberPerformance> {
    try {
      const startDate = this.getPeriodStartDate(period);
      const endDate = new Date();

      // Get user data and related metrics
      const user = await prisma.user.findUnique({
        where: { id: userId, tenantId },
        include: {
          assignedTasks: {
            where: {
              ...(projectId && { projectId }),
              updatedAt: { gte: startDate, lte: endDate }
            },
            include: {
              taskTimeLogs: true,
              taskComments: true,
              project: true
            }
          },
          timesheets: {
            where: {
              ...(projectId && { projectId }),
              date: { gte: startDate, lte: endDate }
            }
          },
          teamPerformanceMetrics: {
            where: {
              ...(projectId && { projectId }),
              startDate: { gte: startDate }
            }
          }
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Calculate individual performance scores
      const productivityScore = await this.calculateProductivityScore(user, startDate, endDate);
      const qualityScore = await this.calculateQualityScore(user, startDate, endDate);
      const collaborationScore = await this.calculateCollaborationScore(user, startDate, endDate);
      const efficiencyScore = await this.calculateEfficiencyScore(user, startDate, endDate);
      const deliveryScore = await this.calculateDeliveryScore(user, startDate, endDate);

      // Calculate overall score (weighted average)
      const overallScore = Math.round(
        (productivityScore * 0.25) +
        (qualityScore * 0.25) +
        (collaborationScore * 0.20) +
        (efficiencyScore * 0.15) +
        (deliveryScore * 0.15)
      );

      // Calculate trends
      const trends = await this.calculatePerformanceTrends(userId, tenantId, period, projectId);

      // Analyze strengths and improvement areas
      const { strengths, improvementAreas } = await this.analyzeStrengthsAndWeaknesses(user, {
        productivityScore,
        qualityScore,
        collaborationScore,
        efficiencyScore,
        deliveryScore
      });

      // Assess workload status
      const workloadStatus = await this.assessWorkloadStatus(userId, tenantId, projectId);

      // Assess burnout risk
      const burnoutRisk = await this.assessBurnoutRisk(userId, tenantId);

      const performance: TeamMemberPerformance = {
        userId,
        userName: user.name || 'Unknown',
        productivityScore,
        qualityScore,
        collaborationScore,
        efficiencyScore,
        deliveryScore,
        overallScore,
        trends,
        strengths,
        improvementAreas,
        workloadStatus,
        burnoutRisk
      };

      // Save performance metrics to database
      await this.savePerformanceMetrics(userId, tenantId, projectId, performance, period, startDate, endDate);

      return performance;
    } catch (error) {
      console.error('Error calculating team member performance:', error);
      throw error;
    }
  }

  /**
   * Analyze team collaboration effectiveness
   */
  async analyzeTeamCollaboration(
    userIds: string[],
    tenantId: string,
    period: string = 'MONTHLY',
    projectId?: string
  ): Promise<TeamCollaborationAnalysis> {
    try {
      const startDate = this.getPeriodStartDate(period);
      const endDate = new Date();

      // Get team interaction data
      const teamData = await this.getTeamInteractionData(userIds, tenantId, startDate, endDate, projectId);

      // Calculate collaboration scores
      const communicationScore = await this.calculateCommunicationScore(teamData);
      const coordinationScore = await this.calculateCoordinationScore(teamData);
      const knowledgeSharingScore = await this.calculateTeamKnowledgeSharingScore(teamData);
      const conflictResolutionScore = await this.calculateConflictResolutionScore(teamData);

      const overallScore = Math.round(
        (communicationScore * 0.3) +
        (coordinationScore * 0.3) +
        (knowledgeSharingScore * 0.2) +
        (conflictResolutionScore * 0.2)
      );

      // Analyze team dynamics
      const teamDynamics = await this.analyzeTeamDynamics(userIds, tenantId, startDate, endDate);

      // Identify collaboration patterns
      const collaborationPatterns = await this.identifyCollaborationPatterns(teamData);

      // Generate recommendations
      const recommendations = await this.generateCollaborationRecommendations(
        overallScore,
        { communicationScore, coordinationScore, knowledgeSharingScore, conflictResolutionScore },
        teamDynamics,
        collaborationPatterns
      );

      const analysis: TeamCollaborationAnalysis = {
        overallScore,
        communicationScore,
        coordinationScore,
        knowledgeSharingScore,
        conflictResolutionScore,
        teamDynamics,
        collaborationPatterns,
        recommendations
      };

      // Save collaboration score to database
      await prisma.teamCollaborationScore.create({
        data: {
          projectId,
          teamMemberIds: userIds,
          collaborationScore: overallScore,
          communicationScore,
          coordinationScore,
          knowledgeSharingScore,
          factors: analysis as any,
          period,
          startDate,
          endDate,
          tenantId
        }
      });

      return analysis;
    } catch (error) {
      console.error('Error analyzing team collaboration:', error);
      throw error;
    }
  }

  /**
   * Analyze workload distribution across team
   */
  async analyzeWorkloadDistribution(
    userIds: string[],
    tenantId: string,
    projectId?: string
  ): Promise<WorkloadDistribution[]> {
    try {
      const workloadData: WorkloadDistribution[] = [];
      const currentDate = new Date();
      const weekStart = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));

      for (const userId of userIds) {
        const user = await prisma.user.findUnique({
          where: { id: userId, tenantId },
          include: {
            assignedTasks: {
              where: {
                ...(projectId && { projectId }),
                status: { not: 'DONE' }
              },
              include: {
                taskTimeLogs: {
                  where: {
                    startTime: { gte: weekStart }
                  }
                }
              }
            },
            timesheets: {
              where: {
                ...(projectId && { projectId }),
                date: { gte: weekStart }
              }
            }
          }
        });

        if (!user) continue;

        // Calculate current workload (hours this week)
        const currentWorkload = user.timesheets?.reduce((total, timesheet) => total + timesheet.hours, 0) || 0;

        // Standard capacity (40 hours per week)
        const capacity = 40;

        // Calculate utilization rate
        const utilizationRate = Math.min(1, currentWorkload / capacity);

        // Count active tasks
        const taskCount = user.assignedTasks?.length || 0;

        // Calculate average task complexity (simplified)
        const avgTaskComplexity = this.calculateAvgTaskComplexity(user.assignedTasks || []);

        // Calculate skill match (how well tasks match user skills)
        const skillMatch = await this.calculateSkillMatch(userId, user.assignedTasks || [], tenantId);

        // Calculate stress indicator
        const stress = this.calculateStressIndicator(utilizationRate, taskCount, avgTaskComplexity);

        workloadData.push({
          userId,
          userName: user.name || 'Unknown',
          currentWorkload,
          capacity,
          utilizationRate,
          taskCount,
          avgTaskComplexity,
          skillMatch,
          stress
        });
      }

      return workloadData;
    } catch (error) {
      console.error('Error analyzing workload distribution:', error);
      throw error;
    }
  }

  /**
   * Calculate team productivity metrics
   */
  async calculateTeamProductivityMetrics(
    userIds: string[],
    tenantId: string,
    period: string = 'MONTHLY',
    projectId?: string
  ): Promise<TeamProductivityMetrics> {
    try {
      const startDate = this.getPeriodStartDate(period);
      const endDate = new Date();

      // Get team data
      const teamTasks = await prisma.task.findMany({
        where: {
          assigneeId: { in: userIds },
          tenantId,
          ...(projectId && { projectId }),
          updatedAt: { gte: startDate, lte: endDate }
        },
        include: {
          taskTimeLogs: true,
          taskComments: true
        }
      });

      const completedTasks = teamTasks.filter(task => task.status === 'DONE');

      // Calculate velocity (tasks completed per time period)
      const velocity = completedTasks.length;

      // Calculate throughput (stories/features completed)
      const throughput = completedTasks.filter(task => task.priority === 'HIGH' || task.priority === 'URGENT').length;

      // Calculate cycle time (time from start to completion)
      const cycleTime = this.calculateAverageCycleTime(completedTasks);

      // Calculate lead time (time from creation to completion)
      const leadTime = this.calculateAverageLeadTime(completedTasks);

      // Calculate quality index
      const qualityIndex = await this.calculateTeamQualityIndex(completedTasks, userIds, tenantId);

      // Calculate innovation index
      const innovationIndex = await this.calculateInnovationIndex(userIds, tenantId, startDate, endDate);

      // Calculate team satisfaction (simplified)
      const teamSatisfaction = await this.calculateTeamSatisfaction(userIds, tenantId);

      // Calculate knowledge sharing score
      const knowledgeSharing = await this.calculateKnowledgeSharingScore(userIds, tenantId, startDate, endDate);

      // Calculate cross-training score
      const crossTraining = await this.calculateCrossTrainingScore(userIds, tenantId);

      // Calculate mentoring score
      const mentoring = await this.calculateMentoringScore(userIds, tenantId, startDate, endDate);

      return {
        velocity,
        throughput,
        cycleTime,
        leadTime,
        qualityIndex,
        innovationIndex,
        teamSatisfaction,
        knowledgeSharing,
        crossTraining,
        mentoring
      };
    } catch (error) {
      console.error('Error calculating team productivity metrics:', error);
      throw error;
    }
  }

  /**
   * Conduct performance review
   */
  async conductPerformanceReview(
    userId: string,
    reviewerId: string,
    tenantId: string,
    period: string,
    projectId?: string
  ): Promise<PerformanceReviewData> {
    try {
      const performance = await this.calculateTeamMemberPerformance(userId, tenantId, period, projectId);
      
      // Generate AI-powered feedback
      const feedback = await this.generatePerformanceFeedback(performance);
      
      // Generate goals and action items
      const goals = await this.generatePerformanceGoals(performance);
      const actionItems = await this.generateActionItems(performance);

      const startDate = this.getPeriodStartDate(period);
      const endDate = new Date();

      const reviewData: PerformanceReviewData = {
        userId,
        period,
        performanceScore: performance.overallScore,
        productivityScore: performance.productivityScore,
        qualityScore: performance.qualityScore,
        collaborationScore: performance.collaborationScore,
        strengths: performance.strengths,
        improvementAreas: performance.improvementAreas,
        goals,
        feedback,
        actionItems
      };

      // Save performance review to database
      await prisma.teamPerformanceReview.create({
        data: {
          userId,
          reviewerId,
          projectId,
          period,
          startDate,
          endDate,
          performanceScore: reviewData.performanceScore,
          productivityScore: reviewData.productivityScore,
          qualityScore: reviewData.qualityScore,
          collaborationScore: reviewData.collaborationScore,
          strengths: reviewData.strengths,
          improvementAreas: reviewData.improvementAreas,
          goals: reviewData.goals,
          feedback: reviewData.feedback,
          actionItems: reviewData.actionItems,
          tenantId
        }
      });

      return reviewData;
    } catch (error) {
      console.error('Error conducting performance review:', error);
      throw error;
    }
  }

  /**
   * Analyze skill gaps in the team
   */
  async analyzeSkillGaps(
    userIds: string[],
    tenantId: string,
    projectId?: string
  ): Promise<SkillGapAnalysis> {
    try {
      // Get project requirements (simplified - in real implementation, this would be more sophisticated)
      const requiredSkills = await this.getProjectRequiredSkills(projectId, tenantId);
      
      // Get team skill matrix
      const teamSkillMatrix = await this.getTeamSkillMatrix(userIds, tenantId);
      
      // Identify gaps
      const gaps = this.identifySkillGaps(requiredSkills, teamSkillMatrix);
      
      // Generate training recommendations
      const trainingRecommendations = this.generateTrainingRecommendations(gaps, teamSkillMatrix);
      
      // Identify cross-training opportunities
      const crossTrainingOpportunities = this.identifyCrossTrainingOpportunities(teamSkillMatrix, gaps);

      return {
        requiredSkills,
        teamSkillMatrix,
        gaps,
        trainingRecommendations,
        crossTrainingOpportunities
      };
    } catch (error) {
      console.error('Error analyzing skill gaps:', error);
      throw error;
    }
  }

  /**
   * Assess burnout risk for team members
   */
  async assessBurnoutRiskForTeam(
    userIds: string[],
    tenantId: string
  ): Promise<BurnoutRiskAssessment[]> {
    try {
      const assessments: BurnoutRiskAssessment[] = [];

      for (const userId of userIds) {
        const assessment = await this.assessDetailedBurnoutRisk(userId, tenantId);
        assessments.push(assessment);
      }

      return assessments;
    } catch (error) {
      console.error('Error assessing burnout risk for team:', error);
      throw error;
    }
  }

  // Private helper methods

  private getPeriodStartDate(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'WEEKLY':
        return new Date(now.setDate(now.getDate() - 7));
      case 'MONTHLY':
        return new Date(now.setMonth(now.getMonth() - 1));
      case 'QUARTERLY':
        return new Date(now.setMonth(now.getMonth() - 3));
      case 'YEARLY':
        return new Date(now.setFullYear(now.getFullYear() - 1));
      default:
        return new Date(now.setMonth(now.getMonth() - 1));
    }
  }

  private async calculateProductivityScore(user: any, startDate: Date, endDate: Date): Promise<number> {
    const tasks = user.assignedTasks || [];
    const completedTasks = tasks.filter((task: any) => task.status === 'DONE');
    
    // Base productivity on task completion rate
    const completionRate = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 100;
    
    // Factor in time efficiency
    const totalHours = user.timesheets?.reduce((sum: number, ts: any) => sum + ts.hours, 0) || 0;
    const estimatedHours = completedTasks.reduce((sum: number, task: any) => sum + (task.estimatedHours || 8), 0);
    
    const timeEfficiency = estimatedHours > 0 ? Math.min(100, (estimatedHours / Math.max(totalHours, 1)) * 100) : 100;
    
    return Math.round((completionRate * 0.7) + (timeEfficiency * 0.3));
  }

  private async calculateQualityScore(user: any, startDate: Date, endDate: Date): Promise<number> {
    const tasks = user.assignedTasks || [];
    const completedTasks = tasks.filter((task: any) => task.status === 'DONE');
    
    if (completedTasks.length === 0) return 100;
    
    // Quality factors: on-time delivery, estimation accuracy, rework
    let qualityScore = 100;
    
    // On-time delivery
    const onTimeTasks = completedTasks.filter((task: any) => 
      !task.dueDate || new Date(task.updatedAt) <= new Date(task.dueDate)
    );
    const onTimeRate = onTimeTasks.length / completedTasks.length;
    
    // Estimation accuracy
    const tasksWithEstimates = completedTasks.filter((task: any) => task.estimatedHours && task.actualHours);
    let estimationAccuracy = 1;
    if (tasksWithEstimates.length > 0) {
      const accuracyScores = tasksWithEstimates.map((task: any) => {
        const variance = Math.abs(task.actualHours - task.estimatedHours) / Math.max(task.estimatedHours, 1);
        return Math.max(0, 1 - variance);
      });
      estimationAccuracy = accuracyScores.reduce((sum: number, score: number) => sum + score, 0) / accuracyScores.length;
    }
    
    qualityScore = Math.round((onTimeRate * 0.6 + estimationAccuracy * 0.4) * 100);
    
    return Math.min(100, Math.max(0, qualityScore));
  }

  private async calculateCollaborationScore(user: any, startDate: Date, endDate: Date): Promise<number> {
    const tasks = user.assignedTasks || [];
    
    // Calculate collaboration based on:
    // 1. Task comments/communication
    // 2. Help provided to others
    // 3. Knowledge sharing activities
    
    const totalComments = tasks.reduce((sum: number, task: any) => 
      sum + (task.taskComments?.length || 0), 0
    );
    
    const avgCommentsPerTask = tasks.length > 0 ? totalComments / tasks.length : 0;
    
    // Simplified collaboration score based on communication activity
    const communicationScore = Math.min(100, avgCommentsPerTask * 20);
    
    // In a real implementation, this would also consider:
    // - Peer reviews conducted
    // - Knowledge sharing sessions
    // - Mentoring activities
    // - Cross-team collaboration
    
    return Math.round(Math.max(50, communicationScore)); // Minimum baseline score
  }

  private async calculateEfficiencyScore(user: any, startDate: Date, endDate: Date): Promise<number> {
    const tasks = user.assignedTasks || [];
    const completedTasks = tasks.filter((task: any) => task.status === 'DONE');
    
    if (completedTasks.length === 0) return 75; // Default score
    
    // Calculate efficiency based on time spent vs. estimated time
    const tasksWithTime = completedTasks.filter((task: any) => task.estimatedHours && task.actualHours);
    
    if (tasksWithTime.length === 0) return 75;
    
    const efficiencyScores = tasksWithTime.map((task: any) => {
      const efficiency = task.estimatedHours / Math.max(task.actualHours, 0.1);
      return Math.min(1.5, efficiency); // Cap at 150% efficiency
    });
    
    const avgEfficiency = efficiencyScores.reduce((sum: number, score: number) => sum + score, 0) / efficiencyScores.length;
    
    return Math.round(Math.min(100, avgEfficiency * 100));
  }

  private async calculateDeliveryScore(user: any, startDate: Date, endDate: Date): Promise<number> {
    const tasks = user.assignedTasks || [];
    const completedTasks = tasks.filter((task: any) => task.status === 'DONE');
    
    if (tasks.length === 0) return 100;
    
    // Delivery score based on completion rate and timeliness
    const completionRate = completedTasks.length / tasks.length;
    
    const tasksWithDueDate = completedTasks.filter((task: any) => task.dueDate);
    let timelinessScore = 1;
    
    if (tasksWithDueDate.length > 0) {
      const onTimeTasks = tasksWithDueDate.filter((task: any) => 
        new Date(task.updatedAt) <= new Date(task.dueDate)
      );
      timelinessScore = onTimeTasks.length / tasksWithDueDate.length;
    }
    
    return Math.round((completionRate * 0.6 + timelinessScore * 0.4) * 100);
  }

  private async calculatePerformanceTrends(
    userId: string,
    tenantId: string,
    period: string,
    projectId?: string
  ): Promise<{ productivity: 'improving' | 'stable' | 'declining'; quality: 'improving' | 'stable' | 'declining'; collaboration: 'improving' | 'stable' | 'declining' }> {
    // Get historical performance data
    const historicalMetrics = await prisma.teamPerformanceMetrics.findMany({
      where: {
        userId,
        tenantId,
        ...(projectId && { projectId }),
        category: { in: ['PRODUCTIVITY', 'QUALITY', 'COLLABORATION'] }
      },
      orderBy: { startDate: 'desc' },
      take: 6 // Last 6 periods
    });

    const trends: { 
      productivity: 'improving' | 'stable' | 'declining'; 
      quality: 'improving' | 'stable' | 'declining'; 
      collaboration: 'improving' | 'stable' | 'declining' 
    } = {
      productivity: 'stable',
      quality: 'stable',
      collaboration: 'stable'
    };

    // Analyze trends for each category
    ['PRODUCTIVITY', 'QUALITY', 'COLLABORATION'].forEach(category => {
      const categoryMetrics = historicalMetrics
        .filter(m => m.category === category)
        .slice(0, 3); // Last 3 periods

      if (categoryMetrics.length >= 2) {
        const recent = categoryMetrics[0].value;
        const previous = categoryMetrics[categoryMetrics.length - 1].value;
        const diff = recent - previous;

        if (diff > 5) {
          trends[category.toLowerCase() as keyof typeof trends] = 'improving';
        } else if (diff < -5) {
          trends[category.toLowerCase() as keyof typeof trends] = 'declining';
        }
      }
    });

    return trends;
  }

  private async analyzeStrengthsAndWeaknesses(
    user: any,
    scores: { productivityScore: number; qualityScore: number; collaborationScore: number; efficiencyScore: number; deliveryScore: number }
  ): Promise<{ strengths: string[]; improvementAreas: string[] }> {
    const strengths: string[] = [];
    const improvementAreas: string[] = [];

    // Identify strengths (scores > 80)
    if (scores.productivityScore > 80) strengths.push('High productivity and task completion rate');
    if (scores.qualityScore > 80) strengths.push('Excellent work quality and attention to detail');
    if (scores.collaborationScore > 80) strengths.push('Strong collaboration and communication skills');
    if (scores.efficiencyScore > 80) strengths.push('Efficient time management and resource utilization');
    if (scores.deliveryScore > 80) strengths.push('Reliable delivery and meeting deadlines');

    // Identify improvement areas (scores < 70)
    if (scores.productivityScore < 70) improvementAreas.push('Productivity and task completion could be improved');
    if (scores.qualityScore < 70) improvementAreas.push('Focus on improving work quality and reducing errors');
    if (scores.collaborationScore < 70) improvementAreas.push('Enhance collaboration and communication with team');
    if (scores.efficiencyScore < 70) improvementAreas.push('Improve time management and efficiency');
    if (scores.deliveryScore < 70) improvementAreas.push('Work on meeting deadlines and delivery commitments');

    return { strengths, improvementAreas };
  }

  private async assessWorkloadStatus(
    userId: string,
    tenantId: string,
    projectId?: string
  ): Promise<'underutilized' | 'optimal' | 'overloaded'> {
    const currentDate = new Date();
    const weekStart = new Date(currentDate.setDate(currentDate.getDate() - currentDate.getDay()));

    const weeklyHours = await prisma.timesheet.aggregate({
      where: {
        userId,
        tenantId,
        ...(projectId && { projectId }),
        date: { gte: weekStart }
      },
      _sum: { hours: true }
    });

    const totalHours = weeklyHours._sum.hours || 0;

    if (totalHours < 30) return 'underutilized';
    if (totalHours > 50) return 'overloaded';
    return 'optimal';
  }

  private async assessBurnoutRisk(
    userId: string,
    tenantId: string
  ): Promise<'low' | 'medium' | 'high'> {
    // Simplified burnout risk assessment
    const workloadStatus = await this.assessWorkloadStatus(userId, tenantId);
    
    // Get recent overtime patterns
    const recentTimesheets = await prisma.timesheet.findMany({
      where: {
        userId,
        tenantId,
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      }
    });

    const avgDailyHours = recentTimesheets.length > 0 ? 
      recentTimesheets.reduce((sum, ts) => sum + ts.hours, 0) / recentTimesheets.length : 8;

    if (workloadStatus === 'overloaded' || avgDailyHours > 10) return 'high';
    if (workloadStatus === 'optimal' && avgDailyHours > 8.5) return 'medium';
    return 'low';
  }

  private async savePerformanceMetrics(
    userId: string,
    tenantId: string,
    projectId: string | undefined,
    performance: TeamMemberPerformance,
    period: string,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const metrics = [
      { category: TeamPerformanceCategory.PRODUCTIVITY, metricName: 'overall_score', value: performance.productivityScore },
      { category: TeamPerformanceCategory.QUALITY, metricName: 'overall_score', value: performance.qualityScore },
      { category: TeamPerformanceCategory.COLLABORATION, metricName: 'overall_score', value: performance.collaborationScore },
      { category: TeamPerformanceCategory.EFFICIENCY, metricName: 'overall_score', value: performance.efficiencyScore },
      { category: TeamPerformanceCategory.DELIVERY, metricName: 'overall_score', value: performance.deliveryScore }
    ];

    // Only save metrics if projectId is provided
    if (projectId) {
      for (const metric of metrics) {
        await prisma.teamPerformanceMetrics.upsert({
          where: {
            userId_projectId_category_metricName_period_startDate: {
              userId,
              projectId,
              category: metric.category,
              metricName: metric.metricName,
              period,
              startDate
            }
          },
          update: {
            value: metric.value,
            endDate,
            metadata: { performance: performance as any }
          },
          create: {
            userId,
            projectId,
            category: metric.category,
            metricName: metric.metricName,
            value: metric.value,
            period,
            startDate,
            endDate,
            metadata: { performance: performance as any },
            tenantId
          }
        });
      }
    }
  }

  private async getTeamInteractionData(
    userIds: string[],
    tenantId: string,
    startDate: Date,
    endDate: Date,
    projectId?: string
  ): Promise<any> {
    // Get team interaction data from task comments, shared tasks, etc.
    const interactions = await prisma.taskComment.findMany({
      where: {
        userId: { in: userIds },
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
        task: {
          ...(projectId && { projectId })
        }
      },
      include: {
        task: {
          include: {
            assignee: true
          }
        },
        user: true
      }
    });

    return {
      interactions,
      userIds,
      startDate,
      endDate
    };
  }

  private async calculateCommunicationScore(teamData: any): Promise<number> {
    const interactions = teamData.interactions || [];
    const userCount = teamData.userIds.length;
    
    if (userCount < 2) return 100;
    
    const avgInteractionsPerUser = interactions.length / userCount;
    
    // Score based on communication frequency
    return Math.min(100, Math.round(avgInteractionsPerUser * 10));
  }

  private async calculateCoordinationScore(teamData: any): Promise<number> {
    // Simplified coordination score based on shared task activities
    return 80; // Placeholder
  }

  private async calculateTeamKnowledgeSharingScore(teamData: any): Promise<number> {
    // Simplified knowledge sharing score
    return 75; // Placeholder
  }

  private async calculateConflictResolutionScore(teamData: any): Promise<number> {
    // Simplified conflict resolution score
    return 85; // Placeholder
  }

  private async analyzeTeamDynamics(
    userIds: string[],
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    return {
      cohesion: 80,
      diversity: 75,
      leadership: 85,
      autonomy: 78
    };
  }

  private async identifyCollaborationPatterns(teamData: any): Promise<any> {
    return {
      pairings: [],
      isolatedMembers: [],
      communicationHubs: []
    };
  }

  private async generateCollaborationRecommendations(
    overallScore: number,
    scores: any,
    teamDynamics: any,
    patterns: any
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (overallScore < 70) {
      recommendations.push('Implement regular team standups to improve communication');
      recommendations.push('Organize team building activities to enhance collaboration');
    }
    
    if (scores.communicationScore < 70) {
      recommendations.push('Establish clear communication channels and protocols');
    }
    
    return recommendations;
  }

  private calculateAvgTaskComplexity(tasks: any[]): number {
    if (tasks.length === 0) return 1;
    
    // Simplified complexity calculation based on estimated hours
    const avgHours = tasks.reduce((sum, task) => sum + (task.estimatedHours || 4), 0) / tasks.length;
    return Math.min(5, Math.max(1, Math.round(avgHours / 4))); // Scale 1-5
  }

  private async calculateSkillMatch(userId: string, tasks: any[], tenantId: string): Promise<number> {
    // Simplified skill matching - in reality would analyze required skills vs user skills
    return 0.8; // 80% match
  }

  private calculateStressIndicator(utilizationRate: number, taskCount: number, complexity: number): number {
    const baseStress = utilizationRate;
    const taskStress = Math.min(0.3, taskCount * 0.05);
    const complexityStress = Math.min(0.2, (complexity - 1) * 0.05);
    
    return Math.min(1, baseStress + taskStress + complexityStress);
  }

  private calculateAverageCycleTime(tasks: any[]): number {
    if (tasks.length === 0) return 0;
    
    const cycleTimes = tasks
      .filter(task => task.startDate && task.updatedAt)
      .map(task => {
        const start = new Date(task.startDate).getTime();
        const end = new Date(task.updatedAt).getTime();
        return (end - start) / (1000 * 60 * 60 * 24); // Days
      });
    
    return cycleTimes.length > 0 ? 
      cycleTimes.reduce((sum, time) => sum + time, 0) / cycleTimes.length : 0;
  }

  private calculateAverageLeadTime(tasks: any[]): number {
    if (tasks.length === 0) return 0;
    
    const leadTimes = tasks
      .filter(task => task.createdAt && task.updatedAt)
      .map(task => {
        const created = new Date(task.createdAt).getTime();
        const completed = new Date(task.updatedAt).getTime();
        return (completed - created) / (1000 * 60 * 60 * 24); // Days
      });
    
    return leadTimes.length > 0 ? 
      leadTimes.reduce((sum, time) => sum + time, 0) / leadTimes.length : 0;
  }

  private async calculateTeamQualityIndex(tasks: any[], userIds: string[], tenantId: string): Promise<number> {
    // Simplified quality index based on task completion quality
    return 85; // Placeholder
  }

  private async calculateInnovationIndex(userIds: string[], tenantId: string, startDate: Date, endDate: Date): Promise<number> {
    // Simplified innovation index
    return 75; // Placeholder
  }

  private async calculateTeamSatisfaction(userIds: string[], tenantId: string): Promise<number> {
    // Simplified team satisfaction score
    return 80; // Placeholder
  }

  private async calculateKnowledgeSharingScore(userIds: string[], tenantId: string, startDate: Date, endDate: Date): Promise<number> {
    // Simplified knowledge sharing score
    return 75; // Placeholder
  }

  private async calculateCrossTrainingScore(userIds: string[], tenantId: string): Promise<number> {
    // Simplified cross-training score
    return 70; // Placeholder
  }

  private async calculateMentoringScore(userIds: string[], tenantId: string, startDate: Date, endDate: Date): Promise<number> {
    // Simplified mentoring score
    return 65; // Placeholder
  }

  private async generatePerformanceFeedback(performance: TeamMemberPerformance): Promise<string> {
    let feedback = `Overall performance score: ${performance.overallScore}/100. `;
    
    if (performance.overallScore >= 80) {
      feedback += 'Excellent performance across all areas. ';
    } else if (performance.overallScore >= 70) {
      feedback += 'Good performance with room for improvement in some areas. ';
    } else {
      feedback += 'Performance needs improvement. ';
    }
    
    if (performance.strengths.length > 0) {
      feedback += `Key strengths: ${performance.strengths.join(', ')}. `;
    }
    
    if (performance.improvementAreas.length > 0) {
      feedback += `Areas for improvement: ${performance.improvementAreas.join(', ')}.`;
    }
    
    return feedback;
  }

  private async generatePerformanceGoals(performance: TeamMemberPerformance): Promise<any> {
    const goals = [];
    
    if (performance.productivityScore < 80) {
      goals.push({
        area: 'Productivity',
        target: 'Increase task completion rate by 15%',
        timeline: '3 months'
      });
    }
    
    if (performance.qualityScore < 80) {
      goals.push({
        area: 'Quality',
        target: 'Reduce rework incidents by 20%',
        timeline: '2 months'
      });
    }
    
    return goals;
  }

  private async generateActionItems(performance: TeamMemberPerformance): Promise<any> {
    const actionItems = [];
    
    if (performance.burnoutRisk === 'high') {
      actionItems.push({
        action: 'Schedule workload review meeting',
        priority: 'immediate',
        owner: 'manager'
      });
    }
    
    if (performance.collaborationScore < 70) {
      actionItems.push({
        action: 'Enroll in communication skills training',
        priority: 'short-term',
        owner: 'employee'
      });
    }
    
    return actionItems;
  }

  private async getProjectRequiredSkills(projectId: string | undefined, tenantId: string): Promise<any[]> {
    // Simplified - in reality would analyze project requirements
    return [
      { skill: 'JavaScript', importance: 0.9, currentLevel: 0.7, targetLevel: 0.9 },
      { skill: 'React', importance: 0.8, currentLevel: 0.6, targetLevel: 0.8 },
      { skill: 'Node.js', importance: 0.7, currentLevel: 0.5, targetLevel: 0.7 }
    ];
  }

  private async getTeamSkillMatrix(userIds: string[], tenantId: string): Promise<any[]> {
    // Simplified - in reality would query user skills from database
    return userIds.map(userId => ({
      userId,
      skills: [
        { skill: 'JavaScript', level: 0.7, certified: true },
        { skill: 'React', level: 0.6, certified: false },
        { skill: 'Node.js', level: 0.5, certified: false }
      ]
    }));
  }

  private identifySkillGaps(requiredSkills: any[], teamSkillMatrix: any[]): any[] {
    // Simplified gap analysis
    return requiredSkills.map(required => ({
      skill: required.skill,
      gap: required.targetLevel - required.currentLevel,
      priority: required.gap > 0.3 ? 'high' : required.gap > 0.1 ? 'medium' : 'low',
      recommendedActions: ['Training course', 'Mentoring', 'Practice project']
    }));
  }

  private generateTrainingRecommendations(gaps: any[], teamSkillMatrix: any[]): any[] {
    // Simplified training recommendations
    return teamSkillMatrix.map(member => ({
      userId: member.userId,
      skills: gaps.filter(gap => gap.priority === 'high').map(gap => gap.skill),
      priority: 'high'
    }));
  }

  private identifyCrossTrainingOpportunities(teamSkillMatrix: any[], gaps: any[]): any[] {
    // Simplified cross-training identification
    return [
      { mentor: 'user1', mentee: 'user2', skill: 'JavaScript', benefit: 0.8 }
    ];
  }

  private async assessDetailedBurnoutRisk(userId: string, tenantId: string): Promise<BurnoutRiskAssessment> {
    // Simplified detailed burnout assessment
    const workloadStatus = await this.assessWorkloadStatus(userId, tenantId);
    
    const factors = {
      workload: workloadStatus === 'overloaded' ? 80 : workloadStatus === 'optimal' ? 40 : 20,
      workLifeBalance: 60,
      jobSatisfaction: 70,
      stress: 50,
      supportSystem: 80,
      growth: 75
    };
    
    const riskScore = Object.values(factors).reduce((sum, score) => sum + score, 0) / Object.keys(factors).length;
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore > 70) riskLevel = 'critical';
    else if (riskScore > 60) riskLevel = 'high';
    else if (riskScore > 40) riskLevel = 'medium';
    else riskLevel = 'low';
    
    return {
      userId,
      riskLevel,
      riskScore,
      factors,
      indicators: ['High workload', 'Long hours'],
      recommendations: ['Redistribute workload', 'Encourage time off'],
      interventions: [
        { action: 'Immediate workload review', priority: 'immediate' },
        { action: 'Stress management training', priority: 'short-term' }
      ]
    };
  }
}

export default TeamPerformanceService;

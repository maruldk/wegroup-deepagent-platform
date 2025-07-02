// @ts-nocheck
/**
 * User Feedback Service - Processing and Learning from User Feedback
 * Handles explicit and implicit feedback collection and processing
 */

import { prisma } from '@/lib/db';
import {
  UserFeedbackData,
  UserPreferenceData,
  ImplicitFeedbackData,
  UserFeedbackType,
  FeedbackSentiment,
  PreferenceSource
} from '@/lib/types';

export class UserFeedbackService {

  /**
   * Collect explicit user feedback
   */
  async collectExplicitFeedback(feedbackData: UserFeedbackData, tenantId: string) {
    try {
      const feedback = await prisma.userFeedback.create({
        data: {
          userId: feedbackData.userId,
          feedbackType: feedbackData.feedbackType,
          targetType: feedbackData.targetType,
          targetId: feedbackData.targetId,
          rating: feedbackData.rating,
          sentiment: feedbackData.sentiment,
          comment: feedbackData.comment,
          data: feedbackData.context ? { context: feedbackData.context } : undefined,
          context: feedbackData.context,
          weight: feedbackData.weight || 1.0,
          tenantId
        }
      });

      // Process feedback immediately for learning
      await this.processFeedbackForLearning(feedback);

      // Update user preferences based on feedback
      await this.updateUserPreferences(feedbackData, tenantId);

      return feedback;
    } catch (error) {
      console.error('Error collecting explicit feedback:', error);
      throw new Error('Failed to collect explicit feedback');
    }
  }

  /**
   * Collect implicit user feedback
   */
  async collectImplicitFeedback(feedbackData: ImplicitFeedbackData, tenantId: string) {
    try {
      const feedback = await prisma.implicitFeedback.create({
        data: {
          userId: feedbackData.userId,
          sessionId: feedbackData.sessionId,
          action: feedbackData.action,
          targetType: feedbackData.targetType,
          targetId: feedbackData.targetId,
          value: feedbackData.value,
          context: feedbackData.context,
          timestamp: feedbackData.timestamp,
          tenantId
        }
      });

      // Process implicit feedback for pattern recognition
      await this.processImplicitFeedback(feedback);

      return feedback;
    } catch (error) {
      console.error('Error collecting implicit feedback:', error);
      throw new Error('Failed to collect implicit feedback');
    }
  }

  /**
   * Update user preferences
   */
  async updateUserPreference(preferenceData: UserPreferenceData, tenantId: string) {
    try {
      const existingPreference = await prisma.userPreference.findUnique({
        where: {
          userId_preferenceType_key: {
            userId: preferenceData.userId,
            preferenceType: preferenceData.preferenceType,
            key: preferenceData.key
          }
        }
      });

      if (existingPreference) {
        // Update existing preference with confidence weighting
        const newConfidence = this.calculateUpdatedConfidence(
          existingPreference.confidence,
          preferenceData.confidence,
          existingPreference.updateCount
        );

        const updatedPreference = await prisma.userPreference.update({
          where: { id: existingPreference.id },
          data: {
            value: preferenceData.value,
            source: preferenceData.source,
            confidence: newConfidence,
            lastUpdated: new Date(),
            updateCount: existingPreference.updateCount + 1
          }
        });

        return updatedPreference;
      } else {
        // Create new preference
        const newPreference = await prisma.userPreference.create({
          data: {
            userId: preferenceData.userId,
            preferenceType: preferenceData.preferenceType,
            key: preferenceData.key,
            value: preferenceData.value,
            source: preferenceData.source,
            confidence: preferenceData.confidence,
            tenantId
          }
        });

        return newPreference;
      }
    } catch (error) {
      console.error('Error updating user preference:', error);
      throw new Error('Failed to update user preference');
    }
  }

  /**
   * Get user preferences for personalization
   */
  async getUserPreferences(userId: string, preferenceType?: string) {
    try {
      const preferences = await prisma.userPreference.findMany({
        where: {
          userId,
          ...(preferenceType && { preferenceType })
        },
        orderBy: [
          { confidence: 'desc' },
          { lastUpdated: 'desc' }
        ]
      });

      return preferences.reduce((acc, pref) => {
        if (!acc[pref.preferenceType]) {
          acc[pref.preferenceType] = {};
        }
        acc[pref.preferenceType][pref.key] = {
          value: pref.value,
          confidence: pref.confidence,
          source: pref.source,
          lastUpdated: pref.lastUpdated
        };
        return acc;
      }, {} as Record<string, Record<string, any>>);
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw new Error('Failed to get user preferences');
    }
  }

  /**
   * Analyze feedback patterns
   */
  async analyzeFeedbackPatterns(userId?: string, targetType?: string, timeWindow?: number) {
    try {
      const timeFilter = timeWindow ? {
        createdAt: {
          gte: new Date(Date.now() - timeWindow * 24 * 60 * 60 * 1000)
        }
      } : {};

      const explicitFeedback = await prisma.userFeedback.findMany({
        where: {
          ...(userId && { userId }),
          ...(targetType && { targetType }),
          ...timeFilter
        }
      });

      const implicitFeedback = await prisma.implicitFeedback.findMany({
        where: {
          ...(userId && { userId }),
          ...(targetType && { targetType }),
          ...timeFilter
        }
      });

      return {
        explicit: this.analyzeExplicitFeedback(explicitFeedback),
        implicit: this.analyzeImplicitFeedback(implicitFeedback),
        combined: this.combineFeedbackAnalysis(explicitFeedback, implicitFeedback)
      };
    } catch (error) {
      console.error('Error analyzing feedback patterns:', error);
      throw new Error('Failed to analyze feedback patterns');
    }
  }

  /**
   * Generate personalized recommendations
   */
  async generatePersonalizedRecommendations(userId: string, context: Record<string, any>) {
    try {
      const userPreferences = await this.getUserPreferences(userId);
      const feedbackPatterns = await this.analyzeFeedbackPatterns(userId, undefined, 30); // Last 30 days

      const recommendations = [];

      // Analyze preferences for UI customization
      if (userPreferences.UI_LAYOUT) {
        recommendations.push({
          type: 'ui_customization',
          priority: 'high',
          description: 'Customize dashboard layout based on usage patterns',
          action: 'apply_layout_preferences',
          confidence: userPreferences.UI_LAYOUT.layout?.confidence || 0.5
        });
      }

      // Analyze feedback for feature recommendations
      if (feedbackPatterns.explicit.averageRating < 3) {
        recommendations.push({
          type: 'feature_improvement',
          priority: 'medium',
          description: 'Adjust feature behavior based on negative feedback',
          action: 'modify_feature_parameters',
          confidence: 0.7
        });
      }

      // Analyze usage patterns for workflow optimization
      if (feedbackPatterns.implicit.timeSpentPatterns) {
        recommendations.push({
          type: 'workflow_optimization',
          priority: 'medium',
          description: 'Optimize workflow based on time spent patterns',
          action: 'suggest_shortcuts',
          confidence: 0.6
        });
      }

      return recommendations;
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      throw new Error('Failed to generate personalized recommendations');
    }
  }

  /**
   * Get feedback metrics
   */
  async getFeedbackMetrics(tenantId: string, timeWindow?: number) {
    try {
      const timeFilter = timeWindow ? {
        createdAt: {
          gte: new Date(Date.now() - timeWindow * 24 * 60 * 60 * 1000)
        }
      } : {};

      const explicitFeedback = await prisma.userFeedback.findMany({
        where: {
          tenantId,
          ...timeFilter
        }
      });

      const implicitFeedback = await prisma.implicitFeedback.findMany({
        where: {
          tenantId,
          ...timeFilter
        }
      });

      const processedFeedback = explicitFeedback.filter(f => f.processed);
      const totalFeedback = explicitFeedback.length + implicitFeedback.length;
      const positiveFeedback = explicitFeedback.filter(f => 
        f.sentiment === FeedbackSentiment.POSITIVE || (f.rating && f.rating >= 4)
      );

      return {
        totalFeedback,
        explicitFeedback: explicitFeedback.length,
        implicitFeedback: implicitFeedback.length,
        processedFeedback: processedFeedback.length,
        processingRate: explicitFeedback.length > 0 ? processedFeedback.length / explicitFeedback.length : 0,
        positiveRatio: explicitFeedback.length > 0 ? positiveFeedback.length / explicitFeedback.length : 0,
        averageRating: this.calculateAverageRating(explicitFeedback),
        sentimentDistribution: this.calculateSentimentDistribution(explicitFeedback),
        feedbackTypes: this.calculateFeedbackTypeDistribution(explicitFeedback),
        responseTime: this.calculateAverageResponseTime(implicitFeedback),
        engagementMetrics: this.calculateEngagementMetrics(implicitFeedback)
      };
    } catch (error) {
      console.error('Error getting feedback metrics:', error);
      throw new Error('Failed to get feedback metrics');
    }
  }

  /**
   * Helper Methods
   */

  private async processFeedbackForLearning(feedback: any) {
    try {
      // Convert feedback to RL reward if applicable
      if (feedback.targetType === 'AI_DECISION' || feedback.targetType === 'MODEL_PREDICTION') {
        const rewardValue = this.convertFeedbackToReward(feedback);
        
        if (rewardValue !== null) {
          // Find associated RL agent and provide reward
          await this.provideFeedbackReward(feedback.targetId, rewardValue, feedback);
        }
      }

      // Mark feedback as processed
      await prisma.userFeedback.update({
        where: { id: feedback.id },
        data: { processed: true }
      });
    } catch (error) {
      console.error('Error processing feedback for learning:', error);
    }
  }

  private async processImplicitFeedback(feedback: any) {
    try {
      // Analyze implicit feedback patterns
      const patterns = this.extractImplicitPatterns(feedback);
      
      // Update user preferences based on implicit behavior
      if (patterns.preference) {
        await this.updateUserPreference({
          userId: feedback.userId,
          preferenceType: patterns.preference.type,
          key: patterns.preference.key,
          value: patterns.preference.value,
          source: PreferenceSource.IMPLICIT,
          confidence: patterns.confidence || 0.3
        }, feedback.tenantId);
      }

      // Mark as processed
      await prisma.implicitFeedback.update({
        where: { id: feedback.id },
        data: { processed: true }
      });
    } catch (error) {
      console.error('Error processing implicit feedback:', error);
    }
  }

  private async updateUserPreferences(feedbackData: UserFeedbackData, tenantId: string) {
    // Infer preferences from explicit feedback
    const preferences = this.inferPreferencesFromFeedback(feedbackData);
    
    for (const preference of preferences) {
      await this.updateUserPreference({
        ...preference,
        userId: feedbackData.userId
      }, tenantId);
    }
  }

  private convertFeedbackToReward(feedback: any): number | null {
    if (feedback.rating) {
      // Convert rating (1-5) to reward (-1 to 1)
      return (feedback.rating - 3) / 2;
    }
    
    if (feedback.sentiment) {
      switch (feedback.sentiment) {
        case FeedbackSentiment.POSITIVE:
          return 1;
        case FeedbackSentiment.NEGATIVE:
          return -1;
        case FeedbackSentiment.NEUTRAL:
          return 0;
        default:
          return 0;
      }
    }
    
    return null;
  }

  private async provideFeedbackReward(targetId: string, rewardValue: number, feedback: any) {
    // This would integrate with the RL service to provide rewards
    // Implementation depends on how targets are linked to RL agents
    try {
      // Find associated RL agent based on target
      const agent = await this.findAssociatedAgent(targetId);
      
      if (agent) {
        // Create reward record
        // @ts-ignore
        await prisma.rLReward.create({
          data: {
            agentId: agent.id,
            rewardType: 'EXTRINSIC',
            value: rewardValue,
            source: 'USER_FEEDBACK',
            context: {
              feedbackId: (feedback as any)?.id,
              feedbackType: (feedback as any)?.feedbackType,
              targetType: (feedback as any)?.targetType,
              userId: (feedback as any)?.userId
            },
            tenantId: (feedback as any)?.tenantId
          }
        });
      }
    } catch (error) {
      console.error('Error providing feedback reward:', error);
    }
  }

  private async findAssociatedAgent(targetId: string) {
    // Logic to find RL agent associated with a target
    // This could be based on decision records, model associations, etc.
    return null; // Placeholder
  }

  private extractImplicitPatterns(feedback: any) {
    const patterns: any = { confidence: 0.3 };
    
    switch (feedback.action) {
      case 'TIME_SPENT':
        if (feedback.value && feedback.value > 300) { // More than 5 minutes
          patterns.preference = {
            type: 'ENGAGEMENT',
            key: feedback.targetType,
            value: 'high_interest'
          };
          patterns.confidence = 0.5;
        }
        break;
      case 'CLICK':
        patterns.preference = {
          type: 'UI_PREFERENCE',
          key: 'preferred_actions',
          value: feedback.targetType
        };
        break;
      case 'SCROLL':
        if (feedback.value && feedback.value > 100) {
          patterns.preference = {
            type: 'CONTENT_PREFERENCE',
            key: 'content_depth',
            value: 'detailed'
          };
        }
        break;
    }
    
    return patterns;
  }

  private inferPreferencesFromFeedback(feedbackData: UserFeedbackData) {
    const preferences = [];
    
    // Infer AI aggressiveness preference
    if (feedbackData.targetType === 'AI_DECISION') {
      if (feedbackData.rating && feedbackData.rating >= 4) {
        preferences.push({
          preferenceType: 'AI_BEHAVIOR',
          key: 'aggressiveness',
          value: 'approved',
          source: PreferenceSource.EXPLICIT,
          confidence: 0.8
        });
      }
    }
    
    // Infer notification preferences
    if (feedbackData.targetType === 'NOTIFICATION') {
      preferences.push({
        preferenceType: 'NOTIFICATION_FREQUENCY',
        key: 'type_preference',
        value: feedbackData.sentiment === FeedbackSentiment.POSITIVE ? 'more' : 'less',
        source: PreferenceSource.EXPLICIT,
        confidence: 0.7
      });
    }
    
    return preferences;
  }

  private calculateUpdatedConfidence(
    existingConfidence: number,
    newConfidence: number,
    updateCount: number
  ): number {
    // Weighted average with decay for older confidence values
    const decayFactor = Math.max(0.1, 1 / Math.sqrt(updateCount));
    return (existingConfidence * (1 - decayFactor)) + (newConfidence * decayFactor);
  }

  private analyzeExplicitFeedback(feedback: any[]) {
    const ratings = feedback.filter(f => f.rating).map(f => f.rating);
    const sentiments = feedback.map(f => f.sentiment).filter(s => s);
    
    return {
      count: feedback.length,
      averageRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
      sentimentDistribution: this.calculateSentimentDistribution(feedback),
      mostCommonTargets: this.calculateMostCommonTargets(feedback),
      temporalPatterns: this.calculateTemporalPatterns(feedback)
    };
  }

  private analyzeImplicitFeedback(feedback: any[]) {
    const timeSpent = feedback.filter(f => f.action === 'TIME_SPENT').map(f => f.value || 0);
    const clicks = feedback.filter(f => f.action === 'CLICK');
    
    return {
      count: feedback.length,
      averageTimeSpent: timeSpent.length > 0 ? timeSpent.reduce((a, b) => a + b, 0) / timeSpent.length : 0,
      clickPatterns: this.calculateClickPatterns(clicks),
      engagementScore: this.calculateEngagementScore(feedback),
      timeSpentPatterns: this.calculateTimeSpentPatterns(timeSpent)
    };
  }

  private combineFeedbackAnalysis(explicit: any[], implicit: any[]) {
    return {
      totalInteractions: explicit.length + implicit.length,
      engagementVsRating: this.correlateEngagementWithRating(explicit, implicit),
      userSatisfactionScore: this.calculateOverallSatisfaction(explicit, implicit),
      behaviorConsistency: this.calculateBehaviorConsistency(explicit, implicit)
    };
  }

  private calculateAverageRating(feedback: any[]): number {
    const ratings = feedback.filter(f => f.rating).map(f => f.rating);
    return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  }

  private calculateSentimentDistribution(feedback: any[]) {
    const sentiments = feedback.map(f => f.sentiment).filter(s => s);
    const distribution = sentiments.reduce((acc, sentiment) => {
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(distribution).map(([sentiment, count]) => ({
      sentiment,
      count: count as number,
      percentage: ((count as number) / sentiments.length) * 100
    }));
  }

  private calculateFeedbackTypeDistribution(feedback: any[]) {
    return feedback.reduce((acc, f) => {
      acc[f.feedbackType] = (acc[f.feedbackType] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateAverageResponseTime(feedback: any[]): number {
    // Calculate average time between user action and feedback
    return 150; // Placeholder - would calculate actual response times
  }

  private calculateEngagementMetrics(feedback: any[]) {
    const timeSpentActions = feedback.filter(f => f.action === 'TIME_SPENT');
    const clickActions = feedback.filter(f => f.action === 'CLICK');
    
    return {
      averageTimeSpent: timeSpentActions.length > 0 
        ? timeSpentActions.reduce((sum, f) => sum + (f.value || 0), 0) / timeSpentActions.length 
        : 0,
      clicksPerSession: clickActions.length,
      engagementScore: this.calculateEngagementScore(feedback)
    };
  }

  private calculateMostCommonTargets(feedback: any[]) {
    const targets = feedback.reduce((acc, f) => {
      const key = `${f.targetType}:${f.targetId}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(targets)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([target, count]) => ({ target, count }));
  }

  private calculateTemporalPatterns(feedback: any[]) {
    // Analyze feedback timing patterns
    const hourCounts = new Array(24).fill(0);
    feedback.forEach(f => {
      const hour = new Date(f.createdAt).getHours();
      hourCounts[hour]++;
    });
    
    return {
      peakHours: hourCounts.map((count, hour) => ({ hour, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
    };
  }

  private calculateClickPatterns(clicks: any[]) {
    return clicks.reduce((acc, click) => {
      acc[click.targetType] = (acc[click.targetType] || 0) + 1;
      return acc;
    }, {});
  }

  private calculateEngagementScore(feedback: any[]): number {
    // Simple engagement score based on interaction frequency and diversity
    const actionTypes = new Set(feedback.map(f => f.action));
    const averageValue = feedback.reduce((sum, f) => sum + (f.value || 1), 0) / feedback.length;
    
    return (actionTypes.size * 0.3 + Math.min(averageValue / 100, 1) * 0.7) * 100;
  }

  private calculateTimeSpentPatterns(timeSpent: number[]) {
    if (timeSpent.length === 0) return null;
    
    const average = timeSpent.reduce((a, b) => a + b, 0) / timeSpent.length;
    const max = Math.max(...timeSpent);
    const min = Math.min(...timeSpent);
    
    return { average, max, min, variance: this.calculateVariance(timeSpent) };
  }

  private correlateEngagementWithRating(explicit: any[], implicit: any[]): number {
    // Simplified correlation between engagement and explicit ratings
    return 0.7; // Placeholder
  }

  private calculateOverallSatisfaction(explicit: any[], implicit: any[]): number {
    const explicitScore = this.calculateAverageRating(explicit) / 5; // Normalize to 0-1
    const implicitScore = this.calculateEngagementScore(implicit) / 100; // Normalize to 0-1
    
    return (explicitScore * 0.7 + implicitScore * 0.3) * 100;
  }

  private calculateBehaviorConsistency(explicit: any[], implicit: any[]): number {
    // Measure consistency between explicit feedback and implicit behavior
    return 0.8; // Placeholder
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }
}

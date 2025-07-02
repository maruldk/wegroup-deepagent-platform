
/**
 * Continuous Learning Service - Online Learning and Concept Drift Detection
 * Implements incremental learning and adaptation mechanisms
 */

import { prisma } from '@/lib/db';
import {
  OnlineLearningConfig,
  OnlineLearningUpdate,
  ConceptDriftDetection,
  ModelPerformanceMetric,
  DriftType,
  DriftSeverity,
  OnlineLearningType
} from '@/lib/types';

export class ContinuousLearningService {

  /**
   * Start an online learning session
   */
  async startOnlineLearningSession(config: OnlineLearningConfig, tenantId: string): Promise<string> {
    try {
      const session = await prisma.onlineLearningSession.create({
        data: {
          modelId: config.modelId,
          agentId: config.agentId,
          sessionType: config.sessionType,
          learningRate: config.learningRate,
          adaptationRate: config.adaptationRate,
          batchSize: config.batchSize,
          updateFrequency: config.updateFrequency,
          memorySize: config.memorySize,
          tenantId,
          metadata: {
            startTime: new Date().toISOString(),
            config: JSON.parse(JSON.stringify(config))
          }
        }
      });

      return session.id;
    } catch (error) {
      console.error('Error starting online learning session:', error);
      throw new Error('Failed to start online learning session');
    }
  }

  /**
   * Process incremental learning update
   */
  async processIncrementalUpdate(sessionId: string, update: OnlineLearningUpdate) {
    try {
      const session = await prisma.onlineLearningSession.findUnique({
        where: { id: sessionId }
      });

      if (!session) {
        throw new Error('Online learning session not found');
      }

      // Process the new data based on session type
      const adaptations = await this.performIncrementalLearning(session, update);

      // Update session statistics
      await prisma.onlineLearningSession.update({
        where: { id: sessionId },
        data: {
          samplesProcessed: session.samplesProcessed + update.newData.length,
          totalUpdates: session.totalUpdates + 1,
          lastUpdate: new Date(),
          currentLoss: update.performanceMetrics.loss || session.currentLoss,
          avgLoss: this.calculateMovingAverage(
            session.avgLoss || 0,
            update.performanceMetrics.loss || 0,
            session.totalUpdates + 1
          ),
          metadata: {
            ...session.metadata as object,
            lastUpdate: {
              timestamp: new Date().toISOString(),
              dataSize: update.newData.length,
              adaptations: adaptations
            }
          }
        }
      });

      // Check for concept drift
      await this.detectConceptDrift(session, update);

      return {
        success: true,
        adaptations,
        sessionStats: {
          samplesProcessed: session.samplesProcessed + update.newData.length,
          totalUpdates: session.totalUpdates + 1,
          avgLoss: this.calculateMovingAverage(
            session.avgLoss || 0,
            update.performanceMetrics.loss || 0,
            session.totalUpdates + 1
          )
        }
      };
    } catch (error) {
      console.error('Error processing incremental update:', error);
      throw new Error('Failed to process incremental update');
    }
  }

  /**
   * Detect concept drift
   */
  async detectConceptDrift(session: any, update: OnlineLearningUpdate): Promise<ConceptDriftDetection | null> {
    try {
      const performanceWindow = 100; // Last 100 samples
      const driftThreshold = 0.15; // 15% performance degradation threshold

      // Calculate recent performance metrics
      const recentMetrics = await this.calculateRecentPerformance(session, performanceWindow);
      const baseline = await this.getBaselinePerformance(session);

      if (!baseline || !recentMetrics) {
        return null;
      }

      // Statistical drift detection using performance metrics
      const performanceDrift = this.calculatePerformanceDrift(baseline, recentMetrics);
      const distributionDrift = this.calculateDistributionDrift(update.newData, session);

      let driftDetected = false;
      let driftType: DriftType = DriftType.GRADUAL;
      let severity: DriftSeverity = DriftSeverity.LOW;
      let confidence = 0;

      // Performance-based drift detection
      if (performanceDrift.degradation > driftThreshold) {
        driftDetected = true;
        driftType = performanceDrift.sudden ? DriftType.SUDDEN : DriftType.GRADUAL;
        severity = this.calculateDriftSeverity(performanceDrift.degradation);
        confidence = performanceDrift.confidence;
      }

      // Distribution-based drift detection
      if (distributionDrift.klDivergence > 0.1) {
        driftDetected = true;
        driftType = DriftType.INCREMENTAL;
        severity = distributionDrift.klDivergence > 0.3 ? DriftSeverity.HIGH : DriftSeverity.MEDIUM;
        confidence = Math.max(confidence, distributionDrift.confidence);
      }

      if (driftDetected) {
        const drift = await prisma.conceptDrift.create({
          data: {
            modelId: session.modelId,
            agentId: session.agentId,
            driftType,
            detectionMethod: 'PERFORMANCE_DECAY',
            severity,
            confidence,
            driftScore: Math.max(performanceDrift.degradation, distributionDrift.klDivergence),
            baseline: baseline,
            current: recentMetrics,
            recommendation: this.generateDriftRecommendation(driftType, severity),
            tenantId: session.tenantId,
            metadata: {
              performanceDrift,
              distributionDrift,
              sessionId: session.id
            }
          }
        });

        // Trigger adaptation if drift is severe
        if (severity === DriftSeverity.HIGH || severity === DriftSeverity.CRITICAL) {
          await this.triggerAdaptation(session, drift);
        }

        return {
          modelId: session.modelId,
          agentId: session.agentId,
          driftType,
          severity,
          confidence,
          driftScore: Math.max(performanceDrift.degradation, distributionDrift.klDivergence),
          baseline,
          current: recentMetrics,
          recommendation: this.generateDriftRecommendation(driftType, severity),
          detectedAt: new Date()
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting concept drift:', error);
      return null;
    }
  }

  /**
   * Trigger model/agent adaptation
   */
  async triggerAdaptation(session: any, drift: any) {
    try {
      // Increase learning rate for faster adaptation
      const adaptedLearningRate = Math.min(session.learningRate * 2, 0.1);
      
      // Reset or modify policy based on drift severity
      const adaptationStrategy = this.selectAdaptationStrategy(drift.severity, drift.driftType);

      await prisma.onlineLearningSession.update({
        where: { id: session.id },
        data: {
          learningRate: adaptedLearningRate,
          adaptationRate: Math.min(session.adaptationRate * 1.5, 0.5),
          metadata: {
            ...session.metadata as object,
            adaptation: {
              timestamp: new Date().toISOString(),
              driftId: drift.id,
              strategy: adaptationStrategy,
              originalLearningRate: session.learningRate,
              newLearningRate: adaptedLearningRate
            }
          }
        }
      });

      // Mark drift as being adapted
      await prisma.conceptDrift.update({
        where: { id: drift.id },
        data: {
          status: 'ADAPTING',
          adaptedAt: new Date()
        }
      });

      return adaptationStrategy;
    } catch (error) {
      console.error('Error triggering adaptation:', error);
      throw new Error('Failed to trigger adaptation');
    }
  }

  /**
   * Record performance metrics
   */
  async recordPerformanceMetric(metric: ModelPerformanceMetric, tenantId: string) {
    try {
      await prisma.modelPerformance.create({
        data: {
          modelId: metric.modelId,
          agentId: metric.agentId,
          metricName: metric.metricName,
          metricValue: metric.metricValue,
          baseline: metric.baseline,
          improvement: metric.improvement,
          dataWindow: metric.dataWindow,
          sampleSize: 100, // Default sample size
          version: '1.0',
          environment: metric.environment,
          tenantId
        }
      });
    } catch (error) {
      console.error('Error recording performance metric:', error);
      throw new Error('Failed to record performance metric');
    }
  }

  /**
   * Get continuous learning metrics
   */
  async getContinuousLearningMetrics(tenantId: string) {
    try {
      const activeSessions = await prisma.onlineLearningSession.findMany({
        where: {
          tenantId,
          status: 'ACTIVE'
        }
      });

      const recentDrifts = await prisma.conceptDrift.findMany({
        where: {
          tenantId,
          detectedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        orderBy: { detectedAt: 'desc' }
      });

      const performanceMetrics = await prisma.modelPerformance.findMany({
        where: {
          tenantId,
          timestamp: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      return {
        activeSessions: activeSessions.length,
        totalSamplesProcessed: activeSessions.reduce((sum, s) => sum + s.samplesProcessed, 0),
        avgLoss: activeSessions.reduce((sum, s) => sum + (s.avgLoss || 0), 0) / Math.max(activeSessions.length, 1),
        driftAlerts: recentDrifts.length,
        criticalDrifts: recentDrifts.filter(d => d.severity === 'CRITICAL').length,
        adaptationRate: this.calculateAdaptationRate(recentDrifts),
        performanceTrends: this.calculatePerformanceTrends(performanceMetrics),
        learningEfficiency: this.calculateLearningEfficiency(activeSessions, performanceMetrics)
      };
    } catch (error) {
      console.error('Error getting continuous learning metrics:', error);
      throw new Error('Failed to get continuous learning metrics');
    }
  }

  /**
   * Helper Methods
   */

  private async performIncrementalLearning(session: any, update: OnlineLearningUpdate) {
    const adaptations: Record<string, any> = {};

    switch (session.sessionType) {
      case OnlineLearningType.INCREMENTAL:
        adaptations.incrementalUpdate = this.performIncrementalUpdate(session, update);
        break;
      case OnlineLearningType.BATCH_INCREMENTAL:
        if (update.newData.length >= session.batchSize) {
          adaptations.batchUpdate = this.performBatchUpdate(session, update);
        }
        break;
      case OnlineLearningType.STREAMING:
        adaptations.streamingUpdate = this.performStreamingUpdate(session, update);
        break;
    }

    return adaptations;
  }

  private performIncrementalUpdate(session: any, update: OnlineLearningUpdate) {
    // Simplified incremental learning simulation
    return {
      method: 'incremental',
      samplesProcessed: update.newData.length,
      learningRateUsed: session.learningRate,
      convergence: update.performanceMetrics.accuracy || 0.8
    };
  }

  private performBatchUpdate(session: any, update: OnlineLearningUpdate) {
    // Simplified batch learning simulation
    return {
      method: 'batch',
      batchSize: update.newData.length,
      learningRateUsed: session.learningRate,
      convergence: update.performanceMetrics.accuracy || 0.85
    };
  }

  private performStreamingUpdate(session: any, update: OnlineLearningUpdate) {
    // Simplified streaming learning simulation
    return {
      method: 'streaming',
      streamRate: update.newData.length / (Date.now() - new Date(session.lastUpdate || session.startTime).getTime()),
      adaptationRate: session.adaptationRate,
      convergence: update.performanceMetrics.accuracy || 0.82
    };
  }

  private calculateMovingAverage(currentAvg: number, newValue: number, count: number): number {
    return (currentAvg * (count - 1) + newValue) / count;
  }

  private async calculateRecentPerformance(session: any, windowSize: number) {
    // Simplified recent performance calculation
    return {
      accuracy: 0.8 + Math.random() * 0.1,
      loss: 0.1 + Math.random() * 0.1,
      sampleCount: windowSize
    };
  }

  private async getBaselinePerformance(session: any) {
    // Simplified baseline performance
    return {
      accuracy: 0.85,
      loss: 0.08,
      sampleCount: 1000
    };
  }

  private calculatePerformanceDrift(baseline: any, recent: any) {
    const accuracyDegradation = baseline.accuracy - recent.accuracy;
    const lossDegradation = recent.loss - baseline.loss;
    
    return {
      degradation: Math.max(accuracyDegradation / baseline.accuracy, lossDegradation / baseline.loss),
      sudden: accuracyDegradation > 0.1, // More than 10% sudden drop
      confidence: Math.min(0.95, Math.abs(accuracyDegradation) * 5)
    };
  }

  private calculateDistributionDrift(newData: any[], session: any) {
    // Simplified KL divergence calculation
    const klDivergence = Math.random() * 0.2; // Placeholder
    
    return {
      klDivergence,
      confidence: Math.min(0.9, klDivergence * 3)
    };
  }

  private calculateDriftSeverity(degradation: number): DriftSeverity {
    if (degradation > 0.3) return DriftSeverity.CRITICAL;
    if (degradation > 0.2) return DriftSeverity.HIGH;
    if (degradation > 0.1) return DriftSeverity.MEDIUM;
    return DriftSeverity.LOW;
  }

  private generateDriftRecommendation(driftType: DriftType, severity: DriftSeverity): string {
    const recommendations = {
      [DriftType.SUDDEN]: {
        [DriftSeverity.CRITICAL]: "Immediate model retraining required with recent data",
        [DriftSeverity.HIGH]: "Increase learning rate and reduce model complexity",
        [DriftSeverity.MEDIUM]: "Monitor closely and increase adaptation rate",
        [DriftSeverity.LOW]: "Continue monitoring with standard parameters"
      },
      [DriftType.GRADUAL]: {
        [DriftSeverity.CRITICAL]: "Progressive retraining with increased learning rate",
        [DriftSeverity.HIGH]: "Gradual parameter adjustment over time",
        [DriftSeverity.MEDIUM]: "Increase sensitivity to new patterns",
        [DriftSeverity.LOW]: "Minor parameter tuning sufficient"
      },
      [DriftType.RECURRING]: {
        [DriftSeverity.CRITICAL]: "Pattern-based retraining with historical data",
        [DriftSeverity.HIGH]: "Implement cyclical adaptation strategy",
        [DriftSeverity.MEDIUM]: "Adjust for recurring patterns",
        [DriftSeverity.LOW]: "Monitor cyclical behavior"
      },
      [DriftType.INCREMENTAL]: {
        [DriftSeverity.CRITICAL]: "Continuous incremental learning required",
        [DriftSeverity.HIGH]: "Enable continuous adaptation mode",
        [DriftSeverity.MEDIUM]: "Increase incremental update frequency",
        [DriftSeverity.LOW]: "Standard incremental updates"
      },
      [DriftType.CYCLICAL]: {
        [DriftSeverity.CRITICAL]: "Seasonal model retraining needed",
        [DriftSeverity.HIGH]: "Implement seasonal adaptation patterns",
        [DriftSeverity.MEDIUM]: "Adjust for seasonal variations",
        [DriftSeverity.LOW]: "Monitor seasonal patterns"
      }
    };

    return recommendations[driftType]?.[severity] || "Monitor and adapt parameters as needed";
  }

  private selectAdaptationStrategy(severity: DriftSeverity, driftType: DriftType): string {
    if (severity === DriftSeverity.CRITICAL) {
      return 'aggressive_retraining';
    } else if (severity === DriftSeverity.HIGH) {
      return driftType === DriftType.SUDDEN ? 'rapid_adaptation' : 'gradual_adaptation';
    } else {
      return 'parameter_tuning';
    }
  }

  private calculateAdaptationRate(drifts: any[]): number {
    const adaptedDrifts = drifts.filter(d => d.status === 'ADAPTED' || d.status === 'ADAPTING');
    return drifts.length > 0 ? adaptedDrifts.length / drifts.length : 1;
  }

  private calculatePerformanceTrends(metrics: any[]) {
    if (metrics.length === 0) return [];

    const groupedMetrics: Record<string, any[]> = metrics.reduce((acc: Record<string, any[]>, metric) => {
      if (!acc[metric.metricName]) acc[metric.metricName] = [];
      acc[metric.metricName].push({
        value: metric.metricValue,
        timestamp: metric.timestamp
      });
      return acc;
    }, {});

    return Object.entries(groupedMetrics).map(([metricName, values]) => {
      const sortedValues = values.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const trend = this.calculateTrend(sortedValues.map(v => v.value));
      
      return {
        metricName,
        trend,
        changePercentage: this.calculateChangePercentage(sortedValues),
        timeline: sortedValues
      };
    });
  }

  private calculateLearningEfficiency(sessions: any[], metrics: any[]): number {
    if (sessions.length === 0) return 0;

    const totalSamples = sessions.reduce((sum, s) => sum + s.samplesProcessed, 0);
    const avgLoss = sessions.reduce((sum, s) => sum + (s.avgLoss || 0), 0) / sessions.length;
    
    // Efficiency = samples processed / average loss (higher is better)
    return totalSamples / Math.max(avgLoss, 0.01);
  }

  private calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    const changeThreshold = 0.05; // 5% threshold
    const changePercentage = (secondAvg - firstAvg) / firstAvg;
    
    if (changePercentage > changeThreshold) return 'improving';
    if (changePercentage < -changeThreshold) return 'declining';
    return 'stable';
  }

  private calculateChangePercentage(values: any[]): number {
    if (values.length < 2) return 0;
    const first = values[0].value;
    const last = values[values.length - 1].value;
    return ((last - first) / first) * 100;
  }
}

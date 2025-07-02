
/**
 * ML Dashboard API - Dashboard statistics and metrics
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prisma } = await import('@/lib/db');
    
    // Get ML dashboard statistics
    const [
      totalModels,
      activeModels,
      trainingJobs,
      predictions,
      anomalies,
      experiments,
      pipelines
    ] = await Promise.all([
      prisma.mLModel.count({
        where: { tenantId: session.user.tenantId }
      }),
      prisma.mLModel.count({
        where: { 
          tenantId: session.user.tenantId,
          status: 'DEPLOYED',
          isActive: true 
        }
      }),
      prisma.mLTrainingJob.count({
        where: { 
          tenantId: session.user.tenantId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      prisma.mLPrediction.count({
        where: { 
          tenantId: session.user.tenantId,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      prisma.mLAnomalyDetection.count({
        where: { 
          tenantId: session.user.tenantId,
          status: 'OPEN',
          isAnomaly: true
        }
      }),
      prisma.mLExperiment.count({
        where: { 
          tenantId: session.user.tenantId,
          isActive: true
        }
      }),
      prisma.mLDataPipeline.count({
        where: { 
          tenantId: session.user.tenantId,
          isActive: true
        }
      })
    ]);

    // Calculate average accuracy of active models
    const modelsWithAccuracy = await prisma.mLModel.findMany({
      where: {
        tenantId: session.user.tenantId,
        status: 'DEPLOYED',
        accuracy: { not: null }
      },
      select: { accuracy: true }
    });

    const avgAccuracy = modelsWithAccuracy.length > 0 
      ? modelsWithAccuracy.reduce((sum, model) => sum + (model.accuracy || 0), 0) / modelsWithAccuracy.length
      : 0;

    // Get recent training job statistics
    const recentTrainingJobs = await prisma.mLTrainingJob.findMany({
      where: {
        tenantId: session.user.tenantId,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      },
      include: {
        model: {
          select: { name: true, type: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    // Get recent predictions by type
    const predictionsByType = await prisma.mLPrediction.groupBy({
      by: ['predictionType'],
      where: {
        tenantId: session.user.tenantId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      _count: {
        predictionType: true
      }
    });

    // Get anomalies by severity
    const anomaliesBySeverity = await prisma.mLAnomalyDetection.groupBy({
      by: ['severity'],
      where: {
        tenantId: session.user.tenantId,
        status: 'OPEN',
        isAnomaly: true
      },
      _count: {
        severity: true
      }
    });

    // Get model performance trends (last 30 days)
    const performanceMetrics = await prisma.mLModelMetrics.findMany({
      where: {
        tenantId: session.user.tenantId,
        evaluationDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        model: {
          select: { name: true, type: true }
        }
      },
      orderBy: { evaluationDate: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalModels,
          activeModels,
          trainingJobs,
          predictions,
          anomaliesDetected: anomalies,
          avgAccuracy: Math.round(avgAccuracy * 100) / 100,
          pipelineRuns: pipelines,
          experiments
        },
        recentActivity: {
          trainingJobs: recentTrainingJobs,
          predictionsByType: predictionsByType.map(p => ({
            type: p.predictionType,
            count: p._count.predictionType
          })),
          anomaliesBySeverity: anomaliesBySeverity.map(a => ({
            severity: a.severity,
            count: a._count.severity
          }))
        },
        performance: {
          metrics: performanceMetrics.slice(0, 20), // Latest 20 metrics
          trends: {
            // Calculate weekly trends
            weeklyPredictions: Math.round(predictions / 4.3), // Approximate weekly average
            weeklyAnomalies: Math.round(anomalies / 4.3),
            modelAccuracyTrend: avgAccuracy > 0.8 ? 'increasing' : 'stable'
          }
        }
      }
    });
  } catch (error) {
    console.error('Get ML dashboard error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ML dashboard data' },
      { status: 500 }
    );
  }
}


/**
 * Concept Drift Detection API - Monitor and manage concept drift
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContinuousLearningService } from '@/lib/ai/continuous-learning-service';
import { ModelPerformanceMetric } from '@/lib/types';

export const dynamic = "force-dynamic";

const continuousLearningService = new ContinuousLearningService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');

    const { prisma } = await import('@/lib/db');
    const drifts = await prisma.conceptDrift.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(severity && { severity: severity as any }),
        ...(status && { status: status as any })
      },
      include: {
        model: {
          select: { name: true, type: true }
        },
        agent: {
          select: { name: true, agentType: true }
        }
      },
      orderBy: { detectedAt: 'desc' },
      take: limit
    });

    return NextResponse.json({ success: true, data: drifts });
  } catch (error) {
    console.error('Error in drift detection GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch concept drifts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, driftId, metricData } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'acknowledge':
        if (!driftId) {
          return NextResponse.json(
            { error: 'Drift ID is required for acknowledgment' },
            { status: 400 }
          );
        }

        const { prisma } = await import('@/lib/db');
        result = await prisma.conceptDrift.update({
          where: { id: driftId },
          data: {
            status: 'ACKNOWLEDGED',
            acknowledgedAt: new Date()
          }
        });
        break;

      case 'record_metric':
        if (!metricData) {
          return NextResponse.json(
            { error: 'Metric data is required' },
            { status: 400 }
          );
        }

        const metric: ModelPerformanceMetric = {
          modelId: metricData.modelId,
          agentId: metricData.agentId,
          metricName: metricData.metricName,
          metricValue: metricData.metricValue,
          baseline: metricData.baseline,
          improvement: metricData.improvement,
          dataWindow: metricData.dataWindow || 'HOUR',
          timestamp: new Date(),
          environment: metricData.environment
        };

        await continuousLearningService.recordPerformanceMetric(
          metric,
          session.user.tenantId
        );

        result = { success: true };
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "acknowledge" or "record_metric"' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: `Drift ${action} successful`
    });
  } catch (error) {
    console.error('Error in drift detection POST:', error);
    return NextResponse.json(
      { error: `Failed to process drift action` },
      { status: 500 }
    );
  }
}


/**
 * Continuous Learning Sessions API - Manage online learning sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContinuousLearningService } from '@/lib/ai/continuous-learning-service';
import { OnlineLearningConfig, OnlineLearningUpdate } from '@/lib/types';

export const dynamic = "force-dynamic";

const continuousLearningService = new ContinuousLearningService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, sessionId, config, update } = body;

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'start':
        if (!config) {
          return NextResponse.json(
            { error: 'Configuration is required for starting session' },
            { status: 400 }
          );
        }

        const learningConfig: OnlineLearningConfig = {
          modelId: config.modelId,
          agentId: config.agentId,
          sessionType: config.sessionType || 'INCREMENTAL',
          learningRate: config.learningRate || 0.01,
          adaptationRate: config.adaptationRate || 0.1,
          batchSize: config.batchSize || 32,
          updateFrequency: config.updateFrequency || 100,
          memorySize: config.memorySize
        };

        const newSessionId = await continuousLearningService.startOnlineLearningSession(
          learningConfig,
          session.user.tenantId
        );

        result = { sessionId: newSessionId };
        break;

      case 'update':
        if (!sessionId || !update) {
          return NextResponse.json(
            { error: 'Session ID and update data are required' },
            { status: 400 }
          );
        }

        const learningUpdate: OnlineLearningUpdate = {
          sessionId,
          newData: update.newData,
          labels: update.labels,
          feedback: update.feedback,
          performanceMetrics: update.performanceMetrics || {},
          adaptations: update.adaptations || {}
        };

        result = await continuousLearningService.processIncrementalUpdate(
          sessionId,
          learningUpdate
        );
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "start" or "update"' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: `Session ${action} successful`
    });
  } catch (error) {
    console.error('Error in continuous learning sessions POST:', error);
    return NextResponse.json(
      { error: `Failed to process learning session` },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    const { prisma } = await import('@/lib/db');

    if (sessionId) {
      // Get specific learning session
      const learningSession = await prisma.onlineLearningSession.findUnique({
        where: { id: sessionId },
        include: {
          model: true,
          agent: true
        }
      });

      if (!learningSession || learningSession.tenantId !== session.user.tenantId) {
        return NextResponse.json({ error: 'Learning session not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: learningSession });
    } else {
      // Get all learning sessions
      const sessions = await prisma.onlineLearningSession.findMany({
        where: { tenantId: session.user.tenantId },
        include: {
          model: {
            select: { name: true, type: true }
          },
          agent: {
            select: { name: true, agentType: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return NextResponse.json({ success: true, data: sessions });
    }
  } catch (error) {
    console.error('Error in continuous learning sessions GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch learning sessions' },
      { status: 500 }
    );
  }
}

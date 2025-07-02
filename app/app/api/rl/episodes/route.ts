
/**
 * RL Episodes API - Manage learning episodes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ReinforcementLearningService } from '@/lib/ai/reinforcement-learning-service';

export const dynamic = "force-dynamic";

const rlService = new ReinforcementLearningService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, agentId, success } = body;

    if (!action || !agentId) {
      return NextResponse.json(
        { error: 'Action and agent ID are required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'start':
        const episodeId = await rlService.startEpisode(agentId);
        result = { episodeId };
        break;
      
      case 'end':
        const { episodeId: endEpisodeId } = body;
        if (!endEpisodeId) {
          return NextResponse.json(
            { error: 'Episode ID is required for ending episode' },
            { status: 400 }
          );
        }
        result = await rlService.endEpisode(endEpisodeId, success || false);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "start" or "end"' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: `Episode ${action} successful`
    });
  } catch (error) {
    console.error('Error in RL episodes POST:', error);
    return NextResponse.json(
      { error: `Failed to process episode` },
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
    const agentId = searchParams.get('agentId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    const { prisma } = await import('@/lib/db');
    const episodes = await prisma.rLEpisode.findMany({
      where: { agentId },
      include: {
        actions: {
          orderBy: { step: 'asc' }
        },
        rewards: {
          orderBy: { timestamp: 'asc' }
        }
      },
      orderBy: { episodeNumber: 'desc' },
      take: limit
    });

    return NextResponse.json({ success: true, data: episodes });
  } catch (error) {
    console.error('Error in RL episodes GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch episodes' },
      { status: 500 }
    );
  }
}

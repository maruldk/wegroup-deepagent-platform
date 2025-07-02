
/**
 * RL Agents API - Create and manage reinforcement learning agents
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ReinforcementLearningService } from '@/lib/ai/reinforcement-learning-service';
import { RLAgentConfig } from '@/lib/types';

export const dynamic = "force-dynamic";

const rlService = new ReinforcementLearningService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get('agentId');

    if (agentId) {
      // Get specific agent metrics
      const metrics = await rlService.getAgentMetrics(agentId);
      return NextResponse.json({ success: true, data: metrics });
    } else {
      // Get all agents for tenant
      const { prisma } = await import('@/lib/db');
      const agents = await prisma.rLAgent.findMany({
        where: { tenantId: session.user.tenantId },
        include: {
          episodes: {
            where: { isCompleted: true },
            orderBy: { episodeNumber: 'desc' },
            take: 5
          },
          _count: {
            select: {
              episodes: true,
              rewards: true,
              actions: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      return NextResponse.json({ success: true, data: agents });
    }
  } catch (error) {
    console.error('Error in RL agents GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch RL agents' },
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
    const { name, agentType, environment, hyperparameters } = body;

    if (!agentType || !environment) {
      return NextResponse.json(
        { error: 'Agent type and environment are required' },
        { status: 400 }
      );
    }

    const config: RLAgentConfig = {
      agentType,
      environment,
      hyperparameters: {
        learningRate: hyperparameters?.learningRate || 0.01,
        explorationRate: hyperparameters?.explorationRate || 0.1,
        discountFactor: hyperparameters?.discountFactor || 0.95,
        ...hyperparameters
      }
    };

    const agent = await rlService.createAgent(
      config,
      session.user.tenantId,
      session.user.id
    );

    return NextResponse.json({ 
      success: true, 
      data: agent,
      message: 'RL agent created successfully'
    });
  } catch (error) {
    console.error('Error in RL agents POST:', error);
    return NextResponse.json(
      { error: 'Failed to create RL agent' },
      { status: 500 }
    );
  }
}

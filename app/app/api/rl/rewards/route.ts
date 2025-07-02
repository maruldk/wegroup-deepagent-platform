
/**
 * RL Rewards API - Process rewards for reinforcement learning
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ReinforcementLearningService } from '@/lib/ai/reinforcement-learning-service';
import { RLReward } from '@/lib/types';

export const dynamic = "force-dynamic";

const rlService = new ReinforcementLearningService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, rewardValue, rewardType, source, context, actionId, episodeId } = body;

    if (!agentId || rewardValue === undefined) {
      return NextResponse.json(
        { error: 'Agent ID and reward value are required' },
        { status: 400 }
      );
    }

    const reward: RLReward = {
      value: rewardValue,
      type: rewardType || 'IMMEDIATE',
      source: source || 'SYSTEM',
      context
    };

    const result = await rlService.processReward(agentId, reward, actionId, episodeId);

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'Reward processed successfully'
    });
  } catch (error) {
    console.error('Error in RL rewards POST:', error);
    return NextResponse.json(
      { error: 'Failed to process reward' },
      { status: 500 }
    );
  }
}

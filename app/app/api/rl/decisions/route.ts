
/**
 * RL Decisions API - Make decisions using reinforcement learning agents
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ReinforcementLearningService } from '@/lib/ai/reinforcement-learning-service';
import { RLDecisionRequest } from '@/lib/types';

export const dynamic = "force-dynamic";

const rlService = new ReinforcementLearningService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { agentId, state, availableActions, context } = body;

    if (!agentId || !state || !availableActions) {
      return NextResponse.json(
        { error: 'Agent ID, state, and available actions are required' },
        { status: 400 }
      );
    }

    const decisionRequest: RLDecisionRequest = {
      agentId,
      state: {
        data: state.data || state,
        hash: state.hash || '',
        features: state.features || [],
        isTerminal: state.isTerminal || false
      },
      availableActions,
      context
    };

    const decision = await rlService.makeDecision(decisionRequest);

    // Record the decision for learning
    const startTime = Date.now();
    const decisionTime = Date.now() - startTime;

    return NextResponse.json({ 
      success: true, 
      data: {
        ...decision,
        decisionTime,
        timestamp: new Date().toISOString()
      },
      message: 'Decision made successfully'
    });
  } catch (error) {
    console.error('Error in RL decisions POST:', error);
    return NextResponse.json(
      { error: 'Failed to make RL decision' },
      { status: 500 }
    );
  }
}

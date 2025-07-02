
/**
 * Hyperparameter Tuning API - Automated parameter optimization
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SelfOptimizationService } from '@/lib/ai/self-optimization-service';
import { HyperparameterTuningConfig } from '@/lib/types';

export const dynamic = "force-dynamic";

const optimizationService = new SelfOptimizationService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      modelId, 
      agentId, 
      tuningMethod, 
      searchSpace, 
      objective, 
      maxIterations,
      constraints 
    } = body;

    if (!tuningMethod || !searchSpace || !objective) {
      return NextResponse.json(
        { error: 'Tuning method, search space, and objective are required' },
        { status: 400 }
      );
    }

    if (!modelId && !agentId) {
      return NextResponse.json(
        { error: 'Either model ID or agent ID must be provided' },
        { status: 400 }
      );
    }

    const config: HyperparameterTuningConfig = {
      modelId,
      agentId,
      tuningMethod,
      searchSpace,
      objective,
      maxIterations: maxIterations || 100,
      constraints
    };

    const tuningId = await optimizationService.startHyperparameterTuning(
      config,
      session.user.tenantId,
      session.user.id
    );

    return NextResponse.json({ 
      success: true, 
      data: { tuningId },
      message: 'Hyperparameter tuning started successfully'
    });
  } catch (error) {
    console.error('Error in hyperparameter tuning POST:', error);
    return NextResponse.json(
      { error: 'Failed to start hyperparameter tuning' },
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
    const tuningId = searchParams.get('tuningId');

    if (tuningId) {
      // Get specific tuning experiment
      const { prisma } = await import('@/lib/db');
      const tuning = await prisma.hyperparameterTuning.findUnique({
        where: { id: tuningId },
        include: {
          model: true,
          agent: true
        }
      });

      if (!tuning || tuning.tenantId !== session.user.tenantId) {
        return NextResponse.json({ error: 'Tuning experiment not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: tuning });
    } else {
      // Get all tuning experiments
      const { prisma } = await import('@/lib/db');
      const tunings = await prisma.hyperparameterTuning.findMany({
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

      return NextResponse.json({ success: true, data: tunings });
    }
  } catch (error) {
    console.error('Error in hyperparameter tuning GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hyperparameter tuning experiments' },
      { status: 500 }
    );
  }
}

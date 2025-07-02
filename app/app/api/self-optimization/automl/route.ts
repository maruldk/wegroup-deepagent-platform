
/**
 * AutoML API - Automated machine learning experiments
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SelfOptimizationService } from '@/lib/ai/self-optimization-service';
import { AutoMLExperimentConfig } from '@/lib/types';

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
      name,
      description,
      experimentType, 
      dataset, 
      objective, 
      constraints,
      searchSpace,
      maxTrials,
      timeLimit
    } = body;

    if (!name || !experimentType || !dataset || !objective) {
      return NextResponse.json(
        { error: 'Name, experiment type, dataset, and objective are required' },
        { status: 400 }
      );
    }

    const config: AutoMLExperimentConfig = {
      name,
      experimentType,
      dataset,
      objective,
      constraints,
      searchSpace: searchSpace || {},
      maxTrials: maxTrials || 50,
      timeLimit
    };

    const experimentId = await optimizationService.startAutoMLExperiment(
      config,
      session.user.tenantId,
      session.user.id
    );

    return NextResponse.json({ 
      success: true, 
      data: { experimentId },
      message: 'AutoML experiment started successfully'
    });
  } catch (error) {
    console.error('Error in AutoML POST:', error);
    return NextResponse.json(
      { error: 'Failed to start AutoML experiment' },
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
    const experimentId = searchParams.get('experimentId');

    if (experimentId) {
      // Get specific AutoML experiment
      const { prisma } = await import('@/lib/db');
      const experiment = await prisma.autoMLExperiment.findUnique({
        where: { id: experimentId }
      });

      if (!experiment || experiment.tenantId !== session.user.tenantId) {
        return NextResponse.json({ error: 'AutoML experiment not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, data: experiment });
    } else {
      // Get all AutoML experiments
      const { prisma } = await import('@/lib/db');
      const experiments = await prisma.autoMLExperiment.findMany({
        where: { tenantId: session.user.tenantId },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return NextResponse.json({ success: true, data: experiments });
    }
  } catch (error) {
    console.error('Error in AutoML GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AutoML experiments' },
      { status: 500 }
    );
  }
}

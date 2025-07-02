
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ResourceOptimizationService from '@/lib/services/resource-optimization-service';
import { OptimizationStrategy } from '@prisma/client';

export const dynamic = 'force-dynamic';

const resourceOptimizationService = new ResourceOptimizationService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { strategy, userIds, projectIds } = body;
    const tenantId = session.user.tenantId;

    if (!strategy || !userIds || !projectIds || !Array.isArray(userIds) || !Array.isArray(projectIds) || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: strategy, userIds (array), projectIds (array)' 
      }, { status: 400 });
    }

    // Validate strategy
    if (!Object.values(OptimizationStrategy).includes(strategy)) {
      return NextResponse.json({ 
        error: 'Invalid optimization strategy' 
      }, { status: 400 });
    }

    const optimizationResult = await resourceOptimizationService.executeOptimizationStrategy(
      strategy,
      userIds,
      projectIds,
      tenantId
    );

    return NextResponse.json({
      success: true,
      data: optimizationResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error executing optimization strategy:', error);
    return NextResponse.json(
      { error: 'Failed to execute optimization strategy' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const strategy = searchParams.get('strategy');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tenantId = session.user.tenantId;

    // Get optimization history from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const where: any = { tenantId };
    if (strategy) where.strategy = strategy;

    const optimizations = await prisma.resourceOptimization.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        strategy: true,
        targetMetric: true,
        currentValue: true,
        targetValue: true,
        estimatedImprovement: true,
        priority: true,
        status: true,
        implementedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: optimizations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching optimization history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch optimization history' },
      { status: 500 }
    );
  }
}

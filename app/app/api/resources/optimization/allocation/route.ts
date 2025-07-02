
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
    const { userIds, projectIds, strategy = OptimizationStrategy.LOAD_BALANCING } = body;
    const tenantId = session.user.tenantId;

    if (!userIds || !projectIds || !Array.isArray(userIds) || !Array.isArray(projectIds) || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: userIds (array), projectIds (array)' 
      }, { status: 400 });
    }

    // Validate strategy
    if (!Object.values(OptimizationStrategy).includes(strategy)) {
      return NextResponse.json({ 
        error: 'Invalid optimization strategy' 
      }, { status: 400 });
    }

    const allocationPlans = await resourceOptimizationService.optimizeResourceAllocation(
      userIds,
      projectIds,
      tenantId,
      strategy
    );

    return NextResponse.json({
      success: true,
      data: allocationPlans,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error optimizing resource allocation:', error);
    return NextResponse.json(
      { error: 'Failed to optimize resource allocation' },
      { status: 500 }
    );
  }
}

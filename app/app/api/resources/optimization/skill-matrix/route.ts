
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ResourceOptimizationService from '@/lib/services/resource-optimization-service';

export const dynamic = 'force-dynamic';

const resourceOptimizationService = new ResourceOptimizationService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userIds, projectIds } = body;
    const tenantId = session.user.tenantId;

    if (!userIds || !Array.isArray(userIds) || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: userIds (array)' 
      }, { status: 400 });
    }

    const skillMatrixOptimization = await resourceOptimizationService.optimizeSkillMatrix(
      userIds,
      tenantId,
      projectIds
    );

    return NextResponse.json({
      success: true,
      data: skillMatrixOptimization,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error optimizing skill matrix:', error);
    return NextResponse.json(
      { error: 'Failed to optimize skill matrix' },
      { status: 500 }
    );
  }
}

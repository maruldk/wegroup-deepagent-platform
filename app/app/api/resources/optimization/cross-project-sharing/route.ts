
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
    const { projectIds } = body;
    const tenantId = session.user.tenantId;

    if (!projectIds || !Array.isArray(projectIds) || projectIds.length < 2 || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: projectIds (array with at least 2 projects)' 
      }, { status: 400 });
    }

    const crossProjectOptimization = await resourceOptimizationService.optimizeCrossProjectResourceSharing(
      projectIds,
      tenantId
    );

    return NextResponse.json({
      success: true,
      data: crossProjectOptimization,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error optimizing cross-project resource sharing:', error);
    return NextResponse.json(
      { error: 'Failed to optimize cross-project resource sharing' },
      { status: 500 }
    );
  }
}

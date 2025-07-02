
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
    const { userIds, forecastPeriods = 12 } = body;
    const tenantId = session.user.tenantId;

    if (!userIds || !Array.isArray(userIds) || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: userIds (array)' 
      }, { status: 400 });
    }

    const capacityPlan = await resourceOptimizationService.analyzeResourceCapacity(
      userIds,
      tenantId,
      forecastPeriods
    );

    return NextResponse.json({
      success: true,
      data: capacityPlan,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing resource capacity:', error);
    return NextResponse.json(
      { error: 'Failed to analyze resource capacity' },
      { status: 500 }
    );
  }
}

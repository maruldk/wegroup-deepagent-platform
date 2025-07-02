
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TeamPerformanceService from '@/lib/services/team-performance-service';

export const dynamic = 'force-dynamic';

const teamPerformanceService = new TeamPerformanceService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userIds, period = 'MONTHLY', projectId } = body;
    const tenantId = session.user.tenantId;

    if (!userIds || !Array.isArray(userIds) || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: userIds (array)' 
      }, { status: 400 });
    }

    const productivityMetrics = await teamPerformanceService.calculateTeamProductivityMetrics(
      userIds,
      tenantId,
      period,
      projectId
    );

    return NextResponse.json({
      success: true,
      data: productivityMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating team productivity metrics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate team productivity metrics' },
      { status: 500 }
    );
  }
}

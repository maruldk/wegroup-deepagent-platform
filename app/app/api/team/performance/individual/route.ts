
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TeamPerformanceService from '@/lib/services/team-performance-service';

export const dynamic = 'force-dynamic';

const teamPerformanceService = new TeamPerformanceService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || 'MONTHLY';
    const projectId = searchParams.get('projectId') || undefined;
    const tenantId = session.user.tenantId;

    if (!userId || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: userId' 
      }, { status: 400 });
    }

    const performance = await teamPerformanceService.calculateTeamMemberPerformance(
      userId,
      tenantId,
      period,
      projectId
    );

    return NextResponse.json({
      success: true,
      data: performance,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating team member performance:', error);
    return NextResponse.json(
      { error: 'Failed to calculate team member performance' },
      { status: 500 }
    );
  }
}

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

    const performances = [];
    for (const userId of userIds) {
      const performance = await teamPerformanceService.calculateTeamMemberPerformance(
        userId,
        tenantId,
        period,
        projectId
      );
      performances.push(performance);
    }

    return NextResponse.json({
      success: true,
      data: performances,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating multiple team member performances:', error);
    return NextResponse.json(
      { error: 'Failed to calculate team member performances' },
      { status: 500 }
    );
  }
}

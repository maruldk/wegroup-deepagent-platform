
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
    const { userIds } = body;
    const tenantId = session.user.tenantId;

    if (!userIds || !Array.isArray(userIds) || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: userIds (array)' 
      }, { status: 400 });
    }

    const burnoutAssessments = await teamPerformanceService.assessBurnoutRiskForTeam(
      userIds,
      tenantId
    );

    return NextResponse.json({
      success: true,
      data: burnoutAssessments,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error assessing burnout risk:', error);
    return NextResponse.json(
      { error: 'Failed to assess burnout risk' },
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
    const userId = searchParams.get('userId');
    const tenantId = session.user.tenantId;

    if (!userId || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: userId' 
      }, { status: 400 });
    }

    const burnoutAssessment = await teamPerformanceService.assessBurnoutRiskForTeam(
      [userId],
      tenantId
    );

    return NextResponse.json({
      success: true,
      data: burnoutAssessment[0] || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching individual burnout risk:', error);
    return NextResponse.json(
      { error: 'Failed to fetch burnout risk assessment' },
      { status: 500 }
    );
  }
}

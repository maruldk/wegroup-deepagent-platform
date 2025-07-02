
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ProjectAnalyticsService from '@/lib/services/project-analytics-service';

export const dynamic = 'force-dynamic';

const projectAnalyticsService = new ProjectAnalyticsService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const tenantId = session.user.tenantId;

    if (!projectId || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: projectId' 
      }, { status: 400 });
    }

    const healthScore = await projectAnalyticsService.calculateProjectHealthScore(projectId, tenantId);

    return NextResponse.json({
      success: true,
      data: healthScore,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating project health score:', error);
    return NextResponse.json(
      { error: 'Failed to calculate project health score' },
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
    const { projectIds } = body;
    const tenantId = session.user.tenantId;

    if (!projectIds || !Array.isArray(projectIds) || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: projectIds (array)' 
      }, { status: 400 });
    }

    const healthScores = [];
    for (const projectId of projectIds) {
      const healthScore = await projectAnalyticsService.calculateProjectHealthScore(projectId, tenantId);
      healthScores.push({ projectId, healthScore });
    }

    return NextResponse.json({
      success: true,
      data: healthScores,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating multiple project health scores:', error);
    return NextResponse.json(
      { error: 'Failed to calculate project health scores' },
      { status: 500 }
    );
  }
}

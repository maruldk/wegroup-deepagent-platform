
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

    const kpis = await projectAnalyticsService.calculateProjectKPIs(projectId, tenantId);

    return NextResponse.json({
      success: true,
      data: kpis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating project KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to calculate project KPIs' },
      { status: 500 }
    );
  }
}

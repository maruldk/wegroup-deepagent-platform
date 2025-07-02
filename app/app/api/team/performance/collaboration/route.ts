
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

    if (!userIds || !Array.isArray(userIds) || userIds.length < 2 || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: userIds (array with at least 2 members)' 
      }, { status: 400 });
    }

    const collaboration = await teamPerformanceService.analyzeTeamCollaboration(
      userIds,
      tenantId,
      period,
      projectId
    );

    return NextResponse.json({
      success: true,
      data: collaboration,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analyzing team collaboration:', error);
    return NextResponse.json(
      { error: 'Failed to analyze team collaboration' },
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
    const projectId = searchParams.get('projectId');
    const period = searchParams.get('period') || 'MONTHLY';
    const limit = parseInt(searchParams.get('limit') || '5');
    const tenantId = session.user.tenantId;

    // Get recent collaboration scores from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const where: any = { tenantId };
    if (projectId) where.projectId = projectId;

    const collaborationScores = await prisma.teamCollaborationScore.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: collaborationScores,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching collaboration scores:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaboration scores' },
      { status: 500 }
    );
  }
}

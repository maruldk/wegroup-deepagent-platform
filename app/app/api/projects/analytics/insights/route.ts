
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ProjectAnalyticsService from '@/lib/services/project-analytics-service';

export const dynamic = 'force-dynamic';

const projectAnalyticsService = new ProjectAnalyticsService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { projectId } = body;
    const tenantId = session.user.tenantId;

    if (!projectId || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: projectId' 
      }, { status: 400 });
    }

    const insights = await projectAnalyticsService.generateProjectInsights(projectId, tenantId);

    return NextResponse.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating project insights:', error);
    return NextResponse.json(
      { error: 'Failed to generate project insights' },
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
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');
    const isRead = searchParams.get('isRead');
    const limit = parseInt(searchParams.get('limit') || '20');
    const tenantId = session.user.tenantId;

    if (!projectId || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: projectId' 
      }, { status: 400 });
    }

    // Get insights from database with filters
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const where: any = { projectId, tenantId };
    if (type) where.type = type;
    if (priority) where.priority = priority;
    if (isRead !== null) where.isRead = isRead === 'true';

    const insights = await prisma.projectInsight.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching project insights:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project insights' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { insightId, isRead, isDismissed } = body;
    const tenantId = session.user.tenantId;

    if (!insightId || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: insightId' 
      }, { status: 400 });
    }

    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const updateData: any = {};
    if (isRead !== undefined) updateData.isRead = isRead;
    if (isDismissed !== undefined) updateData.isDismissed = isDismissed;

    const updatedInsight = await prisma.projectInsight.update({
      where: { 
        id: insightId,
        tenantId 
      },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: updatedInsight,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating project insight:', error);
    return NextResponse.json(
      { error: 'Failed to update project insight' },
      { status: 500 }
    );
  }
}

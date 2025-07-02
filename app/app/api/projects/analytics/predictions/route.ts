
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
    const userId = session.user.id;

    if (!projectId || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: projectId' 
      }, { status: 400 });
    }

    const predictions = await projectAnalyticsService.generateProjectPredictions(projectId, tenantId, userId);

    return NextResponse.json({
      success: true,
      data: predictions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating project predictions:', error);
    return NextResponse.json(
      { error: 'Failed to generate project predictions' },
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const tenantId = session.user.tenantId;

    if (!projectId || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: projectId' 
      }, { status: 400 });
    }

    // Get recent predictions from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const predictions = await prisma.projectPrediction.findMany({
      where: { projectId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: predictions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching project predictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project predictions' },
      { status: 500 }
    );
  }
}

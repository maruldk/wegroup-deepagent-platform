
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ProjectAnalyticsService from '@/lib/services/project-analytics-service';
import { ProjectAnalyticsReportType } from '@prisma/client';

export const dynamic = 'force-dynamic';

const projectAnalyticsService = new ProjectAnalyticsService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, projectIds, userIds = [], filters = {} } = body;
    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    if (!type || !projectIds || !Array.isArray(projectIds) || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: type, projectIds (array)' 
      }, { status: 400 });
    }

    // Validate report type
    if (!Object.values(ProjectAnalyticsReportType).includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid report type' 
      }, { status: 400 });
    }

    const report = await projectAnalyticsService.generateAnalyticsReport(
      type,
      projectIds,
      userIds,
      filters,
      tenantId,
      userId
    );

    return NextResponse.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating analytics report:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics report' },
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
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tenantId = session.user.tenantId;

    // Get reports from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const where: any = { tenantId };
    if (type) where.type = type;

    const reports = await prisma.projectAnalyticsReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        projectIds: true,
        userIds: true,
        generatedBy: true,
        format: true,
        fileUrl: true,
        isScheduled: true,
        createdAt: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      success: true,
      data: reports,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching analytics reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics reports' },
      { status: 500 }
    );
  }
}

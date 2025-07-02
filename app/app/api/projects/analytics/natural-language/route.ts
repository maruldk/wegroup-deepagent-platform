
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
    const { query, projectIds } = body;
    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    if (!query || !projectIds || !Array.isArray(projectIds) || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: query, projectIds (array)' 
      }, { status: 400 });
    }

    const response = await projectAnalyticsService.processNaturalLanguageQuery(
      query,
      projectIds,
      tenantId,
      userId
    );

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing natural language query:', error);
    return NextResponse.json(
      { error: 'Failed to process natural language query' },
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const tenantId = session.user.tenantId;
    const userId = session.user.id;

    if (!tenantId || !userId) {
      return NextResponse.json({ error: 'Missing tenant or user ID' }, { status: 400 });
    }

    // Get recent query history
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const queryHistory = await prisma.projectInsightQuery.findMany({
      where: { userId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: queryHistory,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching query history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch query history' },
      { status: 500 }
    );
  }
}

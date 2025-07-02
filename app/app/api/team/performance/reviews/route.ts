
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
    const { userId, period, projectId } = body;
    const tenantId = session.user.tenantId;
    const reviewerId = session.user.id;

    if (!userId || !period || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: userId, period' 
      }, { status: 400 });
    }

    const review = await teamPerformanceService.conductPerformanceReview(
      userId,
      reviewerId,
      tenantId,
      period,
      projectId
    );

    return NextResponse.json({
      success: true,
      data: review,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error conducting performance review:', error);
    return NextResponse.json(
      { error: 'Failed to conduct performance review' },
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
    const period = searchParams.get('period');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tenantId = session.user.tenantId;

    // Get performance reviews from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const where: any = { tenantId };
    if (userId) where.userId = userId;
    if (period) where.period = period;

    const reviews = await prisma.teamPerformanceReview.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        reviewer: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: reviews,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching performance reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch performance reviews' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import ResourceOptimizationService from '@/lib/services/resource-optimization-service';

export const dynamic = 'force-dynamic';

const resourceOptimizationService = new ResourceOptimizationService();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userIds, weeks = 12 } = body;
    const tenantId = session.user.tenantId;

    if (!userIds || !Array.isArray(userIds) || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: userIds (array)' 
      }, { status: 400 });
    }

    if (weeks < 1 || weeks > 52) {
      return NextResponse.json({ 
        error: 'Weeks parameter must be between 1 and 52' 
      }, { status: 400 });
    }

    const resourceForecasts = await resourceOptimizationService.forecastResourceAvailability(
      userIds,
      tenantId,
      weeks
    );

    return NextResponse.json({
      success: true,
      data: resourceForecasts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error forecasting resource availability:', error);
    return NextResponse.json(
      { error: 'Failed to forecast resource availability' },
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
    const period = searchParams.get('period') || 'WEEKLY';
    const limit = parseInt(searchParams.get('limit') || '10');
    const tenantId = session.user.tenantId;

    // Get resource utilization history from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const where: any = { tenantId };
    if (type) where.type = type;

    const utilizations = await prisma.resourceUtilization.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        },
        project: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: utilizations,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching resource utilization history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource utilization history' },
      { status: 500 }
    );
  }
}

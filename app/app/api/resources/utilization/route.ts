
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ResourceUtilizationType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type');
    const period = searchParams.get('period') || 'WEEKLY';
    const limit = parseInt(searchParams.get('limit') || '20');
    const tenantId = session.user.tenantId;

    // Get resource utilization data from database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const where: any = { tenantId };
    if (userId) where.userId = userId;
    if (projectId) where.projectId = projectId;
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

    // Calculate aggregate metrics
    const totalCapacity = utilizations.reduce((sum, util) => sum + util.totalCapacity, 0);
    const totalUtilized = utilizations.reduce((sum, util) => sum + util.utilizedCapacity, 0);
    const avgUtilizationRate = utilizations.length > 0 ? 
      utilizations.reduce((sum, util) => sum + util.utilizationRate, 0) / utilizations.length : 0;
    const avgEfficiency = utilizations.length > 0 ? 
      utilizations.filter(util => util.efficiency).reduce((sum, util) => sum + (util.efficiency || 0), 0) / 
      utilizations.filter(util => util.efficiency).length : 0;

    return NextResponse.json({
      success: true,
      data: {
        utilizations,
        summary: {
          totalCapacity,
          totalUtilized,
          avgUtilizationRate: Math.round(avgUtilizationRate * 100) / 100,
          avgEfficiency: Math.round(avgEfficiency * 100) / 100,
          availableCapacity: totalCapacity - totalUtilized
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching resource utilization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch resource utilization' },
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
    const { 
      userId, 
      projectId, 
      type, 
      totalCapacity, 
      utilizedCapacity, 
      efficiency, 
      cost, 
      period = 'WEEKLY',
      date = new Date(),
      metadata 
    } = body;
    const tenantId = session.user.tenantId;

    if (!type || totalCapacity === undefined || utilizedCapacity === undefined || !tenantId) {
      return NextResponse.json({ 
        error: 'Missing required parameters: type, totalCapacity, utilizedCapacity' 
      }, { status: 400 });
    }

    // Validate type
    if (!Object.values(ResourceUtilizationType).includes(type)) {
      return NextResponse.json({ 
        error: 'Invalid resource utilization type' 
      }, { status: 400 });
    }

    const utilizationRate = totalCapacity > 0 ? utilizedCapacity / totalCapacity : 0;

    // Save resource utilization to database
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    const resourceUtilization = await prisma.resourceUtilization.create({
      data: {
        userId,
        projectId,
        type,
        totalCapacity,
        utilizedCapacity,
        utilizationRate,
        efficiency,
        cost,
        period,
        date: new Date(date),
        metadata,
        tenantId
      }
    });

    return NextResponse.json({
      success: true,
      data: resourceUtilization,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error creating resource utilization:', error);
    return NextResponse.json(
      { error: 'Failed to create resource utilization' },
      { status: 500 }
    );
  }
}

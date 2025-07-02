
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where = {
      tenantId: session.user.tenantId,
    };

    const [dashboards, total] = await Promise.all([
      prisma.dashboard.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { name: true, email: true },
          },
          widgets: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.dashboard.count({ where }),
    ]);

    return NextResponse.json({
      dashboards,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get dashboards error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, description, layout, isDefault = false } = data;

    if (!name) {
      return NextResponse.json(
        { error: 'Dashboard-Name ist erforderlich' },
        { status: 400 }
      );
    }

    const dashboard = await prisma.dashboard.create({
      data: {
        name,
        description,
        layout,
        isDefault,
        tenantId: session.user.tenantId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        widgets: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DASHBOARD_CREATED',
        resource: 'DASHBOARD',
        resourceId: dashboard.id,
        details: { name: dashboard.name },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(dashboard, { status: 201 });
  } catch (error) {
    console.error('Create dashboard error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

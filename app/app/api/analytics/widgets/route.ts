
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
    const dashboardId = searchParams.get('dashboardId');

    const where: any = {
      tenantId: session.user.tenantId,
    };

    if (dashboardId) {
      where.dashboardId = dashboardId;
    }

    const widgets = await prisma.widget.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        dashboard: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json({ widgets });
  } catch (error) {
    console.error('Get widgets error:', error);
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
    const { dashboardId, name, type, config, position, size, dataSource } = data;

    if (!dashboardId || !name || !type) {
      return NextResponse.json(
        { error: 'Dashboard-ID, Name und Typ sind erforderlich' },
        { status: 400 }
      );
    }

    // Verify dashboard exists and belongs to tenant
    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: dashboardId,
        tenantId: session.user.tenantId,
      },
    });

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard nicht gefunden' },
        { status: 404 }
      );
    }

    const widget = await prisma.widget.create({
      data: {
        dashboardId,
        name,
        type,
        config,
        position,
        size,
        dataSource,
        tenantId: session.user.tenantId,
      },
      include: {
        dashboard: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(widget, { status: 201 });
  } catch (error) {
    console.error('Create widget error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

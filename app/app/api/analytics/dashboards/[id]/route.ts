
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dashboard = await prisma.dashboard.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        widgets: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!dashboard) {
      return NextResponse.json(
        { error: 'Dashboard nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Get dashboard error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const { name, description, layout, isDefault } = data;

    const existingDashboard = await prisma.dashboard.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingDashboard) {
      return NextResponse.json(
        { error: 'Dashboard nicht gefunden' },
        { status: 404 }
      );
    }

    const dashboard = await prisma.dashboard.update({
      where: { id: params.id },
      data: {
        name,
        description,
        layout,
        isDefault,
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
        action: 'DASHBOARD_UPDATED',
        resource: 'DASHBOARD',
        resourceId: dashboard.id,
        details: { name: dashboard.name },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Update dashboard error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingDashboard = await prisma.dashboard.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingDashboard) {
      return NextResponse.json(
        { error: 'Dashboard nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.dashboard.delete({
      where: { id: params.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DASHBOARD_DELETED',
        resource: 'DASHBOARD',
        resourceId: params.id,
        details: { name: existingDashboard.name },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete dashboard error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

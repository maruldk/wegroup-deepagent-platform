
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

    const widget = await prisma.widget.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        dashboard: {
          select: { name: true },
        },
      },
    });

    if (!widget) {
      return NextResponse.json(
        { error: 'Widget nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(widget);
  } catch (error) {
    console.error('Get widget error:', error);
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
    const { name, type, config, position, size, dataSource } = data;

    const existingWidget = await prisma.widget.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingWidget) {
      return NextResponse.json(
        { error: 'Widget nicht gefunden' },
        { status: 404 }
      );
    }

    const widget = await prisma.widget.update({
      where: { id: params.id },
      data: {
        name,
        type,
        config,
        position,
        size,
        dataSource,
      },
      include: {
        dashboard: {
          select: { name: true },
        },
      },
    });

    return NextResponse.json(widget);
  } catch (error) {
    console.error('Update widget error:', error);
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

    const existingWidget = await prisma.widget.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingWidget) {
      return NextResponse.json(
        { error: 'Widget nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.widget.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete widget error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

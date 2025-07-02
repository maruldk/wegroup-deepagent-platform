
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

    const metric = await prisma.metric.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!metric) {
      return NextResponse.json(
        { error: 'Metrik nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(metric);
  } catch (error) {
    console.error('Get metric error:', error);
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
    const { name, description, formula, target, currentValue } = data;

    const existingMetric = await prisma.metric.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingMetric) {
      return NextResponse.json(
        { error: 'Metrik nicht gefunden' },
        { status: 404 }
      );
    }

    const metric = await prisma.metric.update({
      where: { id: params.id },
      data: {
        name,
        description,
        formula,
        target,
        currentValue,
      },
    });

    return NextResponse.json(metric);
  } catch (error) {
    console.error('Update metric error:', error);
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

    const existingMetric = await prisma.metric.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingMetric) {
      return NextResponse.json(
        { error: 'Metrik nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.metric.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete metric error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

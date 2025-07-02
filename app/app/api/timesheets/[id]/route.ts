
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

    const timesheet = await prisma.timesheet.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        task: {
          select: { id: true, name: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!timesheet) {
      return NextResponse.json(
        { error: 'Zeiterfassung nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(timesheet);
  } catch (error) {
    console.error('Get timesheet error:', error);
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
    const { projectId, taskId, date, hours, description } = data;

    const existingTimesheet = await prisma.timesheet.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingTimesheet) {
      return NextResponse.json(
        { error: 'Zeiterfassung nicht gefunden' },
        { status: 404 }
      );
    }

    const timesheet = await prisma.timesheet.update({
      where: { id: params.id },
      data: {
        projectId,
        taskId,
        date: date ? new Date(date) : undefined,
        hours,
        description,
      },
      include: {
        project: {
          select: { id: true, name: true },
        },
        task: {
          select: { id: true, name: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json(timesheet);
  } catch (error) {
    console.error('Update timesheet error:', error);
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

    const existingTimesheet = await prisma.timesheet.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingTimesheet) {
      return NextResponse.json(
        { error: 'Zeiterfassung nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.timesheet.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete timesheet error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

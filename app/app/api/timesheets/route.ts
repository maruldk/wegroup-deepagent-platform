
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
    const userId = searchParams.get('userId') || session.user.id;
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: session.user.tenantId,
      userId,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const [timesheets, total] = await Promise.all([
      prisma.timesheet.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
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
      }),
      prisma.timesheet.count({ where }),
    ]);

    return NextResponse.json({
      timesheets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get timesheets error:', error);
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
    const { projectId, taskId, date, hours, description } = data;

    if (!date || !hours || hours <= 0) {
      return NextResponse.json(
        { error: 'Datum und gültige Stunden sind erforderlich' },
        { status: 400 }
      );
    }

    // Verify project exists if provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          tenantId: session.user.tenantId,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Projekt nicht gefunden' },
          { status: 404 }
        );
      }
    }

    // Verify task exists if provided
    if (taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          tenantId: session.user.tenantId,
        },
      });

      if (!task) {
        return NextResponse.json(
          { error: 'Task nicht gefunden' },
          { status: 404 }
        );
      }
    }

    const timesheet = await prisma.timesheet.create({
      data: {
        projectId,
        taskId,
        userId: session.user.id,
        date: new Date(date),
        hours,
        description,
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

    return NextResponse.json(timesheet, { status: 201 });
  } catch (error) {
    console.error('Create timesheet error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

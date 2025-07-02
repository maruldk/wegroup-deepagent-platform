
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

    // Verify project exists and belongs to tenant
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Projekt nicht gefunden' },
        { status: 404 }
      );
    }

    const tasks = await prisma.task.findMany({
      where: {
        projectId: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        assignee: {
          select: { name: true, email: true },
        },
        parentTask: {
          select: { id: true, name: true },
        },
        subtasks: {
          select: { id: true, name: true, status: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Get project tasks error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify project exists and belongs to tenant
    const project = await prisma.project.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Projekt nicht gefunden' },
        { status: 404 }
      );
    }

    const data = await request.json();
    const {
      name,
      description,
      status = 'TODO',
      priority = 'MEDIUM',
      assigneeId,
      startDate,
      dueDate,
      estimatedHours,
      parentTaskId,
    } = data;

    if (!name) {
      return NextResponse.json(
        { error: 'Task-Name ist erforderlich' },
        { status: 400 }
      );
    }

    // Verify assignee if provided
    if (assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: {
          id: assigneeId,
          tenantId: session.user.tenantId,
        },
      });

      if (!assignee) {
        return NextResponse.json(
          { error: 'Zugewiesener Benutzer nicht gefunden' },
          { status: 404 }
        );
      }
    }

    const task = await prisma.task.create({
      data: {
        projectId: params.id,
        name,
        description,
        status,
        priority,
        assigneeId,
        startDate: startDate ? new Date(startDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        estimatedHours,
        parentTaskId,
        tenantId: session.user.tenantId,
      },
      include: {
        assignee: {
          select: { name: true, email: true },
        },
        parentTask: {
          select: { id: true, name: true },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Create project task error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}


export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TaskManagementService } from '@/lib/services/task-management-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId') || undefined;
    const assigneeId = searchParams.get('assigneeId') || undefined;
    const status = searchParams.get('status') as any;
    const priority = searchParams.get('priority') as any;
    const parentTaskId = searchParams.has('parentTaskId') 
      ? searchParams.get('parentTaskId') 
      : undefined;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const tasks = await TaskManagementService.getTasks(
      session.user.tenantId,
      { projectId, assigneeId, status, priority, parentTaskId, limit, offset }
    );

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
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

    const body = await request.json();
    const { 
      name, 
      description, 
      projectId, 
      assigneeId, 
      priority, 
      startDate, 
      dueDate, 
      estimatedHours, 
      parentTaskId 
    } = body;

    if (!name || !projectId) {
      return NextResponse.json(
        { error: 'Task name and project ID are required' },
        { status: 400 }
      );
    }

    const task = await TaskManagementService.createTask({
      name,
      description,
      projectId,
      assigneeId,
      priority,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      parentTaskId,
      tenantId: session.user.tenantId,
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create task' },
      { status: 500 }
    );
  }
}

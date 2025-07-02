
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TaskManagementService } from '@/lib/services/task-management-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeInternal = searchParams.get('includeInternal') === 'true';

    const comments = await TaskManagementService.getTaskComments(
      params.id,
      session.user.tenantId,
      includeInternal
    );

    return NextResponse.json({ comments });
  } catch (error) {
    console.error('Error fetching task comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
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
    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, isInternal } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });
    }

    const comment = await TaskManagementService.addTaskComment({
      taskId: params.id,
      userId: session.user.id,
      content,
      isInternal: isInternal || false,
      tenantId: session.user.tenantId,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Error adding task comment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add comment' },
      { status: 500 }
    );
  }
}

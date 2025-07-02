
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ProjectManagementService } from '@/lib/services/project-management-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, role } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const member = await ProjectManagementService.addProjectMember(
      params.id,
      userId,
      role || 'Member',
      session.user.tenantId
    );

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    console.error('Error adding project member:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to add member' },
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await ProjectManagementService.removeProjectMember(
      params.id,
      userId,
      session.user.tenantId
    );

    return NextResponse.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Error removing project member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}


export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TaskManagementService } from '@/lib/services/task-management-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analytics = await TaskManagementService.getTaskAnalytics(
      params.projectId,
      session.user.tenantId
    );

    return NextResponse.json({ analytics });
  } catch (error) {
    console.error('Error fetching task analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task analytics' },
      { status: 500 }
    );
  }
}

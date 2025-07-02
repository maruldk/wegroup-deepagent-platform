
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TeamCollaborationService } from '@/lib/services/team-collaboration-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const timeframe = startDate && endDate ? {
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    } : undefined;

    const stats = await TeamCollaborationService.getTeamCollaborationStats(
      params.projectId,
      session.user.tenantId,
      timeframe
    );

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching collaboration stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch collaboration stats' },
      { status: 500 }
    );
  }
}

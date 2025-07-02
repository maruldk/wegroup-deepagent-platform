
/**
 * HYBRID SPRINT 2.1: Performance Statistics API
 * Get performance statistics and dashboard data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { performanceService } from '@/lib/monitoring/performance-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const timeRange = parseInt(searchParams.get('timeRange') || '24');

    const stats = await performanceService.getPerformanceStats(
      tenantId || undefined,
      timeRange
    );

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Performance statistics error:', error);
    return NextResponse.json(
      { error: 'Failed to get performance statistics' },
      { status: 500 }
    );
  }
}


/**
 * HYBRID SPRINT 2.1: Performance Alerts API
 * Get and acknowledge performance alerts
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

    const alerts = performanceService.getActiveAlerts();

    return NextResponse.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Performance alerts error:', error);
    return NextResponse.json(
      { error: 'Failed to get performance alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { alertId, action } = body;

    if (action === 'acknowledge' && alertId) {
      const success = performanceService.acknowledgeAlert(alertId);
      
      if (!success) {
        return NextResponse.json(
          { error: 'Alert not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: { acknowledged: true }
      });
    }

    return NextResponse.json(
      { error: 'Invalid action or missing alertId' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Performance alert action error:', error);
    return NextResponse.json(
      { error: 'Failed to process alert action' },
      { status: 500 }
    );
  }
}


/**
 * HYBRID SPRINT 2.1: Performance Metrics API
 * Record and retrieve performance metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { performanceService } from '@/lib/monitoring/performance-service';
import { PerformanceMetricType } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metricType, value, endpoint, additionalData, tenantId } = body;

    if (!metricType || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: metricType, value' },
        { status: 400 }
      );
    }

    const metric = await performanceService.recordMetric(
      metricType as PerformanceMetricType,
      value,
      endpoint,
      additionalData,
      tenantId
    );

    return NextResponse.json({
      success: true,
      data: metric
    });
  } catch (error) {
    console.error('Performance metric recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record performance metric' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const metricType = searchParams.get('metricType') as PerformanceMetricType;
    const endpoint = searchParams.get('endpoint');
    const tenantId = searchParams.get('tenantId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const limit = searchParams.get('limit');

    const filters: any = {};
    if (metricType) filters.metricType = metricType;
    if (endpoint) filters.endpoint = endpoint;
    if (tenantId) filters.tenantId = tenantId;
    if (startTime) filters.startTime = new Date(startTime);
    if (endTime) filters.endTime = new Date(endTime);
    if (limit) filters.limit = parseInt(limit);

    const metrics = await performanceService.getMetrics(filters);

    return NextResponse.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Performance metrics retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to get performance metrics' },
      { status: 500 }
    );
  }
}

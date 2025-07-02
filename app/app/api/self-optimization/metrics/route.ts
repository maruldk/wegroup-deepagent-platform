
/**
 * Self-Optimization Metrics API - Performance metrics and insights
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SelfOptimizationService } from '@/lib/ai/self-optimization-service';

export const dynamic = "force-dynamic";

const optimizationService = new SelfOptimizationService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metrics = await optimizationService.getOptimizationMetrics(session.user.tenantId);

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error in optimization metrics GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch optimization metrics' },
      { status: 500 }
    );
  }
}

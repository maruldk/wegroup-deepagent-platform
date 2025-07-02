
/**
 * Continuous Learning Metrics API - Performance and learning metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContinuousLearningService } from '@/lib/ai/continuous-learning-service';

export const dynamic = "force-dynamic";

const continuousLearningService = new ContinuousLearningService();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metrics = await continuousLearningService.getContinuousLearningMetrics(
      session.user.tenantId
    );

    return NextResponse.json({ success: true, data: metrics });
  } catch (error) {
    console.error('Error in continuous learning metrics GET:', error);
    return NextResponse.json(
      { error: 'Failed to fetch continuous learning metrics' },
      { status: 500 }
    );
  }
}

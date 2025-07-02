
/**
 * ML Model Details API - Individual model operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MLPipelineService } from '@/lib/ai/ml-pipeline-service';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mlService = new MLPipelineService(session.user.tenantId, session.user.id);
    const metrics = await mlService.getModelMetrics(params.id);

    return NextResponse.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Get ML model metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch model metrics' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();
    const mlService = new MLPipelineService(session.user.tenantId, session.user.id);

    if (action === 'deploy') {
      const model = await mlService.deployModel(params.id);
      return NextResponse.json({
        success: true,
        data: model,
        message: 'Model deployed to production successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update ML model error:', error);
    return NextResponse.json(
      { error: 'Failed to update ML model' },
      { status: 500 }
    );
  }
}

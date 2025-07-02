
/**
 * ML Models API - Model management endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MLPipelineService } from '@/lib/ai/ml-pipeline-service';
import { z } from 'zod';

const createModelSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['REGRESSION', 'CLASSIFICATION', 'CLUSTERING', 'TIME_SERIES', 'NEURAL_NETWORK', 'ENSEMBLE', 'DEEP_LEARNING', 'REINFORCEMENT_LEARNING']),
  algorithm: z.string().min(1),
  description: z.string().optional(),
  featureColumns: z.array(z.string()),
  targetColumn: z.string().optional(),
  configParams: z.record(z.any()),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as any;
    const status = searchParams.get('status') as any;
    const isProduction = searchParams.get('isProduction') === 'true';

    const mlService = new MLPipelineService(session.user.tenantId, session.user.id);
    
    const filters: any = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (isProduction !== undefined) filters.isProduction = isProduction;

    const models = await mlService.listModels(filters);

    return NextResponse.json({
      success: true,
      data: models,
      count: models.length
    });
  } catch (error) {
    console.error('Get ML models error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ML models' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createModelSchema.parse(body);

    const mlService = new MLPipelineService(session.user.tenantId, session.user.id);
    const model = await mlService.createModel(validatedData);

    return NextResponse.json({
      success: true,
      data: model,
      message: 'ML model created successfully'
    });
  } catch (error) {
    console.error('Create ML model error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create ML model' },
      { status: 500 }
    );
  }
}

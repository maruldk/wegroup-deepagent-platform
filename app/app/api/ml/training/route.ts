
/**
 * ML Training API - Model training and retraining endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MLPipelineService } from '@/lib/ai/ml-pipeline-service';
import { FeatureEngineeringService } from '@/lib/ai/feature-engineering-service';
import { z } from 'zod';

const trainModelSchema = z.object({
  modelId: z.string(),
  dataSource: z.enum(['sales', 'cashflow', 'projects', 'customers', 'custom']),
  trainingConfig: z.object({
    epochs: z.number().min(1).max(1000).optional(),
    batchSize: z.number().min(1).max(1000).optional(),
    learningRate: z.number().min(0.0001).max(1).optional(),
    validationSplit: z.number().min(0.1).max(0.5).optional(),
  }).optional(),
  dateRange: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get training jobs from database
    const { prisma } = await import('@/lib/db');
    
    const whereClause: any = {
      tenantId: session.user.tenantId,
    };
    
    if (modelId) whereClause.modelId = modelId;
    if (status) whereClause.status = status;

    const trainingJobs = await prisma.mLTrainingJob.findMany({
      where: whereClause,
      include: {
        model: {
          select: {
            name: true,
            type: true,
            algorithm: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: trainingJobs,
      count: trainingJobs.length
    });
  } catch (error) {
    console.error('Get training jobs error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch training jobs' },
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
    const validatedData = trainModelSchema.parse(body);

    const mlService = new MLPipelineService(session.user.tenantId, session.user.id);
    const featureService = new FeatureEngineeringService(session.user.tenantId, session.user.id);

    // Extract training data based on data source
    let trainingData;
    const startDate = validatedData.dateRange?.startDate ? new Date(validatedData.dateRange.startDate) : undefined;
    const endDate = validatedData.dateRange?.endDate ? new Date(validatedData.dateRange.endDate) : undefined;

    switch (validatedData.dataSource) {
      case 'sales':
        trainingData = await featureService.extractSalesFeatures(startDate, endDate);
        break;
      case 'cashflow':
        trainingData = await featureService.extractCashFlowFeatures(startDate, endDate);
        break;
      case 'projects':
        trainingData = await featureService.extractProjectFeatures();
        break;
      case 'customers':
        trainingData = await featureService.extractCustomerFeatures();
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported data source' },
          { status: 400 }
        );
    }

    if (trainingData.sampleCount < 10) {
      return NextResponse.json(
        { error: 'Insufficient training data. At least 10 samples required.' },
        { status: 400 }
      );
    }

    // Start model training
    const trainingJob = await mlService.trainModel(
      validatedData.modelId,
      trainingData,
      validatedData.trainingConfig
    );

    return NextResponse.json({
      success: true,
      data: trainingJob,
      message: 'Model training started successfully'
    });
  } catch (error) {
    console.error('Train model error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to start model training' },
      { status: 500 }
    );
  }
}

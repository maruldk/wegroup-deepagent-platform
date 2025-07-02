
/**
 * ML Predictions API - Make predictions and manage prediction history
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MLPipelineService } from '@/lib/ai/ml-pipeline-service';
import { PredictiveAnalyticsService } from '@/lib/ai/predictive-analytics-service';
import { z } from 'zod';

const makePredictionSchema = z.object({
  modelId: z.string(),
  inputData: z.array(z.array(z.number())),
  predictionType: z.enum(['SALES_FORECAST', 'CASH_FLOW_PREDICTION', 'PROJECT_TIMELINE', 'CUSTOMER_BEHAVIOR', 'ANOMALY_DETECTION', 'RISK_ASSESSMENT', 'DEMAND_FORECAST', 'PRICE_OPTIMIZATION', 'CHURN_PREDICTION', 'LEAD_SCORING']),
  context: z.record(z.any()).optional(),
});

const analyticsRequestSchema = z.object({
  type: z.enum(['sales_forecast', 'cash_flow', 'project_timeline', 'customer_behavior']),
  config: z.object({
    forecastHorizon: z.number().min(1).max(365).optional(),
    confidence: z.number().min(0.5).max(0.99).optional(),
    includeSeasonality: z.boolean().optional(),
    includeHolidays: z.boolean().optional(),
    features: z.array(z.string()).optional(),
    projectId: z.string().optional(),
    customerId: z.string().optional(),
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
    const predictionType = searchParams.get('predictionType');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get recent predictions from database
    const { prisma } = await import('@/lib/db');
    
    const whereClause: any = {
      tenantId: session.user.tenantId,
    };
    
    if (modelId) whereClause.modelId = modelId;
    if (predictionType) whereClause.predictionType = predictionType;

    const predictions = await prisma.mLPrediction.findMany({
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
      data: predictions,
      count: predictions.length
    });
  } catch (error) {
    console.error('Get predictions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch predictions' },
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
    
    // Check if this is a predictive analytics request
    if (body.type && ['sales_forecast', 'cash_flow', 'project_timeline', 'customer_behavior'].includes(body.type)) {
      const validatedData = analyticsRequestSchema.parse(body);
      const analyticsService = new PredictiveAnalyticsService(session.user.tenantId, session.user.id);

      let result;
      switch (validatedData.type) {
        case 'sales_forecast':
          result = await analyticsService.generateSalesForecast({
            forecastHorizon: validatedData.config?.forecastHorizon || 30,
            confidence: validatedData.config?.confidence || 0.8,
            includeSeasonality: validatedData.config?.includeSeasonality || true,
            includeHolidays: validatedData.config?.includeHolidays || true,
            features: validatedData.config?.features || ['trend', 'seasonality'],
          });
          break;
          
        case 'cash_flow':
          result = await analyticsService.predictCashFlow(validatedData.config?.forecastHorizon || 90);
          break;
          
        case 'project_timeline':
          if (!validatedData.config?.projectId) {
            return NextResponse.json(
              { error: 'Project ID is required for project timeline prediction' },
              { status: 400 }
            );
          }
          result = await analyticsService.predictProjectTimeline(validatedData.config.projectId);
          break;
          
        case 'customer_behavior':
          if (!validatedData.config?.customerId) {
            return NextResponse.json(
              { error: 'Customer ID is required for customer behavior analysis' },
              { status: 400 }
            );
          }
          result = await analyticsService.analyzeCustomerBehavior(validatedData.config.customerId);
          break;
          
        default:
          return NextResponse.json(
            { error: 'Unsupported analytics type' },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        data: result,
        type: validatedData.type,
        message: 'Predictive analytics completed successfully'
      });
    }

    // Standard ML prediction request
    const validatedData = makePredictionSchema.parse(body);
    const mlService = new MLPipelineService(session.user.tenantId, session.user.id);
    
    const prediction = await mlService.predict(
      validatedData.modelId,
      validatedData.inputData,
      validatedData.predictionType,
      validatedData.context
    );

    return NextResponse.json({
      success: true,
      data: prediction,
      message: 'Prediction completed successfully'
    });
  } catch (error) {
    console.error('Make prediction error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to make prediction' },
      { status: 500 }
    );
  }
}

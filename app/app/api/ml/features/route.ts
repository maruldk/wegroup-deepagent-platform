
/**
 * ML Features API - Feature engineering and data quality endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FeatureEngineeringService } from '@/lib/ai/feature-engineering-service';
import { z } from 'zod';

const extractFeaturesSchema = z.object({
  dataSource: z.enum(['sales', 'cashflow', 'projects', 'customers']),
  dateRange: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }).optional(),
  preprocessing: z.object({
    normalization: z.enum(['minmax', 'zscore']).optional(),
    handleMissing: z.enum(['mean', 'median', 'mode', 'drop']).optional(),
    polynomialDegree: z.number().min(1).max(3).optional(),
    varianceThreshold: z.number().min(0).max(1).optional(),
  }).optional(),
});

const dataQualitySchema = z.object({
  data: z.array(z.array(z.union([z.number(), z.string(), z.null()]))),
  featureNames: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const featureService = new FeatureEngineeringService(session.user.tenantId, session.user.id);

    // Check if this is a data quality assessment request
    if (body.action === 'assess_quality') {
      const validatedData = dataQualitySchema.parse(body);
      const qualityMetrics = featureService.assessDataQuality(validatedData.data, validatedData.featureNames);

      return NextResponse.json({
        success: true,
        data: qualityMetrics,
        message: 'Data quality assessment completed'
      });
    }

    // Feature extraction request
    const validatedData = extractFeaturesSchema.parse(body);
    
    // Extract raw features
    let rawFeatures;
    const startDate = validatedData.dateRange?.startDate ? new Date(validatedData.dateRange.startDate) : undefined;
    const endDate = validatedData.dateRange?.endDate ? new Date(validatedData.dateRange.endDate) : undefined;

    switch (validatedData.dataSource) {
      case 'sales':
        rawFeatures = await featureService.extractSalesFeatures(startDate, endDate);
        break;
      case 'cashflow':
        rawFeatures = await featureService.extractCashFlowFeatures(startDate, endDate);
        break;
      case 'projects':
        rawFeatures = await featureService.extractProjectFeatures();
        break;
      case 'customers':
        rawFeatures = await featureService.extractCustomerFeatures();
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported data source' },
          { status: 400 }
        );
    }

    let processedFeatures = rawFeatures.features;
    let scalingParams = null;

    // Apply preprocessing if requested
    if (validatedData.preprocessing) {
      const { preprocessing } = validatedData;

      // Handle missing values
      if (preprocessing.handleMissing) {
        processedFeatures = featureService.handleMissingValues(
          processedFeatures as (number | null)[][],
          preprocessing.handleMissing
        );
      }

      // Normalize features
      if (preprocessing.normalization) {
        const { normalizedData, scalingParams: params } = featureService.normalizeFeatures(
          processedFeatures,
          preprocessing.normalization
        );
        processedFeatures = normalizedData;
        scalingParams = params;
      }

      // Create polynomial features
      if (preprocessing.polynomialDegree && preprocessing.polynomialDegree > 1) {
        processedFeatures = featureService.createPolynomialFeatures(
          processedFeatures,
          preprocessing.polynomialDegree
        );
      }

      // Feature selection by variance
      if (preprocessing.varianceThreshold) {
        const { selectedData, selectedIndices } = featureService.selectFeaturesByVariance(
          processedFeatures,
          preprocessing.varianceThreshold
        );
        processedFeatures = selectedData;
        
        return NextResponse.json({
          success: true,
          data: {
            originalFeatures: rawFeatures,
            processedFeatures,
            scalingParams,
            selectedFeatureIndices: selectedIndices,
            featureCount: processedFeatures[0]?.length || 0,
            sampleCount: processedFeatures.length,
          },
          message: 'Feature extraction and preprocessing completed'
        });
      }
    }

    // Assess data quality
    const qualityMetrics = featureService.assessDataQuality(
      processedFeatures as (number | string | null)[][],
      rawFeatures.featureNames
    );

    return NextResponse.json({
      success: true,
      data: {
        originalFeatures: rawFeatures,
        processedFeatures,
        scalingParams,
        qualityMetrics,
        featureCount: processedFeatures[0]?.length || 0,
        sampleCount: processedFeatures.length,
      },
      message: 'Feature extraction and preprocessing completed'
    });
  } catch (error) {
    console.error('Feature extraction error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to extract features' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');

    if (!modelId) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    // Get features for a specific model
    const { prisma } = await import('@/lib/db');
    
    const features = await prisma.mLFeature.findMany({
      where: {
        modelId,
        tenantId: session.user.tenantId,
      },
      orderBy: { importance: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: features,
      count: features.length
    });
  } catch (error) {
    console.error('Get features error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch features' },
      { status: 500 }
    );
  }
}

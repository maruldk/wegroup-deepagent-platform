
/**
 * ML Anomalies API - Anomaly detection and management
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AnomalyDetectionService } from '@/lib/ai/anomaly-detection-service';
import { z } from 'zod';

const detectAnomaliesSchema = z.object({
  type: z.enum(['financial', 'project', 'customer', 'comprehensive']).optional(),
  autoDetect: z.boolean().optional(),
});

const updateAnomalySchema = z.object({
  action: z.enum(['acknowledge', 'resolve', 'false_positive']),
  anomalyId: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const anomalyType = searchParams.get('anomalyType') as any;
    const severity = searchParams.get('severity') as any;
    const status = searchParams.get('status') as any;
    const limit = parseInt(searchParams.get('limit') || '50');

    const anomalyService = new AnomalyDetectionService(session.user.tenantId, session.user.id);
    
    const filters: any = {};
    if (anomalyType) filters.anomalyType = anomalyType;
    if (severity) filters.severity = severity;
    if (status) filters.status = status;
    filters.limit = limit;

    const anomalies = await anomalyService.getAllAnomalies(filters);

    return NextResponse.json({
      success: true,
      data: anomalies,
      count: anomalies.length
    });
  } catch (error) {
    console.error('Get anomalies error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch anomalies' },
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
    
    // Check if this is an update action
    if (body.action && body.anomalyId) {
      const validatedData = updateAnomalySchema.parse(body);
      const anomalyService = new AnomalyDetectionService(session.user.tenantId, session.user.id);

      let result;
      switch (validatedData.action) {
        case 'acknowledge':
          result = await anomalyService.acknowledgeAnomaly(validatedData.anomalyId, session.user.id);
          break;
        case 'resolve':
          result = await anomalyService.resolveAnomaly(validatedData.anomalyId, session.user.id);
          break;
        case 'false_positive':
          result = await anomalyService.markAsFalsePositive(validatedData.anomalyId, session.user.id);
          break;
        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          );
      }

      return NextResponse.json({
        success: true,
        data: result,
        message: `Anomaly ${validatedData.action} successfully`
      });
    }

    // Anomaly detection request
    const validatedData = detectAnomaliesSchema.parse(body);
    const anomalyService = new AnomalyDetectionService(session.user.tenantId, session.user.id);

    let result;
    switch (validatedData.type) {
      case 'financial':
        result = { financial: await anomalyService.detectFinancialAnomalies() };
        break;
      case 'project':
        result = { project: await anomalyService.detectProjectAnomalies() };
        break;
      case 'customer':
        result = { customer: await anomalyService.detectCustomerBehaviorAnomalies() };
        break;
      case 'comprehensive':
      default:
        result = await anomalyService.runComprehensiveDetection();
        break;
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'Anomaly detection completed successfully'
    });
  } catch (error) {
    console.error('Detect anomalies error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to detect anomalies' },
      { status: 500 }
    );
  }
}

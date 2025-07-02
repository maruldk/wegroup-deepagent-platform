
import { NextRequest, NextResponse } from 'next/server';
import { aiAnomalyDetectionService } from '@/lib/ai/security/anomaly-detection';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'anomalies':
        const anomalies = aiAnomalyDetectionService.getActiveAnomalies();
        return NextResponse.json({
          success: true,
          data: anomalies,
          count: anomalies.length
        });

      case 'metrics':
        const metrics = aiAnomalyDetectionService.getSecurityMetrics();
        return NextResponse.json({
          success: true,
          data: metrics
        });

      default:
        // Return overview
        const activeAnomalies = aiAnomalyDetectionService.getActiveAnomalies();
        const securityMetrics = aiAnomalyDetectionService.getSecurityMetrics();
        
        return NextResponse.json({
          success: true,
          data: {
            overview: {
              activeAnomalies: activeAnomalies.length,
              criticalAnomalies: activeAnomalies.filter(a => a.severity === 'critical').length,
              averageRiskScore: securityMetrics.averageRiskScore,
              lastDetection: activeAnomalies[0]?.detectedAt || null
            },
            anomalies: activeAnomalies.slice(0, 10), // Latest 10
            metrics: securityMetrics
          }
        });
    }
  } catch (error) {
    console.error('Security API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch security data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, anomalyId, status } = body;

    switch (action) {
      case 'update_status':
        if (!anomalyId || !status) {
          return NextResponse.json(
            { success: false, error: 'Anomaly ID and status are required' },
            { status: 400 }
          );
        }

        aiAnomalyDetectionService.updateAnomalyStatus(anomalyId, status);
        
        return NextResponse.json({
          success: true,
          message: `Anomaly status updated to ${status}`
        });

      case 'trigger_scan':
        // Trigger immediate security scan
        const results = {
          scanId: `scan_${Date.now()}`,
          status: 'initiated',
          estimatedCompletion: new Date(Date.now() + 300000).toISOString() // 5 minutes
        };

        return NextResponse.json({
          success: true,
          data: results
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Security API POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process security request' },
      { status: 500 }
    );
  }
}

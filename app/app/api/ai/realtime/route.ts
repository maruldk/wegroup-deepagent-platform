
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Simulate real-time AI data
    const aiUpdates = [
      {
        type: 'lead_score_update',
        data: {
          leadId: 'lead-' + Math.random().toString(36).substr(2, 9),
          oldScore: Math.floor(Math.random() * 100),
          newScore: Math.floor(Math.random() * 100),
          reason: 'Updated based on recent website activity'
        },
        timestamp: new Date().toISOString()
      },
      {
        type: 'market_insight',
        data: {
          insight: 'Tech sector showing 15% growth this quarter',
          confidence: 0.92,
          impact: 'high',
          recommendations: ['Increase tech sector outreach', 'Adjust pricing strategy']
        },
        timestamp: new Date().toISOString()
      },
      {
        type: 'anomaly_detected',
        data: {
          anomaly: 'Unusual drop in conversion rate',
          severity: 'medium',
          affectedMetrics: ['conversion_rate', 'lead_quality'],
          suggestedActions: ['Review recent campaigns', 'Check lead sources']
        },
        timestamp: new Date().toISOString()
      }
    ];

    return NextResponse.json({
      success: true,
      updates: aiUpdates,
      serverTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('Real-time AI API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch real-time AI updates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    // Process real-time AI request
    let response;
    switch (type) {
      case 'get_recommendations':
        response = {
          recommendations: [
            {
              id: 'rec-1',
              type: 'lead_priority',
              message: 'Focus on Enterprise leads - 40% higher conversion',
              priority: 'high',
              confidence: 0.87
            },
            {
              id: 'rec-2',
              type: 'market_opportunity',
              message: 'Healthcare sector showing increased interest',
              priority: 'medium',
              confidence: 0.73
            }
          ]
        };
        break;

      case 'trigger_analysis':
        response = {
          analysisId: 'analysis-' + Math.random().toString(36).substr(2, 9),
          status: 'initiated',
          estimatedCompletion: new Date(Date.now() + 60000).toISOString()
        };
        break;

      default:
        response = { processed: true, type };
    }

    return NextResponse.json({
      success: true,
      data: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Real-time AI POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process real-time AI request' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AdvancedFinancialAnalyticsService } from '@/lib/services/advanced-financial-analytics-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analyticsService = new AdvancedFinancialAnalyticsService(
      session.user.tenantId!,
      session.user.id
    );

    const risks = await analyticsService.performRiskAssessment();

    return NextResponse.json({
      success: true,
      data: risks,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalRisks: risks.length,
        highRisks: risks.filter(r => r.severity === 'HIGH' || r.severity === 'CRITICAL').length,
        riskTypes: [...new Set(risks.map(r => r.type))]
      }
    });
  } catch (error) {
    console.error('Error performing risk assessment:', error);
    return NextResponse.json({
      error: 'Failed to perform risk assessment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { riskTypes, includeHistorical = false } = body;

    const analyticsService = new AdvancedFinancialAnalyticsService(
      session.user.tenantId!,
      session.user.id
    );

    const risks = await analyticsService.performRiskAssessment();

    // Filter by requested risk types if specified
    const filteredRisks = riskTypes 
      ? risks.filter(risk => riskTypes.includes(risk.type))
      : risks;

    return NextResponse.json({
      success: true,
      data: filteredRisks,
      metadata: {
        generatedAt: new Date().toISOString(),
        requestedTypes: riskTypes,
        includeHistorical,
        totalRisks: filteredRisks.length
      }
    });
  } catch (error) {
    console.error('Error performing custom risk assessment:', error);
    return NextResponse.json({
      error: 'Failed to perform custom risk assessment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}


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

    const searchParams = request.nextUrl.searchParams;
    const periods = parseInt(searchParams.get('periods') || '6');
    const period = searchParams.get('period') as 'MONTHLY' | 'QUARTERLY' || 'MONTHLY';

    if (periods < 1 || periods > 24) {
      return NextResponse.json({ 
        error: 'Invalid periods parameter. Must be between 1 and 24.' 
      }, { status: 400 });
    }

    const analyticsService = new AdvancedFinancialAnalyticsService(
      session.user.tenantId!,
      session.user.id
    );

    const forecasts = await analyticsService.generateRevenueForecast(periods, period);

    return NextResponse.json({
      success: true,
      data: forecasts,
      metadata: {
        generatedAt: new Date().toISOString(),
        periods,
        period,
        count: forecasts.length
      }
    });
  } catch (error) {
    console.error('Error generating revenue forecast:', error);
    return NextResponse.json({
      error: 'Failed to generate revenue forecast',
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
    const { periods = 6, period = 'MONTHLY', customParameters } = body;

    const analyticsService = new AdvancedFinancialAnalyticsService(
      session.user.tenantId!,
      session.user.id
    );

    // Generate forecast with custom parameters
    const forecasts = await analyticsService.generateRevenueForecast(periods, period);

    return NextResponse.json({
      success: true,
      data: forecasts,
      metadata: {
        generatedAt: new Date().toISOString(),
        customParameters,
        periods,
        period
      }
    });
  } catch (error) {
    console.error('Error generating custom revenue forecast:', error);
    return NextResponse.json({
      error: 'Failed to generate custom revenue forecast',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

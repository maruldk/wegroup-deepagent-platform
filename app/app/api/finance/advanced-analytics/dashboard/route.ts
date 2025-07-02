
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AdvancedFinancialAnalyticsService } from '@/lib/services/advanced-financial-analytics-service';
import { FinancialService } from '@/lib/services/financial-service';
import { subMonths, subDays } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '12'; // months
    const includeForecasts = searchParams.get('forecasts') === 'true';
    const includeRisks = searchParams.get('risks') === 'true';
    const includeInsights = searchParams.get('insights') === 'true';

    const periodMonths = parseInt(period);
    const startDate = subMonths(new Date(), periodMonths);
    const endDate = new Date();

    const analyticsService = new AdvancedFinancialAnalyticsService(
      session.user.tenantId!,
      session.user.id
    );

    // Get basic financial summary
    const financialSummary = await FinancialService.getFinancialSummary(
      session.user.tenantId!,
      startDate,
      endDate
    );

    const dashboardData: any = {
      period: periodMonths,
      summary: financialSummary,
      generatedAt: new Date().toISOString()
    };

    // Conditionally include advanced analytics
    if (includeForecasts) {
      const [revenueForecasts, cashFlowForecasts] = await Promise.all([
        analyticsService.generateRevenueForecast(3, 'MONTHLY'),
        analyticsService.generateCashFlowPrediction(6)
      ]);
      
      dashboardData.forecasts = {
        revenue: revenueForecasts,
        cashFlow: cashFlowForecasts
      };
    }

    if (includeRisks) {
      const risks = await analyticsService.performRiskAssessment();
      dashboardData.risks = {
        total: risks.length,
        critical: risks.filter(r => r.severity === 'CRITICAL').length,
        high: risks.filter(r => r.severity === 'HIGH').length,
        items: risks.slice(0, 5) // Top 5 risks
      };
    }

    if (includeInsights) {
      const insights = await analyticsService.generateFinancialInsights();
      dashboardData.insights = {
        total: insights.length,
        urgent: insights.filter(i => i.priority === 'URGENT').length,
        critical: insights.filter(i => i.priority === 'CRITICAL').length,
        items: insights.slice(0, 5) // Top 5 insights
      };
    }

    // Get trend data for charts
    const expenseSummary = await FinancialService.getExpenseSummary(
      session.user.tenantId!,
      startDate,
      endDate
    );

    const budgetPerformance = await FinancialService.getBudgetPerformance(
      session.user.tenantId!
    );

    dashboardData.trends = {
      expenses: expenseSummary,
      budgets: budgetPerformance
    };

    return NextResponse.json({
      success: true,
      data: dashboardData,
      metadata: {
        generatedAt: new Date().toISOString(),
        period: periodMonths,
        features: {
          forecasts: includeForecasts,
          risks: includeRisks,
          insights: includeInsights
        }
      }
    });
  } catch (error) {
    console.error('Error generating advanced analytics dashboard:', error);
    return NextResponse.json({
      error: 'Failed to generate advanced analytics dashboard',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

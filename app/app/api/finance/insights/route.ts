
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
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '10');

    const analyticsService = new AdvancedFinancialAnalyticsService(
      session.user.tenantId!,
      session.user.id
    );

    const insights = await analyticsService.generateFinancialInsights();

    // Filter insights based on query parameters
    let filteredInsights = insights;
    
    if (category) {
      filteredInsights = filteredInsights.filter(insight => 
        insight.category.toLowerCase() === category.toLowerCase()
      );
    }
    
    if (priority) {
      filteredInsights = filteredInsights.filter(insight => 
        insight.priority.toLowerCase() === priority.toLowerCase()
      );
    }

    // Limit results
    filteredInsights = filteredInsights.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: filteredInsights,
      metadata: {
        generatedAt: new Date().toISOString(),
        totalInsights: insights.length,
        filteredCount: filteredInsights.length,
        filters: { category, priority, limit }
      }
    });
  } catch (error) {
    console.error('Error generating financial insights:', error);
    return NextResponse.json({
      error: 'Failed to generate financial insights',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

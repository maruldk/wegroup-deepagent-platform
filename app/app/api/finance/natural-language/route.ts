
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { AdvancedFinancialAnalyticsService } from '@/lib/services/advanced-financial-analytics-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ 
        error: 'Query is required and must be a non-empty string' 
      }, { status: 400 });
    }

    if (query.length > 500) {
      return NextResponse.json({ 
        error: 'Query too long. Maximum 500 characters allowed.' 
      }, { status: 400 });
    }

    const analyticsService = new AdvancedFinancialAnalyticsService(
      session.user.tenantId!,
      session.user.id
    );

    const result = await analyticsService.processNaturalLanguageQuery(query);

    return NextResponse.json({
      success: result.isSuccessful,
      data: result,
      metadata: {
        processedAt: new Date().toISOString(),
        processingTime: result.processingTime,
        intent: result.intent
      }
    });
  } catch (error) {
    console.error('Error processing natural language query:', error);
    return NextResponse.json({
      error: 'Failed to process natural language query',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get query history from database
    const { prisma } = await import('@/lib/db');
    
    const history = await prisma.financialQueryHistory.findMany({
      where: {
        tenantId: session.user.tenantId!,
        userId: session.user.id
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const total = await prisma.financialQueryHistory.count({
      where: {
        tenantId: session.user.tenantId!,
        userId: session.user.id
      }
    });

    return NextResponse.json({
      success: true,
      data: history,
      metadata: {
        total,
        limit,
        offset,
        hasMore: total > offset + limit
      }
    });
  } catch (error) {
    console.error('Error fetching query history:', error);
    return NextResponse.json({
      error: 'Failed to fetch query history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

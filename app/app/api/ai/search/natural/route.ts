
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SemanticSearchService } from '@/lib/ai/nlp/semantic-search-service';

export const dynamic = 'force-dynamic';

const searchService = new SemanticSearchService();

/**
 * POST /api/ai/search/natural
 * Natural language search processing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      query,
      context,
      tenantId = session.user.tenantId || 'default'
    } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ 
        error: 'Missing or invalid natural language query' 
      }, { status: 400 });
    }

    if (query.length < 5) {
      return NextResponse.json({ 
        error: 'Natural language query must be at least 5 characters long' 
      }, { status: 400 });
    }

    const searchResults = await searchService.processNaturalLanguageQuery(
      query.trim(),
      tenantId,
      context
    );

    return NextResponse.json({
      success: true,
      data: {
        originalQuery: query,
        processedResults: searchResults,
        processingType: 'natural_language',
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Natural language search API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

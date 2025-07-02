
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SemanticSearchService, SearchQuery } from '@/lib/ai/nlp/semantic-search-service';

export const dynamic = 'force-dynamic';

const searchService = new SemanticSearchService();

/**
 * POST /api/ai/search
 * Semantic search across all business data
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
      context = 'ALL',
      filters = {},
      includeSemanticSimilarity = true,
      enhanceWithAI = true,
      tenantId = session.user.tenantId || 'default'
    } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ 
        error: 'Missing or invalid query parameter' 
      }, { status: 400 });
    }

    if (query.length < 2) {
      return NextResponse.json({ 
        error: 'Query must be at least 2 characters long' 
      }, { status: 400 });
    }

    const searchQuery: SearchQuery = {
      query: query.trim(),
      context,
      filters: {
        ...filters,
        limit: Math.min(filters.limit || 20, 100) // Cap at 100 results
      },
      includeSemanticSimilarity,
      enhanceWithAI
    };

    const searchResults = await searchService.search(searchQuery, tenantId);

    return NextResponse.json({
      success: true,
      data: searchResults
    });

  } catch (error) {
    console.error('Semantic search API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/search/autocomplete?q=partial&context=CRM&limit=10
 * Get search autocompletions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partialQuery = searchParams.get('q');
    const context = searchParams.get('context');
    const limit = parseInt(searchParams.get('limit') || '10');
    const tenantId = searchParams.get('tenantId') || session.user.tenantId || 'default';

    if (!partialQuery || partialQuery.length < 1) {
      return NextResponse.json({ 
        error: 'Missing or invalid query parameter' 
      }, { status: 400 });
    }

    const completions = await searchService.getAutoCompletions(
      partialQuery,
      tenantId,
      context || undefined,
      Math.min(limit, 20) // Cap at 20 completions
    );

    return NextResponse.json({
      success: true,
      data: {
        query: partialQuery,
        completions,
        context,
        count: completions.length
      }
    });

  } catch (error) {
    console.error('Search autocomplete API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

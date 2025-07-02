
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ContentAnalysisService, ContentAnalysisRequest } from '@/lib/ai/nlp/content-analysis-service';

export const dynamic = 'force-dynamic';

const contentAnalysisService = new ContentAnalysisService();

/**
 * POST /api/ai/content-analysis
 * Analyze content for sentiment, keywords, entities, etc.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      content,
      type = 'OTHER',
      context,
      analysisTypes = ['SENTIMENT', 'KEYWORDS', 'ENTITIES'],
      options = {}
    } = body;

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ 
        error: 'Missing or invalid content parameter' 
      }, { status: 400 });
    }

    if (content.length < 10) {
      return NextResponse.json({ 
        error: 'Content must be at least 10 characters long' 
      }, { status: 400 });
    }

    if (content.length > 50000) {
      return NextResponse.json({ 
        error: 'Content exceeds maximum length of 50,000 characters' 
      }, { status: 400 });
    }

    const validAnalysisTypes = ['SENTIMENT', 'KEYWORDS', 'ENTITIES', 'SUMMARY', 'CLASSIFICATION', 'INTENT', 'LANGUAGE'];
    const filteredAnalysisTypes = analysisTypes.filter((type: string) => 
      validAnalysisTypes.includes(type)
    );

    if (filteredAnalysisTypes.length === 0) {
      return NextResponse.json({ 
        error: `Invalid analysis types. Must be one or more of: ${validAnalysisTypes.join(', ')}` 
      }, { status: 400 });
    }

    const analysisRequest: ContentAnalysisRequest = {
      content: content.trim(),
      type,
      context,
      analysisTypes: filteredAnalysisTypes,
      options: {
        ...options,
        confidenceThreshold: Math.max(0, Math.min(1, options.confidenceThreshold || 0.5)),
        maxKeywords: Math.min(options.maxKeywords || 20, 50),
        maxEntities: Math.min(options.maxEntities || 15, 30)
      }
    };

    const analysisResult = await contentAnalysisService.analyzeContent(analysisRequest);

    return NextResponse.json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('Content analysis API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/ai/content-analysis/batch
 * Batch content analysis
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { contents } = body;

    if (!Array.isArray(contents)) {
      return NextResponse.json({ 
        error: 'Contents must be an array of content analysis requests' 
      }, { status: 400 });
    }

    if (contents.length === 0) {
      return NextResponse.json({ 
        error: 'Contents array cannot be empty' 
      }, { status: 400 });
    }

    if (contents.length > 10) {
      return NextResponse.json({ 
        error: 'Batch size cannot exceed 10 items' 
      }, { status: 400 });
    }

    // Validate each content request
    const validatedRequests: ContentAnalysisRequest[] = [];
    for (const [index, contentRequest] of contents.entries()) {
      if (!contentRequest.content || typeof contentRequest.content !== 'string') {
        return NextResponse.json({ 
          error: `Invalid content at index ${index}` 
        }, { status: 400 });
      }

      if (contentRequest.content.length < 10) {
        return NextResponse.json({ 
          error: `Content at index ${index} must be at least 10 characters long` 
        }, { status: 400 });
      }

      validatedRequests.push({
        content: contentRequest.content.trim(),
        type: contentRequest.type || 'OTHER',
        context: contentRequest.context,
        analysisTypes: contentRequest.analysisTypes || ['SENTIMENT', 'KEYWORDS'],
        options: {
          ...contentRequest.options,
          confidenceThreshold: Math.max(0, Math.min(1, contentRequest.options?.confidenceThreshold || 0.5))
        }
      });
    }

    const batchResults = await contentAnalysisService.analyzeBatch(validatedRequests);

    return NextResponse.json({
      success: true,
      data: {
        results: batchResults,
        processedCount: batchResults.length,
        requestedCount: contents.length,
        batchId: `batch_${Date.now()}`
      }
    });

  } catch (error) {
    console.error('Batch content analysis API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

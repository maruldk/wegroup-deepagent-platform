
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ComputerVisionService } from '@/lib/ai/vision/computer-vision-service';

export const dynamic = 'force-dynamic';

const visionService = new ComputerVisionService();

/**
 * POST /api/ai/vision/document
 * Process documents with full pipeline
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      imageData,
      documentType = 'DOCUMENT',
      context
    } = body;

    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json({ 
        error: 'Missing or invalid imageData parameter (base64 encoded image required)' 
      }, { status: 400 });
    }

    // Validate base64 image data
    if (!imageData.match(/^[A-Za-z0-9+/=]+$/)) {
      return NextResponse.json({ 
        error: 'Invalid base64 image data format' 
      }, { status: 400 });
    }

    const validDocumentTypes = ['DOCUMENT', 'ID_CARD', 'INVOICE', 'RECEIPT', 'BUSINESS_CARD', 'CHART', 'OTHER'];
    if (!validDocumentTypes.includes(documentType)) {
      return NextResponse.json({ 
        error: `Invalid documentType. Must be one of: ${validDocumentTypes.join(', ')}` 
      }, { status: 400 });
    }

    const processingResult = await visionService.processDocument(
      imageData,
      documentType,
      context
    );

    return NextResponse.json({
      success: true,
      data: processingResult
    });

  } catch (error) {
    console.error('Document processing API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/ai/vision/document/batch
 * Batch document processing
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { documents } = body;

    if (!Array.isArray(documents)) {
      return NextResponse.json({ 
        error: 'Documents must be an array of document processing requests' 
      }, { status: 400 });
    }

    if (documents.length === 0) {
      return NextResponse.json({ 
        error: 'Documents array cannot be empty' 
      }, { status: 400 });
    }

    if (documents.length > 5) {
      return NextResponse.json({ 
        error: 'Batch size cannot exceed 5 documents for vision processing' 
      }, { status: 400 });
    }

    // Validate each document request
    for (const [index, doc] of documents.entries()) {
      if (!doc.imageData || typeof doc.imageData !== 'string') {
        return NextResponse.json({ 
          error: `Invalid imageData at index ${index}` 
        }, { status: 400 });
      }

      if (!doc.imageData.match(/^[A-Za-z0-9+/=]+$/)) {
        return NextResponse.json({ 
          error: `Invalid base64 image data format at index ${index}` 
        }, { status: 400 });
      }
    }

    const batchResults = await visionService.processBatch(documents);

    return NextResponse.json({
      success: true,
      data: {
        results: batchResults,
        processedCount: batchResults.length,
        requestedCount: documents.length,
        batchId: `batch_${Date.now()}`
      }
    });

  } catch (error) {
    console.error('Batch document processing API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

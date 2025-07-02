
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ComputerVisionService, VisionAnalysisRequest } from '@/lib/ai/vision/computer-vision-service';

export const dynamic = 'force-dynamic';

const visionService = new ComputerVisionService();

/**
 * POST /api/ai/vision
 * Analyze images with computer vision
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
      imageType = 'OTHER',
      analysisTypes = ['OCR', 'CLASSIFICATION'],
      options = {},
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

    // Check image size (approximate)
    const imageSizeBytes = (imageData.length * 3) / 4;
    const maxSizeBytes = 10 * 1024 * 1024; // 10MB
    if (imageSizeBytes > maxSizeBytes) {
      return NextResponse.json({ 
        error: 'Image size exceeds 10MB limit' 
      }, { status: 400 });
    }

    const validImageTypes = ['DOCUMENT', 'ID_CARD', 'INVOICE', 'RECEIPT', 'BUSINESS_CARD', 'PHOTO', 'CHART', 'OTHER'];
    if (!validImageTypes.includes(imageType)) {
      return NextResponse.json({ 
        error: `Invalid imageType. Must be one of: ${validImageTypes.join(', ')}` 
      }, { status: 400 });
    }

    const validAnalysisTypes = ['OCR', 'CLASSIFICATION', 'OBJECT_DETECTION', 'TEXT_EXTRACTION', 'QUALITY_CHECK', 'CONTENT_ANALYSIS'];
    const filteredAnalysisTypes = analysisTypes.filter((type: string) => 
      validAnalysisTypes.includes(type)
    );

    if (filteredAnalysisTypes.length === 0) {
      return NextResponse.json({ 
        error: `Invalid analysis types. Must be one or more of: ${validAnalysisTypes.join(', ')}` 
      }, { status: 400 });
    }

    const visionRequest: VisionAnalysisRequest = {
      imageData,
      imageType,
      analysisTypes: filteredAnalysisTypes,
      options: {
        ...options,
        confidenceThreshold: Math.max(0, Math.min(1, options.confidenceThreshold || 0.5)),
        outputFormat: options.outputFormat || 'STRUCTURED',
        enhanceImage: options.enhanceImage || false
      },
      context
    };

    const analysisResult = await visionService.analyzeImage(visionRequest);

    return NextResponse.json({
      success: true,
      data: analysisResult
    });

  } catch (error) {
    console.error('Computer vision API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

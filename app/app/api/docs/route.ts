
import { NextRequest, NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/api/swagger-config';

export const dynamic = 'force-dynamic';

/**
 * @swagger
 * /api/docs:
 *   get:
 *     summary: Get OpenAPI specification
 *     description: Returns the complete OpenAPI 3.0 specification for the weGROUP DeepAgent Plattform API
 *     tags: [Documentation]
 *     responses:
 *       200:
 *         description: OpenAPI specification
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               description: OpenAPI 3.0 specification
 */
export async function GET(request: NextRequest) {
  try {
    // Add request metadata to the spec
    const spec = {
      ...swaggerSpec,
      info: {
        ...swaggerSpec.info,
        'x-generated-at': new Date().toISOString(),
        'x-request-id': crypto.randomUUID(),
      },
    };

    return NextResponse.json(spec, {
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate API documentation',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

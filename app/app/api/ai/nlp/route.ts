
// SPRINT 2.8 - Advanced NLP API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { advancedNLP } from '@/lib/services/advanced-nlp-service'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/ai/nlp - Get NLP processors and performance
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const processorId = searchParams.get('processorId')

    if (processorId) {
      const performance = await advancedNLP.getProcessorPerformance(processorId)
      return NextResponse.json({
        success: true,
        data: performance
      })
    }

    // Get all processors for tenant
    const processors = await prisma.nLPProcessor.findMany({
      where: { tenantId: user.tenantId },
      include: {
        queries: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { processors }
    })
  } catch (error) {
    console.error('NLP get error:', error)
    return NextResponse.json(
      { error: 'Failed to get NLP data' },
      { status: 500 }
    )
  }
}

// POST /api/ai/nlp - Process text or create processor
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 })
    }

    const body = await request.json()
    const { action, text, processorType, processorConfig, texts, language, options } = body

    switch (action) {
      case 'create_processor':
        if (!processorConfig) {
          return NextResponse.json({ error: 'Processor config required' }, { status: 400 })
        }

        const processorId = await advancedNLP.createProcessor(
          processorConfig,
          user.tenantId
        )

        return NextResponse.json({
          success: true,
          data: { processorId },
          message: 'NLP processor created successfully'
        })

      case 'process_text':
        if (!text || !processorType) {
          return NextResponse.json({ error: 'Text and processor type required' }, { status: 400 })
        }

        const result = await advancedNLP.processText(
          { text, processorType, language, options },
          user.tenantId,
          user.id
        )

        return NextResponse.json({
          success: true,
          data: result
        })

      case 'batch_process':
        if (!texts || !Array.isArray(texts) || !processorType) {
          return NextResponse.json({ error: 'Text array and processor type required' }, { status: 400 })
        }

        const batchResults = await advancedNLP.batchProcess(
          texts,
          processorType,
          user.tenantId,
          user.id
        )

        return NextResponse.json({
          success: true,
          data: batchResults
        })

      case 'analyze_sentiment':
        if (!text) {
          return NextResponse.json({ error: 'Text required' }, { status: 400 })
        }

        const sentimentResult = await advancedNLP.processText(
          { text, processorType: 'SENTIMENT' },
          user.tenantId,
          user.id
        )

        return NextResponse.json({
          success: true,
          data: sentimentResult
        })

      case 'extract_entities':
        if (!text) {
          return NextResponse.json({ error: 'Text required' }, { status: 400 })
        }

        const entityResult = await advancedNLP.processText(
          { text, processorType: 'ENTITY' },
          user.tenantId,
          user.id
        )

        return NextResponse.json({
          success: true,
          data: entityResult
        })

      case 'classify_intent':
        if (!text) {
          return NextResponse.json({ error: 'Text required' }, { status: 400 })
        }

        const intentResult = await advancedNLP.processText(
          { text, processorType: 'INTENT' },
          user.tenantId,
          user.id
        )

        return NextResponse.json({
          success: true,
          data: intentResult
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('NLP operation error:', error)
    return NextResponse.json(
      { error: 'NLP operation failed' },
      { status: 500 }
    )
  }
}

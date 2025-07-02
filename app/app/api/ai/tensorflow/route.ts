
// SPRINT 2.8 - TensorFlow.js API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { tensorflowClient } from '@/lib/services/tensorflow-client-service'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/ai/tensorflow - Get TensorFlow models and performance
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
    const modelId = searchParams.get('modelId')

    if (modelId) {
      const performance = await tensorflowClient.getModelPerformance(modelId)
      return NextResponse.json({
        success: true,
        data: performance
      })
    }

    // Get all models for tenant
    const models = await prisma.clientMLModel.findMany({
      where: { tenantId: user.tenantId },
      include: {
        predictions: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: { models }
    })
  } catch (error) {
    console.error('TensorFlow get error:', error)
    return NextResponse.json(
      { error: 'Failed to get TensorFlow data' },
      { status: 500 }
    )
  }
}

// POST /api/ai/tensorflow - Create model, train, or predict
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
    const { action, modelConfig, trainingData, modelId, inputData } = body

    switch (action) {
      case 'create_model':
        if (!modelConfig) {
          return NextResponse.json({ error: 'Model config required' }, { status: 400 })
        }

        const newModelId = await tensorflowClient.createModel(
          modelConfig,
          user.tenantId,
          user.id
        )

        return NextResponse.json({
          success: true,
          data: { modelId: newModelId },
          message: 'Model created successfully'
        })

      case 'train_model':
        if (!modelId || !trainingData) {
          return NextResponse.json({ error: 'Model ID and training data required' }, { status: 400 })
        }

        await tensorflowClient.trainModel(modelId, trainingData)

        return NextResponse.json({
          success: true,
          message: 'Model training started'
        })

      case 'predict':
        if (!modelId || !inputData) {
          return NextResponse.json({ error: 'Model ID and input data required' }, { status: 400 })
        }

        const prediction = await tensorflowClient.predict(
          modelId,
          inputData,
          user.tenantId,
          user.id
        )

        return NextResponse.json({
          success: true,
          data: prediction
        })

      case 'batch_predict':
        if (!modelId || !inputData || !Array.isArray(inputData)) {
          return NextResponse.json({ error: 'Model ID and input batch required' }, { status: 400 })
        }

        const batchResults = await tensorflowClient.batchPredict(
          modelId,
          inputData,
          user.tenantId,
          user.id
        )

        return NextResponse.json({
          success: true,
          data: batchResults
        })

      case 'optimize_model':
        if (!modelId) {
          return NextResponse.json({ error: 'Model ID required' }, { status: 400 })
        }

        await tensorflowClient.optimizeModel(modelId)

        return NextResponse.json({
          success: true,
          message: 'Model optimization completed'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('TensorFlow operation error:', error)
    return NextResponse.json(
      { error: 'TensorFlow operation failed' },
      { status: 500 }
    )
  }
}

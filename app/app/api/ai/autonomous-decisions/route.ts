
// SPRINT 2.8 - Autonomous Decision API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { autonomousDecision } from '@/lib/services/autonomous-decision-service'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/ai/autonomous-decisions - Get decision analytics
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

    const analytics = await autonomousDecision.getDecisionAnalytics(user.tenantId)

    return NextResponse.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('Autonomous decision get error:', error)
    return NextResponse.json(
      { error: 'Failed to get decision analytics' },
      { status: 500 }
    )
  }
}

// POST /api/ai/autonomous-decisions - Make decision or provide feedback
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
    const { action, context, decisionId, feedback, outcome } = body

    switch (action) {
      case 'make_decision':
        if (!context) {
          return NextResponse.json({ error: 'Decision context required' }, { status: 400 })
        }

        const decision = await autonomousDecision.makeDecision(
          context,
          user.tenantId
        )

        return NextResponse.json({
          success: true,
          data: decision
        })

      case 'provide_feedback':
        if (!decisionId || feedback === undefined) {
          return NextResponse.json({ error: 'Decision ID and feedback required' }, { status: 400 })
        }

        await autonomousDecision.provideFeedback(decisionId, feedback, outcome)

        return NextResponse.json({
          success: true,
          message: 'Feedback provided successfully'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Autonomous decision operation error:', error)
    return NextResponse.json(
      { error: 'Autonomous decision operation failed' },
      { status: 500 }
    )
  }
}

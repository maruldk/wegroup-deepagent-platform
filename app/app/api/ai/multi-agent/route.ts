
// SPRINT 2.8 - Multi-Agent AI API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { multiAgentAI } from '@/lib/services/multi-agent-ai-service'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/ai/multi-agent - Get agent system status
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

    const performance = await multiAgentAI.getAgentPerformance(user.tenantId)

    return NextResponse.json({
      success: true,
      data: {
        agents: performance,
        systemStatus: 'active',
        totalAgents: performance.length
      }
    })
  } catch (error) {
    console.error('Multi-agent status error:', error)
    return NextResponse.json(
      { error: 'Failed to get agent status' },
      { status: 500 }
    )
  }
}

// POST /api/ai/multi-agent - Initialize or assign task to agents
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
    const { action, taskPayload, agentType } = body

    if (action === 'initialize') {
      await multiAgentAI.initializeAgentSystem(user.tenantId)
      return NextResponse.json({
        success: true,
        message: 'Agent system initialized successfully'
      })
    }

    if (action === 'assign_task') {
      if (!taskPayload) {
        return NextResponse.json({ error: 'Task payload required' }, { status: 400 })
      }

      const taskId = await multiAgentAI.assignTask(
        user.tenantId,
        taskPayload,
        agentType
      )

      return NextResponse.json({
        success: true,
        data: { taskId },
        message: 'Task assigned successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Multi-agent operation error:', error)
    return NextResponse.json(
      { error: 'Multi-agent operation failed' },
      { status: 500 }
    )
  }
}

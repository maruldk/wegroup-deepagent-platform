
// SPRINT 2.8 - Self-Healing System API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { selfHealing } from '@/lib/services/self-healing-service'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/system/health - Get system health overview
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

    const healthOverview = await selfHealing.getSystemHealthOverview(user.tenantId)

    return NextResponse.json({
      success: true,
      data: healthOverview
    })
  } catch (error) {
    console.error('System health error:', error)
    return NextResponse.json(
      { error: 'Failed to get system health' },
      { status: 500 }
    )
  }
}

// POST /api/system/health - Start/stop monitoring or trigger healing
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
    const { action } = body

    switch (action) {
      case 'start_monitoring':
        await selfHealing.startMonitoring(user.tenantId)
        return NextResponse.json({
          success: true,
          message: 'System health monitoring started'
        })

      case 'stop_monitoring':
        await selfHealing.stopMonitoring()
        return NextResponse.json({
          success: true,
          message: 'System health monitoring stopped'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('System health operation error:', error)
    return NextResponse.json(
      { error: 'System health operation failed' },
      { status: 500 }
    )
  }
}

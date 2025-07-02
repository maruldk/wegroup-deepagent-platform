
// SPRINT 2.9 - PWA API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { pwaService } from '@/lib/services/pwa-service'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/pwa - Get PWA analytics and status
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

    const analytics = await pwaService.getPWAAnalytics(user.tenantId)

    return NextResponse.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('PWA analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get PWA analytics' },
      { status: 500 }
    )
  }
}

// POST /api/pwa - Track installation or send notification
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
    const { action, deviceInfo, payload, installationId, status } = body

    switch (action) {
      case 'track_installation':
        if (!deviceInfo) {
          return NextResponse.json({ error: 'Device info required' }, { status: 400 })
        }

        const newInstallationId = await pwaService.trackInstallation(
          user.id,
          deviceInfo,
          user.tenantId
        )

        return NextResponse.json({
          success: true,
          data: { installationId: newInstallationId },
          message: 'Installation tracked successfully'
        })

      case 'update_installation':
        if (!installationId || !status) {
          return NextResponse.json({ error: 'Installation ID and status required' }, { status: 400 })
        }

        await pwaService.updateInstallationStatus(installationId, status)

        return NextResponse.json({
          success: true,
          message: 'Installation status updated successfully'
        })

      case 'send_notification':
        if (!payload) {
          return NextResponse.json({ error: 'Notification payload required' }, { status: 400 })
        }

        const sent = await pwaService.sendPushNotification(
          user.id,
          payload,
          user.tenantId
        )

        return NextResponse.json({
          success: sent,
          message: sent ? 'Notification sent successfully' : 'Failed to send notification'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('PWA operation error:', error)
    return NextResponse.json(
      { error: 'PWA operation failed' },
      { status: 500 }
    )
  }
}

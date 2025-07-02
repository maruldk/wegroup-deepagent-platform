
// SPRINT 2.9 - Zero-Trust Security API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { advancedSecurity } from '@/lib/services/advanced-security-service'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/security/zero-trust - Get security analytics
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
    const timeRange = parseInt(searchParams.get('timeRange') || '7')

    const analytics = await advancedSecurity.getSecurityAnalytics(user.tenantId, timeRange)

    return NextResponse.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('Zero-trust analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get security analytics' },
      { status: 500 }
    )
  }
}

// POST /api/security/zero-trust - Evaluate request or assess risk
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
    const { action, requestData, resourceSensitivity } = body

    // Get client IP and user agent
    const ipAddress = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    switch (action) {
      case 'evaluate_trust':
        const trustEvaluation = await advancedSecurity.evaluateZeroTrust(
          {
            userId: user.id,
            ipAddress,
            userAgent,
            ...requestData
          },
          user.tenantId
        )

        return NextResponse.json({
          success: true,
          data: trustEvaluation
        })

      case 'assess_risk':
        if (!resourceSensitivity) {
          return NextResponse.json({ error: 'Resource sensitivity required' }, { status: 400 })
        }

        const riskAssessment = await advancedSecurity.assessSecurityRisk(
          {
            userId: user.id,
            action: requestData?.action || 'access',
            ipAddress,
            userAgent,
            resourceSensitivity
          },
          user.tenantId
        )

        return NextResponse.json({
          success: true,
          data: riskAssessment
        })

      case 'log_event':
        await advancedSecurity.logSecurityEvent({
          userId: user.id,
          eventType: requestData.eventType,
          ipAddress,
          userAgent,
          details: requestData.details,
          tenantId: user.tenantId
        })

        return NextResponse.json({
          success: true,
          message: 'Security event logged successfully'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Zero-trust operation error:', error)
    return NextResponse.json(
      { error: 'Zero-trust operation failed' },
      { status: 500 }
    )
  }
}

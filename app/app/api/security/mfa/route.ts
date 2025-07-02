
// SPRINT 2.9 - Multi-Factor Authentication API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { advancedSecurity } from '@/lib/services/advanced-security-service'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/security/mfa - Get MFA devices and status
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

    const mfaDevices = await prisma.mFADevice.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        deviceType: true,
        deviceName: true,
        isActive: true,
        isVerified: true,
        lastUsed: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: { devices: mfaDevices }
    })
  } catch (error) {
    console.error('MFA get error:', error)
    return NextResponse.json(
      { error: 'Failed to get MFA data' },
      { status: 500 }
    )
  }
}

// POST /api/security/mfa - Setup or verify MFA
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
    const { action, deviceType, deviceName, phoneNumber, deviceId, token, code } = body

    switch (action) {
      case 'setup_totp':
        if (!deviceName) {
          return NextResponse.json({ error: 'Device name required' }, { status: 400 })
        }

        const totpSetup = await advancedSecurity.setupTOTP(
          user.id,
          deviceName,
          user.tenantId
        )

        return NextResponse.json({
          success: true,
          data: totpSetup
        })

      case 'setup_sms':
        if (!phoneNumber) {
          return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
        }

        const smsDeviceId = await advancedSecurity.setupSMSMFA(
          user.id,
          phoneNumber,
          user.tenantId
        )

        return NextResponse.json({
          success: true,
          data: { deviceId: smsDeviceId },
          message: 'SMS verification code sent'
        })

      case 'verify_totp':
        if (!deviceId || !token) {
          return NextResponse.json({ error: 'Device ID and token required' }, { status: 400 })
        }

        const totpValid = await advancedSecurity.verifyTOTP(
          deviceId,
          token,
          user.id,
          user.tenantId
        )

        return NextResponse.json({
          success: totpValid,
          message: totpValid ? 'TOTP verified successfully' : 'Invalid TOTP token'
        })

      case 'verify_sms':
        if (!deviceId || !code) {
          return NextResponse.json({ error: 'Device ID and code required' }, { status: 400 })
        }

        const smsValid = await advancedSecurity.verifySMSMFA(
          deviceId,
          code,
          user.id,
          user.tenantId
        )

        return NextResponse.json({
          success: smsValid,
          message: smsValid ? 'SMS verified successfully' : 'Invalid SMS code'
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('MFA operation error:', error)
    return NextResponse.json(
      { error: 'MFA operation failed' },
      { status: 500 }
    )
  }
}

// DELETE /api/security/mfa - Remove MFA device
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const deviceId = searchParams.get('deviceId')

    if (!deviceId) {
      return NextResponse.json({ error: 'Device ID required' }, { status: 400 })
    }

    await prisma.mFADevice.delete({
      where: {
        id: deviceId,
        userId: user.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'MFA device removed successfully'
    })
  } catch (error) {
    console.error('MFA device removal error:', error)
    return NextResponse.json(
      { error: 'Failed to remove MFA device' },
      { status: 500 }
    )
  }
}

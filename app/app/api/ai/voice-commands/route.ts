
// SPRINT 2.8 - Voice Command API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { voiceCommandService } from '@/lib/services/voice-command-service'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/ai/voice-commands - Get voice command analytics
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
    const action = searchParams.get('action')

    if (action === 'commands') {
      const availableCommands = voiceCommandService.getAvailableCommands()
      return NextResponse.json({
        success: true,
        data: { commands: availableCommands }
      })
    }

    const analytics = await voiceCommandService.getVoiceCommandAnalytics(user.tenantId)

    return NextResponse.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('Voice command get error:', error)
    return NextResponse.json(
      { error: 'Failed to get voice command data' },
      { status: 500 }
    )
  }
}

// POST /api/ai/voice-commands - Process voice command
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
    const { command, confidence, customCommand } = body

    if (!command) {
      return NextResponse.json({ error: 'Voice command required' }, { status: 400 })
    }

    if (customCommand) {
      voiceCommandService.addCustomCommand(customCommand)
      return NextResponse.json({
        success: true,
        message: 'Custom command added successfully'
      })
    }

    const result = await voiceCommandService.processVoiceCommand(
      command,
      confidence || 0.8,
      user.tenantId,
      user.id
    )

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Voice command processing error:', error)
    return NextResponse.json(
      { error: 'Voice command processing failed' },
      { status: 500 }
    )
  }
}

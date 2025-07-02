
// SPRINT 2.9 - Performance Optimization API Routes
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { performanceOptimization } from '@/lib/services/performance-optimization-service'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

// GET /api/performance/optimization - Get performance analytics
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

    const analytics = await performanceOptimization.getPerformanceAnalytics(user.tenantId, timeRange)

    return NextResponse.json({
      success: true,
      data: analytics
    })
  } catch (error) {
    console.error('Performance analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to get performance analytics' },
      { status: 500 }
    )
  }
}

// POST /api/performance/optimization - Cache operations or query optimization
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
    const { action, key, value, config, query, parameters, pattern, tags } = body

    switch (action) {
      case 'set_cache':
        if (!key || !value || !config) {
          return NextResponse.json({ error: 'Key, value, and config required' }, { status: 400 })
        }

        const cached = await performanceOptimization.setCache(
          key,
          value,
          config,
          user.tenantId
        )

        return NextResponse.json({
          success: cached,
          message: cached ? 'Cache set successfully' : 'Cache operation failed'
        })

      case 'get_cache':
        if (!key) {
          return NextResponse.json({ error: 'Cache key required' }, { status: 400 })
        }

        const cachedValue = await performanceOptimization.getCache(key, user.tenantId)

        return NextResponse.json({
          success: true,
          data: { value: cachedValue, cached: cachedValue !== null }
        })

      case 'invalidate_cache':
        if (!pattern) {
          return NextResponse.json({ error: 'Cache pattern required' }, { status: 400 })
        }

        const invalidated = await performanceOptimization.invalidateCache(pattern, user.tenantId)

        return NextResponse.json({
          success: invalidated,
          message: invalidated ? 'Cache invalidated successfully' : 'Cache invalidation failed'
        })

      case 'invalidate_by_tags':
        if (!tags || !Array.isArray(tags)) {
          return NextResponse.json({ error: 'Tags array required' }, { status: 400 })
        }

        const tagInvalidated = await performanceOptimization.invalidateCacheByTags(tags, user.tenantId)

        return NextResponse.json({
          success: tagInvalidated,
          message: tagInvalidated ? 'Cache invalidated by tags successfully' : 'Tag invalidation failed'
        })

      case 'optimize_query':
        if (!query || !parameters) {
          return NextResponse.json({ error: 'Query and parameters required' }, { status: 400 })
        }

        const optimization = await performanceOptimization.optimizeQuery(
          query,
          parameters,
          user.tenantId
        )

        return NextResponse.json({
          success: true,
          data: optimization
        })

      case 'optimize_resources':
        const resourceOptimization = await performanceOptimization.optimizeResources()

        return NextResponse.json({
          success: true,
          data: resourceOptimization
        })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Performance optimization error:', error)
    return NextResponse.json(
      { error: 'Performance optimization failed' },
      { status: 500 }
    )
  }
}

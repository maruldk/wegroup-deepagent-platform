
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { CacheService } from '@/lib/performance/cache-service';

export const dynamic = 'force-dynamic';

// Initialize cache service (singleton pattern)
let cacheService: CacheService | null = null;

function getCacheService(): CacheService {
  if (!cacheService) {
    cacheService = new CacheService({
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      keyPrefix: 'wegroup:api:',
      maxMemory: '128mb'
    });
  }
  return cacheService;
}

/**
 * GET /api/performance/cache
 * Get cache performance metrics and health status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    if (!session.user.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ 
        error: 'Insufficient privileges. Admin access required.' 
      }, { status: 403 });
    }

    const cache = getCacheService();
    
    const [metrics, healthCheck] = await Promise.all([
      cache.getMetrics(),
      cache.healthCheck()
    ]);

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        health: healthCheck,
        timestamp: new Date(),
        cacheType: 'Redis + Local Memory'
      }
    });

  } catch (error) {
    console.error('Cache metrics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/performance/cache
 * Cache management operations
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    if (!session.user.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ 
        error: 'Insufficient privileges. Admin access required.' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { action, key, value, pattern, ttl } = body;

    if (!action) {
      return NextResponse.json({ 
        error: 'Missing action parameter' 
      }, { status: 400 });
    }

    const cache = getCacheService();
    let result;

    switch (action) {
      case 'get':
        if (!key) {
          return NextResponse.json({ error: 'Missing key parameter for get action' }, { status: 400 });
        }
        result = await cache.get(key);
        break;

      case 'set':
        if (!key || value === undefined) {
          return NextResponse.json({ error: 'Missing key or value parameter for set action' }, { status: 400 });
        }
        result = await cache.set(key, value, ttl);
        break;

      case 'delete':
        if (!key) {
          return NextResponse.json({ error: 'Missing key parameter for delete action' }, { status: 400 });
        }
        result = await cache.delete(key);
        break;

      case 'exists':
        if (!key) {
          return NextResponse.json({ error: 'Missing key parameter for exists action' }, { status: 400 });
        }
        result = await cache.exists(key);
        break;

      case 'clear':
        result = await cache.clear(pattern);
        break;

      case 'invalidate_tag':
        if (!pattern) {
          return NextResponse.json({ error: 'Missing pattern parameter for invalidate_tag action' }, { status: 400 });
        }
        result = await cache.invalidateByTag(pattern);
        break;

      case 'reset_metrics':
        cache.resetMetrics();
        result = { reset: true };
        break;

      case 'health_check':
        result = await cache.healthCheck();
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action. Must be one of: get, set, delete, exists, clear, invalidate_tag, reset_metrics, health_check' 
        }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        action,
        result,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Cache management API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * DELETE /api/performance/cache
 * Clear all cache or by pattern
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    if (!session.user.role || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ 
        error: 'Insufficient privileges. Admin access required.' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pattern = searchParams.get('pattern');

    const cache = getCacheService();
    const clearedCount = await cache.clear(pattern || undefined);

    return NextResponse.json({
      success: true,
      data: {
        action: 'clear',
        pattern: pattern || 'all',
        clearedCount,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Cache clear API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

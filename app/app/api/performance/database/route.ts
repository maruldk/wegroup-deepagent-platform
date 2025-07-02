
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DatabaseOptimizationService } from '@/lib/performance/database-optimization';

export const dynamic = 'force-dynamic';

const dbOptimizationService = new DatabaseOptimizationService();

/**
 * GET /api/performance/database
 * Get database performance metrics
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

    const metrics = await dbOptimizationService.getDatabaseMetrics();

    return NextResponse.json({
      success: true,
      data: {
        metrics,
        timestamp: new Date(),
        system: 'PostgreSQL with Prisma ORM'
      }
    });

  } catch (error) {
    console.error('Database metrics API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/performance/database/analyze
 * Analyze query performance
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
    const { query, action = 'analyze' } = body;

    if (action === 'analyze') {
      if (!query || typeof query !== 'string') {
        return NextResponse.json({ 
          error: 'Missing or invalid query parameter' 
        }, { status: 400 });
      }

      if (query.length > 5000) {
        return NextResponse.json({ 
          error: 'Query exceeds maximum length of 5000 characters' 
        }, { status: 400 });
      }

      const analysis = await dbOptimizationService.analyzeQuery(query);

      return NextResponse.json({
        success: true,
        data: analysis
      });
    }

    if (action === 'optimize_indexes') {
      const tenantId = body.tenantId || session.user.tenantId || 'default';
      const optimization = await dbOptimizationService.optimizeIndexes(tenantId);

      return NextResponse.json({
        success: true,
        data: optimization
      });
    }

    if (action === 'optimize_connections') {
      const optimization = await dbOptimizationService.optimizeConnectionPool();

      return NextResponse.json({
        success: true,
        data: optimization
      });
    }

    if (action === 'maintenance') {
      const maintenance = await dbOptimizationService.performMaintenance();

      return NextResponse.json({
        success: true,
        data: maintenance
      });
    }

    return NextResponse.json({ 
      error: 'Invalid action. Must be one of: analyze, optimize_indexes, optimize_connections, maintenance' 
    }, { status: 400 });

  } catch (error) {
    console.error('Database optimization API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

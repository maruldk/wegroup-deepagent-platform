
import { NextRequest, NextResponse } from 'next/server';
import { getDecisionEngine, DecisionContext } from '@/lib/ai/autonomous-decision-engine';
import { CRMDecisionEngine } from '@/lib/ai/decision-models/crm-decision-model';
import { HRDecisionEngine } from '@/lib/ai/decision-models/hr-decision-model';
import { BusinessDecisionEngine } from '@/lib/ai/decision-models/business-decision-model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/ai/decisions
 * Make autonomous AI decisions
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      module, 
      action, 
      data, 
      priority = 'MEDIUM', 
      metadata = {},
      tenantId = session.user.tenantId || 'default' 
    } = body;

    // Validate required fields
    if (!module || !action || !data) {
      return NextResponse.json({ 
        error: 'Missing required fields: module, action, data' 
      }, { status: 400 });
    }

    const validModules = ['CRM', 'HR', 'FINANCE', 'PROJECT', 'ANALYTICS'];
    if (!validModules.includes(module)) {
      return NextResponse.json({ 
        error: `Invalid module. Must be one of: ${validModules.join(', ')}` 
      }, { status: 400 });
    }

    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({ 
        error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
      }, { status: 400 });
    }

    // Create decision context
    const context: DecisionContext = {
      tenantId,
      userId: session.user.id,
      module: module as 'CRM' | 'HR' | 'FINANCE' | 'PROJECT' | 'ANALYTICS',
      action,
      data,
      priority: priority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      metadata: {
        ...metadata,
        timestamp: new Date(),
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || 'unknown'
      }
    };

    // Get the appropriate decision engine
    let decisionResult;
    const autonomousEngine = getDecisionEngine();

    // Use specialized engines for specific modules
    if (module === 'CRM') {
      const crmEngine = new CRMDecisionEngine();
      decisionResult = await crmEngine.makeCRMDecision(context);
    } else if (module === 'HR') {
      const hrEngine = new HRDecisionEngine();
      decisionResult = await hrEngine.makeHRDecision(context);
    } else if (module === 'FINANCE' || module === 'PROJECT') {
      const businessEngine = new BusinessDecisionEngine();
      decisionResult = await businessEngine.makeBusinessDecision(context);
    } else {
      // Use the general autonomous decision engine
      decisionResult = await autonomousEngine.makeDecision(context);
    }

    // Enhance response with additional metadata
    const enhancedResult = {
      ...decisionResult,
      context: {
        module,
        action,
        priority,
        tenantId,
        timestamp: new Date(),
        processingTime: Date.now() - (metadata.startTime || Date.now())
      },
      version: '1.0.0'
    };

    return NextResponse.json({
      success: true,
      data: enhancedResult
    });

  } catch (error) {
    console.error('Decision API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * GET /api/ai/decisions?tenantId=xxx&limit=10&module=CRM
 * Get recent decisions for analysis
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId') || session.user.tenantId || 'default';
    const limit = parseInt(searchParams.get('limit') || '10');
    const module = searchParams.get('module');
    const timeframe = searchParams.get('timeframe') || '7d'; // 7 days default

    // Calculate date range
    const timeframeHours = {
      '1h': 1,
      '24h': 24,
      '7d': 24 * 7,
      '30d': 24 * 30,
      '90d': 24 * 90
    };

    const hoursBack = timeframeHours[timeframe as keyof typeof timeframeHours] || 24 * 7;
    const startDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    const decisionEngine = getDecisionEngine();
    
    // Get decisions from the decision engine (this would typically query the database)
    const decisions = []; // Placeholder - implement actual decision retrieval

    const stats = {
      totalDecisions: decisions.length,
      averageConfidence: decisions.length > 0 
        ? decisions.reduce((sum: number, d: any) => sum + d.confidence, 0) / decisions.length 
        : 0,
      autoExecutedCount: decisions.filter((d: any) => d.autoExecuted).length,
      topActions: this.getTopActions(decisions),
      confidenceDistribution: this.getConfidenceDistribution(decisions)
    };

    return NextResponse.json({
      success: true,
      data: {
        decisions: decisions.slice(0, limit),
        stats,
        filters: {
          tenantId,
          module,
          timeframe,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get decisions API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }

  // Helper methods would be implemented as part of a class or separate utility
  function getTopActions(decisions: any[]): any[] {
    const actionCounts: Record<string, number> = {};
    decisions.forEach(d => {
      actionCounts[d.action] = (actionCounts[d.action] || 0) + 1;
    });
    
    return Object.entries(actionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([action, count]) => ({ action, count }));
  }

  function getConfidenceDistribution(decisions: any[]): any {
    const ranges = { low: 0, medium: 0, high: 0 };
    decisions.forEach(d => {
      if (d.confidence < 0.5) ranges.low++;
      else if (d.confidence < 0.8) ranges.medium++;
      else ranges.high++;
    });
    return ranges;
  }
}

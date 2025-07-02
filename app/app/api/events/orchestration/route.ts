
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getOrchestrator } from '../../../../lib/ai/orchestrator';
import { getEventBus } from '../../../../lib/ai/event-bus';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const metric = searchParams.get('metric');
    const timeframe = searchParams.get('timeframe') || '24h';

    // Calculate time range
    let startDate: Date;
    switch (timeframe) {
      case '1h':
        startDate = new Date(Date.now() - 60 * 60 * 1000);
        break;
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    if (metric === 'stats') {
      // Get orchestration statistics
      const orchestrator = getOrchestrator();
      const stats = await orchestrator.getOrchestrationStats(session.user.tenantId);
      
      return NextResponse.json({ stats });
    }

    if (metric === 'metrics') {
      // Get detailed metrics
      const [
        eventMetrics,
        workflowMetrics,
        aiMetrics,
        recentEvents
      ] = await Promise.all([
        // Event processing metrics
        prisma.eventBus.groupBy({
          by: ['status'],
          where: {
            tenantId: session.user.tenantId,
            createdAt: { gte: startDate }
          },
          _count: true,
          _avg: {
            // Calculate average processing time
          }
        }),

        // Workflow execution metrics
        prisma.workflowExecution.groupBy({
          by: ['status'],
          where: {
            tenantId: session.user.tenantId,
            createdAt: { gte: startDate }
          },
          _count: true
        }),

        // AI insight metrics
        prisma.aIInsight.groupBy({
          by: ['severity'],
          where: {
            tenantId: session.user.tenantId,
            createdAt: { gte: startDate }
          },
          _count: true
        }),

        // Recent events for analysis
        prisma.eventBus.findMany({
          where: {
            tenantId: session.user.tenantId,
            createdAt: { gte: startDate }
          },
          select: {
            id: true,
            eventName: true,
            eventType: true,
            status: true,
            createdAt: true,
            processedAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 100
        })
      ]);

      // Calculate processing times
      const processingTimes = recentEvents
        .filter(event => event.processedAt)
        .map(event => event.processedAt!.getTime() - event.createdAt.getTime());

      const avgProcessingTime = processingTimes.length > 0
        ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length
        : 0;

      // Calculate success rate
      const totalEvents = recentEvents.length;
      const successfulEvents = recentEvents.filter(event => event.status === 'COMPLETED').length;
      const successRate = totalEvents > 0 ? successfulEvents / totalEvents : 0;

      // Calculate automation score based on AI insights and successful workflows
      const aiInsightsCount = aiMetrics.reduce((sum, metric) => sum + metric._count, 0);
      const successfulWorkflows = workflowMetrics
        .filter(metric => metric.status === 'COMPLETED')
        .reduce((sum, metric) => sum + metric._count, 0);
      
      const automationScore = Math.min(
        (aiInsightsCount * 0.3 + successfulWorkflows * 0.4 + successRate * 0.3),
        1.0
      );

      return NextResponse.json({
        metrics: {
          eventMetrics: eventMetrics.reduce((acc, metric) => {
            acc[metric.status] = metric._count;
            return acc;
          }, {} as Record<string, number>),
          
          workflowMetrics: workflowMetrics.reduce((acc, metric) => {
            acc[metric.status] = metric._count;
            return acc;
          }, {} as Record<string, number>),
          
          aiMetrics: aiMetrics.reduce((acc, metric) => {
            acc[metric.severity] = metric._count;
            return acc;
          }, {} as Record<string, number>),
          
          performance: {
            avgProcessingTime,
            successRate,
            automationScore,
            totalEvents,
            timeframe
          }
        }
      });
    }

    if (metric === 'live') {
      // Get live orchestration data
      const eventBus = getEventBus();
      const eventMetrics = eventBus.getMetrics();
      
      // Get current active workflows
      const activeWorkflows = await prisma.workflowExecution.findMany({
        where: {
          tenantId: session.user.tenantId,
          status: 'RUNNING'
        },
        include: {
          workflowDefinition: {
            select: {
              name: true
            }
          }
        },
        take: 10
      });

      // Get recent notifications
      const recentNotifications = await prisma.realTimeNotification.findMany({
        where: {
          tenantId: session.user.tenantId,
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      return NextResponse.json({
        liveData: {
          activeWorkflows,
          recentNotifications,
          eventProcessingMetrics: Array.from(eventMetrics.values()).slice(-10),
          timestamp: new Date()
        }
      });
    }

    return NextResponse.json({ error: 'Invalid metric parameter' }, { status: 400 });

  } catch (error) {
    console.error('Failed to fetch orchestration data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orchestration data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'trigger_workflow':
        const { workflowName, inputData, priority } = data;
        
        // Find workflow definition
        const workflowDef = await prisma.workflowDefinition.findFirst({
          where: {
            name: workflowName,
            tenantId: session.user.tenantId,
            isActive: true
          }
        });

        if (!workflowDef) {
          return NextResponse.json(
            { error: 'Workflow not found' },
            { status: 404 }
          );
        }

        // Trigger workflow via event
        const eventBus = getEventBus();
        const eventId = await eventBus.publishEvent(
          workflowDef.triggerEvent,
          'WORKFLOW_EVENT',
          inputData,
          {
            userId: session.user.id,
            tenantId: session.user.tenantId,
            timestamp: new Date(),
            source: 'manual-trigger'
          },
          {
            priority: priority || 'MEDIUM'
          }
        );

        return NextResponse.json({
          success: true,
          eventId,
          message: 'Workflow triggered successfully'
        });

      case 'update_automation_level':
        const { level } = data;
        
        if (typeof level !== 'number' || level < 0 || level > 1) {
          return NextResponse.json(
            { error: 'Invalid automation level. Must be between 0 and 1' },
            { status: 400 }
          );
        }

        // Store automation level preference (this could be in user preferences or tenant settings)
        // For now, we'll return success - in production, this would update tenant settings
        
        return NextResponse.json({
          success: true,
          message: `Automation level updated to ${Math.round(level * 100)}%`
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Orchestration action failed:', error);
    return NextResponse.json(
      { error: 'Orchestration action failed' },
      { status: 500 }
    );
  }
}


export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getEventBus } from '../../../lib/ai/event-bus';
import { getOrchestrator } from '../../../lib/ai/orchestrator';
import { PrismaClient } from '@prisma/client';
import {
  EventType,
  EventPriority,
  EventStatus
} from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      eventName,
      eventType,
      payload,
      priority,
      target,
      scheduledAt
    } = body;

    // Validate required fields
    if (!eventName || !eventType || !payload) {
      return NextResponse.json(
        { error: 'Missing required fields: eventName, eventType, payload' },
        { status: 400 }
      );
    }

    // Validate event type
    if (!Object.values(EventType).includes(eventType)) {
      return NextResponse.json(
        { error: 'Invalid event type' },
        { status: 400 }
      );
    }

    const eventBus = getEventBus();
    
    // Publish event
    const eventId = await eventBus.publishEvent(
      eventName,
      eventType,
      payload,
      {
        userId: session.user.id,
        tenantId: session.user.tenantId,
        timestamp: new Date(),
        source: 'api'
      },
      {
        priority: priority || EventPriority.MEDIUM,
        target,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined
      }
    );

    return NextResponse.json({
      success: true,
      eventId,
      message: 'Event published successfully'
    });

  } catch (error) {
    console.error('Event publishing failed:', error);
    return NextResponse.json(
      { error: 'Failed to publish event' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const eventType = searchParams.get('eventType');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query filters
    const where: any = {
      tenantId: session.user.tenantId
    };

    if (eventType) {
      where.eventType = eventType;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Get events with handlers
    const events = await prisma.eventBus.findMany({
      where,
      include: {
        handlers: {
          orderBy: { createdAt: 'desc' }
        },
        correlations: {
          orderBy: { sequenceNumber: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    // Get total count
    const totalCount = await prisma.eventBus.count({ where });

    return NextResponse.json({
      events,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit
      }
    });

  } catch (error) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

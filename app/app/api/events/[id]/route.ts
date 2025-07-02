
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { EventStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = await prisma.eventBus.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId
      },
      include: {
        handlers: {
          orderBy: { createdAt: 'desc' }
        },
        correlations: {
          include: {
            parentEvent: {
              select: {
                id: true,
                eventName: true,
                status: true,
                createdAt: true
              }
            }
          }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json(event);

  } catch (error) {
    console.error('Failed to fetch event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status, scheduledAt } = body;

    // Validate status if provided
    if (status && !Object.values(EventStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Check if event exists and belongs to tenant
    const existingEvent = await prisma.eventBus.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId
      }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Update event
    const updatedEvent = await prisma.eventBus.update({
      where: { id: params.id },
      data: {
        ...(status && { status }),
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        updatedAt: new Date()
      },
      include: {
        handlers: true,
        correlations: true
      }
    });

    return NextResponse.json({
      success: true,
      event: updatedEvent,
      message: 'Event updated successfully'
    });

  } catch (error) {
    console.error('Failed to update event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if event exists and belongs to tenant
    const existingEvent = await prisma.eventBus.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId
      }
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Can only delete events that are not processing or completed
    if (existingEvent.status === EventStatus.PROCESSING) {
      return NextResponse.json(
        { error: 'Cannot delete event that is currently processing' },
        { status: 400 }
      );
    }

    // Delete event (cascades to handlers and correlations)
    await prisma.eventBus.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    });

  } catch (error) {
    console.error('Failed to delete event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}

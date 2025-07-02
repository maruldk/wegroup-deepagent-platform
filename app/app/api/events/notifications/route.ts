
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { getWebSocketService } from '../../../../lib/ai/websocket-service';
import {
  NotificationType,
  NotificationSeverity
} from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const isRead = searchParams.get('isRead');
    const type = searchParams.get('type');
    const severity = searchParams.get('severity');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query filters
    const where: any = {
      tenantId: session.user.tenantId,
      OR: [
        { userId: null }, // Broadcast notifications
        { userId: session.user.id } // User-specific notifications
      ]
    };

    if (isRead !== null) {
      where.isRead = isRead === 'true';
    }

    if (type) {
      where.type = type;
    }

    if (severity) {
      where.severity = severity;
    }

    // Only include non-expired notifications
    const now = new Date();
    where.OR.push({ expiresAt: null });
    where.OR.push({ expiresAt: { gt: now } });

    const notifications = await prisma.realTimeNotification.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit,
      skip: offset
    });

    // Get unread count
    const unreadCount = await prisma.realTimeNotification.count({
      where: {
        ...where,
        isRead: false
      }
    });

    // Get total count
    const totalCount = await prisma.realTimeNotification.count({ where });

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: totalCount > offset + limit
      }
    });

  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
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
    const {
      title,
      message,
      type,
      severity,
      userId,
      data,
      isPersistent,
      channel,
      expiresAt
    } = body;

    // Validate required fields
    if (!title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: title, message' },
        { status: 400 }
      );
    }

    // Validate enums
    if (type && !Object.values(NotificationType).includes(type)) {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      );
    }

    if (severity && !Object.values(NotificationSeverity).includes(severity)) {
      return NextResponse.json(
        { error: 'Invalid notification severity' },
        { status: 400 }
      );
    }

    // Create notification
    const notification = await prisma.realTimeNotification.create({
      data: {
        title,
        message,
        type: type || NotificationType.INFO,
        severity: severity || NotificationSeverity.INFO,
        data,
        userId: userId || null,
        tenantId: session.user.tenantId,
        isPersistent: isPersistent !== false,
        channel,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Send real-time notification via WebSocket
    const wsService = getWebSocketService();
    if (wsService) {
      await wsService.sendNotification({
        title,
        message,
        type: type || NotificationType.INFO,
        severity: severity || NotificationSeverity.INFO,
        tenantId: session.user.tenantId,
        userId: userId || undefined,
        data,
        isPersistent: isPersistent !== false,
        channel
      });
    }

    return NextResponse.json({
      success: true,
      notification,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('Failed to send notification:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, action } = body;

    if (!notificationIds || !Array.isArray(notificationIds) || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: notificationIds (array), action' },
        { status: 400 }
      );
    }

    let updateData: any = {};

    switch (action) {
      case 'mark_read':
        updateData = { isRead: true };
        break;
      case 'mark_unread':
        updateData = { isRead: false };
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: mark_read, mark_unread' },
          { status: 400 }
        );
    }

    // Update notifications
    const result = await prisma.realTimeNotification.updateMany({
      where: {
        id: { in: notificationIds },
        tenantId: session.user.tenantId,
        OR: [
          { userId: null },
          { userId: session.user.id }
        ]
      },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      updatedCount: result.count,
      message: `${result.count} notifications updated successfully`
    });

  } catch (error) {
    console.error('Failed to update notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

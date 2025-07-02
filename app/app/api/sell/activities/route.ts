
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';
    const assignedTo = searchParams.get('assignedTo') || 'all';
    const opportunityId = searchParams.get('opportunityId') || 'all';
    const customerId = searchParams.get('customerId') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: session.user.tenantId,
    };

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (type !== 'all') {
      where.type = type;
    }

    if (status !== 'all') {
      where.status = status;
    }

    if (assignedTo !== 'all') {
      where.assignedTo = assignedTo;
    }

    if (opportunityId !== 'all') {
      where.opportunityId = opportunityId;
    }

    if (customerId !== 'all') {
      where.customerId = customerId;
    }

    if (priority !== 'all') {
      where.priority = priority;
    }

    if (fromDate && toDate) {
      where.scheduledAt = {
        gte: new Date(fromDate),
        lte: new Date(toDate),
      };
    } else if (fromDate) {
      where.scheduledAt = { gte: new Date(fromDate) };
    } else if (toDate) {
      where.scheduledAt = { lte: new Date(toDate) };
    }

    const [activities, total] = await Promise.all([
      prisma.salesActivity.findMany({
        where,
        orderBy: [
          { scheduledAt: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
        include: {
          opportunity: {
            select: { title: true, stage: true },
          },
          customer: {
            select: { companyName: true, contactPerson: true },
          },
          creator: {
            select: { name: true, email: true },
          },
          assignee: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.salesActivity.count({ where }),
    ]);

    return NextResponse.json({
      activities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get activities error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
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

    const data = await request.json();
    const {
      opportunityId,
      customerId,
      type,
      subject,
      description,
      scheduledAt,
      duration,
      location,
      priority = 'MEDIUM',
      reminderAt,
      isRecurring = false,
      recurringType,
      recurringUntil,
      attendees = [],
      attachments = [],
      assignedTo
    } = data;

    if (!type || !subject) {
      return NextResponse.json(
        { error: 'Typ und Betreff sind erforderlich' },
        { status: 400 }
      );
    }

    const activity = await prisma.salesActivity.create({
      data: {
        opportunityId,
        customerId,
        type,
        subject,
        description,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        duration,
        location,
        priority,
        reminderAt: reminderAt ? new Date(reminderAt) : null,
        isRecurring,
        recurringType,
        recurringUntil: recurringUntil ? new Date(recurringUntil) : null,
        attendees,
        attachments,
        assignedTo: assignedTo || session.user.id,
        tenantId: session.user.tenantId,
        createdBy: session.user.id,
      },
      include: {
        opportunity: {
          select: { title: true, stage: true },
        },
        customer: {
          select: { companyName: true, contactPerson: true },
        },
        creator: {
          select: { name: true, email: true },
        },
        assignee: {
          select: { name: true, email: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SALES_ACTIVITY_CREATED',
        resource: 'SALES_ACTIVITY',
        resourceId: activity.id,
        details: { subject: activity.subject, type: activity.type },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Create activity error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

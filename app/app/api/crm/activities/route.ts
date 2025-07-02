
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
    const assignedUserId = searchParams.get('assignedUserId') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: session.user.tenantId,
    };

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } },
        { contact: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (type !== 'all') {
      where.type = type;
    }

    if (status !== 'all') {
      where.status = status;
    }

    if (assignedUserId !== 'all') {
      where.assignedUserId = assignedUserId;
    }

    const [activities, total] = await Promise.all([
      prisma.crmActivity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          assignedUser: {
            select: { name: true, email: true },
          },
          createdBy: {
            select: { name: true, email: true },
          },
          customer: {
            select: { companyName: true, status: true },
          },
          contact: {
            select: { fullName: true, email: true, title: true },
          },
          opportunity: {
            select: { name: true, stage: true },
          },
          deal: {
            select: { name: true, status: true },
          },
        },
      }),
      prisma.crmActivity.count({ where }),
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
    console.error('Get CRM activities error:', error);
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
      subject,
      description,
      type = 'TASK',
      status = 'SCHEDULED',
      priority = 'MEDIUM',
      dueDate,
      completedDate,
      duration,
      outcome,
      tags,
      attachments,
      customFields,
      customerId,
      contactId,
      opportunityId,
      dealId,
      assignedUserId,
    } = data;

    if (!subject) {
      return NextResponse.json(
        { error: 'Aktivitäts-Betreff ist erforderlich' },
        { status: 400 }
      );
    }

    const activity = await prisma.crmActivity.create({
      data: {
        subject,
        description,
        type,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        completedDate: completedDate ? new Date(completedDate) : null,
        duration,
        outcome,
        tags,
        attachments,
        customFields,
        customerId,
        contactId,
        opportunityId,
        dealId,
        assignedUserId,
        createdById: session.user.id,
        tenantId: session.user.tenantId,
      },
      include: {
        assignedUser: {
          select: { name: true, email: true },
        },
        createdBy: {
          select: { name: true, email: true },
        },
        customer: {
          select: { companyName: true, status: true },
        },
        contact: {
          select: { fullName: true, email: true, title: true },
        },
        opportunity: {
          select: { name: true, stage: true },
        },
        deal: {
          select: { name: true, status: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CRM_ACTIVITY_CREATED',
        resource: 'CRM_ACTIVITY',
        resourceId: activity.id,
        details: { subject: activity.subject, type: activity.type },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error('Create CRM activity error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

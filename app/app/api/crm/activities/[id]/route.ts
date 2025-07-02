
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activity = await prisma.crmActivity.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        assignedUser: {
          select: { name: true, email: true },
        },
        createdBy: {
          select: { name: true, email: true },
        },
        customer: true,
        contact: true,
        opportunity: true,
        deal: true,
      },
    });

    if (!activity) {
      return NextResponse.json({ error: 'Aktivität nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Get CRM activity error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      subject,
      description,
      type,
      status,
      priority,
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

    const existingActivity = await prisma.crmActivity.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingActivity) {
      return NextResponse.json({ error: 'Aktivität nicht gefunden' }, { status: 404 });
    }

    const activity = await prisma.crmActivity.update({
      where: { id: params.id },
      data: {
        subject,
        description,
        type,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        completedDate: completedDate ? new Date(completedDate) : undefined,
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
        action: 'CRM_ACTIVITY_UPDATED',
        resource: 'CRM_ACTIVITY',
        resourceId: activity.id,
        details: { subject: activity.subject, changes: Object.keys(data) },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(activity);
  } catch (error) {
    console.error('Update CRM activity error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
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

    const existingActivity = await prisma.crmActivity.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingActivity) {
      return NextResponse.json({ error: 'Aktivität nicht gefunden' }, { status: 404 });
    }

    await prisma.crmActivity.delete({
      where: { id: params.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CRM_ACTIVITY_DELETED',
        resource: 'CRM_ACTIVITY',
        resourceId: params.id,
        details: { subject: existingActivity.subject },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ message: 'Aktivität erfolgreich gelöscht' });
  } catch (error) {
    console.error('Delete CRM activity error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

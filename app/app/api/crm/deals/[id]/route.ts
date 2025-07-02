
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

    const deal = await prisma.deal.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        owner: {
          select: { name: true, email: true },
        },
        customer: true,
        contact: true,
        opportunity: true,
        activities: {
          include: {
            assignedUser: {
              select: { name: true, email: true },
            },
            createdBy: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!deal) {
      return NextResponse.json({ error: 'Deal nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Get deal error:', error);
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
      name,
      description,
      status,
      amount,
      currency,
      closedDate,
      margin,
      commission,
      tags,
      terms,
      notes,
      customFields,
      opportunityId,
      customerId,
      contactId,
      ownerId,
    } = data;

    const existingDeal = await prisma.deal.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingDeal) {
      return NextResponse.json({ error: 'Deal nicht gefunden' }, { status: 404 });
    }

    const deal = await prisma.deal.update({
      where: { id: params.id },
      data: {
        name,
        description,
        status,
        amount,
        currency,
        closedDate: closedDate ? new Date(closedDate) : undefined,
        margin,
        commission,
        tags,
        terms,
        notes,
        customFields,
        opportunityId,
        customerId,
        contactId,
        ownerId,
      },
      include: {
        owner: {
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
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DEAL_UPDATED',
        resource: 'DEAL',
        resourceId: deal.id,
        details: { name: deal.name, status: deal.status, changes: Object.keys(data) },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(deal);
  } catch (error) {
    console.error('Update deal error:', error);
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

    const existingDeal = await prisma.deal.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingDeal) {
      return NextResponse.json({ error: 'Deal nicht gefunden' }, { status: 404 });
    }

    await prisma.deal.delete({
      where: { id: params.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DEAL_DELETED',
        resource: 'DEAL',
        resourceId: params.id,
        details: { name: existingDeal.name, amount: existingDeal.amount },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ message: 'Deal erfolgreich gelöscht' });
  } catch (error) {
    console.error('Delete deal error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

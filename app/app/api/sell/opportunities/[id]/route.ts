
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

    const opportunity = await prisma.salesOpportunity.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        customer: true,
        assignee: {
          select: { name: true, email: true },
        },
        quotes: {
          orderBy: { createdAt: 'desc' },
          include: {
            creator: { select: { name: true } },
            _count: { select: { items: true } },
          },
        },
        activities: {
          orderBy: { scheduledAt: 'desc' },
          include: {
            creator: { select: { name: true } },
            assignee: { select: { name: true } },
          },
        },
        products: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Get opportunity error:', error);
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
      title,
      description,
      amount,
      currency,
      probability,
      stage,
      priority,
      source,
      expectedCloseDate,
      actualCloseDate,
      closedReason,
      customerId,
      assignedTo,
      tags,
      customFields,
      notes
    } = data;

    // Check if opportunity exists and user has access
    const existingOpportunity = await prisma.salesOpportunity.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingOpportunity) {
      return NextResponse.json({ error: 'Opportunity nicht gefunden' }, { status: 404 });
    }

    const opportunity = await prisma.salesOpportunity.update({
      where: { id: params.id },
      data: {
        title,
        description,
        amount,
        currency,
        probability,
        stage,
        priority,
        source,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        actualCloseDate: actualCloseDate ? new Date(actualCloseDate) : null,
        closedReason,
        customerId,
        assignedTo,
        tags,
        customFields,
        notes,
      },
      include: {
        customer: {
          select: { companyName: true, contactPerson: true, email: true },
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
        action: 'SALES_OPPORTUNITY_UPDATED',
        resource: 'SALES_OPPORTUNITY',
        resourceId: opportunity.id,
        details: { title: opportunity.title, stage: opportunity.stage },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Update opportunity error:', error);
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

    // Check if opportunity exists and user has access
    const opportunity = await prisma.salesOpportunity.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity nicht gefunden' }, { status: 404 });
    }

    // Delete opportunity (cascade will handle quotes, activities, products)
    await prisma.salesOpportunity.delete({
      where: { id: params.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SALES_OPPORTUNITY_DELETED',
        resource: 'SALES_OPPORTUNITY',
        resourceId: params.id,
        details: { title: opportunity.title },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ message: 'Opportunity gelöscht' });
  } catch (error) {
    console.error('Delete opportunity error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

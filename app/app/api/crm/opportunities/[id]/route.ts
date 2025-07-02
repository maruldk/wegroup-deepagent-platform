
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

    const opportunity = await prisma.opportunity.findFirst({
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
        deals: {
          include: {
            owner: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
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
      name,
      description,
      stage,
      probability,
      amount,
      currency,
      expectedCloseDate,
      actualCloseDate,
      source,
      competitors,
      nextSteps,
      lossReason,
      tags,
      customFields,
      customerId,
      contactId,
      ownerId,
    } = data;

    const existingOpportunity = await prisma.opportunity.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingOpportunity) {
      return NextResponse.json({ error: 'Opportunity nicht gefunden' }, { status: 404 });
    }

    const opportunity = await prisma.opportunity.update({
      where: { id: params.id },
      data: {
        name,
        description,
        stage,
        probability,
        amount,
        currency,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
        actualCloseDate: actualCloseDate ? new Date(actualCloseDate) : undefined,
        source,
        competitors,
        nextSteps,
        lossReason,
        tags,
        customFields,
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
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'OPPORTUNITY_UPDATED',
        resource: 'OPPORTUNITY',
        resourceId: opportunity.id,
        details: { name: opportunity.name, stage: opportunity.stage, changes: Object.keys(data) },
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

    const existingOpportunity = await prisma.opportunity.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingOpportunity) {
      return NextResponse.json({ error: 'Opportunity nicht gefunden' }, { status: 404 });
    }

    await prisma.opportunity.delete({
      where: { id: params.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'OPPORTUNITY_DELETED',
        resource: 'OPPORTUNITY',
        resourceId: params.id,
        details: { name: existingOpportunity.name },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ message: 'Opportunity erfolgreich gelöscht' });
  } catch (error) {
    console.error('Delete opportunity error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

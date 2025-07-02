
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

    const lead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        assignedUser: {
          select: { name: true, email: true },
        },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Get lead error:', error);
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
      companyName,
      contactPerson,
      email,
      phone,
      status,
      source,
      notes,
      estimatedValue,
      assignedUserId,
    } = data;

    // Check if lead exists and belongs to user's tenant
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead nicht gefunden' },
        { status: 404 }
      );
    }

    const lead = await prisma.lead.update({
      where: { id: params.id },
      data: {
        companyName,
        contactPerson,
        email,
        phone,
        status,
        source,
        notes,
        estimatedValue,
        assignedUserId,
      },
      include: {
        assignedUser: {
          select: { name: true, email: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'LEAD_UPDATED',
        resource: 'LEAD',
        resourceId: lead.id,
        details: { companyName: lead.companyName },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error('Update lead error:', error);
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

    // Check if lead exists and belongs to user's tenant
    const existingLead = await prisma.lead.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: 'Lead nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.lead.delete({
      where: { id: params.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'LEAD_DELETED',
        resource: 'LEAD',
        resourceId: params.id,
        details: { companyName: existingLead.companyName },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ message: 'Lead erfolgreich gelöscht' });
  } catch (error) {
    console.error('Delete lead error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

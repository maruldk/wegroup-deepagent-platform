
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

    const contact = await prisma.contact.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        owner: {
          select: { name: true, email: true },
        },
        customer: true,
        opportunities: {
          include: {
            owner: {
              select: { name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
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

    if (!contact) {
      return NextResponse.json({ error: 'Kontakt nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Get contact error:', error);
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
      firstName,
      lastName,
      email,
      phone,
      mobile,
      title,
      department,
      companyName,
      address,
      city,
      state,
      postalCode,
      country,
      website,
      linkedinUrl,
      source,
      notes,
      tags,
      ownerId,
      customerId,
      customFields,
      isActive,
    } = data;

    const existingContact = await prisma.contact.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingContact) {
      return NextResponse.json({ error: 'Kontakt nicht gefunden' }, { status: 404 });
    }

    const fullName = firstName && lastName ? `${firstName} ${lastName}` : existingContact.fullName;

    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        fullName,
        email,
        phone,
        mobile,
        title,
        department,
        companyName,
        address,
        city,
        state,
        postalCode,
        country,
        website,
        linkedinUrl,
        source,
        notes,
        tags,
        ownerId,
        customerId,
        customFields,
        isActive,
      },
      include: {
        owner: {
          select: { name: true, email: true },
        },
        customer: {
          select: { companyName: true, status: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CONTACT_UPDATED',
        resource: 'CONTACT',
        resourceId: contact.id,
        details: { name: contact.fullName, changes: Object.keys(data) },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Update contact error:', error);
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

    const existingContact = await prisma.contact.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingContact) {
      return NextResponse.json({ error: 'Kontakt nicht gefunden' }, { status: 404 });
    }

    // Soft delete by setting isActive to false
    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CONTACT_DELETED',
        resource: 'CONTACT',
        resourceId: contact.id,
        details: { name: contact.fullName },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ message: 'Kontakt erfolgreich gelöscht' });
  } catch (error) {
    console.error('Delete contact error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

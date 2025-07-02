
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
    const source = searchParams.get('source') || 'all';
    const ownerId = searchParams.get('ownerId') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: session.user.tenantId,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { companyName: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (source !== 'all') {
      where.source = source;
    }

    if (ownerId !== 'all') {
      where.ownerId = ownerId;
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          owner: {
            select: { name: true, email: true },
          },
          customer: {
            select: { companyName: true, status: true },
          },
          opportunities: {
            select: { id: true, name: true, stage: true, amount: true },
            take: 3,
          },
          _count: {
            select: {
              opportunities: true,
              activities: true,
              deals: true,
            },
          },
        },
      }),
      prisma.contact.count({ where }),
    ]);

    return NextResponse.json({
      contacts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get contacts error:', error);
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
      source = 'OTHER',
      notes,
      tags,
      ownerId,
      customerId,
      customFields,
    } = data;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'Vor- und Nachname sind erforderlich' },
        { status: 400 }
      );
    }

    const fullName = `${firstName} ${lastName}`;

    const contact = await prisma.contact.create({
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
        tenantId: session.user.tenantId,
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
        action: 'CONTACT_CREATED',
        resource: 'CONTACT',
        resourceId: contact.id,
        details: { name: contact.fullName, email: contact.email },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Create contact error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

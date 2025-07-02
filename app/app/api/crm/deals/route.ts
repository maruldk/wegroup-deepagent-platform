
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
    const status = searchParams.get('status') || 'all';
    const ownerId = searchParams.get('ownerId') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: session.user.tenantId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { customer: { companyName: { contains: search, mode: 'insensitive' } } },
        { contact: { fullName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (status !== 'all') {
      where.status = status;
    }

    if (ownerId !== 'all') {
      where.ownerId = ownerId;
    }

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
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
          contact: {
            select: { fullName: true, email: true, title: true },
          },
          opportunity: {
            select: { name: true, stage: true },
          },
          _count: {
            select: {
              activities: true,
            },
          },
        },
      }),
      prisma.deal.count({ where }),
    ]);

    return NextResponse.json({
      deals,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get deals error:', error);
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
      name,
      description,
      status = 'OPEN',
      amount,
      currency = 'EUR',
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

    if (!name || !amount) {
      return NextResponse.json(
        { error: 'Deal-Name und Betrag sind erforderlich' },
        { status: 400 }
      );
    }

    const deal = await prisma.deal.create({
      data: {
        name,
        description,
        status,
        amount,
        currency,
        closedDate: closedDate ? new Date(closedDate) : null,
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
        tenantId: session.user.tenantId,
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
        action: 'DEAL_CREATED',
        resource: 'DEAL',
        resourceId: deal.id,
        details: { name: deal.name, amount: deal.amount, status: deal.status },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(deal, { status: 201 });
  } catch (error) {
    console.error('Create deal error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

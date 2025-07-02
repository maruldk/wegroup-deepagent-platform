
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
    const stage = searchParams.get('stage') || 'all';
    const assignedTo = searchParams.get('assignedTo') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const customerId = searchParams.get('customerId') || 'all';
    const minAmount = searchParams.get('minAmount');
    const maxAmount = searchParams.get('maxAmount');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: session.user.tenantId,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    if (stage !== 'all') {
      where.stage = stage;
    }

    if (assignedTo !== 'all') {
      where.assignedTo = assignedTo;
    }

    if (priority !== 'all') {
      where.priority = priority;
    }

    if (customerId !== 'all') {
      where.customerId = customerId;
    }

    if (minAmount) {
      where.amount = { ...where.amount, gte: parseFloat(minAmount) };
    }

    if (maxAmount) {
      where.amount = { ...where.amount, lte: parseFloat(maxAmount) };
    }

    const [opportunities, total] = await Promise.all([
      prisma.salesOpportunity.findMany({
        where,
        orderBy: [
          { stage: 'asc' },
          { expectedCloseDate: 'asc' },
          { amount: 'desc' }
        ],
        skip,
        take: limit,
        include: {
          customer: {
            select: { companyName: true, contactPerson: true, email: true },
          },
          assignee: {
            select: { name: true, email: true },
          },
          _count: {
            select: {
              quotes: true,
              activities: true,
              products: true,
            },
          },
        },
      }),
      prisma.salesOpportunity.count({ where }),
    ]);

    return NextResponse.json({
      opportunities,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get opportunities error:', error);
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
      title,
      description,
      amount,
      currency = 'EUR',
      probability = 50,
      stage = 'PROSPECTING',
      priority = 'MEDIUM',
      source,
      expectedCloseDate,
      customerId,
      assignedTo,
      tags = [],
      customFields = {},
      notes
    } = data;

    if (!title || !amount || !assignedTo) {
      return NextResponse.json(
        { error: 'Titel, Betrag und Zuständiger sind erforderlich' },
        { status: 400 }
      );
    }

    const opportunity = await prisma.salesOpportunity.create({
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
        customerId,
        assignedTo,
        tags,
        customFields,
        notes,
        tenantId: session.user.tenantId,
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
        action: 'SALES_OPPORTUNITY_CREATED',
        resource: 'SALES_OPPORTUNITY',
        resourceId: opportunity.id,
        details: { title: opportunity.title, amount: opportunity.amount.toString() },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error('Create opportunity error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

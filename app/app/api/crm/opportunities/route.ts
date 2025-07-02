
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

    if (stage !== 'all') {
      where.stage = stage;
    }

    if (ownerId !== 'all') {
      where.ownerId = ownerId;
    }

    const [opportunities, total] = await Promise.all([
      prisma.opportunity.findMany({
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
          deals: {
            select: { id: true, name: true, status: true, amount: true },
          },
          _count: {
            select: {
              activities: true,
              deals: true,
            },
          },
        },
      }),
      prisma.opportunity.count({ where }),
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
      name,
      description,
      stage = 'PROSPECTING',
      probability = 'LOW',
      amount,
      currency = 'EUR',
      expectedCloseDate,
      source = 'OTHER',
      competitors,
      nextSteps,
      tags,
      customFields,
      customerId,
      contactId,
      ownerId,
    } = data;

    if (!name) {
      return NextResponse.json(
        { error: 'Opportunity-Name ist erforderlich' },
        { status: 400 }
      );
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        name,
        description,
        stage,
        probability,
        amount,
        currency,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        source,
        competitors,
        nextSteps,
        tags,
        customFields,
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
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'OPPORTUNITY_CREATED',
        resource: 'OPPORTUNITY',
        resourceId: opportunity.id,
        details: { name: opportunity.name, stage: opportunity.stage },
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

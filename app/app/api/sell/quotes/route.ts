
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
    const opportunityId = searchParams.get('opportunityId') || 'all';
    const createdBy = searchParams.get('createdBy') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: session.user.tenantId,
    };

    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status !== 'all') {
      where.status = status;
    }

    if (opportunityId !== 'all') {
      where.opportunityId = opportunityId;
    }

    if (createdBy !== 'all') {
      where.createdBy = createdBy;
    }

    const [quotes, total] = await Promise.all([
      prisma.salesQuote.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          opportunity: {
            select: { title: true, stage: true, customer: { select: { companyName: true } } },
          },
          creator: {
            select: { name: true, email: true },
          },
          _count: {
            select: { items: true },
          },
        },
      }),
      prisma.salesQuote.count({ where }),
    ]);

    return NextResponse.json({
      quotes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get quotes error:', error);
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
      opportunityId,
      title,
      description,
      validUntil,
      terms,
      notes,
      customerMessage,
      internalNotes,
      items = [] // Array of quote items
    } = data;

    if (!opportunityId || !title || !validUntil || !items.length) {
      return NextResponse.json(
        { error: 'OpportunityId, Titel, Gültigkeitsdatum und Positionen sind erforderlich' },
        { status: 400 }
      );
    }

    // Verify opportunity access
    const opportunity = await prisma.salesOpportunity.findFirst({
      where: {
        id: opportunityId,
        tenantId: session.user.tenantId,
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity nicht gefunden' }, { status: 404 });
    }

    // Generate quote number
    const quoteCount = await prisma.salesQuote.count({
      where: { tenantId: session.user.tenantId },
    });
    const quoteNumber = `Q${new Date().getFullYear()}-${String(quoteCount + 1).padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    const processedItems = items.map((item: any, index: number) => {
      const itemTotal = (item.quantity || 1) * (item.unitPrice || 0) - (item.discount || 0);
      subtotal += itemTotal;
      return {
        ...item,
        totalPrice: itemTotal,
        sortOrder: index,
        tenantId: session.user.tenantId,
      };
    });

    const taxAmount = data.taxAmount || 0;
    const discountAmount = data.discountAmount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    const quote = await prisma.salesQuote.create({
      data: {
        quoteNumber,
        opportunityId,
        title,
        description,
        subtotal,
        taxAmount,
        discountAmount,
        discountPercent: data.discountPercent,
        totalAmount,
        currency: data.currency || 'EUR',
        validUntil: new Date(validUntil),
        terms,
        notes,
        customerMessage,
        internalNotes,
        tenantId: session.user.tenantId,
        createdBy: session.user.id,
        items: {
          create: processedItems,
        },
      },
      include: {
        opportunity: {
          select: { title: true, customer: { select: { companyName: true } } },
        },
        creator: {
          select: { name: true, email: true },
        },
        items: {
          include: {
            product: { select: { name: true, sku: true } },
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'SALES_QUOTE_CREATED',
        resource: 'SALES_QUOTE',
        resourceId: quote.id,
        details: { quoteNumber: quote.quoteNumber, totalAmount: quote.totalAmount.toString() },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(quote, { status: 201 });
  } catch (error) {
    console.error('Create quote error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

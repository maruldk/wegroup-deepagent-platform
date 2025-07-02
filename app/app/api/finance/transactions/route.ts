
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
    const type = searchParams.get('type') || 'all';
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: session.user.tenantId,
    };

    if (type !== 'all') {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { date: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { name: true, email: true },
          },
          invoice: {
            select: { invoiceNumber: true, customerName: true },
          },
        },
      }),
      prisma.transaction.count({ where }),
    ]);

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
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
    const { description, amount, type, category, date, reference, invoiceId } = data;

    if (!description || !amount || !type || !date) {
      return NextResponse.json(
        { error: 'Beschreibung, Betrag, Typ und Datum sind erforderlich' },
        { status: 400 }
      );
    }

    const transaction = await prisma.transaction.create({
      data: {
        description,
        amount,
        type,
        category,
        date: new Date(date),
        reference,
        invoiceId,
        tenantId: session.user.tenantId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        invoice: {
          select: { invoiceNumber: true, customerName: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'TRANSACTION_CREATED',
        resource: 'TRANSACTION',
        resourceId: transaction.id,
        details: { description: transaction.description, amount: transaction.amount },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

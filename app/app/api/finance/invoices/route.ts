
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
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: session.user.tenantId,
    };

    if (status !== 'all') {
      where.status = status;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          customer: {
            select: { companyName: true, email: true },
          },
          user: {
            select: { name: true, email: true },
          },
          items: true,
        },
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get invoices error:', error);
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
      invoiceNumber,
      customerId,
      customerName,
      customerEmail,
      customerAddress,
      status = 'DRAFT',
      issueDate,
      dueDate,
      notes,
      terms,
      items = [],
    } = data;

    if (!invoiceNumber || !customerName || !issueDate || !dueDate) {
      return NextResponse.json(
        { error: 'Rechnungsnummer, Kundenname, Ausstellungs- und Fälligkeitsdatum sind erforderlich' },
        { status: 400 }
      );
    }

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;

    for (const item of items) {
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = itemTotal * (item.taxRate / 100);
      subtotal += itemTotal;
      taxAmount += itemTax;
    }

    const totalAmount = subtotal + taxAmount;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId,
        customerName,
        customerEmail,
        customerAddress,
        status,
        issueDate: new Date(issueDate),
        dueDate: new Date(dueDate),
        subtotal,
        taxAmount,
        totalAmount,
        notes,
        terms,
        tenantId: session.user.tenantId,
        userId: session.user.id,
      },
    });

    // Create invoice items
    if (items.length > 0) {
      await prisma.invoiceItem.createMany({
        data: items.map((item: any) => ({
          invoiceId: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          totalPrice: item.quantity * item.unitPrice,
          tenantId: session.user.tenantId,
        })),
      });
    }

    // Get complete invoice with items
    const completeInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        customer: {
          select: { companyName: true, email: true },
        },
        user: {
          select: { name: true, email: true },
        },
        items: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'INVOICE_CREATED',
        resource: 'INVOICE',
        resourceId: invoice.id,
        details: { invoiceNumber: invoice.invoiceNumber, customerName: invoice.customerName },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(completeInvoice, { status: 201 });
  } catch (error) {
    console.error('Create invoice error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}


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

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        customer: {
          select: { companyName: true, email: true, address: true, city: true },
        },
        user: {
          select: { name: true, email: true },
        },
        items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
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
      customerName,
      customerEmail,
      customerAddress,
      status,
      issueDate,
      dueDate,
      notes,
      terms,
      items = [],
    } = data;

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      );
    }

    // Calculate new totals
    let subtotal = 0;
    let taxAmount = 0;

    for (const item of items) {
      const itemTotal = item.quantity * item.unitPrice;
      const itemTax = itemTotal * (item.taxRate / 100);
      subtotal += itemTotal;
      taxAmount += itemTax;
    }

    const totalAmount = subtotal + taxAmount;

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id: params.id },
      data: {
        customerName,
        customerEmail,
        customerAddress,
        status,
        issueDate: issueDate ? new Date(issueDate) : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        subtotal,
        taxAmount,
        totalAmount,
        notes,
        terms,
      },
    });

    // Delete existing items and create new ones
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: params.id },
    });

    if (items.length > 0) {
      await prisma.invoiceItem.createMany({
        data: items.map((item: any) => ({
          invoiceId: params.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          totalPrice: item.quantity * item.unitPrice,
          tenantId: session.user.tenantId,
        })),
      });
    }

    // Get complete updated invoice
    const completeInvoice = await prisma.invoice.findUnique({
      where: { id: params.id },
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
        action: 'INVOICE_UPDATED',
        resource: 'INVOICE',
        resourceId: params.id,
        details: { invoiceNumber: invoice.invoiceNumber },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(completeInvoice);
  } catch (error) {
    console.error('Update invoice error:', error);
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

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Rechnung nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.invoice.delete({
      where: { id: params.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'INVOICE_DELETED',
        resource: 'INVOICE',
        resourceId: params.id,
        details: { invoiceNumber: existingInvoice.invoiceNumber },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete invoice error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

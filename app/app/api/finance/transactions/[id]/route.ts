
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

    const transaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
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

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaktion nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
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
    const { description, amount, type, category, date, reference } = data;

    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaktion nicht gefunden' },
        { status: 404 }
      );
    }

    const transaction = await prisma.transaction.update({
      where: { id: params.id },
      data: {
        description,
        amount,
        type,
        category,
        date: date ? new Date(date) : undefined,
        reference,
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

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
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

    const existingTransaction = await prisma.transaction.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Transaktion nicht gefunden' },
        { status: 404 }
      );
    }

    await prisma.transaction.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

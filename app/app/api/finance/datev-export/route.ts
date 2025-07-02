
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

    const exports = await prisma.datevExport.findMany({
      where: {
        tenantId: session.user.tenantId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ exports });
  } catch (error) {
    console.error('Get DATEV exports error:', error);
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
    const { startDate, endDate } = data;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start- und Enddatum sind erforderlich' },
        { status: 400 }
      );
    }

    // Get transactions for the period
    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId: session.user.tenantId,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        invoice: {
          select: { invoiceNumber: true, customerName: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    // Generate filename
    const start = new Date(startDate).toISOString().split('T')[0];
    const end = new Date(endDate).toISOString().split('T')[0];
    const filename = `DATEV_Export_${start}_to_${end}.csv`;

    // Prepare DATEV export data
    const exportData = {
      filename,
      period: { start: startDate, end: endDate },
      transactions: transactions.length,
      totalIncome: transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0),
      totalExpenses: transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0),
      data: transactions.map(t => ({
        date: t.date,
        description: t.description,
        amount: t.amount,
        type: t.type,
        category: t.category,
        reference: t.reference,
        invoice: t.invoice?.invoiceNumber,
      })),
    };

    const datevExport = await prisma.datevExport.create({
      data: {
        filename,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        data: exportData,
        tenantId: session.user.tenantId,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DATEV_EXPORT_CREATED',
        resource: 'DATEV_EXPORT',
        resourceId: datevExport.id,
        details: { filename, period: `${start} bis ${end}` },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(datevExport, { status: 201 });
  } catch (error) {
    console.error('Create DATEV export error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

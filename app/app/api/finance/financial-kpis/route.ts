
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, tenantId: true }
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'MONTHLY';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Calculate real-time KPIs
    const kpis = await calculateFinancialKPIs(user.tenantId, period, startDate, endDate);

    return NextResponse.json({
      success: true,
      kpis,
      period,
      calculatedAt: new Date()
    });

  } catch (error) {
    console.error('Error fetching financial KPIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial KPIs' },
      { status: 500 }
    );
  }
}

async function calculateFinancialKPIs(
  tenantId: string, 
  period: string, 
  startDate?: string | null, 
  endDate?: string | null
) {
  const now = new Date();
  const defaultStart = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultEnd = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);

  // Revenue KPI
  const revenue = await prisma.transaction.aggregate({
    where: {
      tenantId,
      type: 'INCOME',
      date: { gte: defaultStart, lte: defaultEnd }
    },
    _sum: { amount: true },
    _count: true
  });

  // Expenses KPI
  const [transactionExpenses, approvedExpenses] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        tenantId,
        type: 'EXPENSE',
        date: { gte: defaultStart, lte: defaultEnd }
      },
      _sum: { amount: true },
      _count: true
    }),
    prisma.expense.aggregate({
      where: {
        tenantId,
        status: { in: ['APPROVED', 'PAID'] },
        date: { gte: defaultStart, lte: defaultEnd }
      },
      _sum: { amount: true },
      _count: true
    })
  ]);

  // Budget Performance KPI
  const budgetPerformance = await prisma.budget.findMany({
    where: {
      tenantId,
      startDate: { lte: defaultEnd },
      endDate: { gte: defaultStart }
    },
    select: {
      id: true,
      budgetAmount: true,
      spentAmount: true
    }
  });

  // Outstanding Invoices KPI
  const outstandingInvoices = await prisma.invoice.aggregate({
    where: {
      tenantId,
      status: { in: ['SENT', 'OVERDUE'] }
    },
    _sum: { totalAmount: true },
    _count: true
  });

  // Cash Flow KPI
  const totalRevenue = revenue._sum.amount || 0;
  const totalExpenses = Math.abs(transactionExpenses._sum.amount || 0) + (approvedExpenses._sum.amount || 0);
  const netCashFlow = totalRevenue - totalExpenses;

  // Profit Margin KPI
  const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;

  // Budget Utilization KPI
  const totalBudget = budgetPerformance.reduce((sum, b) => sum + b.budgetAmount, 0);
  const totalBudgetSpent = budgetPerformance.reduce((sum, b) => sum + b.spentAmount, 0);
  const budgetUtilization = totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0;

  // Average Transaction Value
  const avgTransactionValue = revenue._count > 0 ? totalRevenue / revenue._count : 0;

  return [
    {
      name: 'REVENUE',
      value: totalRevenue,
      unit: 'EUR',
      period,
      target: totalRevenue * 1.1, // 10% growth target
      change: await calculatePeriodChange(tenantId, 'REVENUE', defaultStart, defaultEnd),
      metadata: {
        transactionCount: revenue._count,
        averageValue: avgTransactionValue
      }
    },
    {
      name: 'EXPENSES',
      value: totalExpenses,
      unit: 'EUR',
      period,
      target: totalRevenue * 0.8, // 80% of revenue target
      change: await calculatePeriodChange(tenantId, 'EXPENSES', defaultStart, defaultEnd),
      metadata: {
        transactionExpenses: Math.abs(transactionExpenses._sum.amount || 0),
        approvedExpenses: approvedExpenses._sum.amount || 0,
        expenseCount: transactionExpenses._count + approvedExpenses._count
      }
    },
    {
      name: 'NET_CASH_FLOW',
      value: netCashFlow,
      unit: 'EUR',
      period,
      target: totalRevenue * 0.2, // 20% of revenue target
      change: await calculatePeriodChange(tenantId, 'CASH_FLOW', defaultStart, defaultEnd),
      metadata: {
        revenue: totalRevenue,
        expenses: totalExpenses
      }
    },
    {
      name: 'PROFIT_MARGIN',
      value: profitMargin,
      unit: 'PERCENT',
      period,
      target: 25, // 25% target
      change: await calculatePeriodChange(tenantId, 'PROFIT_MARGIN', defaultStart, defaultEnd),
      metadata: {
        netProfit: netCashFlow,
        revenue: totalRevenue
      }
    },
    {
      name: 'BUDGET_UTILIZATION',
      value: budgetUtilization,
      unit: 'PERCENT',
      period,
      target: 90, // 90% target utilization
      change: await calculatePeriodChange(tenantId, 'BUDGET_UTILIZATION', defaultStart, defaultEnd),
      metadata: {
        totalBudget,
        totalSpent: totalBudgetSpent,
        budgetCount: budgetPerformance.length
      }
    },
    {
      name: 'OUTSTANDING_INVOICES',
      value: outstandingInvoices._sum.totalAmount || 0,
      unit: 'EUR',
      period,
      target: 0, // Target is to have no outstanding invoices
      change: await calculatePeriodChange(tenantId, 'OUTSTANDING_INVOICES', defaultStart, defaultEnd),
      metadata: {
        invoiceCount: outstandingInvoices._count,
        averageInvoiceValue: outstandingInvoices._count > 0 
          ? (outstandingInvoices._sum.totalAmount || 0) / outstandingInvoices._count 
          : 0
      }
    }
  ];
}

async function calculatePeriodChange(
  tenantId: string, 
  kpiType: string, 
  currentStart: Date, 
  currentEnd: Date
) {
  // Calculate the period length
  const periodLength = currentEnd.getTime() - currentStart.getTime();
  
  // Calculate previous period
  const previousStart = new Date(currentStart.getTime() - periodLength);
  const previousEnd = new Date(currentEnd.getTime() - periodLength);

  try {
    switch (kpiType) {
      case 'REVENUE': {
        const [current, previous] = await Promise.all([
          prisma.transaction.aggregate({
            where: { tenantId, type: 'INCOME', date: { gte: currentStart, lte: currentEnd } },
            _sum: { amount: true }
          }),
          prisma.transaction.aggregate({
            where: { tenantId, type: 'INCOME', date: { gte: previousStart, lte: previousEnd } },
            _sum: { amount: true }
          })
        ]);
        
        const currentValue = current._sum.amount || 0;
        const previousValue = previous._sum.amount || 0;
        
        return previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
      }
      
      case 'EXPENSES': {
        const [currentTx, previousTx, currentExp, previousExp] = await Promise.all([
          prisma.transaction.aggregate({
            where: { tenantId, type: 'EXPENSE', date: { gte: currentStart, lte: currentEnd } },
            _sum: { amount: true }
          }),
          prisma.transaction.aggregate({
            where: { tenantId, type: 'EXPENSE', date: { gte: previousStart, lte: previousEnd } },
            _sum: { amount: true }
          }),
          prisma.expense.aggregate({
            where: { tenantId, status: { in: ['APPROVED', 'PAID'] }, date: { gte: currentStart, lte: currentEnd } },
            _sum: { amount: true }
          }),
          prisma.expense.aggregate({
            where: { tenantId, status: { in: ['APPROVED', 'PAID'] }, date: { gte: previousStart, lte: previousEnd } },
            _sum: { amount: true }
          })
        ]);
        
        const currentValue = Math.abs(currentTx._sum.amount || 0) + (currentExp._sum.amount || 0);
        const previousValue = Math.abs(previousTx._sum.amount || 0) + (previousExp._sum.amount || 0);
        
        return previousValue > 0 ? ((currentValue - previousValue) / previousValue) * 100 : 0;
      }
      
      default:
        return 0;
    }
  } catch (error) {
    console.error('Error calculating period change:', error);
    return 0;
  }
}

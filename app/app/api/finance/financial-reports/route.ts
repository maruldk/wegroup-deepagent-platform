
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createReportSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich'),
  type: z.enum(['PROFIT_LOSS', 'CASH_FLOW', 'BALANCE_SHEET', 'EXPENSE_ANALYSIS', 'BUDGET_PERFORMANCE', 'TAX_REPORT', 'CUSTOM']),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY', 'CUSTOM']),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  filters: z.object({}).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, tenantId: true, role: true }
    });

    if (!user?.tenantId) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const status = searchParams.get('status');

    const where: any = {
      tenantId: user.tenantId,
      ...(type && { type }),
      ...(status && { status })
    };

    const reports = await prisma.financialReport.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      reports
    });

  } catch (error) {
    console.error('Error fetching financial reports:', error);
    return NextResponse.json(
      { error: 'Failed to fetch financial reports' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = createReportSchema.parse(body);

    // Generate report data based on type
    const reportData = await generateReportData(
      validatedData.type,
      validatedData.startDate,
      validatedData.endDate,
      user.tenantId,
      validatedData.filters
    );

    const report = await prisma.financialReport.create({
      data: {
        ...validatedData,
        data: reportData,
        generatedBy: 'USER',
        status: 'COMPLETED',
        tenantId: user.tenantId,
        userId: user.id
      },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Error creating financial report:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create financial report' },
      { status: 500 }
    );
  }
}

async function generateReportData(
  type: string,
  startDate: Date,
  endDate: Date,
  tenantId: string,
  filters?: any
) {
  switch (type) {
    case 'PROFIT_LOSS':
      return await generateProfitLossReport(startDate, endDate, tenantId);
    
    case 'CASH_FLOW':
      return await generateCashFlowReport(startDate, endDate, tenantId);
    
    case 'EXPENSE_ANALYSIS':
      return await generateExpenseAnalysisReport(startDate, endDate, tenantId);
    
    case 'BUDGET_PERFORMANCE':
      return await generateBudgetPerformanceReport(startDate, endDate, tenantId);
    
    default:
      return { message: 'Report type not implemented yet' };
  }
}

async function generateProfitLossReport(startDate: Date, endDate: Date, tenantId: string) {
  // Revenue (from transactions marked as INCOME)
  const revenue = await prisma.transaction.aggregate({
    where: {
      tenantId,
      type: 'INCOME',
      date: { gte: startDate, lte: endDate }
    },
    _sum: { amount: true }
  });

  // Expenses (from transactions marked as EXPENSE and approved expenses)
  const [transactionExpenses, approvedExpenses] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        tenantId,
        type: 'EXPENSE',
        date: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    }),
    prisma.expense.aggregate({
      where: {
        tenantId,
        status: { in: ['APPROVED', 'PAID'] },
        date: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    })
  ]);

  const totalRevenue = revenue._sum.amount || 0;
  const totalExpenses = Math.abs(transactionExpenses._sum.amount || 0) + (approvedExpenses._sum.amount || 0);
  const netProfit = totalRevenue - totalExpenses;

  // Expense breakdown by category
  const expenseByCategory = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: {
      tenantId,
      status: { in: ['APPROVED', 'PAID'] },
      date: { gte: startDate, lte: endDate }
    },
    _sum: { amount: true }
  });

  const categoryDetails = await Promise.all(
    expenseByCategory.map(async (item) => {
      const category = item.categoryId 
        ? await prisma.expenseCategory.findUnique({
            where: { id: item.categoryId },
            select: { name: true }
          })
        : null;
      
      return {
        category: category?.name || 'Uncategorized',
        amount: item._sum.amount || 0
      };
    })
  );

  return {
    period: { startDate, endDate },
    summary: {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
    },
    expenseBreakdown: categoryDetails,
    generatedAt: new Date()
  };
}

async function generateCashFlowReport(startDate: Date, endDate: Date, tenantId: string) {
  // Operating Cash Flow (from transactions)
  const operatingInflows = await prisma.transaction.aggregate({
    where: {
      tenantId,
      type: 'INCOME',
      date: { gte: startDate, lte: endDate }
    },
    _sum: { amount: true }
  });

  const operatingOutflows = await prisma.transaction.aggregate({
    where: {
      tenantId,
      type: 'EXPENSE',
      date: { gte: startDate, lte: endDate }
    },
    _sum: { amount: true }
  });

  // Monthly breakdown
  const monthlyData = await prisma.transaction.groupBy({
    by: ['type'],
    where: {
      tenantId,
      date: { gte: startDate, lte: endDate }
    },
    _sum: { amount: true },
    _count: true
  });

  const totalInflows = operatingInflows._sum.amount || 0;
  const totalOutflows = Math.abs(operatingOutflows._sum.amount || 0);
  const netCashFlow = totalInflows - totalOutflows;

  return {
    period: { startDate, endDate },
    summary: {
      totalInflows,
      totalOutflows,
      netCashFlow
    },
    operatingCashFlow: {
      inflows: totalInflows,
      outflows: totalOutflows,
      net: netCashFlow
    },
    monthlyBreakdown: monthlyData,
    generatedAt: new Date()
  };
}

async function generateExpenseAnalysisReport(startDate: Date, endDate: Date, tenantId: string) {
  // Total expenses
  const totalExpenses = await prisma.expense.aggregate({
    where: {
      tenantId,
      status: { in: ['APPROVED', 'PAID'] },
      date: { gte: startDate, lte: endDate }
    },
    _sum: { amount: true },
    _count: true
  });

  // Expenses by category
  const expensesByCategory = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: {
      tenantId,
      status: { in: ['APPROVED', 'PAID'] },
      date: { gte: startDate, lte: endDate }
    },
    _sum: { amount: true },
    _count: true
  });

  // Expenses by status
  const expensesByStatus = await prisma.expense.groupBy({
    by: ['status'],
    where: {
      tenantId,
      date: { gte: startDate, lte: endDate }
    },
    _sum: { amount: true },
    _count: true
  });

  // Top expenses
  const topExpenses = await prisma.expense.findMany({
    where: {
      tenantId,
      status: { in: ['APPROVED', 'PAID'] },
      date: { gte: startDate, lte: endDate }
    },
    include: {
      category: true,
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { amount: 'desc' },
    take: 10
  });

  return {
    period: { startDate, endDate },
    summary: {
      totalAmount: totalExpenses._sum.amount || 0,
      totalCount: totalExpenses._count,
      averageExpense: totalExpenses._count > 0 
        ? (totalExpenses._sum.amount || 0) / totalExpenses._count 
        : 0
    },
    byCategory: expensesByCategory,
    byStatus: expensesByStatus,
    topExpenses,
    generatedAt: new Date()
  };
}

async function generateBudgetPerformanceReport(startDate: Date, endDate: Date, tenantId: string) {
  // Active budgets in period
  const budgets = await prisma.budget.findMany({
    where: {
      tenantId,
      startDate: { lte: endDate },
      endDate: { gte: startDate }
    },
    include: {
      user: {
        select: { name: true, email: true }
      }
    }
  });

  const budgetPerformance = await Promise.all(
    budgets.map(async (budget) => {
      // Calculate actual spending for this budget
      const actualSpending = await prisma.expense.aggregate({
        where: {
          tenantId,
          budgetId: budget.id,
          status: { in: ['APPROVED', 'PAID'] },
          date: { gte: startDate, lte: endDate }
        },
        _sum: { amount: true }
      });

      const spent = actualSpending._sum.amount || 0;
      const remaining = budget.budgetAmount - spent;
      const utilizationPercentage = budget.budgetAmount > 0 
        ? (spent / budget.budgetAmount) * 100 
        : 0;

      return {
        budget: {
          id: budget.id,
          name: budget.name,
          category: budget.category,
          budgetAmount: budget.budgetAmount,
          createdBy: budget.user.name || budget.user.email
        },
        performance: {
          spent,
          remaining,
          utilizationPercentage,
          status: utilizationPercentage > 100 ? 'OVER_BUDGET' :
                  utilizationPercentage > 80 ? 'NEAR_LIMIT' : 'ON_TRACK'
        }
      };
    })
  );

  const totalBudgeted = budgets.reduce((sum, budget) => sum + budget.budgetAmount, 0);
  const totalSpent = budgetPerformance.reduce((sum, item) => sum + item.performance.spent, 0);

  return {
    period: { startDate, endDate },
    summary: {
      totalBudgets: budgets.length,
      totalBudgeted,
      totalSpent,
      totalRemaining: totalBudgeted - totalSpent,
      overallUtilization: totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0
    },
    budgetPerformance,
    generatedAt: new Date()
  };
}

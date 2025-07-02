
import { prisma } from '@/lib/db';

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  cashFlow: number;
  outstandingInvoices: number;
  budgetUtilization: number;
}

export interface ExpenseSummary {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
  byCategory: Array<{
    categoryId: string | null;
    categoryName: string;
    amount: number;
    count: number;
  }>;
  byStatus: Array<{
    status: string;
    amount: number;
    count: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
}

export interface BudgetPerformance {
  budgetId: string;
  budgetName: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  utilizationPercentage: number;
  status: 'ON_TRACK' | 'NEAR_LIMIT' | 'OVER_BUDGET';
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    allocated: number;
    spent: number;
  }>;
}

export class FinancialService {
  static async getFinancialSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FinancialSummary> {
    // Revenue from transactions
    const revenue = await prisma.transaction.aggregate({
      where: {
        tenantId,
        type: 'INCOME',
        date: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    });

    // Expenses from transactions and approved expenses
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

    // Outstanding invoices
    const outstandingInvoices = await prisma.invoice.aggregate({
      where: {
        tenantId,
        status: { in: ['SENT', 'OVERDUE'] }
      },
      _sum: { totalAmount: true }
    });

    // Budget utilization
    const budgets = await prisma.budget.findMany({
      where: {
        tenantId,
        startDate: { lte: endDate },
        endDate: { gte: startDate }
      },
      select: {
        budgetAmount: true,
        spentAmount: true
      }
    });

    const totalRevenue = revenue._sum.amount || 0;
    const totalExpenses = Math.abs(transactionExpenses._sum.amount || 0) + (approvedExpenses._sum.amount || 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const totalBudget = budgets.reduce((sum, b) => sum + b.budgetAmount, 0);
    const totalBudgetSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
    const budgetUtilization = totalBudget > 0 ? (totalBudgetSpent / totalBudget) * 100 : 0;

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      profitMargin,
      cashFlow: netProfit,
      outstandingInvoices: outstandingInvoices._sum.totalAmount || 0,
      budgetUtilization
    };
  }

  static async getExpenseSummary(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ExpenseSummary> {
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

    // Get category details
    const categoryDetails = await Promise.all(
      expensesByCategory.map(async (item) => {
        const category = item.categoryId 
          ? await prisma.expenseCategory.findUnique({
              where: { id: item.categoryId },
              select: { name: true }
            })
          : null;
        
        return {
          categoryId: item.categoryId,
          categoryName: category?.name || 'Uncategorized',
          amount: item._sum.amount || 0,
          count: item._count
        };
      })
    );

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

    // Monthly trend
    const monthlyTrend = await this.getMonthlyExpenseTrend(tenantId, startDate, endDate);

    const totalAmount = totalExpenses._sum.amount || 0;
    const totalCount = totalExpenses._count;
    const averageAmount = totalCount > 0 ? totalAmount / totalCount : 0;

    return {
      totalAmount,
      totalCount,
      averageAmount,
      byCategory: categoryDetails,
      byStatus: expensesByStatus.map(item => ({
        status: item.status,
        amount: item._sum.amount || 0,
        count: item._count
      })),
      monthlyTrend
    };
  }

  static async getBudgetPerformance(
    tenantId: string,
    budgetId?: string
  ): Promise<BudgetPerformance[]> {
    const where = budgetId 
      ? { tenantId, id: budgetId }
      : { tenantId };

    const budgets = await prisma.budget.findMany({
      where,
      include: {
        allocations: {
          include: {
            category: true
          }
        },
        expenses: {
          where: {
            status: { in: ['APPROVED', 'PAID'] }
          },
          include: {
            category: true
          }
        }
      }
    });

    return budgets.map(budget => {
      const spentAmount = budget.expenses.reduce((sum, expense) => sum + expense.amount, 0);
      const remainingAmount = budget.budgetAmount - spentAmount;
      const utilizationPercentage = budget.budgetAmount > 0 
        ? (spentAmount / budget.budgetAmount) * 100 
        : 0;

      const status = utilizationPercentage > 100 ? 'OVER_BUDGET' :
                    utilizationPercentage > 80 ? 'NEAR_LIMIT' : 'ON_TRACK';

      // Category breakdown
      const categoryMap = new Map();
      
      budget.allocations.forEach(allocation => {
        categoryMap.set(allocation.categoryId, {
          categoryId: allocation.categoryId,
          categoryName: allocation.category.name,
          allocated: allocation.allocatedAmount,
          spent: 0
        });
      });

      budget.expenses.forEach(expense => {
        if (expense.categoryId && categoryMap.has(expense.categoryId)) {
          const category = categoryMap.get(expense.categoryId);
          category.spent += expense.amount;
        }
      });

      return {
        budgetId: budget.id,
        budgetName: budget.name,
        budgetAmount: budget.budgetAmount,
        spentAmount,
        remainingAmount,
        utilizationPercentage,
        status,
        categoryBreakdown: Array.from(categoryMap.values())
      };
    });
  }

  static async getCashFlowForecast(
    tenantId: string,
    months: number = 6
  ): Promise<Array<{
    month: string;
    predictedInflow: number;
    predictedOutflow: number;
    netCashFlow: number;
    confidence: number;
  }>> {
    // Get historical data for trend analysis
    const historicalData = await this.getHistoricalCashFlow(tenantId, 12);
    
    // Simple linear regression for forecast
    const forecast = [];
    const currentDate = new Date();

    for (let i = 1; i <= months; i++) {
      const forecastDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
      const monthName = forecastDate.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });

      // Calculate trend-based prediction
      const avgInflow = historicalData.reduce((sum, data) => sum + data.inflow, 0) / historicalData.length;
      const avgOutflow = historicalData.reduce((sum, data) => sum + data.outflow, 0) / historicalData.length;

      // Add some growth/decline trend
      const growthRate = this.calculateGrowthRate(historicalData);
      const predictedInflow = avgInflow * (1 + (growthRate * i / 12));
      const predictedOutflow = avgOutflow * (1 + (growthRate * 0.5 * i / 12));

      forecast.push({
        month: monthName,
        predictedInflow,
        predictedOutflow,
        netCashFlow: predictedInflow - predictedOutflow,
        confidence: Math.max(0.9 - (i * 0.1), 0.3) // Decreasing confidence over time
      });
    }

    return forecast;
  }

  private static async getHistoricalCashFlow(tenantId: string, months: number) {
    const endDate = new Date();
    const startDate = new Date(endDate.getFullYear(), endDate.getMonth() - months, 1);

    const transactions = await prisma.transaction.findMany({
      where: {
        tenantId,
        date: { gte: startDate, lte: endDate }
      },
      select: {
        amount: true,
        type: true,
        date: true
      }
    });

    // Group by month
    const monthlyData = new Map();
    
    transactions.forEach(transaction => {
      const monthKey = transaction.date.toISOString().substring(0, 7); // YYYY-MM
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { inflow: 0, outflow: 0 });
      }
      
      const data = monthlyData.get(monthKey);
      if (transaction.type === 'INCOME') {
        data.inflow += transaction.amount;
      } else if (transaction.type === 'EXPENSE') {
        data.outflow += Math.abs(transaction.amount);
      }
    });

    return Array.from(monthlyData.values());
  }

  private static calculateGrowthRate(data: Array<{ inflow: number; outflow: number }>) {
    if (data.length < 2) return 0;

    const firstMonth = data[0];
    const lastMonth = data[data.length - 1];
    
    const initialValue = firstMonth.inflow - firstMonth.outflow;
    const finalValue = lastMonth.inflow - lastMonth.outflow;
    
    if (initialValue === 0) return 0;
    
    return (finalValue - initialValue) / Math.abs(initialValue);
  }

  private static async getMonthlyExpenseTrend(
    tenantId: string,
    startDate: Date,
    endDate: Date
  ) {
    const expenses = await prisma.expense.findMany({
      where: {
        tenantId,
        status: { in: ['APPROVED', 'PAID'] },
        date: { gte: startDate, lte: endDate }
      },
      select: {
        amount: true,
        date: true
      }
    });

    // Group by month
    const monthlyData = new Map();
    
    expenses.forEach(expense => {
      const monthKey = expense.date.toLocaleDateString('de-DE', { month: 'short', year: 'numeric' });
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { amount: 0, count: 0 });
      }
      
      const data = monthlyData.get(monthKey);
      data.amount += expense.amount;
      data.count += 1;
    });

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      amount: data.amount,
      count: data.count
    }));
  }

  static async updateBudgetSpentAmounts(tenantId: string, budgetId?: string) {
    const where = budgetId 
      ? { tenantId, id: budgetId }
      : { tenantId };

    const budgets = await prisma.budget.findMany({
      where,
      select: { id: true }
    });

    for (const budget of budgets) {
      const totalSpent = await prisma.expense.aggregate({
        where: {
          budgetId: budget.id,
          status: { in: ['APPROVED', 'PAID'] }
        },
        _sum: { amount: true }
      });

      await prisma.budget.update({
        where: { id: budget.id },
        data: {
          spentAmount: totalSpent._sum.amount || 0
        }
      });
    }
  }
}

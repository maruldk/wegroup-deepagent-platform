
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const createExpenseSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().optional(),
  amount: z.number().positive('Betrag muss positiv sein'),
  date: z.string().transform((str) => new Date(str)),
  categoryId: z.string().optional(),
  currency: z.string().default('EUR'),
  merchantName: z.string().optional(),
  notes: z.string().optional(),
  budgetId: z.string().optional(),
  projectId: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  recurringEndDate: z.string().transform((str) => new Date(str)).optional(),
});

const querySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED']).optional(),
  categoryId: z.string().optional(),
  budgetId: z.string().optional(),
  projectId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  offset: z.string().transform((val) => parseInt(val, 10)).optional(),
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
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = querySchema.parse(queryParams);

    const where: any = {
      tenantId: user.tenantId,
      ...(validatedQuery.status && { status: validatedQuery.status }),
      ...(validatedQuery.categoryId && { categoryId: validatedQuery.categoryId }),
      ...(validatedQuery.budgetId && { budgetId: validatedQuery.budgetId }),
      ...(validatedQuery.projectId && { projectId: validatedQuery.projectId }),
    };

    if (validatedQuery.startDate || validatedQuery.endDate) {
      where.date = {};
      if (validatedQuery.startDate) {
        where.date.gte = new Date(validatedQuery.startDate);
      }
      if (validatedQuery.endDate) {
        where.date.lte = new Date(validatedQuery.endDate);
      }
    }

    // Non-admin users can only see their own expenses or approved ones
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      where.OR = [
        { userId: user.id },
        { status: 'APPROVED' }
      ];
    }

    const [expenses, totalCount] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          category: true,
          budget: true,
          project: true,
          user: {
            select: { id: true, name: true, email: true }
          },
          approvedBy: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: validatedQuery.limit || 50,
        skip: validatedQuery.offset || 0,
      }),
      prisma.expense.count({ where })
    ]);

    // Calculate expense statistics
    const stats = await prisma.expense.aggregate({
      where: { tenantId: user.tenantId },
      _sum: { amount: true },
      _count: true,
    });

    const statusCounts = await prisma.expense.groupBy({
      by: ['status'],
      where: { tenantId: user.tenantId },
      _count: { status: true },
    });

    const categoryTotals = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: { 
        tenantId: user.tenantId,
        status: { in: ['APPROVED', 'PAID'] }
      },
      _sum: { amount: true },
      _count: { categoryId: true },
    });

    return NextResponse.json({
      success: true,
      expenses,
      pagination: {
        total: totalCount,
        limit: validatedQuery.limit || 50,
        offset: validatedQuery.offset || 0,
      },
      stats: {
        totalAmount: stats._sum.amount || 0,
        totalCount: stats._count,
        statusCounts: statusCounts.reduce((acc, item) => ({
          ...acc,
          [item.status]: item._count.status
        }), {}),
        categoryTotals: categoryTotals.map(item => ({
          categoryId: item.categoryId,
          amount: item._sum.amount || 0,
          count: item._count.categoryId
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
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
    const validatedData = createExpenseSchema.parse(body);

    // Validate category exists
    if (validatedData.categoryId) {
      const category = await prisma.expenseCategory.findFirst({
        where: {
          id: validatedData.categoryId,
          tenantId: user.tenantId
        }
      });
      if (!category) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
      }
    }

    // Validate budget exists
    if (validatedData.budgetId) {
      const budget = await prisma.budget.findFirst({
        where: {
          id: validatedData.budgetId,
          tenantId: user.tenantId
        }
      });
      if (!budget) {
        return NextResponse.json({ error: 'Invalid budget' }, { status: 400 });
      }
    }

    // Validate project exists
    if (validatedData.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: validatedData.projectId,
          tenantId: user.tenantId
        }
      });
      if (!project) {
        return NextResponse.json({ error: 'Invalid project' }, { status: 400 });
      }
    }

    const expense = await prisma.expense.create({
      data: {
        ...validatedData,
        tenantId: user.tenantId,
        userId: user.id,
      },
      include: {
        category: true,
        budget: true,
        project: true,
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      expense
    });

  } catch (error) {
    console.error('Error creating expense:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}

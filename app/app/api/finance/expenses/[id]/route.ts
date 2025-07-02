
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateExpenseSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  date: z.string().transform((str) => new Date(str)).optional(),
  categoryId: z.string().optional(),
  currency: z.string().optional(),
  merchantName: z.string().optional(),
  notes: z.string().optional(),
  budgetId: z.string().optional(),
  projectId: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED']).optional(),
  rejectedReason: z.string().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const expense = await prisma.expense.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId
      },
      include: {
        category: true,
        budget: true,
        project: true,
        user: {
          select: { id: true, name: true, email: true }
        },
        approvedBy: {
          select: { id: true, name: true, email: true }
        },
        approvalHistory: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Check if user can access this expense
    if (
      user.role !== 'ADMIN' && 
      user.role !== 'SUPER_ADMIN' && 
      expense.userId !== user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      expense
    });

  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
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

    const body = await request.json();
    const validatedData = updateExpenseSchema.parse(body);

    // Find the expense
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId
      }
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Check permissions
    const canEdit = 
      user.role === 'ADMIN' || 
      user.role === 'SUPER_ADMIN' || 
      (existingExpense.userId === user.id && existingExpense.status === 'PENDING');

    if (!canEdit) {
      return NextResponse.json({ error: 'Cannot edit this expense' }, { status: 403 });
    }

    // Track status changes for approval workflow
    const statusChanged = validatedData.status && validatedData.status !== existingExpense.status;
    const isApprovalAction = statusChanged && 
      (validatedData.status === 'APPROVED' || validatedData.status === 'REJECTED');

    let updateData: any = { ...validatedData };

    // Handle approval/rejection
    if (isApprovalAction && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      updateData.approvedById = user.id;
      updateData.approvedAt = new Date();
      
      if (validatedData.status === 'REJECTED' && !validatedData.rejectedReason) {
        return NextResponse.json(
          { error: 'Rejection reason is required' },
          { status: 400 }
        );
      }
    }

    const expense = await prisma.$transaction(async (tx) => {
      // Update the expense
      const updatedExpense = await tx.expense.update({
        where: { id: params.id },
        data: updateData,
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
        }
      });

      // Create approval history entry if status changed
      if (statusChanged) {
        await tx.expenseApproval.create({
          data: {
            expenseId: params.id,
            status: validatedData.status!,
            comment: validatedData.rejectedReason,
            userId: user.id,
            tenantId: user.tenantId || 'default'
          }
        });
      }

      // Update budget spent amount if expense is approved/paid
      if (
        statusChanged && 
        updatedExpense.budgetId && 
        (validatedData.status === 'APPROVED' || validatedData.status === 'PAID')
      ) {
        await tx.budget.update({
          where: { id: updatedExpense.budgetId },
          data: {
            spentAmount: {
              increment: updatedExpense.amount
            }
          }
        });
      }

      return updatedExpense;
    });

    return NextResponse.json({
      success: true,
      expense
    });

  } catch (error) {
    console.error('Error updating expense:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update expense' },
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

    const expense = await prisma.expense.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId
      }
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Check permissions - only owner or admin can delete, and only if not approved/paid
    const canDelete = 
      (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') ||
      (expense.userId === user.id && ['PENDING', 'REJECTED'].includes(expense.status));

    if (!canDelete) {
      return NextResponse.json({ error: 'Cannot delete this expense' }, { status: 403 });
    }

    await prisma.expense.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}

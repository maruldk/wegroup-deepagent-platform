
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
    const category = searchParams.get('category');
    const active = searchParams.get('active');

    const where: any = {
      tenantId: session.user.tenantId,
    };

    if (category) {
      where.category = category;
    }

    if (active === 'true') {
      const now = new Date();
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    const budgets = await prisma.budget.findMany({
      where,
      orderBy: { startDate: 'desc' },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ budgets });
  } catch (error) {
    console.error('Get budgets error:', error);
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
      name,
      description,
      category,
      budgetAmount,
      spentAmount = 0,
      startDate,
      endDate,
    } = data;

    if (!name || !category || !budgetAmount || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Name, Kategorie, Budget-Betrag, Start- und Enddatum sind erforderlich' },
        { status: 400 }
      );
    }

    const budget = await prisma.budget.create({
      data: {
        name,
        description,
        category,
        budgetAmount,
        spentAmount,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
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
        action: 'BUDGET_CREATED',
        resource: 'BUDGET',
        resourceId: budget.id,
        details: { name: budget.name, category: budget.category },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(budget, { status: 201 });
  } catch (error) {
    console.error('Create budget error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

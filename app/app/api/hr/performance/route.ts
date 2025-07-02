
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
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const type = searchParams.get('type') || 'all';
    const department = searchParams.get('department') || 'all';
    const period = searchParams.get('period') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: session.user.tenantId,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { 
          employee: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { employeeId: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
        { 
          reviewer: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    if (status !== 'all') {
      where.status = status;
    }

    if (type !== 'all') {
      where.type = type;
    }

    if (department !== 'all') {
      where.employee = {
        departmentId: department,
      };
    }

    if (period !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'current_quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3);
          startDate.setMonth(currentQuarter * 3, 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'last_quarter':
          const lastQuarter = Math.floor(now.getMonth() / 3) - 1;
          if (lastQuarter < 0) {
            startDate.setFullYear(now.getFullYear() - 1);
            startDate.setMonth(9, 1);
          } else {
            startDate.setMonth(lastQuarter * 3, 1);
          }
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'current_year':
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'last_year':
          startDate.setFullYear(now.getFullYear() - 1, 0, 1);
          startDate.setHours(0, 0, 0, 0);
          break;
      }
      
      where.reviewDate = {
        gte: startDate,
      };
    }

    const [reviews, total] = await Promise.all([
      prisma.performance.findMany({
        where,
        orderBy: { endDate: 'desc' },
        skip,
        take: limit,
        include: {
          employee: {
            select: { 
              firstName: true, 
              lastName: true, 
              employeeNumber: true,
              department: {
                select: { name: true },
              },
              position: {
                select: { title: true },
              },
            },
          },
          reviewer: {
            select: { firstName: true, lastName: true, employeeNumber: true },
          },
        },
      }),
      prisma.performance.count({ where }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get performance reviews error:', error);
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
      employeeId,
      reviewerId,
      type = 'ANNUAL',
      reviewDate,
      goals,
      achievements,
      competencies,
      overallRating,
      strengths,
      improvementAreas,
      developmentPlan,
      comments,
      status = 'DRAFT',
      customFields,
    } = data;

    if (!employeeId || !reviewDate) {
      return NextResponse.json(
        { error: 'Mitarbeiter und Bewertungsdatum sind erforderlich' },
        { status: 400 }
      );
    }

    const performance = await prisma.performance.create({
      data: {
        employeeId,
        reviewerId: reviewerId || session.user.id,
        reviewPeriod: `Performance Review ${new Date().getFullYear()}`,
        startDate: new Date(),
        endDate: new Date(reviewDate),
        goals,


        overallRating: overallRating ? parseFloat(overallRating) as any : undefined,
        strengths,
        improvements: improvementAreas,


        status,

        tenantId: session.user.tenantId,
      },
      include: {
        employee: {
          select: { 
            firstName: true, 
            lastName: true, 
            employeeNumber: true,
            department: {
              select: { name: true },
            },
          },
        },
        reviewer: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PERFORMANCE_REVIEW_CREATED',
        resource: 'PERFORMANCE',
        resourceId: performance.id,
        details: { 
          employeeId: performance.employeeId,
          endDate: performance.endDate,
        },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(performance, { status: 201 });
  } catch (error) {
    console.error('Create performance review error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

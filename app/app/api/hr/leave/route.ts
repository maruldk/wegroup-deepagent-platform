
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
    const employeeId = searchParams.get('employeeId') || 'all';
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
        { reason: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status !== 'all') {
      where.status = status;
    }

    if (type !== 'all') {
      where.type = type;
    }

    if (employeeId !== 'all') {
      where.employeeId = employeeId;
    }

    if (department !== 'all') {
      where.employee = {
        departmentId: department,
      };
    }

    if (period !== 'all') {
      const now = new Date();
      let startDate = new Date();
      let endDate = new Date();
      
      switch (period) {
        case 'current_month':
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setMonth(endDate.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'next_month':
          startDate.setMonth(startDate.getMonth() + 1, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setMonth(endDate.getMonth() + 2, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'current_quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3);
          startDate.setMonth(currentQuarter * 3, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setMonth((currentQuarter + 1) * 3, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'current_year':
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          endDate.setMonth(11, 31);
          endDate.setHours(23, 59, 59, 999);
          break;
      }
      
      where.OR = [
        {
          startDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          endDate: {
            gte: startDate,
            lte: endDate,
          },
        },
        {
          AND: [
            { startDate: { lte: startDate } },
            { endDate: { gte: endDate } },
          ],
        },
      ];
    }

    const [leaveRequests, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        orderBy: { requestedAt: 'desc' },
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
          approver: {
            select: { firstName: true, lastName: true, employeeNumber: true },
          },
        },
      }),
      prisma.leave.count({ where }),
    ]);

    return NextResponse.json({
      leaveRequests,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get leave requests error:', error);
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
      type,
      startDate,
      endDate,
      reason,
      notes,
      emergencyContact,
      handoverNotes,
      attachments,
      status = 'PENDING',
      customFields,
    } = data;

    if (!employeeId || !type || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Mitarbeiter, Art, Start- und Enddatum sind erforderlich' },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: 'Enddatum muss nach dem Startdatum liegen' },
        { status: 400 }
      );
    }

    // Calculate working days (excluding weekends)
    let workingDays = 0;
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Sunday (0) or Saturday (6)
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const leave = await prisma.leave.create({
      data: {
        employeeId,
        type,
        startDate: start,
        endDate: end,
        totalDays: workingDays,
        reason,




        status,

        tenantId: session.user.tenantId,
      },
      include: {
        employee: {
          select: { 
            firstName: true, 
            lastName: true, 
            employeeNumber: true,
            manager: {
              select: { id: true, firstName: true, lastName: true },
            },
            department: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'LEAVE_REQUEST_CREATED',
        resource: 'LEAVE',
        resourceId: leave.id,
        details: { 
          employeeId: leave.employeeId,
          type: leave.type,
          startDate: leave.startDate,
          endDate: leave.endDate,
          totalDays: leave.totalDays,
        },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(leave, { status: 201 });
  } catch (error) {
    console.error('Create leave request error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

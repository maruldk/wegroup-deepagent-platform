
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
    const department = searchParams.get('department') || 'all';
    const status = searchParams.get('status') || 'all';
    const position = searchParams.get('position') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: session.user.tenantId,
      status: 'ACTIVE',
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (department !== 'all') {
      where.departmentId = department;
    }

    if (status !== 'all') {
      where.status = status;
    }

    if (position !== 'all') {
      where.positionId = position;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { name: true, email: true, image: true },
          },
          department: {
            select: { name: true, code: true },
          },
          position: {
            select: { title: true, level: true },
          },
          manager: {
            select: { firstName: true, lastName: true, employeeNumber: true },
          },
          directReports: {
            select: { id: true, firstName: true, lastName: true },
            take: 5,
          },
          _count: {
            select: {
              directReports: true,
              performanceReviews: true,
              leaveRequests: true,
            },
          },
        },
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({
      employees,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get employees error:', error);
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
      firstName,
      lastName,
      email,
      phone,
      mobile,
      address,
      city,
      state,
      postalCode,
      country,
      dateOfBirth,
      hireDate,
      departmentId,
      positionId,
      managerId,
      salary,
      currency = 'EUR',
      workingHours = 40,
      contractType = 'FULL_TIME',
      employmentType = 'PERMANENT',
      status = 'ACTIVE',
      emergencyContactName,
      emergencyContactPhone,
      bankAccount,
      taxId,
      socialSecurityNumber,
      skills,
      certifications,
      notes,
      customFields,
      userId,
    } = data;

    if (!employeeId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Mitarbeiter-ID, Vor-, Nachname und E-Mail sind erforderlich' },
        { status: 400 }
      );
    }

    // Check if employeeId already exists
    const existingEmployee = await prisma.employee.findFirst({
      where: {
        employeeNumber: employeeId,
        tenantId: session.user.tenantId,
      },
    });

    if (existingEmployee) {
      return NextResponse.json(
        { error: 'Mitarbeiter-ID bereits vergeben' },
        { status: 400 }
      );
    }

    const fullName = `${firstName} ${lastName}`;

    const employee = await prisma.employee.create({
      data: {
        employeeNumber: employeeId,
        firstName,
        lastName,
        fullName,
        email,
        phone,
        mobile,
        address,
        city,
        state,
        postalCode,
        country,
        birthDate: dateOfBirth ? new Date(dateOfBirth) : null,
        hireDate: new Date(hireDate),
        departmentId,
        positionId,
        managerId,




        employmentType,
        status,
        emergencyContactName,
        emergencyContactPhone,
        bankAccount,
        taxId,



        notes,
        customFields,
        userId,
        tenantId: session.user.tenantId,
      },
      include: {
        user: {
          select: { name: true, email: true },
        },
        department: {
          select: { name: true, code: true },
        },
        position: {
          select: { title: true, level: true },
        },
        manager: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EMPLOYEE_CREATED',
        resource: 'EMPLOYEE',
        resourceId: employee.id,
        details: { 
          name: employee.fullName, 
          employeeId: employee.employeeNumber,
          departmentId: employee.departmentId,
        },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error('Create employee error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

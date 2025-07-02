
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: session.user.tenantId,
      isActive: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [departments, total] = await Promise.all([
      prisma.department.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
        include: {
          manager: {
            select: { 
              firstName: true, 
              lastName: true, 
              employeeNumber: true,
              email: true,
            },
          },
          parent: {
            select: { name: true, code: true },
          },
          children: {
            select: { name: true, code: true },
            take: 5,
          },
          _count: {
            select: {
              employees: true,
              positions: true,
              children: true,
            },
          },
        },
      }),
      prisma.department.count({ where }),
    ]);

    return NextResponse.json({
      departments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get departments error:', error);
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
      code,
      description,
      managerId,
      parentDepartmentId,
      budget,
      costCenter,
      location,
      customFields,
    } = data;

    if (!name || !code) {
      return NextResponse.json(
        { error: 'Name und Code sind erforderlich' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingDepartment = await prisma.department.findFirst({
      where: {
        code,
        tenantId: session.user.tenantId,
      },
    });

    if (existingDepartment) {
      return NextResponse.json(
        { error: 'Abteilungscode bereits vergeben' },
        { status: 400 }
      );
    }

    const department = await prisma.department.create({
      data: {
        name,
        code,
        description,
        managerId,
        parentId: parentDepartmentId,
        budget: budget ? parseFloat(budget) : null,

        tenantId: session.user.tenantId,
      },
      include: {
        manager: {
          select: { firstName: true, lastName: true, employeeNumber: true },
        },
        parent: {
          select: { name: true, code: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DEPARTMENT_CREATED',
        resource: 'DEPARTMENT',
        resourceId: department.id,
        details: { 
          name: department.name, 
          code: department.code,
        },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error('Create department error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

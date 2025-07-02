
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const department = await prisma.department.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
        isActive: true,
      },
      include: {
        manager: {
          select: { 
            id: true,
            firstName: true, 
            lastName: true, 
            employeeNumber: true,
            email: true,
            position: {
              select: { title: true },
            },
          },
        },
        parent: {
          select: { id: true, name: true, code: true },
        },
        children: {
          select: { id: true, name: true, code: true },
          where: { isActive: true },
        },
        employees: {
          select: { 
            id: true,
            firstName: true, 
            lastName: true, 
            employeeNumber: true,
            email: true,
            status: true,
            position: {
              select: { title: true },
            },
          },
          where: { status: 'ACTIVE' },
          orderBy: { firstName: 'asc' },
        },
        positions: {
          select: { 
            id: true,
            title: true, 
            level: true,
            _count: {
              select: { employees: true },
            },
          },
          where: { isActive: true },
          orderBy: { title: 'asc' },
        },
        _count: {
          select: {
            employees: true,
            positions: true,
            children: true,
          },
        },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: 'Abteilung nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(department);
  } catch (error) {
    console.error('Get department error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
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
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      name,
      description,
      managerId,
      parentDepartmentId,
      budget,
      costCenter,
      location,
      customFields,
    } = data;

    const existingDepartment = await prisma.department.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingDepartment) {
      return NextResponse.json(
        { error: 'Abteilung nicht gefunden' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (managerId) updateData.managerId = managerId;
    if (parentDepartmentId) updateData.parentDepartmentId = parentDepartmentId;
    if (budget !== undefined) updateData.budget = budget ? parseFloat(budget) : null;
    if (costCenter) updateData.costCenter = costCenter;
    if (location) updateData.location = location;
    if (customFields) updateData.customFields = customFields;

    updateData.updatedAt = new Date();

    const department = await prisma.department.update({
      where: { id: params.id },
      data: updateData,
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
        action: 'DEPARTMENT_UPDATED',
        resource: 'DEPARTMENT',
        resourceId: department.id,
        details: { 
          name: department.name,
          code: department.code,
          changes: Object.keys(updateData),
        },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(department);
  } catch (error) {
    console.error('Update department error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
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
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const department = await prisma.department.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        employees: { where: { status: 'ACTIVE' } },
        children: { where: { isActive: true } },
        positions: { where: { isActive: true } },
      },
    });

    if (!department) {
      return NextResponse.json(
        { error: 'Abteilung nicht gefunden' },
        { status: 404 }
      );
    }

    // Check if department has active employees or sub-departments
    if (department.employees.length > 0) {
      return NextResponse.json(
        { error: 'Abteilung kann nicht gelöscht werden - enthält aktive Mitarbeiter' },
        { status: 400 }
      );
    }

    if (department.children.length > 0) {
      return NextResponse.json(
        { error: 'Abteilung kann nicht gelöscht werden - enthält Unterabteilungen' },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.department.update({
      where: { id: params.id },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Also deactivate positions
    await prisma.position.updateMany({
      where: { 
        departmentId: params.id,
        tenantId: session.user.tenantId,
      },
      data: {
        isActive: false,
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'DEPARTMENT_DELETED',
        resource: 'DEPARTMENT',
        resourceId: department.id,
        details: { 
          name: department.name,
          code: department.code,
        },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete department error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

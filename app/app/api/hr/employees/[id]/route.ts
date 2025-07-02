
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

    const employee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        user: {
          select: { name: true, email: true, image: true },
        },
        department: {
          select: { name: true, code: true, description: true },
        },
        position: {
          select: { title: true, level: true, description: true },
        },
        manager: {
          select: { 
            id: true,
            firstName: true, 
            lastName: true, 
            employeeNumber: true,
            position: {
              select: { title: true },
            },
          },
        },
        directReports: {
          select: { 
            id: true,
            firstName: true, 
            lastName: true, 
            employeeNumber: true,
            position: {
              select: { title: true },
            },
          },
        },
        performanceReviews: {
          orderBy: { endDate: 'desc' },
          take: 5,
          select: {
            id: true,
            endDate: true,
            overallRating: true,
            status: true,
          },
        },
        leaveRequests: {
          orderBy: { requestedAt: 'desc' },
          take: 5,
          select: {
            id: true,
            type: true,
            startDate: true,
            endDate: true,
            status: true,
            reason: true,
          },
        },
        payrollRecords: {
          orderBy: { payPeriodStart: 'desc' },
          take: 3,
          select: {
            id: true,
            payPeriodStart: true,
            payPeriodEnd: true,
            baseSalary: true,
            netPay: true,
          },
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
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
      departmentId,
      positionId,
      managerId,
      salary,
      currency,
      workingHours,
      contractType,
      employmentType,
      status,
      emergencyContactName,
      emergencyContactPhone,
      bankAccount,
      taxId,
      socialSecurityNumber,
      skills,
      certifications,
      notes,
      customFields,
    } = data;

    const existingEmployee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingEmployee) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (firstName && lastName) {
      updateData.firstName = firstName;
      updateData.lastName = lastName;
      updateData.fullName = `${firstName} ${lastName}`;
    }

    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (mobile) updateData.mobile = mobile;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (postalCode) updateData.postalCode = postalCode;
    if (country) updateData.country = country;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (departmentId) updateData.departmentId = departmentId;
    if (positionId) updateData.positionId = positionId;
    if (managerId) updateData.managerId = managerId;
    if (salary !== undefined) updateData.salary = salary ? parseFloat(salary) : null;
    if (currency) updateData.currency = currency;
    if (workingHours) updateData.workingHours = workingHours;
    if (contractType) updateData.contractType = contractType;
    if (employmentType) updateData.employmentType = employmentType;
    if (status) updateData.status = status;
    if (emergencyContactName) updateData.emergencyContactName = emergencyContactName;
    if (emergencyContactPhone) updateData.emergencyContactPhone = emergencyContactPhone;
    if (bankAccount) updateData.bankAccount = bankAccount;
    if (taxId) updateData.taxId = taxId;
    if (socialSecurityNumber) updateData.socialSecurityNumber = socialSecurityNumber;
    if (skills) updateData.skills = skills;
    if (certifications) updateData.certifications = certifications;
    if (notes) updateData.notes = notes;
    if (customFields) updateData.customFields = customFields;

    updateData.updatedAt = new Date();

    const employee = await prisma.employee.update({
      where: { id: params.id },
      data: updateData,
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
        action: 'EMPLOYEE_UPDATED',
        resource: 'EMPLOYEE',
        resourceId: employee.id,
        details: { 
          name: employee.fullName,
          employeeId: employee.employeeNumber,
          changes: Object.keys(updateData),
        },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error('Update employee error:', error);
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

    const employee = await prisma.employee.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Mitarbeiter nicht gefunden' },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.employee.update({
      where: { id: params.id },
      data: {
        status: 'TERMINATED',
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'EMPLOYEE_DELETED',
        resource: 'EMPLOYEE',
        resourceId: employee.id,
        details: { 
          name: employee.fullName,
          employeeId: employee.employeeNumber,
        },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete employee error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

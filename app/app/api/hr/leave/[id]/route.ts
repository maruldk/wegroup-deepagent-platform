
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

    const leave = await prisma.leave.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        employee: {
          select: { 
            id: true,
            firstName: true, 
            lastName: true, 
            employeeNumber: true,
            email: true,
            department: {
              select: { name: true, code: true },
            },
            position: {
              select: { title: true },
            },
            manager: {
              select: { firstName: true, lastName: true, email: true },
            },
          },
        },
        approver: {
          select: { 
            id: true,
            firstName: true, 
            lastName: true, 
            employeeNumber: true,
            email: true,
          },
        },
      },
    });

    if (!leave) {
      return NextResponse.json(
        { error: 'Urlaubsantrag nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(leave);
  } catch (error) {
    console.error('Get leave request error:', error);
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
      type,
      startDate,
      endDate,
      reason,
      notes,
      emergencyContact,
      handoverNotes,
      attachments,
      status,
      approverId,
      approvalNotes,
      customFields,
    } = data;

    const existingLeave = await prisma.leave.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingLeave) {
      return NextResponse.json(
        { error: 'Urlaubsantrag nicht gefunden' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (type) updateData.type = type;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start >= end) {
        return NextResponse.json(
          { error: 'Enddatum muss nach dem Startdatum liegen' },
          { status: 400 }
        );
      }

      // Recalculate working days
      let workingDays = 0;
      const currentDate = new Date(start);
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          workingDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      updateData.startDate = start;
      updateData.endDate = end;
      updateData.days = workingDays;
    }
    if (reason) updateData.reason = reason;
    if (notes) updateData.notes = notes;
    if (emergencyContact) updateData.emergencyContact = emergencyContact;
    if (handoverNotes) updateData.handoverNotes = handoverNotes;
    if (attachments) updateData.attachments = attachments;
    if (status) {
      updateData.status = status;
      if (status === 'APPROVED' || status === 'REJECTED') {
        updateData.approverId = approverId || session.user.id;
        updateData.approvalDate = new Date();
        if (approvalNotes) updateData.approvalNotes = approvalNotes;
      }
    }
    if (customFields) updateData.customFields = customFields;

    updateData.updatedAt = new Date();

    const leave = await prisma.leave.update({
      where: { id: params.id },
      data: updateData,
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeNumber: true },
        },
        approver: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'LEAVE_REQUEST_UPDATED',
        resource: 'LEAVE',
        resourceId: leave.id,
        details: { 
          employeeId: leave.employeeId,
          type: leave.type,
          status: leave.status,
          changes: Object.keys(updateData),
        },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(leave);
  } catch (error) {
    console.error('Update leave request error:', error);
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

    const leave = await prisma.leave.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeNumber: true },
        },
      },
    });

    if (!leave) {
      return NextResponse.json(
        { error: 'Urlaubsantrag nicht gefunden' },
        { status: 404 }
      );
    }

    // Only allow deletion of pending requests
    if (leave.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Nur ausstehende Anträge können gelöscht werden' },
        { status: 400 }
      );
    }

    // Soft delete
    await prisma.leave.update({
      where: { id: params.id },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'LEAVE_REQUEST_DELETED',
        resource: 'LEAVE',
        resourceId: leave.id,
        details: { 
          employeeId: leave.employeeId,
          type: leave.type,
          startDate: leave.startDate,
          endDate: leave.endDate,
        },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete leave request error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

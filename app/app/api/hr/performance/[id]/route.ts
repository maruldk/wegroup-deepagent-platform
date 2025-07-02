
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

    const performance = await prisma.performance.findFirst({
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
            hireDate: true,
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
        },
        reviewer: {
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

    if (!performance) {
      return NextResponse.json(
        { error: 'Leistungsbeurteilung nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json(performance);
  } catch (error) {
    console.error('Get performance review error:', error);
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
      reviewDate,
      goals,
      achievements,
      competencies,
      overallRating,
      strengths,
      improvementAreas,
      developmentPlan,
      comments,
      status,
      customFields,
    } = data;

    const existingPerformance = await prisma.performance.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingPerformance) {
      return NextResponse.json(
        { error: 'Leistungsbeurteilung nicht gefunden' },
        { status: 404 }
      );
    }

    const updateData: any = {};

    if (type) updateData.type = type;
    if (reviewDate) updateData.reviewDate = new Date(reviewDate);
    if (goals) updateData.goals = goals;
    if (achievements) updateData.achievements = achievements;
    if (competencies) updateData.competencies = competencies;
    if (overallRating !== undefined) updateData.overallRating = overallRating ? parseFloat(overallRating) : null;
    if (strengths) updateData.strengths = strengths;
    if (improvementAreas) updateData.improvementAreas = improvementAreas;
    if (developmentPlan) updateData.developmentPlan = developmentPlan;
    if (comments) updateData.comments = comments;
    if (status) updateData.status = status;
    if (customFields) updateData.customFields = customFields;

    updateData.updatedAt = new Date();

    const performance = await prisma.performance.update({
      where: { id: params.id },
      data: updateData,
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeNumber: true },
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
        action: 'PERFORMANCE_REVIEW_UPDATED',
        resource: 'PERFORMANCE',
        resourceId: performance.id,
        details: { 
          employeeId: performance.employeeId,
          changes: Object.keys(updateData),
        },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(performance);
  } catch (error) {
    console.error('Update performance review error:', error);
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

    const performance = await prisma.performance.findFirst({
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

    if (!performance) {
      return NextResponse.json(
        { error: 'Leistungsbeurteilung nicht gefunden' },
        { status: 404 }
      );
    }

    // Soft delete
    await prisma.performance.update({
      where: { id: params.id },
      data: {
        status: 'DELETED',
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'PERFORMANCE_REVIEW_DELETED',
        resource: 'PERFORMANCE',
        resourceId: performance.id,
        details: { 
          employeeId: performance.employeeId,
        },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete performance review error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}


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
    const period = searchParams.get('period') || '30'; // days
    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Employee metrics
    const [
      totalEmployees,
      activeEmployees,
      newHires,
      departures,
      employeesByDepartment,
      employeesByStatus,
      avgTenure,
    ] = await Promise.all([
      prisma.employee.count({
        where: { tenantId: session.user.tenantId },
      }),
      prisma.employee.count({
        where: { 
          tenantId: session.user.tenantId,
          status: 'ACTIVE',
        },
      }),
      prisma.employee.count({
        where: { 
          tenantId: session.user.tenantId,
          hireDate: { gte: startDate },
        },
      }),
      prisma.employee.count({
        where: { 
          tenantId: session.user.tenantId,
          status: 'TERMINATED',
          updatedAt: { gte: startDate },
        },
      }),
      prisma.employee.groupBy({
        by: ['departmentId'],
        where: { 
          tenantId: session.user.tenantId,
          status: 'ACTIVE',
        },
        _count: true,
      }),
      prisma.employee.groupBy({
        by: ['status'],
        where: { 
          tenantId: session.user.tenantId,
        },
        _count: true,
      }),
      prisma.employee.aggregate({
        where: { 
          tenantId: session.user.tenantId,
          status: 'ACTIVE',
        },
        _count: {
          id: true,
        },
      }),
    ]);

    // Get department names for the groupBy results
    const departmentIds = employeesByDepartment.map(item => item.departmentId).filter(Boolean);
    const departments = await prisma.department.findMany({
      where: { 
        id: { in: departmentIds.filter(id => id !== null) as string[] },
        tenantId: session.user.tenantId,
      },
      select: { id: true, name: true },
    });

    const departmentMap = departments.reduce((acc, dept) => {
      acc[dept.id] = dept.name;
      return acc;
    }, {} as Record<string, string>);

    // Leave requests metrics
    const [
      pendingLeaveRequests,
      approvedLeaveRequests,
      rejectedLeaveRequests,
      leaveRequestsByType,
      upcomingLeaves,
    ] = await Promise.all([
      prisma.leave.count({
        where: { 
          tenantId: session.user.tenantId,
          status: 'PENDING',
        },
      }),
      prisma.leave.count({
        where: { 
          tenantId: session.user.tenantId,
          status: 'APPROVED',
          requestedAt: { gte: startDate },
        },
      }),
      prisma.leave.count({
        where: { 
          tenantId: session.user.tenantId,
          status: 'REJECTED',
          requestedAt: { gte: startDate },
        },
      }),
      prisma.leave.groupBy({
        by: ['type'],
        where: { 
          tenantId: session.user.tenantId,
          requestedAt: { gte: startDate },
        },
        _count: { id: true },
      }),
      prisma.leave.findMany({
        where: { 
          tenantId: session.user.tenantId,
          status: 'APPROVED',
          startDate: { 
            gte: new Date(),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Next 30 days
          },
        },
        include: {
          employee: {
            select: { firstName: true, lastName: true, employeeNumber: true },
          },
        },
        orderBy: { startDate: 'asc' },
        take: 10,
      }),
    ]);

    // Performance reviews metrics
    const [
      duePerformanceReviews,
      completedPerformanceReviews,
      avgPerformanceRating,
    ] = await Promise.all([
      prisma.performance.count({
        where: { 
          tenantId: session.user.tenantId,
          status: 'PENDING',
          endDate: { lte: new Date() },
        },
      }),
      prisma.performance.count({
        where: { 
          tenantId: session.user.tenantId,
          status: 'COMPLETED',
          endDate: { gte: startDate },
        },
      }),
      prisma.performance.findMany({
        where: { 
          tenantId: session.user.tenantId,
          status: 'COMPLETED',
          overallRating: { not: undefined },
          endDate: { gte: startDate },
        },
        select: { overallRating: true },
      }),
    ]);

    // Department metrics
    const departmentMetrics = await prisma.department.findMany({
      where: { 
        tenantId: session.user.tenantId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        code: true,
        _count: {
          select: {
            employees: {
              where: { status: 'ACTIVE' },
            },
            positions: {
              where: { isActive: true },
            },
          },
        },
        manager: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    // Recent activities
    const recentActivities = await prisma.auditLog.findMany({
      where: { 
        tenantId: session.user.tenantId,
        resource: { in: ['EMPLOYEE', 'LEAVE', 'PERFORMANCE', 'DEPARTMENT'] },
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    const dashboard = {
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        newHires,
        departures,
        turnoverRate: totalEmployees > 0 ? (departures / totalEmployees * 100).toFixed(1) : '0',
        byDepartment: employeesByDepartment.map(item => ({
          departmentId: item.departmentId,
          departmentName: item.departmentId ? departmentMap[item.departmentId] || 'Unknown' : 'Unassigned',
          count: item._count,
        })),
        byStatus: employeesByStatus.map(item => ({
          status: item.status,
          count: item._count,
        })),
      },
      leave: {
        pending: pendingLeaveRequests,
        approved: approvedLeaveRequests,
        rejected: rejectedLeaveRequests,
        byType: leaveRequestsByType.map(item => ({
          type: item.type,
          count: item._count.id,
        })),
        upcoming: upcomingLeaves,
      },
      performance: {
        dueReviews: duePerformanceReviews,
        completedReviews: completedPerformanceReviews,
        averageRating: avgPerformanceRating.length > 0 ? 
          avgPerformanceRating.filter(p => p.overallRating).length.toString() : 'N/A',
      },
      departments: departmentMetrics,
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        action: activity.action,
        resource: activity.resource,
        details: activity.details,
        createdAt: activity.createdAt,
        userName: activity.user?.name || 'System',
      })),
      period: periodDays,
      generatedAt: new Date(),
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Get HR dashboard error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

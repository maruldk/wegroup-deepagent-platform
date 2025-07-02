
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

    const tenantId = session.user.tenantId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCustomers,
      totalLeads,
      totalUsers,
      activeCustomers,
      newLeadsThisMonth,
      leadsByStatus,
      recentActivities,
    ] = await Promise.all([
      // Total customers
      prisma.customer.count({
        where: { tenantId },
      }),
      // Total leads
      prisma.lead.count({
        where: { tenantId },
      }),
      // Total users
      prisma.user.count({
        where: { tenantId, isActive: true },
      }),
      // Active customers
      prisma.customer.count({
        where: { tenantId, status: 'ACTIVE' },
      }),
      // New leads this month
      prisma.lead.count({
        where: {
          tenantId,
          createdAt: { gte: startOfMonth },
        },
      }),
      // Leads by status for chart
      prisma.lead.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { status: true },
      }),
      // Recent activities (audit logs)
      prisma.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
    ]);

    const stats = {
      totalCustomers,
      totalLeads,
      totalUsers,
      activeCustomers,
      newLeadsThisMonth,
      leadsByStatus: leadsByStatus.map(item => ({
        status: item.status,
        count: item._count.status,
      })),
      recentActivities: recentActivities.map(activity => ({
        id: activity.id,
        action: activity.action,
        resource: activity.resource,
        user: activity.user,
        createdAt: activity.createdAt,
        details: activity.details,
      })),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

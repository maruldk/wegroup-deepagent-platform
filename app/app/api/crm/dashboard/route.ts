
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

    // Get overview stats
    const [
      totalContacts,
      totalOpportunities,
      totalDeals,
      totalActivities,
      activeContacts,
      openOpportunities,
      wonDeals,
      overdueActivities,
    ] = await Promise.all([
      prisma.contact.count({ where: { tenantId } }),
      prisma.opportunity.count({ where: { tenantId } }),
      prisma.deal.count({ where: { tenantId } }),
      prisma.crmActivity.count({ where: { tenantId } }),
      prisma.contact.count({ where: { tenantId, isActive: true } }),
      prisma.opportunity.count({ 
        where: { 
          tenantId, 
          stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } 
        } 
      }),
      prisma.deal.count({ where: { tenantId, status: 'WON' } }),
      prisma.crmActivity.count({
        where: {
          tenantId,
          status: 'OVERDUE',
        },
      }),
    ]);

    // Get pipeline statistics
    const pipelineStats = await prisma.opportunity.groupBy({
      by: ['stage'],
      where: { tenantId },
      _count: { _all: true },
      _sum: { amount: true },
    });

    const pipelineData = pipelineStats.map(stat => ({
      stage: stat.stage,
      count: stat._count._all,
      totalValue: stat._sum.amount || 0,
    }));

    // Get deal status statistics  
    const dealStats = await prisma.deal.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { _all: true },
      _sum: { amount: true },
    });

    const dealData = dealStats.map(stat => ({
      status: stat.status,
      count: stat._count._all,
      totalValue: stat._sum.amount || 0,
    }));

    // Get recent activities
    const recentActivities = await prisma.crmActivity.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        assignedUser: {
          select: { name: true, email: true },
        },
        customer: {
          select: { companyName: true },
        },
        contact: {
          select: { fullName: true },
        },
        opportunity: {
          select: { name: true },
        },
        deal: {
          select: { name: true },
        },
      },
    });

    // Get top opportunities by value
    const topOpportunities = await prisma.opportunity.findMany({
      where: { 
        tenantId,
        stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] },
        amount: { not: null },
      },
      orderBy: { amount: 'desc' },
      take: 5,
      include: {
        owner: {
          select: { name: true, email: true },
        },
        customer: {
          select: { companyName: true },
        },
        contact: {
          select: { fullName: true },
        },
      },
    });

    // Get sales rep performance
    const salesRepPerformance = await prisma.deal.groupBy({
      by: ['ownerId'],
      where: { 
        tenantId,
        status: 'WON',
        ownerId: { not: null },
      },
      _count: { _all: true },
      _sum: { amount: true },
    });

    const salesRepData = await Promise.all(
      salesRepPerformance.map(async (rep) => {
        const user = await prisma.user.findUnique({
          where: { id: rep.ownerId! },
          select: { name: true, email: true },
        });
        return {
          userId: rep.ownerId,
          userName: user?.name || 'Unknown',
          userEmail: user?.email || '',
          dealCount: rep._count._all,
          totalValue: rep._sum.amount || 0,
        };
      })
    );

    // Get monthly trends (last 12 months)
    const monthlyTrends = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(CASE WHEN "status" = 'WON' THEN 1 END) as won_deals,
        COUNT(CASE WHEN "status" = 'LOST' THEN 1 END) as lost_deals,
        SUM(CASE WHEN "status" = 'WON' THEN "amount" ELSE 0 END) as won_revenue
      FROM "deals" 
      WHERE "tenantId" = ${tenantId}
        AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `;

    const stats = {
      overview: {
        totalContacts,
        totalOpportunities,
        totalDeals,
        totalActivities,
        activeContacts,
        openOpportunities,
        wonDeals,
        overdueActivities,
      },
      pipeline: pipelineData,
      deals: dealData,
      recentActivities,
      topOpportunities,
      salesRepPerformance: salesRepData,
      monthlyTrends,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get CRM dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}


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
    const assignedTo = searchParams.get('assignedTo') || 'all';

    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - parseInt(period));

    // Base where clause
    const baseWhere = {
      tenantId: session.user.tenantId,
      createdAt: { gte: periodStart },
    };

    const userWhere = assignedTo !== 'all' 
      ? { ...baseWhere, assignedTo } 
      : baseWhere;

    // Get overview metrics
    const [
      totalOpportunities,
      openOpportunities,
      wonOpportunities,
      lostOpportunities,
      totalQuotes,
      acceptedQuotes,
      totalActivities,
      completedActivities,
      totalRevenue,
      pipelineValue
    ] = await Promise.all([
      prisma.salesOpportunity.count({ where: userWhere }),
      prisma.salesOpportunity.count({ 
        where: { 
          ...userWhere, 
          stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] }
        } 
      }),
      prisma.salesOpportunity.count({ 
        where: { ...userWhere, stage: 'CLOSED_WON' } 
      }),
      prisma.salesOpportunity.count({ 
        where: { ...userWhere, stage: 'CLOSED_LOST' } 
      }),
      prisma.salesQuote.count({ 
        where: { 
          tenantId: session.user.tenantId,
          createdAt: { gte: periodStart },
        } 
      }),
      prisma.salesQuote.count({ 
        where: { 
          tenantId: session.user.tenantId,
          createdAt: { gte: periodStart },
          status: 'ACCEPTED'
        } 
      }),
      prisma.salesActivity.count({ where: userWhere }),
      prisma.salesActivity.count({ 
        where: { ...userWhere, status: 'COMPLETED' } 
      }),
      prisma.salesOpportunity.aggregate({
        where: { ...userWhere, stage: 'CLOSED_WON' },
        _sum: { amount: true },
      }),
      prisma.salesOpportunity.aggregate({
        where: { 
          ...userWhere, 
          stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] }
        },
        _sum: { amount: true },
      }),
    ]);

    // Get opportunities by stage
    const opportunitiesByStage = await prisma.salesOpportunity.groupBy({
      by: ['stage'],
      where: userWhere,
      _count: { stage: true },
      _sum: { amount: true },
    });

    // Get opportunities by source
    const opportunitiesBySource = await prisma.salesOpportunity.groupBy({
      by: ['source'],
      where: { ...userWhere, source: { not: null } },
      _count: { source: true },
      _sum: { amount: true },
    });

    // Get monthly revenue trend
    const monthlyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', actual_close_date) as month,
        COUNT(*) as deals_won,
        SUM(amount) as revenue
      FROM sales_opportunities 
      WHERE tenant_id = ${session.user.tenantId}
        AND stage = 'CLOSED_WON'
        AND actual_close_date >= ${periodStart}
        ${assignedTo !== 'all' ? `AND assigned_to = ${assignedTo}` : ''}
      GROUP BY DATE_TRUNC('month', actual_close_date)
      ORDER BY month ASC
    `;

    // Get sales funnel conversion rates
    const funnelData = await prisma.salesOpportunity.groupBy({
      by: ['stage'],
      where: userWhere,
      _count: { stage: true },
      orderBy: { stage: 'asc' },
    });

    // Get top performing users
    const userPerformance = await prisma.salesOpportunity.groupBy({
      by: ['assignedTo'],
      where: baseWhere,
      _count: { assignedTo: true },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 10,
    });

    // Add user names to performance data
    const userIds = userPerformance.map(u => u.assignedTo);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userPerformanceWithNames = userPerformance.map(up => ({
      ...up,
      user: users.find(u => u.id === up.assignedTo),
      revenue: up._sum.amount || 0,
      deals: up._count.assignedTo,
    }));

    // Get activity types distribution
    const activitiesByType = await prisma.salesActivity.groupBy({
      by: ['type'],
      where: userWhere,
      _count: { type: true },
    });

    // Get average deal size and cycle time
    const dealMetrics = await prisma.$queryRaw`
      SELECT 
        AVG(amount) as avg_deal_size,
        AVG(EXTRACT(EPOCH FROM (actual_close_date - created_at))/86400) as avg_cycle_days
      FROM sales_opportunities 
      WHERE tenant_id = ${session.user.tenantId}
        AND stage = 'CLOSED_WON'
        AND actual_close_date IS NOT NULL
        AND created_at >= ${periodStart}
        ${assignedTo !== 'all' ? `AND assigned_to = ${assignedTo}` : ''}
    `;

    // Calculate conversion rates
    const winRate = totalOpportunities > 0 
      ? Math.round((wonOpportunities / totalOpportunities) * 100)
      : 0;

    const quoteAcceptanceRate = totalQuotes > 0 
      ? Math.round((acceptedQuotes / totalQuotes) * 100)
      : 0;

    const activityCompletionRate = totalActivities > 0 
      ? Math.round((completedActivities / totalActivities) * 100)
      : 0;

    return NextResponse.json({
      overview: {
        totalOpportunities,
        openOpportunities,
        wonOpportunities,
        lostOpportunities,
        totalRevenue: totalRevenue._sum.amount || 0,
        pipelineValue: pipelineValue._sum.amount || 0,
        winRate,
        quoteAcceptanceRate,
        activityCompletionRate,
        avgDealSize: (dealMetrics as any[])[0]?.avg_deal_size || 0,
        avgCycleDays: Math.round((dealMetrics as any[])[0]?.avg_cycle_days || 0),
      },
      charts: {
        opportunitiesByStage: opportunitiesByStage.map(o => ({
          stage: o.stage,
          count: o._count.stage,
          value: o._sum.amount || 0,
        })),
        opportunitiesBySource: opportunitiesBySource.map(o => ({
          source: o.source,
          count: o._count.source,
          value: o._sum.amount || 0,
        })),
        monthlyRevenue: monthlyRevenue as any[],
        activitiesByType: activitiesByType.map(a => ({
          type: a.type,
          count: a._count.type,
        })),
        funnelData: funnelData.map(f => ({
          stage: f.stage,
          count: f._count.stage,
        })),
      },
      lists: {
        userPerformance: userPerformanceWithNames,
      },
    });
  } catch (error) {
    console.error('Get sales analytics error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

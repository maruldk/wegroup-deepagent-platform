
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
    const category = searchParams.get('category') || 'all';

    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - parseInt(period));

    // Base where clause
    const baseWhere = {
      tenantId: session.user.tenantId,
      createdAt: { gte: periodStart },
    };

    const categoryWhere = category !== 'all' 
      ? { ...baseWhere, category } 
      : baseWhere;

    // Get overview metrics
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalAssets,
      totalTemplates,
      recentProjects
    ] = await Promise.all([
      prisma.contentProject.count({ where: categoryWhere }),
      prisma.contentProject.count({ 
        where: { 
          ...categoryWhere, 
          status: { in: ['DRAFT', 'IN_PROGRESS', 'REVIEW'] } 
        } 
      }),
      prisma.contentProject.count({ 
        where: { 
          ...categoryWhere, 
          status: { in: ['COMPLETED', 'PUBLISHED'] } 
        } 
      }),
      prisma.contentAsset.count({ 
        where: { 
          tenantId: session.user.tenantId,
          createdAt: { gte: periodStart },
        } 
      }),
      prisma.contentTemplate.count({ 
        where: { 
          tenantId: session.user.tenantId,
          createdAt: { gte: periodStart },
        } 
      }),
      prisma.contentProject.findMany({
        where: categoryWhere,
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          creator: { select: { name: true } },
          _count: { select: { assets: true, versions: true } },
        },
      }),
    ]);

    // Get projects by status
    const projectsByStatus = await prisma.contentProject.groupBy({
      by: ['status'],
      where: categoryWhere,
      _count: { status: true },
    });

    // Get projects by category
    const projectsByCategory = await prisma.contentProject.groupBy({
      by: ['category'],
      where: baseWhere,
      _count: { category: true },
    });

    // Get daily project creation over time
    const dailyProjects = await prisma.$queryRaw`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count
      FROM content_projects 
      WHERE tenant_id = ${session.user.tenantId}
        AND created_at >= ${periodStart}
        ${category !== 'all' ? `AND category = ${category}` : ''}
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    // Get most used templates
    const popularTemplates = await prisma.contentTemplate.findMany({
      where: {
        OR: [
          { tenantId: session.user.tenantId },
          { isPublic: true }
        ],
        isActive: true,
      },
      orderBy: { downloads: 'desc' },
      take: 5,
      include: {
        creator: { select: { name: true } },
        _count: { select: { projects: true } },
      },
    });

    // Get asset type distribution
    const assetsByType = await prisma.contentAsset.groupBy({
      by: ['type'],
      where: {
        tenantId: session.user.tenantId,
        createdAt: { gte: periodStart },
      },
      _count: { type: true },
    });

    // Get user productivity
    const userProductivity = await prisma.contentProject.groupBy({
      by: ['createdBy'],
      where: categoryWhere,
      _count: { createdBy: true },
      orderBy: { _count: { createdBy: 'desc' } },
      take: 10,
    });

    // Add user names to productivity data
    const userIds = userProductivity.map(u => u.createdBy);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userProductivityWithNames = userProductivity.map(up => ({
      ...up,
      user: users.find(u => u.id === up.createdBy),
    }));

    // Calculate completion rate
    const completionRate = totalProjects > 0 
      ? Math.round((completedProjects / totalProjects) * 100)
      : 0;

    return NextResponse.json({
      overview: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalAssets,
        totalTemplates,
        completionRate,
      },
      charts: {
        projectsByStatus: projectsByStatus.map(p => ({
          status: p.status,
          count: p._count.status,
        })),
        projectsByCategory: projectsByCategory.map(p => ({
          category: p.category,
          count: p._count.category,
        })),
        dailyProjects: dailyProjects as any[],
        assetsByType: assetsByType.map(a => ({
          type: a.type,
          count: a._count.type,
        })),
      },
      lists: {
        recentProjects,
        popularTemplates,
        userProductivity: userProductivityWithNames,
      },
    });
  } catch (error) {
    console.error('Get create analytics error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { permissionService } from '@/lib/services/permission-service';
import { prisma } from '@/lib/db';
import os from 'os';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const canManageSystem = await permissionService.isSuperAdmin(session.user.id);
    
    if (!canManageSystem) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get system statistics
    const stats = await getSystemStats();

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Error fetching system stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getSystemStats() {
  // Server metrics
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  const nodeVersion = process.version;
  
  // Calculate CPU usage (simplified)
  const cpuUsage = os.loadavg()[0] * 10; // Rough approximation
  
  // Database metrics
  const [
    totalUsers,
    activeUsers,
    totalTenants,
    activeTenants,
    totalSessions,
    recentErrors
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.tenant.count(),
    prisma.tenant.count({ where: { isActive: true } }),
    prisma.session.count(),
    prisma.auditLog.count({
      where: {
        action: { contains: 'ERROR' },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })
  ]);

  // Security metrics
  const [
    failedLogins,
    suspiciousActivities
  ] = await Promise.all([
    prisma.auditLog.count({
      where: {
        action: 'LOGIN_FAILED',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    }),
    prisma.auditLog.count({
      where: {
        action: { in: ['SUSPICIOUS_ACTIVITY', 'UNAUTHORIZED_ACCESS'] },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    })
  ]);

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return {
    server: {
      status: cpuUsage < 80 && memUsage.heapUsed / memUsage.heapTotal < 0.8 ? 'healthy' : 'warning',
      uptime: formatUptime(uptime),
      nodeVersion,
      memoryUsage: {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      cpuUsage: Math.min(cpuUsage, 100)
    },
    database: {
      status: 'connected', // Simplified - if we can query, we're connected
      connections: {
        active: Math.floor(Math.random() * 10) + 5, // Mock data
        idle: Math.floor(Math.random() * 20) + 10,
        total: 50
      },
      performance: {
        avgQueryTime: Math.floor(Math.random() * 50) + 10, // Mock data
        slowQueries: Math.floor(Math.random() * 5)
      }
    },
    application: {
      totalUsers,
      activeUsers,
      totalTenants,
      activeTenants,
      totalSessions,
      errorRate: totalUsers > 0 ? (recentErrors / totalUsers) * 100 : 0
    },
    security: {
      failedLogins,
      suspiciousActivities,
      activeSecurityRules: 15 // Mock data
    },
    performance: {
      avgResponseTime: Math.floor(Math.random() * 200) + 50, // Mock data
      requestsPerMinute: Math.floor(Math.random() * 1000) + 500,
      errorRate: Math.random() * 2 // Mock data
    }
  };
}

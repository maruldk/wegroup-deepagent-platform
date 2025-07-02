
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { permissionService } from '@/lib/services/permission-service';
import { prisma } from '@/lib/db';

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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const level = searchParams.get('level'); // info, warning, error
    const module = searchParams.get('module');

    // Build where clause
    const where: any = {};
    
    if (level) {
      // Map log levels to audit log actions
      const actionMap: any = {
        error: ['ERROR', 'LOGIN_FAILED', 'UNAUTHORIZED_ACCESS'],
        warning: ['SUSPICIOUS_ACTIVITY', 'PERMISSION_DENIED'],
        info: ['USER_CREATED', 'USER_UPDATED', 'LOGIN_SUCCESS']
      };
      
      if (actionMap[level]) {
        where.action = { in: actionMap[level] };
      }
    }

    if (module) {
      where.resource = module.toUpperCase();
    }

    // Get recent audit logs as system logs
    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // Transform audit logs to activity logs format
    const logs = auditLogs.map(log => ({
      id: log.id,
      timestamp: log.createdAt.toISOString(),
      level: getLogLevel(log.action),
      message: formatLogMessage(log),
      module: log.resource || 'SYSTEM',
      userId: log.userId,
      tenantId: log.tenantId
    }));

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching system logs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getLogLevel(action: string): 'info' | 'warning' | 'error' {
  const errorActions = ['ERROR', 'LOGIN_FAILED', 'UNAUTHORIZED_ACCESS'];
  const warningActions = ['SUSPICIOUS_ACTIVITY', 'PERMISSION_DENIED'];
  
  if (errorActions.some(a => action.includes(a))) return 'error';
  if (warningActions.some(a => action.includes(a))) return 'warning';
  return 'info';
}

function formatLogMessage(log: any): string {
  const user = log.user?.name || log.user?.email || 'Unknown';
  const tenant = log.tenant?.name || 'System';
  
  switch (log.action) {
    case 'USER_CREATED':
      return `Neuer Benutzer wurde erstellt von ${user}`;
    case 'USER_UPDATED':
      return `Benutzer wurde aktualisiert von ${user}`;
    case 'LOGIN_SUCCESS':
      return `Erfolgreiche Anmeldung: ${user}`;
    case 'LOGIN_FAILED':
      return `Fehlgeschlagene Anmeldung: ${user}`;
    case 'UNAUTHORIZED_ACCESS':
      return `Unbefugter Zugriff versucht: ${user}`;
    case 'PERMISSION_DENIED':
      return `Berechtigung verweigert: ${user}`;
    case 'TENANT_CREATED':
      return `Neuer Mandant erstellt: ${tenant}`;
    case 'TENANT_UPDATED':
      return `Mandant aktualisiert: ${tenant}`;
    default:
      return `${log.action}: ${user} in ${tenant}`;
  }
}

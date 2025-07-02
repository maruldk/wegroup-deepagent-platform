
/**
 * HYBRID SPRINT 2.1: Security Audit Logs API
 * Get security audit logs and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { securityAuditService } from '@/lib/auth/security-audit-service';
import { SecurityAction } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin privileges
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    if (!isAdmin) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const tenantId = searchParams.get('tenantId');
    const action = searchParams.get('action') as SecurityAction;
    const resource = searchParams.get('resource');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const minRiskScore = searchParams.get('minRiskScore');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const filters: any = {};
    if (userId) filters.userId = userId;
    if (tenantId) filters.tenantId = tenantId;
    if (action) filters.action = action;
    if (resource) filters.resource = resource;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (minRiskScore) filters.minRiskScore = parseFloat(minRiskScore);
    if (limit) filters.limit = parseInt(limit);
    if (offset) filters.offset = parseInt(offset);

    const result = await securityAuditService.getAuditLogs(filters);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Security audit logs error:', error);
    return NextResponse.json(
      { error: 'Failed to get audit logs' },
      { status: 500 }
    );
  }
}

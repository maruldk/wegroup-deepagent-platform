
/**
 * HYBRID SPRINT 2.1: Security Statistics API
 * Get security statistics and metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { securityAuditService } from '@/lib/auth/security-audit-service';
import { twoFactorService } from '@/lib/auth/two-factor-service';
import { apiRateLimiter } from '@/lib/auth/api-rate-limiter';

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
    const tenantId = searchParams.get('tenantId');
    const days = parseInt(searchParams.get('days') || '30');

    const [securityStats, twoFactorStats, rateLimitStats] = await Promise.all([
      securityAuditService.getSecurityStats(tenantId || undefined, days),
      twoFactorService.getTwoFactorStats(tenantId || undefined),
      apiRateLimiter.getRateLimitStats(tenantId || undefined)
    ]);

    // Calculate overall security score
    const twoFactorScore = twoFactorStats.enabledPercentage;
    const threatScore = securityStats.totalEvents > 0 ? 
      Math.max(0, 100 - (securityStats.highRiskEvents / securityStats.totalEvents) * 100) : 100;
    const rateLimitScore = rateLimitStats.totalRequests > 0 ?
      Math.max(0, 100 - (rateLimitStats.blockedRequests / rateLimitStats.totalRequests) * 100) : 100;

    const overallSecurityScore = Math.round((twoFactorScore + threatScore + rateLimitScore) / 3);

    return NextResponse.json({
      success: true,
      data: {
        overallSecurityScore,
        security: securityStats,
        twoFactor: twoFactorStats,
        rateLimit: rateLimitStats,
        summary: {
          riskLevel: overallSecurityScore >= 80 ? 'LOW' : 
                   overallSecurityScore >= 60 ? 'MEDIUM' : 
                   overallSecurityScore >= 40 ? 'HIGH' : 'CRITICAL',
          recommendations: [
            twoFactorStats.enabledPercentage < 50 ? 
              'Encourage more users to enable 2FA' : null,
            securityStats.highRiskEvents > 10 ? 
              'Review high-risk security events' : null,
            rateLimitStats.blockedRequests > 100 ? 
              'Investigate blocked requests for potential attacks' : null
          ].filter(Boolean)
        }
      }
    });
  } catch (error) {
    console.error('Security statistics error:', error);
    return NextResponse.json(
      { error: 'Failed to get security statistics' },
      { status: 500 }
    );
  }
}

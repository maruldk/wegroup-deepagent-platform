
/**
 * HYBRID SPRINT 2.1: Two-Factor Authentication Status API
 * Get 2FA status and statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { twoFactorService } from '@/lib/auth/two-factor-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const status = await twoFactorService.getTwoFactorStatus(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        isEnabled: status?.isEnabled || false,
        hasBackupCodes: status ? status.backupCodes.length > 0 : false,
        backupCodesCount: status?.backupCodes.length || 0,
        lastUsed: status?.lastUsed,
        createdAt: status?.createdAt
      }
    });
  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json(
      { error: 'Failed to get 2FA status' },
      { status: 500 }
    );
  }
}

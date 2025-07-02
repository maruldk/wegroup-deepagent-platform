
/**
 * HYBRID SPRINT 2.1: Two-Factor Authentication Backup Codes API
 * Regenerate backup codes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { twoFactorService } from '@/lib/auth/two-factor-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { confirmToken } = body;

    // Verify current 2FA token before regenerating backup codes
    if (confirmToken) {
      const verification = await twoFactorService.verifyToken(session.user.id, confirmToken);
      if (!verification.valid) {
        return NextResponse.json(
          { error: 'Invalid confirmation token' },
          { status: 400 }
        );
      }
    }

    const backupCodes = await twoFactorService.regenerateBackupCodes(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        backupCodes,
        message: 'New backup codes generated. Store them securely!'
      }
    });
  } catch (error) {
    console.error('Backup codes regeneration error:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate backup codes' },
      { status: 500 }
    );
  }
}

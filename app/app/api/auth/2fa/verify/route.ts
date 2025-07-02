
/**
 * HYBRID SPRINT 2.1: Two-Factor Authentication Verification API
 * Verify 2FA token during login
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
    const { token, allowBackupCode } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const result = await twoFactorService.verifyToken(
      session.user.id, 
      token, 
      allowBackupCode || false
    );

    if (!result.valid) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        usedBackupCode: result.usedBackupCode || false,
        message: result.usedBackupCode ? 
          'Verified with backup code. Consider regenerating backup codes.' :
          'Successfully verified with authenticator'
      }
    });
  } catch (error) {
    console.error('2FA verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify 2FA token' },
      { status: 500 }
    );
  }
}

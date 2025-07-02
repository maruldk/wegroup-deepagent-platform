
/**
 * HYBRID SPRINT 2.1: Two-Factor Authentication Disable API
 * Disable 2FA for user account
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

    // Verify current 2FA token before disabling
    if (confirmToken) {
      const verification = await twoFactorService.verifyToken(session.user.id, confirmToken);
      if (!verification.valid) {
        return NextResponse.json(
          { error: 'Invalid confirmation token' },
          { status: 400 }
        );
      }
    }

    const success = await twoFactorService.disableTwoFactor(session.user.id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to disable 2FA' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        disabled: true,
        message: 'Two-factor authentication has been disabled'
      }
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}

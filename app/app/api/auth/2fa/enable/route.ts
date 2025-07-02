
/**
 * HYBRID SPRINT 2.1: Two-Factor Authentication Enable API
 * Enable 2FA after token verification
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
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      );
    }

    const result = await twoFactorService.enableTwoFactor(session.user.id, token);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid verification token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        enabled: true,
        backupCodes: result.backupCodes,
        message: 'Two-factor authentication has been enabled successfully'
      }
    });
  } catch (error) {
    console.error('2FA enable error:', error);
    return NextResponse.json(
      { error: 'Failed to enable 2FA' },
      { status: 500 }
    );
  }
}

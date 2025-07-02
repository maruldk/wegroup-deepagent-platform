
/**
 * HYBRID SPRINT 2.1: Two-Factor Authentication Initialization API
 * Initialize 2FA for user account
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

    const result = await twoFactorService.initializeTwoFactor(session.user.id);

    return NextResponse.json({
      success: true,
      data: {
        qrCodeUrl: result.qrCodeUrl,
        backupCodes: result.backupCodes,
        // Don't return the raw secret for security
        message: 'Scan the QR code with your authenticator app, then verify with a token to enable 2FA'
      }
    });
  } catch (error) {
    console.error('2FA initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize 2FA' },
      { status: 500 }
    );
  }
}

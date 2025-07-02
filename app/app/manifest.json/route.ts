
/**
 * HYBRID SPRINT 2.1: PWA Manifest API Route
 * Dynamic PWA manifest generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { pwaService } from '@/lib/mobile/pwa-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const manifest = pwaService.getManifest();
    
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Manifest generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate manifest' },
      { status: 500 }
    );
  }
}

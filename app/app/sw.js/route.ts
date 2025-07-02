
/**
 * HYBRID SPRINT 2.1: Service Worker API Route
 * Dynamic service worker generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { pwaService } from '@/lib/mobile/pwa-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const serviceWorkerScript = pwaService.generateServiceWorker();
    
    return new NextResponse(serviceWorkerScript, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600'
      }
    });
  } catch (error) {
    console.error('Service worker generation error:', error);
    return new NextResponse(
      'console.error("Service worker generation failed");',
      {
        headers: {
          'Content-Type': 'application/javascript'
        },
        status: 500
      }
    );
  }
}


/**
 * HYBRID SPRINT 2.1: PWA Status API
 * Get PWA installation and configuration status
 */

import { NextRequest, NextResponse } from 'next/server';
import { pwaService } from '@/lib/mobile/pwa-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const status = pwaService.getPWAInstallationStatus();
    const installability = pwaService.checkInstallability();
    const config = pwaService.getConfig();
    const metrics = pwaService.getPWAMetrics();

    return NextResponse.json({
      success: true,
      data: {
        installation: status,
        installability,
        config: {
          enabled: config.enabled,
          serviceWorker: config.serviceWorker,
          pushNotifications: config.pushNotifications
        },
        metrics
      }
    });
  } catch (error) {
    console.error('PWA status error:', error);
    return NextResponse.json(
      { error: 'Failed to get PWA status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'register_sw':
        const registered = await pwaService.registerServiceWorker();
        return NextResponse.json({
          success: true,
          data: { registered }
        });

      case 'request_notification_permission':
        const permission = await pwaService.requestNotificationPermission();
        return NextResponse.json({
          success: true,
          data: { permission }
        });

      case 'show_notification':
        const { title, options } = body;
        const shown = await pwaService.showNotification(title, options);
        return NextResponse.json({
          success: true,
          data: { shown }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('PWA action error:', error);
    return NextResponse.json(
      { error: 'Failed to process PWA action' },
      { status: 500 }
    );
  }
}


/**
 * HYBRID SPRINT 2.1: Mobile Layout Configuration API
 * Get and update mobile layout configuration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { mobileLayoutService } from '@/lib/mobile/mobile-layout-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const config = mobileLayoutService.getConfig();
    const deviceType = mobileLayoutService.getDeviceType();
    const layoutConfig = mobileLayoutService.getLayoutConfig();
    const navigationConfig = mobileLayoutService.getNavigationConfig();

    return NextResponse.json({
      success: true,
      data: {
        config,
        deviceType,
        layout: layoutConfig,
        navigation: navigationConfig,
        capabilities: {
          isTouch: mobileLayoutService.isTouchDevice(),
          orientation: mobileLayoutService.getOrientation(),
          isMobile: mobileLayoutService.isMobile(),
          isTablet: mobileLayoutService.isTablet(),
          isDesktop: mobileLayoutService.isDesktop()
        }
      }
    });
  } catch (error) {
    console.error('Layout config error:', error);
    return NextResponse.json(
      { error: 'Failed to get layout configuration' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'update_navigation_badge':
        const { itemId, badge } = data;
        mobileLayoutService.updateNavigationBadge(itemId, badge);
        break;

      case 'hide_navigation_item':
        mobileLayoutService.hideNavigationItem(data.itemId);
        break;

      case 'show_navigation_item':
        mobileLayoutService.showNavigationItem(data.itemId);
        break;

      case 'update_config':
        mobileLayoutService.updateConfig(data.config);
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: { updated: true }
    });
  } catch (error) {
    console.error('Layout config update error:', error);
    return NextResponse.json(
      { error: 'Failed to update layout configuration' },
      { status: 500 }
    );
  }
}

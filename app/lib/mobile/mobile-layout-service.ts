
/**
 * HYBRID SPRINT 2.1: Mobile Layout Service
 * Mobile-first responsive design configuration
 */

import { MobileLayoutConfig, MobileNavItem } from '@/lib/types';

export class MobileLayoutService {
  private static instance: MobileLayoutService;
  private config: MobileLayoutConfig;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): MobileLayoutService {
    if (!MobileLayoutService.instance) {
      MobileLayoutService.instance = new MobileLayoutService();
    }
    return MobileLayoutService.instance;
  }

  /**
   * Get default mobile layout configuration
   */
  private getDefaultConfig(): MobileLayoutConfig {
    return {
      breakpoints: {
        mobile: 640,   // 0-640px
        tablet: 1024,  // 641-1024px
        desktop: 1280  // 1025px+
      },
      navigation: {
        type: 'bottom-tabs',
        items: [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: 'LayoutDashboard',
            path: '/dashboard',
            badge: 0
          },
          {
            id: 'analytics',
            label: 'Analytics',
            icon: 'BarChart3',
            path: '/analytics',
            badge: 0
          },
          {
            id: 'projects',
            label: 'Projects',
            icon: 'FolderKanban',
            path: '/projects',
            badge: 0
          },
          {
            id: 'ai-chat',
            label: 'AI Chat',
            icon: 'MessageSquare',
            path: '/ai-chat',
            badge: 0
          },
          {
            id: 'more',
            label: 'More',
            icon: 'Menu',
            path: '/more',
            badge: 0
          }
        ]
      },
      layout: {
        sidebar: false,
        header: true,
        footer: false,
        compact: true
      }
    };
  }

  /**
   * Get current device type based on screen width
   */
  getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') {
      return 'desktop';
    }

    const width = window.innerWidth;
    
    if (width <= this.config.breakpoints.mobile) {
      return 'mobile';
    } else if (width <= this.config.breakpoints.tablet) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  /**
   * Check if current device is mobile
   */
  isMobile(): boolean {
    return this.getDeviceType() === 'mobile';
  }

  /**
   * Check if current device is tablet
   */
  isTablet(): boolean {
    return this.getDeviceType() === 'tablet';
  }

  /**
   * Check if current device is desktop
   */
  isDesktop(): boolean {
    return this.getDeviceType() === 'desktop';
  }

  /**
   * Get responsive classes for grid
   */
  getGridClasses(cols: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  }): string {
    const classes = [];
    
    if (cols.mobile) {
      classes.push(`grid-cols-${cols.mobile}`);
    }
    
    if (cols.tablet) {
      classes.push(`md:grid-cols-${cols.tablet}`);
    }
    
    if (cols.desktop) {
      classes.push(`lg:grid-cols-${cols.desktop}`);
    }
    
    return classes.join(' ');
  }

  /**
   * Get responsive spacing classes
   */
  getSpacingClasses(spacing: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  }): string {
    const classes = [];
    
    if (spacing.mobile) {
      classes.push(spacing.mobile);
    }
    
    if (spacing.tablet) {
      classes.push(`md:${spacing.tablet}`);
    }
    
    if (spacing.desktop) {
      classes.push(`lg:${spacing.desktop}`);
    }
    
    return classes.join(' ');
  }

  /**
   * Get responsive text classes
   */
  getTextClasses(sizes: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  }): string {
    const classes = [];
    
    if (sizes.mobile) {
      classes.push(sizes.mobile);
    }
    
    if (sizes.tablet) {
      classes.push(`md:${sizes.tablet}`);
    }
    
    if (sizes.desktop) {
      classes.push(`lg:${sizes.desktop}`);
    }
    
    return classes.join(' ');
  }

  /**
   * Get navigation configuration for current device
   */
  getNavigationConfig(): {
    type: 'bottom-tabs' | 'hamburger' | 'drawer';
    items: MobileNavItem[];
    visible: boolean;
  } {
    const deviceType = this.getDeviceType();
    
    let navType = this.config.navigation.type;
    let visible = true;
    
    // Adjust navigation type based on device
    if (deviceType === 'desktop') {
      navType = 'drawer';
    } else if (deviceType === 'tablet') {
      navType = 'hamburger';
    }
    
    return {
      type: navType,
      items: this.config.navigation.items,
      visible
    };
  }

  /**
   * Get layout configuration for current device
   */
  getLayoutConfig(): {
    sidebar: boolean;
    header: boolean;
    footer: boolean;
    compact: boolean;
    padding: string;
    containerWidth: string;
  } {
    const deviceType = this.getDeviceType();
    
    let config = { ...this.config.layout };
    let padding = 'p-4';
    let containerWidth = 'max-w-7xl';
    
    switch (deviceType) {
      case 'mobile':
        config.sidebar = false;
        config.compact = true;
        padding = 'p-2';
        containerWidth = 'max-w-full';
        break;
      case 'tablet':
        config.sidebar = false;
        config.compact = true;
        padding = 'p-4';
        containerWidth = 'max-w-6xl';
        break;
      case 'desktop':
        config.sidebar = true;
        config.compact = false;
        padding = 'p-6';
        containerWidth = 'max-w-7xl';
        break;
    }
    
    return {
      ...config,
      padding,
      containerWidth
    };
  }

  /**
   * Get touch-optimized classes
   */
  getTouchClasses(): string {
    if (this.isMobile()) {
      return 'touch-manipulation select-none';
    }
    return '';
  }

  /**
   * Get button size classes for current device
   */
  getButtonClasses(variant: 'sm' | 'md' | 'lg' = 'md'): string {
    const deviceType = this.getDeviceType();
    
    const sizeMap = {
      mobile: {
        sm: 'px-3 py-2 text-sm min-h-[44px]',
        md: 'px-4 py-3 text-base min-h-[44px]',
        lg: 'px-6 py-4 text-lg min-h-[48px]'
      },
      tablet: {
        sm: 'px-3 py-2 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
      },
      desktop: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base'
      }
    };
    
    return sizeMap[deviceType][variant];
  }

  /**
   * Get input size classes for current device
   */
  getInputClasses(): string {
    if (this.isMobile()) {
      return 'min-h-[44px] text-base'; // Prevent zoom on iOS
    }
    return 'h-10 text-sm';
  }

  /**
   * Get modal/dialog classes for current device
   */
  getModalClasses(): string {
    const deviceType = this.getDeviceType();
    
    switch (deviceType) {
      case 'mobile':
        return 'fixed inset-0 z-50 bg-background';
      case 'tablet':
        return 'fixed inset-4 z-50 max-w-lg mx-auto bg-background rounded-lg';
      case 'desktop':
        return 'fixed left-[50%] top-[50%] z-50 max-w-lg translate-x-[-50%] translate-y-[-50%] bg-background rounded-lg';
    }
  }

  /**
   * Get card/panel classes for current device
   */
  getCardClasses(): string {
    if (this.isMobile()) {
      return 'bg-card border-0 rounded-none shadow-sm';
    }
    return 'bg-card border rounded-lg shadow-sm';
  }

  /**
   * Update navigation badge
   */
  updateNavigationBadge(itemId: string, badge: number): void {
    const item = this.config.navigation.items.find(item => item.id === itemId);
    if (item) {
      item.badge = badge;
    }
  }

  /**
   * Hide navigation item
   */
  hideNavigationItem(itemId: string): void {
    const item = this.config.navigation.items.find(item => item.id === itemId);
    if (item) {
      item.hidden = true;
    }
  }

  /**
   * Show navigation item
   */
  showNavigationItem(itemId: string): void {
    const item = this.config.navigation.items.find(item => item.id === itemId);
    if (item) {
      item.hidden = false;
    }
  }

  /**
   * Get viewport meta tag content
   */
  getViewportMeta(): string {
    return 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
  }

  /**
   * Get safe area classes for devices with notches
   */
  getSafeAreaClasses(): string {
    return 'safe-area-inset-top safe-area-inset-bottom safe-area-inset-left safe-area-inset-right';
  }

  /**
   * Check if device supports touch
   */
  isTouchDevice(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }
    
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  /**
   * Get orientation
   */
  getOrientation(): 'portrait' | 'landscape' {
    if (typeof window === 'undefined') {
      return 'portrait';
    }
    
    return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MobileLayoutConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      breakpoints: {
        ...this.config.breakpoints,
        ...newConfig.breakpoints
      },
      navigation: {
        ...this.config.navigation,
        ...newConfig.navigation,
        items: newConfig.navigation?.items || this.config.navigation.items
      },
      layout: {
        ...this.config.layout,
        ...newConfig.layout
      }
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): MobileLayoutConfig {
    return this.config;
  }
}

export const mobileLayoutService = MobileLayoutService.getInstance();

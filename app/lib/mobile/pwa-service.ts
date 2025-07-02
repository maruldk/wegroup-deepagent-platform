
/**
 * HYBRID SPRINT 2.1: Progressive Web App Service
 * PWA configuration and management
 */

import { PWAConfig, PWAIcon, MobileLayoutConfig } from '@/lib/types';

export class PWAService {
  private static instance: PWAService;
  private config: PWAConfig;

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService();
    }
    return PWAService.instance;
  }

  /**
   * Get default PWA configuration
   */
  private getDefaultConfig(): PWAConfig {
    return {
      enabled: true,
      manifest: {
        name: 'weGROUP DeepAgent Platform',
        shortName: 'weGROUP',
        description: 'Enterprise-ready AI-powered business automation platform',
        startUrl: '/',
        display: 'standalone',
        orientation: 'portrait',
        themeColor: '#0066FF',
        backgroundColor: '#ffffff',
        icons: [
          {
            src: '/favicon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/favicon-192-maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/favicon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      serviceWorker: {
        enabled: true,
        scope: '/',
        cachingStrategy: 'stale-while-revalidate',
        offlinePages: [
          '/',
          '/dashboard',
          '/analytics',
          '/offline'
        ]
      },
      pushNotifications: {
        enabled: false,
        vapidKeys: {
          publicKey: '',
          privateKey: ''
        }
      }
    };
  }

  /**
   * Get PWA manifest
   */
  getManifest(): any {
    return {
      name: this.config.manifest.name,
      short_name: this.config.manifest.shortName,
      description: this.config.manifest.description,
      start_url: this.config.manifest.startUrl,
      display: this.config.manifest.display,
      orientation: this.config.manifest.orientation,
      theme_color: this.config.manifest.themeColor,
      background_color: this.config.manifest.backgroundColor,
      icons: this.config.manifest.icons,
      categories: ['business', 'productivity', 'utilities'],
      lang: 'en',
      scope: '/',
      shortcuts: [
        {
          name: 'Dashboard',
          short_name: 'Dashboard',
          description: 'Open main dashboard',
          url: '/dashboard',
          icons: [
            {
              src: '/favicon-192.png',
              sizes: '192x192'
            }
          ]
        },
        {
          name: 'Analytics',
          short_name: 'Analytics',
          description: 'View analytics',
          url: '/analytics',
          icons: [
            {
              src: '/favicon-192.png',
              sizes: '192x192'
            }
          ]
        }
      ]
    };
  }

  /**
   * Generate service worker script
   */
  generateServiceWorker(): string {
    const { serviceWorker } = this.config;
    
    return `
// Service Worker for weGROUP DeepAgent Platform
const CACHE_NAME = 'wegroup-deepagent-v1';
const OFFLINE_URL = '/offline';

const urlsToCache = ${JSON.stringify(serviceWorker.offlinePages)};

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.open(CACHE_NAME)
            .then((cache) => {
              return cache.match(OFFLINE_URL);
            });
        })
    );
  } else {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Return cached version or fetch from network
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New notification from weGROUP',
      icon: '/favicon-192.png',
      badge: '/favicon-192.png',
      tag: data.tag || 'notification',
      data: data.data || {},
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'weGROUP DeepAgent', options)
    );
  }
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle action clicks
    console.log('Notification action clicked:', event.action);
  } else {
    // Handle notification click
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
`;
  }

  /**
   * Check if PWA is installable
   */
  checkInstallability(): {
    isInstallable: boolean;
    requirements: {
      manifest: boolean;
      serviceWorker: boolean;
      https: boolean;
      icons: boolean;
    };
  } {
    const requirements = {
      manifest: true, // We always provide a manifest
      serviceWorker: this.config.serviceWorker.enabled,
      https: typeof window !== 'undefined' ? 
        window.location.protocol === 'https:' || window.location.hostname === 'localhost' : true,
      icons: this.config.manifest.icons.length >= 2
    };

    const isInstallable = Object.values(requirements).every(req => req);

    return {
      isInstallable,
      requirements
    };
  }

  /**
   * Update PWA configuration
   */
  updateConfig(newConfig: Partial<PWAConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      manifest: {
        ...this.config.manifest,
        ...newConfig.manifest
      },
      serviceWorker: {
        ...this.config.serviceWorker,
        ...newConfig.serviceWorker
      },
      pushNotifications: {
        ...this.config.pushNotifications,
        ...newConfig.pushNotifications
      }
    };
  }

  /**
   * Get PWA configuration
   */
  getConfig(): PWAConfig {
    return this.config;
  }

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<boolean> {
    if (!this.config.serviceWorker.enabled) {
      return false;
    }

    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: this.config.serviceWorker.scope
      });

      console.log('Service Worker registered successfully:', registration);
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  /**
   * Request push notification permission
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }

    return Notification.permission;
  }

  /**
   * Show local notification
   */
  async showNotification(
    title: string,
    options: {
      body?: string;
      icon?: string;
      badge?: string;
      tag?: string;
      data?: any;
      actions?: Array<{
        action: string;
        title: string;
        icon?: string;
      }>;
    } = {}
  ): Promise<boolean> {
    const permission = await this.requestNotificationPermission();
    
    if (permission !== 'granted') {
      return false;
    }

    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon || '/favicon-192.png',
      badge: options.badge || '/favicon-192.png',
      tag: options.tag,
      data: options.data,
      ...options
    });

    return true;
  }

  /**
   * Check PWA installation status
   */
  getPWAInstallationStatus(): {
    isInstalled: boolean;
    isStandalone: boolean;
    canInstall: boolean;
  } {
    if (typeof window === 'undefined') {
      return {
        isInstalled: false,
        isStandalone: false,
        canInstall: false
      };
    }

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    return {
      isInstalled: isStandalone,
      isStandalone,
      canInstall: this.checkInstallability().isInstallable
    };
  }

  /**
   * Trigger PWA install prompt
   */
  async triggerInstallPrompt(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    const deferredPrompt = (window as any).deferredPrompt;
    
    if (!deferredPrompt) {
      return false;
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        return true;
      } else {
        console.log('User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      console.error('Install prompt failed:', error);
      return false;
    } finally {
      (window as any).deferredPrompt = null;
    }
  }

  /**
   * Get PWA metrics
   */
  getPWAMetrics(): {
    installationRate: number;
    engagementRate: number;
    retentionRate: number;
    offlineUsage: number;
  } {
    // In production, these would come from analytics
    return {
      installationRate: 0,
      engagementRate: 0,
      retentionRate: 0,
      offlineUsage: 0
    };
  }
}

export const pwaService = PWAService.getInstance();

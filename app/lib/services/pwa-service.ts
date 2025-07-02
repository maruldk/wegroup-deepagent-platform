
// SPRINT 2.9 - Progressive Web App Service
import { prisma } from '@/lib/db'
import { NotificationStatus } from '@prisma/client'

export interface PWAConfig {
  name: string
  shortName: string
  description: string
  themeColor: string
  backgroundColor: string
  icons: PWAIcon[]
  features: PWAFeature[]
}

export interface PWAIcon {
  src: string
  sizes: string
  type: string
  purpose?: string
}

export interface PWAFeature {
  name: string
  enabled: boolean
  config?: any
}

export interface PushNotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  data?: any
  actions?: NotificationAction[]
}

export interface NotificationAction {
  action: string
  title: string
  icon?: string
}

export interface ServiceWorkerUpdate {
  version: string
  updateAvailable: boolean
  changes: string[]
}

export class PWAService {
  private static instance: PWAService
  private registration: ServiceWorkerRegistration | null = null
  private isOnline: boolean = true
  private syncQueue: any[] = []

  static getInstance(): PWAService {
    if (!PWAService.instance) {
      PWAService.instance = new PWAService()
    }
    return PWAService.instance
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeOnlineStatus()
      this.initializeBackgroundSync()
    }
  }

  // PWA Installation and Management
  async initializePWA(config: PWAConfig): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false

      // Register service worker
      const registered = await this.registerServiceWorker()
      if (!registered) return false

      // Setup push notifications
      await this.setupPushNotifications()

      // Configure offline capabilities
      await this.configureOfflineSupport()

      // Update manifest
      this.updateManifest(config)

      console.log('PWA initialized successfully')
      return true
    } catch (error) {
      console.error('PWA initialization failed:', error)
      return false
    }
  }

  private async registerServiceWorker(): Promise<boolean> {
    try {
      if ('serviceWorker' in navigator) {
        this.registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        this.registration.addEventListener('updatefound', () => {
          this.handleServiceWorkerUpdate()
        })

        console.log('Service Worker registered successfully')
        return true
      }
      return false
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return false
    }
  }

  private handleServiceWorkerUpdate(): void {
    if (!this.registration?.installing) return

    const newWorker = this.registration.installing

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        // New service worker is available
        this.notifyUpdateAvailable()
      }
    })
  }

  private notifyUpdateAvailable(): void {
    // Notify user about available update
    const event = new CustomEvent('pwa-update-available', {
      detail: { updateAvailable: true }
    })
    window.dispatchEvent(event)
  }

  async updateServiceWorker(): Promise<boolean> {
    try {
      if (this.registration?.waiting) {
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
        return true
      }
      return false
    } catch (error) {
      console.error('Service Worker update failed:', error)
      return false
    }
  }

  // Push Notifications
  async setupPushNotifications(): Promise<boolean> {
    try {
      if (!('Notification' in window) || !('PushManager' in window)) {
        console.warn('Push notifications not supported')
        return false
      }

      const permission = await this.requestNotificationPermission()
      if (permission !== 'granted') {
        console.warn('Notification permission denied')
        return false
      }

      // Subscribe to push notifications
      const subscription = await this.subscribeToPush()
      if (subscription) {
        await this.savePushSubscription(subscription)
        return true
      }

      return false
    } catch (error) {
      console.error('Push notification setup failed:', error)
      return false
    }
  }

  private async requestNotificationPermission(): Promise<NotificationPermission> {
    if (Notification.permission === 'default') {
      return await Notification.requestPermission()
    }
    return Notification.permission
  }

  private async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      if (!this.registration) return null

      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        )
      })

      return subscription
    } catch (error) {
      console.error('Push subscription failed:', error)
      return null
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private async savePushSubscription(subscription: PushSubscription): Promise<void> {
    try {
      // Send subscription to server
      await fetch('/api/pwa/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON()
        })
      })
    } catch (error) {
      console.error('Failed to save push subscription:', error)
    }
  }

  async sendPushNotification(
    userId: string,
    payload: PushNotificationPayload,
    tenantId: string
  ): Promise<boolean> {
    try {
      // Save notification to database
      const notification = await prisma.pushNotification.create({
        data: {
          userId,
          title: payload.title,
          body: payload.body,
          icon: payload.icon,
          badge: payload.badge,
          data: payload.data,
          status: NotificationStatus.PENDING,
          tenantId
        }
      })

      // Send via push service (server-side)
      const response = await fetch('/api/pwa/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          payload,
          notificationId: notification.id
        })
      })

      if (response.ok) {
        await prisma.pushNotification.update({
          where: { id: notification.id },
          data: {
            status: NotificationStatus.SENT,
            sentAt: new Date()
          }
        })
        return true
      }

      return false
    } catch (error) {
      console.error('Push notification failed:', error)
      return false
    }
  }

  // Offline Support
  private async configureOfflineSupport(): Promise<void> {
    try {
      // Setup cache strategies
      await this.setupCacheStrategies()
      
      // Initialize background sync
      await this.initializeBackgroundSync()
      
      // Setup offline page
      await this.cacheOfflinePage()
      
    } catch (error) {
      console.error('Offline support configuration failed:', error)
    }
  }

  private async setupCacheStrategies(): Promise<void> {
    // Cache strategies are implemented in the service worker
    // This method communicates with the service worker to update strategies
    
    if (this.registration?.active) {
      this.registration.active.postMessage({
        type: 'CACHE_STRATEGIES',
        strategies: {
          api: 'networkFirst',
          static: 'cacheFirst',
          images: 'staleWhileRevalidate'
        }
      })
    }
  }

  private initializeOnlineStatus(): void {
    this.isOnline = navigator.onLine

    window.addEventListener('online', () => {
      this.isOnline = true
      this.processSyncQueue()
      this.notifyOnlineStatus(true)
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
      this.notifyOnlineStatus(false)
    })
  }

  private notifyOnlineStatus(isOnline: boolean): void {
    const event = new CustomEvent('pwa-online-status', {
      detail: { isOnline }
    })
    window.dispatchEvent(event)
  }

  private async initializeBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      // Background sync is available
      console.log('Background sync is available')
    } else {
      console.warn('Background sync not supported, using fallback')
    }
  }

  async addToSyncQueue(action: any): Promise<void> {
    try {
      this.syncQueue.push({
        ...action,
        timestamp: Date.now(),
        id: this.generateSyncId()
      })

      // Try to sync immediately if online
      if (this.isOnline) {
        await this.processSyncQueue()
      } else {
        // Register for background sync
        if ((this.registration as any)?.sync) {
          await (this.registration as any).sync.register('background-sync')
        }
      }
    } catch (error) {
      console.error('Failed to add to sync queue:', error)
    }
  }

  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return

    const queue = [...this.syncQueue]
    this.syncQueue = []

    for (const action of queue) {
      try {
        await this.processSyncAction(action)
      } catch (error) {
        console.error('Sync action failed:', error)
        // Re-add to queue for retry
        this.syncQueue.push(action)
      }
    }
  }

  private async processSyncAction(action: any): Promise<void> {
    switch (action.type) {
      case 'api_call':
        await fetch(action.url, action.options)
        break
      
      case 'form_submit':
        await this.submitFormData(action.data)
        break
      
      case 'file_upload':
        await this.uploadFile(action.file)
        break
      
      default:
        console.warn('Unknown sync action type:', action.type)
    }
  }

  private async submitFormData(data: any): Promise<void> {
    // Submit form data that was queued while offline
    await fetch('/api/offline/form-submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
  }

  private async uploadFile(file: File): Promise<void> {
    const formData = new FormData()
    formData.append('file', file)
    
    await fetch('/api/offline/file-upload', {
      method: 'POST',
      body: formData
    })
  }

  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async cacheOfflinePage(): Promise<void> {
    if ('caches' in window) {
      const cache = await caches.open('offline-pages')
      await cache.add('/offline')
    }
  }

  // Installation Tracking
  async trackInstallation(
    userId: string,
    deviceInfo: any,
    tenantId: string
  ): Promise<string> {
    try {
      const installation = await prisma.pWAInstallation.create({
        data: {
          userId,
          deviceType: deviceInfo.deviceType || 'UNKNOWN',
          platform: deviceInfo.platform || 'UNKNOWN',
          browser: deviceInfo.browser || 'UNKNOWN',
          version: deviceInfo.version || '1.0.0',
          tenantId
        }
      })

      return installation.id
    } catch (error) {
      console.error('Failed to track installation:', error)
      throw error
    }
  }

  async updateInstallationStatus(
    installationId: string,
    status: { isActive?: boolean, lastSync?: Date, pushEnabled?: boolean }
  ): Promise<void> {
    try {
      await prisma.pWAInstallation.update({
        where: { id: installationId },
        data: {
          ...status,
          lastAccessed: new Date()
        }
      })
    } catch (error) {
      console.error('Failed to update installation status:', error)
    }
  }

  // Manifest Management
  private updateManifest(config: PWAConfig): void {
    const manifest = {
      name: config.name,
      short_name: config.shortName,
      description: config.description,
      theme_color: config.themeColor,
      background_color: config.backgroundColor,
      display: 'standalone',
      orientation: 'portrait-primary',
      scope: '/',
      start_url: '/',
      icons: config.icons,
      categories: ['business', 'productivity', 'finance'],
      screenshots: [
        {
          src: '/screenshots/desktop.png',
          sizes: '1280x720',
          type: 'image/png',
          form_factor: 'wide'
        },
        {
          src: '/screenshots/mobile.png',
          sizes: '750x1334',
          type: 'image/png',
          form_factor: 'narrow'
        }
      ]
    }

    // Update manifest link in document head
    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' })
    const manifestURL = URL.createObjectURL(manifestBlob)
    
    let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement
    if (!manifestLink) {
      manifestLink = document.createElement('link')
      manifestLink.rel = 'manifest'
      document.head.appendChild(manifestLink)
    }
    manifestLink.href = manifestURL
  }

  // Analytics and Monitoring
  async getPWAAnalytics(tenantId: string): Promise<any> {
    try {
      const installations = await prisma.pWAInstallation.findMany({
        where: { tenantId },
        include: {
          user: { select: { id: true, name: true, email: true } }
        }
      })

      const notifications = await prisma.pushNotification.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 100
      })

      const analytics = {
        installations: {
          total: installations.length,
          active: installations.filter(i => i.isActive).length,
          byPlatform: this.groupByPlatform(installations),
          byDevice: this.groupByDevice(installations)
        },
        notifications: {
          total: notifications.length,
          sent: notifications.filter(n => n.status === NotificationStatus.SENT).length,
          delivered: notifications.filter(n => n.status === NotificationStatus.DELIVERED).length,
          clicked: notifications.filter(n => n.clickedAt).length,
          clickRate: this.calculateClickRate(notifications)
        },
        usage: {
          avgSessionDuration: this.calculateAvgSessionDuration(installations),
          retentionRate: this.calculateRetentionRate(installations),
          offlineUsage: this.getOfflineUsageStats()
        }
      }

      return analytics
    } catch (error) {
      console.error('Failed to get PWA analytics:', error)
      return {}
    }
  }

  private groupByPlatform(installations: any[]): any {
    return installations.reduce((groups, installation) => {
      const platform = installation.platform
      groups[platform] = (groups[platform] || 0) + 1
      return groups
    }, {})
  }

  private groupByDevice(installations: any[]): any {
    return installations.reduce((groups, installation) => {
      const device = installation.deviceType
      groups[device] = (groups[device] || 0) + 1
      return groups
    }, {})
  }

  private calculateClickRate(notifications: any[]): number {
    const sent = notifications.filter(n => n.status === NotificationStatus.SENT).length
    const clicked = notifications.filter(n => n.clickedAt).length
    return sent > 0 ? (clicked / sent) * 100 : 0
  }

  private calculateAvgSessionDuration(installations: any[]): number {
    // Simplified calculation - in production, track actual session data
    return installations.length > 0 ? 25.5 : 0 // Average minutes
  }

  private calculateRetentionRate(installations: any[]): number {
    const total = installations.length
    const active = installations.filter(i => i.isActive).length
    return total > 0 ? (active / total) * 100 : 0
  }

  private getOfflineUsageStats(): any {
    // Get offline usage statistics from service worker
    return {
      offlineSessions: this.syncQueue.length,
      cachedResources: 0, // Would get from cache API
      syncQueueSize: this.syncQueue.length
    }
  }

  // Utility Methods
  isInstalled(): boolean {
    // Check if app is running in standalone mode
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }

  canInstall(): boolean {
    // Check if installation prompt is available
    return 'beforeinstallprompt' in window
  }

  async promptInstall(): Promise<boolean> {
    try {
      // This would be called from a beforeinstallprompt event handler
      const deferredPrompt = (window as any).deferredPrompt
      if (deferredPrompt) {
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        return outcome === 'accepted'
      }
      return false
    } catch (error) {
      console.error('Install prompt failed:', error)
      return false
    }
  }

  getConnectionInfo(): any {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData
      }
    }
    return null
  }
}

export const pwaService = PWAService.getInstance()

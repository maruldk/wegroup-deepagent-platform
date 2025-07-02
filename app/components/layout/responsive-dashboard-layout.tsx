
'use client';

/**
 * HYBRID SPRINT 2.1: Responsive Dashboard Layout
 * Mobile-first responsive layout with PWA support
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { mobileLayoutService } from '@/lib/mobile/mobile-layout-service';
import { pwaService } from '@/lib/mobile/pwa-service';
import MobileNavigation from './mobile-navigation';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface ResponsiveDashboardLayoutProps {
  children: React.ReactNode;
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
  onSignOut?: () => void;
}

export const ResponsiveDashboardLayout: React.FC<ResponsiveDashboardLayoutProps> = ({
  children,
  user,
  onSignOut
}) => {
  const [layoutConfig, setLayoutConfig] = useState(mobileLayoutService.getLayoutConfig());
  const [deviceType, setDeviceType] = useState(mobileLayoutService.getDeviceType());
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [pwaStatus, setPwaStatus] = useState(pwaService.getPWAInstallationStatus());

  useEffect(() => {
    const updateLayout = () => {
      const newDeviceType = mobileLayoutService.getDeviceType();
      setDeviceType(newDeviceType);
      setLayoutConfig(mobileLayoutService.getLayoutConfig());
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    
    // Register service worker
    pwaService.registerServiceWorker();
    
    // Check PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('resize', updateLayout);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    const success = await pwaService.triggerInstallPrompt();
    if (success) {
      setShowInstallPrompt(false);
      setPwaStatus(pwaService.getPWAInstallationStatus());
    }
  };

  const getMainContentClasses = () => {
    const baseClasses = 'flex-1 overflow-auto';
    
    if (deviceType === 'desktop' && layoutConfig.sidebar) {
      return `${baseClasses} ml-64`;
    }
    
    if (deviceType === 'mobile') {
      return `${baseClasses} pb-20`; // Space for bottom navigation
    }
    
    return baseClasses;
  };

  const getContainerClasses = () => {
    return `
      ${layoutConfig.containerWidth}
      mx-auto
      ${layoutConfig.padding}
      ${deviceType === 'mobile' ? mobileLayoutService.getSafeAreaClasses() : ''}
    `;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* PWA Install Banner */}
      {showInstallPrompt && !pwaStatus.isInstalled && (
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground p-3"
        >
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-3">
              <Download className="h-5 w-5" />
              <div>
                <p className="font-medium">Install DeepAgent Platform</p>
                <p className="text-sm opacity-90">Get the full app experience</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleInstallPWA}
                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                Install
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowInstallPrompt(false)}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Navigation */}
      <MobileNavigation user={user} onSignOut={onSignOut} />

      {/* Main Content */}
      <main className={getMainContentClasses()}>
        {/* Header for tablet/mobile when navigation is hamburger */}
        {deviceType === 'tablet' && (
          <div className="h-16" /> // Space for hamburger header
        )}
        
        {/* PWA install banner offset */}
        {showInstallPrompt && !pwaStatus.isInstalled && (
          <div className="h-16" /> // Space for install banner
        )}

        {/* Content Container */}
        <div className={getContainerClasses()}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Offline Indicator */}
      <OfflineIndicator />
    </div>
  );
};

// Offline Indicator Component
const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  if (isOnline) return null;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-4 left-4 right-4 bg-destructive text-destructive-foreground p-3 rounded-lg shadow-lg z-50"
    >
      <div className="flex items-center justify-center space-x-2">
        <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
        <span className="text-sm font-medium">You're offline</span>
      </div>
    </motion.div>
  );
};

export default ResponsiveDashboardLayout;

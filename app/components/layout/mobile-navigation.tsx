
'use client';

/**
 * HYBRID SPRINT 2.1: Mobile Navigation Component
 * Responsive navigation with bottom tabs, hamburger, and drawer modes
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  BarChart3, 
  FolderKanban, 
  MessageSquare, 
  Menu,
  X,
  Bell,
  Settings,
  User,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { mobileLayoutService } from '@/lib/mobile/mobile-layout-service';
import { MobileNavItem } from '@/lib/types';

interface MobileNavigationProps {
  user?: {
    name?: string;
    email?: string;
    image?: string;
  };
  onSignOut?: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  user,
  onSignOut
}) => {
  const pathname = usePathname();
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [navConfig, setNavConfig] = useState(mobileLayoutService.getNavigationConfig());

  useEffect(() => {
    const updateLayout = () => {
      const newDeviceType = mobileLayoutService.getDeviceType();
      setDeviceType(newDeviceType);
      setNavConfig(mobileLayoutService.getNavigationConfig());
    };

    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      LayoutDashboard,
      BarChart3,
      FolderKanban,
      MessageSquare,
      Menu,
      Bell,
      Settings,
      User,
      LogOut
    };
    return icons[iconName] || Menu;
  };

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  // Bottom Tabs Navigation (Mobile)
  const BottomTabsNavigation = () => (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-inset-bottom"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navConfig.items.filter(item => !item.hidden).map((item) => {
          const Icon = getIconComponent(item.icon);
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`
                flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors relative
                ${active 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
                ${mobileLayoutService.getTouchClasses()}
                min-w-[60px] min-h-[48px]
              `}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 text-xs flex items-center justify-center"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-xs mt-1 font-medium leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </motion.div>
  );

  // Hamburger Navigation (Tablet)
  const HamburgerNavigation = () => (
    <div className="flex items-center justify-between p-4 bg-background border-b border-border">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsDrawerOpen(!isDrawerOpen)}
          className={mobileLayoutService.getTouchClasses()}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">DeepAgent Platform</h1>
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
        {user && (
          <Button variant="ghost" size="icon">
            <User className="h-5 w-5" />
          </Button>
        )}
      </div>

      {/* Slide-out Navigation */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-background border-r border-border"
            >
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Navigation</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              
              <nav className="p-4 space-y-2">
                {navConfig.items.filter(item => !item.hidden).map((item) => {
                  const Icon = getIconComponent(item.icon);
                  const active = isActive(item.path);
                  
                  return (
                    <Link
                      key={item.id}
                      href={item.path}
                      onClick={() => setIsDrawerOpen(false)}
                      className={`
                        flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                        ${active 
                          ? 'text-primary bg-primary/10' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                      {item.badge && item.badge > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {item.badge > 99 ? '99+' : item.badge}
                        </Badge>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* User Section */}
              {user && (
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  {onSignOut && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onSignOut}
                      className="w-full"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );

  // Drawer Navigation (Desktop)
  const DrawerNavigation = () => (
    <div className="fixed left-0 top-0 bottom-0 w-64 bg-background border-r border-border z-30">
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold">DeepAgent Platform</h1>
      </div>
      
      <nav className="p-4 space-y-2">
        {navConfig.items.filter(item => !item.hidden).map((item) => {
          const Icon = getIconComponent(item.icon);
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`
                flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors
                ${active 
                  ? 'text-primary bg-primary/10' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }
              `}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
              {item.badge && item.badge > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {item.badge > 99 ? '99+' : item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      {user && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex-1">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            {onSignOut && (
              <Button variant="outline" size="sm" onClick={onSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Render based on device type
  if (deviceType === 'mobile') {
    return <BottomTabsNavigation />;
  } else if (deviceType === 'tablet') {
    return <HamburgerNavigation />;
  } else {
    return <DrawerNavigation />;
  }
};

export default MobileNavigation;

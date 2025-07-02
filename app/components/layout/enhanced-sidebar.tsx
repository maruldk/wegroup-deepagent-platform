
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  BarChart3, 
  Users, 
  DollarSign, 
  Target,
  Building,
  Calendar,
  Settings,
  Shield,
  Zap,
  Lightbulb,
  TrendingUp,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  current?: boolean;
  badge?: string | number;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  aiPowered?: boolean;
  children?: NavigationItem[];
}

interface AINotification {
  id: string;
  type: 'insight' | 'alert' | 'recommendation' | 'update';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}

interface EnhancedSidebarProps {
  className?: string;
}

export function EnhancedSidebar({ className }: EnhancedSidebarProps) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['ai-analytics']));
  const [aiNotifications, setAiNotifications] = useState<AINotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Generate mock AI notifications
  const generateMockNotifications = (): AINotification[] => {
    return [
      {
        id: '1',
        type: 'insight',
        title: 'Umsatz-Prognose',
        message: 'Q4 Umsatz wird voraussichtlich 15% über Plan liegen',
        priority: 'high',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false,
        actionUrl: '/analytics/dashboard'
      },
      {
        id: '2',
        type: 'alert',
        title: 'Churn-Risiko',
        message: '23 Kunden mit hohem Abwanderungsrisiko erkannt',
        priority: 'critical',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        read: false,
        actionUrl: '/crm/customers'
      },
      {
        id: '3',
        type: 'recommendation',
        title: 'Enterprise-Opportunity',
        message: 'Neue Verkaufschance im Enterprise-Segment identifiziert',
        priority: 'medium',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        read: true,
        actionUrl: '/crm/opportunities'
      }
    ];
  };

  useEffect(() => {
    const notifications = generateMockNotifications();
    setAiNotifications(notifications);
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, []);

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      aiPowered: true,
      badge: '3',
      badgeVariant: 'secondary'
    },
    {
      name: 'KI-Analytics',
      href: '#',
      icon: Brain,
      aiPowered: true,
      badge: 'NEW',
      badgeVariant: 'destructive',
      children: [
        {
          name: 'Analytics Dashboard',
          href: '/analytics/dashboard',
          icon: TrendingUp,
          aiPowered: true
        },
        {
          name: 'KI-Erkenntnisse',
          href: '/analytics/insights',
          icon: Lightbulb,
          aiPowered: true,
          badge: '12'
        },
        {
          name: 'Predictive Analytics',
          href: '/ml-analytics',
          icon: Zap,
          aiPowered: true
        }
      ]
    },
    {
      name: 'CRM',
      href: '/crm',
      icon: Users,
      aiPowered: true,
      children: [
        {
          name: 'Übersicht',
          href: '/crm',
          icon: BarChart3
        },
        {
          name: 'Kontakte',
          href: '/crm/contacts',
          icon: Users,
          aiPowered: true,
          badge: '1,247'
        },
        {
          name: 'Opportunities',
          href: '/crm/opportunities',
          icon: Target,
          aiPowered: true,
          badge: '89'
        },
        {
          name: 'Deals',
          href: '/crm/deals',
          icon: DollarSign,
          aiPowered: true
        },
        {
          name: 'Enhanced CRM',
          href: '/crm/enhanced-crm',
          icon: Sparkles,
          aiPowered: true,
          badge: 'AI'
        }
      ]
    },
    {
      name: 'Leads',
      href: '/leads',
      icon: Target,
      aiPowered: true,
      badge: '45',
      badgeVariant: 'default'
    },
    {
      name: 'Kunden',
      href: '/customers',
      icon: Building,
      badge: '1,247'
    },
    {
      name: 'HR',
      href: '/hr',
      icon: Users,
      aiPowered: true,
      children: [
        {
          name: 'Dashboard',
          href: '/hr/dashboard',
          icon: BarChart3,
          aiPowered: true
        },
        {
          name: 'Mitarbeiter',
          href: '/hr/employees',
          icon: Users,
          badge: '156'
        },
        {
          name: 'Performance',
          href: '/hr/performance',
          icon: TrendingUp,
          aiPowered: true
        }
      ]
    },
    {
      name: 'Finanzen',
      href: '/finance',
      icon: DollarSign,
      aiPowered: true,
      children: [
        {
          name: 'Übersicht',
          href: '/finance',
          icon: BarChart3,
          aiPowered: true
        },
        {
          name: 'Rechnungen',
          href: '/finance/invoices',
          icon: DollarSign,
          badge: '23'
        },
        {
          name: 'Berichte',
          href: '/finance/reports',
          icon: TrendingUp,
          aiPowered: true
        }
      ]
    },
    {
      name: 'Projekte',
      href: '/projects',
      icon: Calendar,
      badge: '12',
      children: [
        {
          name: 'Alle Projekte',
          href: '/projects',
          icon: Calendar
        },
        {
          name: 'Timesheets',
          href: '/projects/timesheets',
          icon: Clock
        }
      ]
    }
  ];

  const aiFeatures: NavigationItem[] = [
    {
      name: 'KI-Chat',
      href: '/ai-chat',
      icon: Brain,
      aiPowered: true,
      badge: 'BETA',
      badgeVariant: 'outline'
    },
    {
      name: 'Self-Learning',
      href: '/self-learning',
      icon: Zap,
      aiPowered: true
    },
    {
      name: 'Event Orchestration',
      href: '/event-orchestration',
      icon: Settings,
      aiPowered: true
    }
  ];

  const systemItems: NavigationItem[] = [
    {
      name: 'Sicherheit',
      href: '/security',
      icon: Shield,
      badge: unreadCount > 0 ? 'Alert' : undefined,
      badgeVariant: 'destructive'
    },
    {
      name: 'Einstellungen',
      href: '/settings',
      icon: Settings
    }
  ];

  const toggleSection = (sectionName: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionName)) {
      newExpanded.delete(sectionName);
    } else {
      newExpanded.add(sectionName);
    }
    setExpandedSections(newExpanded);
  };

  const renderNavigationItem = (item: NavigationItem, level: number = 0) => {
    const isActive = pathname === item.href || (item.children && item.children.some(child => pathname === child.href));
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.has(item.name.toLowerCase().replace(/\s+/g, '-'));

    return (
      <div key={item.name}>
        <div
          className={cn(
            'group flex items-center px-2 py-2 text-sm font-medium rounded-md cursor-pointer transition-all duration-200',
            level === 0 ? 'mx-2' : 'mx-4',
            isActive
              ? 'bg-blue-100 text-blue-900 shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
            level > 0 && 'text-xs'
          )}
          onClick={() => {
            if (hasChildren) {
              toggleSection(item.name.toLowerCase().replace(/\s+/g, '-'));
            }
          }}
        >
          {!hasChildren ? (
            <Link href={item.href} className="flex items-center w-full">
              <item.icon
                className={cn(
                  'mr-3 flex-shrink-0 h-4 w-4',
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                  item.aiPowered && 'text-purple-500'
                )}
                aria-hidden="true"
              />
              <span className="flex-1">{item.name}</span>
              {item.aiPowered && (
                <Sparkles className="h-3 w-3 text-purple-500 ml-1" />
              )}
              {item.badge && (
                <Badge 
                  variant={item.badgeVariant || 'secondary'} 
                  className="ml-2 text-xs"
                >
                  {item.badge}
                </Badge>
              )}
            </Link>
          ) : (
            <div className="flex items-center w-full">
              <item.icon
                className={cn(
                  'mr-3 flex-shrink-0 h-4 w-4',
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500',
                  item.aiPowered && 'text-purple-500'
                )}
                aria-hidden="true"
              />
              <span className="flex-1">{item.name}</span>
              {item.aiPowered && (
                <Sparkles className="h-3 w-3 text-purple-500 ml-1" />
              )}
              {item.badge && (
                <Badge 
                  variant={item.badgeVariant || 'secondary'} 
                  className="ml-2 text-xs"
                >
                  {item.badge}
                </Badge>
              )}
              <div className="ml-2">
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </div>
            </div>
          )}
        </div>

        <AnimatePresence>
          {hasChildren && isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-1 space-y-1">
                {item.children?.map(child => renderNavigationItem(child, level + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const getNotificationIcon = (type: AINotification['type']) => {
    switch (type) {
      case 'insight': return <Lightbulb className="h-3 w-3" />;
      case 'alert': return <AlertTriangle className="h-3 w-3" />;
      case 'recommendation': return <Target className="h-3 w-3" />;
      case 'update': return <CheckCircle className="h-3 w-3" />;
      default: return <Bell className="h-3 w-3" />;
    }
  };

  const getPriorityColor = (priority: AINotification['priority']) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={cn('flex flex-col h-full bg-white border-r border-gray-200', className)}>
      {/* Logo and Search */}
      <div className="flex-shrink-0 px-6 py-4">
        <div className="flex items-center">
          <Brain className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">WeGroup</span>
          <Badge variant="secondary" className="ml-2 text-xs">AI</Badge>
        </div>
      </div>

      {/* AI Search Bar */}
      <div className="px-4 pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="KI-gestützte Suche..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-500" />
        </div>
      </div>

      {/* AI Notifications */}
      {unreadCount > 0 && (
        <div className="mx-4 mb-4">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-blue-900 flex items-center">
                <Bell className="h-4 w-4 mr-1" />
                KI-Benachrichtigungen
              </h3>
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            </div>
            <div className="space-y-2">
              {aiNotifications.filter(n => !n.read).slice(0, 2).map(notification => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start space-x-2"
                >
                  <div className={cn('mt-0.5', getPriorityColor(notification.priority))}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-blue-900 truncate">
                      {notification.title}
                    </p>
                    <p className="text-xs text-blue-700 truncate">
                      {notification.message}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            <Button variant="ghost" size="sm" className="w-full mt-2 text-xs">
              Alle anzeigen
            </Button>
          </motion.div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="space-y-1 pb-4">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navigation.map(item => renderNavigationItem(item))}
          </div>

          <Separator className="mx-4 my-4" />

          {/* AI Features */}
          <div className="px-4 mb-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center">
              <Brain className="h-3 w-3 mr-2 text-purple-500" />
              KI-Features
            </h3>
          </div>
          <div className="space-y-1">
            {aiFeatures.map(item => renderNavigationItem(item))}
          </div>

          <Separator className="mx-4 my-4" />

          {/* System */}
          <div className="space-y-1">
            {systemItems.map(item => renderNavigationItem(item))}
          </div>
        </nav>
      </div>

      {/* AI Status Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="ml-2 text-xs font-medium text-green-900">KI-System</span>
            </div>
            <Badge variant="outline" className="text-xs">Online</Badge>
          </div>
          <div className="mt-1 text-xs text-green-700">
            Alle AI-Services verfügbar
          </div>
          <div className="mt-2 flex items-center text-xs text-green-600">
            <Zap className="h-3 w-3 mr-1" />
            Performance: 98%
          </div>
        </div>
      </div>
    </div>
  );
}

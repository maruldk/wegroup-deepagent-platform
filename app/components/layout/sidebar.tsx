
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  Filter,
  UserCog,
  Building2,
  LogOut,
  Menu,
  X,
  Bot,
  BarChart3,
  Euro,
  FolderKanban,
  Clock,
  FileText,
  Calculator,
  PieChart,
  Receipt,
  Target,
  Calendar,
  Zap,
  Brain,
  Shield,
  Crown,
  Briefcase,
  Star,
  ShoppingCart,
  Wrench,
  Settings,
  Eye,
  TrendingUp,
  Phone,
  Mail,
  DollarSign,
  Award,
  UserCheck,
  UserPlus,
  Plane,
  Palette,
  Lightbulb,
  Image,
  FileVideo,
  FileSpreadsheet,
  Presentation,
  ShoppingBag,
  Package,
  Quote,
  TrendingDown,
  Megaphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TenantSwitcher } from './tenant-switcher';

interface SidebarProps {
  className?: string;
}

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Kunden',
    href: '/customers',
    icon: Users,
  },
  {
    title: 'Leads',
    href: '/leads',
    icon: Filter,
  },
  {
    title: 'KI-Assistent',
    href: '/ai-chat',
    icon: Bot,
  },
  {
    title: 'Event Orchestration',
    href: '/event-orchestration',
    icon: Zap,
  },
  {
    title: 'ML Analytics',
    href: '/ml-analytics',
    icon: Brain,
  },
];

const analyticsNavItems = [
  {
    title: 'Analytics Dashboard',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Berichte',
    href: '/analytics/reports',
    icon: FileText,
  },
  {
    title: 'KPI Metriken',
    href: '/analytics/metrics',
    icon: Target,
  },
];

const financeNavItems = [
  {
    title: 'Rechnungen',
    href: '/finance/invoices',
    icon: Receipt,
  },
  {
    title: 'Transaktionen',
    href: '/finance/transactions',
    icon: Euro,
  },
  {
    title: 'Budgets',
    href: '/finance/budgets',
    icon: Calculator,
  },
  {
    title: 'Finanzberichte',
    href: '/finance/reports',
    icon: PieChart,
  },
];

const aiNavItems = [
  {
    title: 'ML Analytics',
    href: '/ml-analytics',
    icon: BarChart3,
  },
  {
    title: 'Self-Learning',
    href: '/self-learning',
    icon: Brain,
  },
  {
    title: 'AI Chat',
    href: '/ai-chat',
    icon: Bot,
  },
  {
    title: 'Event Orchestration',
    href: '/event-orchestration',
    icon: Zap,
  },
];

const projectNavItems = [
  {
    title: 'Projekte',
    href: '/projects',
    icon: FolderKanban,
  },
  {
    title: 'Aufgaben',
    href: '/projects/tasks',
    icon: Calendar,
  },
  {
    title: 'Zeiterfassung',
    href: '/projects/timesheets',
    icon: Clock,
  },
];

const crmNavItems = [
  {
    title: 'CRM Dashboard',
    href: '/crm',
    icon: Target,
  },
  {
    title: 'Kontakte',
    href: '/crm/contacts',
    icon: Phone,
  },
  {
    title: 'Opportunities',
    href: '/crm/opportunities',
    icon: Target,
  },
  {
    title: 'Deals',
    href: '/crm/deals',
    icon: DollarSign,
  },
  {
    title: 'Aktivitäten',
    href: '/crm/activities',
    icon: Calendar,
  },
  {
    title: 'Analytics',
    href: '/crm/dashboard',
    icon: BarChart3,
  },
];

const hrNavItems = [
  {
    title: 'HR Dashboard',
    href: '/hr',
    icon: Users,
  },
  {
    title: 'Mitarbeiter',
    href: '/hr/employees',
    icon: UserCheck,
  },
  {
    title: 'Abteilungen',
    href: '/hr/departments',
    icon: Building2,
  },
  {
    title: 'Performance',
    href: '/hr/performance',
    icon: Award,
  },
  {
    title: 'Urlaub',
    href: '/hr/leave',
    icon: Plane,
  },
  {
    title: 'Gehaltsabrechnung',
    href: '/hr/payroll',
    icon: Calculator,
  },
  {
    title: 'Analytics',
    href: '/hr/dashboard',
    icon: BarChart3,
  },
];

const createNavItems = [
  {
    title: 'Content Studio',
    href: '/create',
    icon: Palette,
  },
  {
    title: 'Templates',
    href: '/create/templates',
    icon: FileText,
  },
  {
    title: 'Projekte',
    href: '/create/projects',
    icon: FolderKanban,
  },
  {
    title: 'Assets',
    href: '/create/assets',
    icon: Image,
  },
  {
    title: 'KI-Generierung',
    href: '/create/ai-generate',
    icon: Lightbulb,
  },
  {
    title: 'Analytics',
    href: '/create/analytics',
    icon: BarChart3,
  },
];

const sellNavItems = [
  {
    title: 'Sales Pipeline',
    href: '/sell',
    icon: TrendingUp,
  },
  {
    title: 'Opportunities',
    href: '/sell/opportunities',
    icon: Target,
  },
  {
    title: 'Angebote',
    href: '/sell/quotes',
    icon: Quote,
  },
  {
    title: 'Produkte',
    href: '/sell/products',
    icon: Package,
  },
  {
    title: 'Aktivitäten',
    href: '/sell/activities',
    icon: Calendar,
  },
  {
    title: 'Analytics',
    href: '/sell/analytics',
    icon: BarChart3,
  },
];

const adminNavItems = [
  {
    title: 'Benutzerverwaltung',
    href: '/admin/users',
    icon: UserCog,
    roles: ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'TENANT_ADMIN', 'ADMIN'],
  },
  {
    title: 'Mandantenverwaltung',
    href: '/admin/tenants',
    icon: Building2,
    roles: ['SUPER_ADMIN', 'GLOBAL_ADMIN'],
  },
  {
    title: 'Berechtigungen',
    href: '/admin/permissions',
    icon: Shield,
    roles: ['SUPER_ADMIN', 'GLOBAL_ADMIN'],
  },
  {
    title: 'System Übersicht',
    href: '/admin/system',
    icon: Settings,
    roles: ['SUPER_ADMIN', 'GLOBAL_ADMIN'],
  },
];

// Role-based menu visibility
const ROLE_PERMISSIONS = {
  // Level 1: Administratoren  
  SUPER_ADMIN: ['all'],
  GLOBAL_ADMIN: ['all'],
  TENANT_ADMIN: ['dashboard', 'analytics', 'finance', 'projects', 'ai', 'customers', 'leads', 'crm', 'hr', 'create', 'sell', 'admin_users'],
  ADMIN: ['dashboard', 'analytics', 'finance', 'projects', 'customers', 'leads', 'crm', 'hr', 'create', 'sell'],

  // Level 2: C-Level
  CEO: ['dashboard', 'analytics', 'finance', 'projects', 'customers', 'leads', 'crm', 'hr', 'create', 'sell'],
  CFO: ['dashboard', 'analytics', 'finance', 'customers', 'crm', 'hr', 'sell'],
  CTO: ['dashboard', 'analytics', 'projects', 'ai', 'hr', 'create'],
  COO: ['dashboard', 'analytics', 'projects', 'customers', 'crm', 'hr', 'create', 'sell'],

  // Level 3: Management
  DEPARTMENT_HEAD: ['dashboard', 'analytics', 'projects', 'customers', 'crm', 'hr', 'create', 'sell'],
  TEAM_LEAD: ['dashboard', 'projects', 'customers', 'crm', 'create', 'sell'],
  PROJECT_MANAGER: ['dashboard', 'projects', 'analytics', 'create'],
  HR_MANAGER: ['dashboard', 'customers', 'analytics', 'hr', 'create'],
  SALES_MANAGER: ['dashboard', 'customers', 'analytics', 'crm', 'sell'],
  MARKETING_MANAGER: ['dashboard', 'customers', 'analytics', 'crm', 'create', 'sell'],

  // Level 4: Operative
  SENIOR_EMPLOYEE: ['dashboard', 'projects', 'customers', 'crm', 'create', 'sell'],
  EMPLOYEE: ['dashboard', 'projects', 'create'],
  JUNIOR_EMPLOYEE: ['dashboard', 'projects', 'create'],
  INTERN: ['dashboard'],

  // Level 5: Content & Sales Specialists
  CONTENT_CREATOR: ['dashboard', 'create', 'analytics'],
  DESIGNER: ['dashboard', 'create'],
  SALES_REP: ['dashboard', 'customers', 'crm', 'sell'],
  MARKETING_SPECIALIST: ['dashboard', 'customers', 'create', 'sell'],

  // Level 6: Kunden
  CUSTOMER_ADMIN: ['dashboard', 'projects_view'],
  CUSTOMER_USER: ['dashboard'],

  // Level 7: Lieferanten
  SUPPLIER_ADMIN: ['dashboard', 'projects_view'],
  SUPPLIER_USER: ['dashboard'],

  // Legacy (backward compatibility)
  USER: ['dashboard'],
  MANAGER: ['dashboard', 'projects', 'customers', 'crm', 'hr', 'create', 'sell'],
  AUDITOR: ['dashboard', 'analytics'],
};

export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTenant, setCurrentTenant] = useState<any>(null);
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    // Fetch current tenant info
    fetchCurrentTenant();
  }, [session?.user?.id]);

  const fetchCurrentTenant = async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch('/api/multi-tenant/user-tenants');
      if (response.ok) {
        const data = await response.json();
        const primary = data.userTenants?.find((ut: any) => ut.isPrimary);
        setCurrentTenant(primary || data.userTenants?.[0] || null);
      }
    } catch (error) {
      console.error('Error fetching current tenant:', error);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  const userRole = session?.user?.role;
  
  // Helper function to check if user has access to a menu section
  const hasAccess = (section: string): boolean => {
    if (!userRole) return false;
    const permissions = ROLE_PERMISSIONS[userRole as keyof typeof ROLE_PERMISSIONS];
    return permissions?.includes('all') || permissions?.includes(section) || false;
  };

  // Filter admin items based on roles
  const visibleAdminItems = adminNavItems.filter((item) =>
    item.roles.includes(userRole || '')
  );

  // Role badge configuration
  const getRoleBadge = () => {
    if (!userRole) return null;
    
    const config = {
      SUPER_ADMIN: { color: 'bg-red-500', icon: Shield },
      GLOBAL_ADMIN: { color: 'bg-red-600', icon: Shield },
      TENANT_ADMIN: { color: 'bg-orange-500', icon: Shield },
      CEO: { color: 'bg-purple-500', icon: Crown },
      CFO: { color: 'bg-purple-600', icon: Crown },
      CTO: { color: 'bg-purple-700', icon: Crown },
      COO: { color: 'bg-purple-400', icon: Crown },
      DEPARTMENT_HEAD: { color: 'bg-blue-500', icon: Briefcase },
      TEAM_LEAD: { color: 'bg-blue-600', icon: Briefcase },
      PROJECT_MANAGER: { color: 'bg-blue-700', icon: Briefcase },
      CUSTOMER_ADMIN: { color: 'bg-teal-500', icon: Star },
      CUSTOMER_USER: { color: 'bg-teal-600', icon: Star },
      SUPPLIER_ADMIN: { color: 'bg-amber-500', icon: Building2 },
      SUPPLIER_USER: { color: 'bg-amber-600', icon: Building2 },
    };
    
    return config[userRole as keyof typeof config] || { color: 'bg-gray-500', icon: Users };
  };

  const roleBadge = getRoleBadge();

  return (
    <div
      className={cn(
        'flex h-screen flex-col border-r bg-background transition-all duration-300',
        isCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">WG</span>
            </div>
            <span className="font-semibold text-lg">weGROUP</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Tenant Switcher */}
      {!isCollapsed && (
        <div className="p-4 border-b">
          <TenantSwitcher />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
        {/* Main Navigation */}
        {hasAccess('dashboard') && (
          <div className="space-y-2">
            {mainNavItems.filter(item => {
              // Filter items based on permissions
              if (item.href === '/customers' && !hasAccess('customers')) return false;
              if (item.href === '/leads' && !hasAccess('leads')) return false;
              if (item.href.includes('/ai') && !hasAccess('ai')) return false;
              return true;
            }).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        )}

        {/* Analytics Section */}
        {hasAccess('analytics') && (
          <div className="space-y-2 border-t pt-4">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                ANALYTICS
              </h3>
            )}
            {analyticsNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        )}

        {/* AI Section */}
        {hasAccess('ai') && (
          <div className="space-y-2 border-t pt-4">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                AI SYSTEMS
              </h3>
            )}
            {aiNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        )}

        {/* Finance Section */}
        {hasAccess('finance') && (
          <div className="space-y-2 border-t pt-4">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                FINANCE
              </h3>
            )}
            {financeNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        )}

        {/* Projects Section */}
        {hasAccess('projects') && (
          <div className="space-y-2 border-t pt-4">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                PROJEKTE
              </h3>
            )}
            {projectNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        )}

        {/* CRM Section */}
        {hasAccess('crm') && (
          <div className="space-y-2 border-t pt-4">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                CRM
              </h3>
            )}
            {crmNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        )}

        {/* HR Section */}
        {hasAccess('hr') && (
          <div className="space-y-2 border-t pt-4">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                HUMAN RESOURCES
              </h3>
            )}
            {hrNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        )}

        {/* CREATE Section */}
        {hasAccess('create') && (
          <div className="space-y-2 border-t pt-4">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                CONTENT CREATION
              </h3>
            )}
            {createNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        )}

        {/* SELL Section */}
        {hasAccess('sell') && (
          <div className="space-y-2 border-t pt-4">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                SALES & VERTRIEB
              </h3>
            )}
            {sellNavItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        )}

        {/* Admin Section */}
        {visibleAdminItems.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administration
              </h3>
            )}
            {visibleAdminItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive && 'bg-accent text-accent-foreground',
                    isCollapsed && 'justify-center px-2'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t p-4">
        {!isCollapsed && session?.user && (
          <div className="mb-4 space-y-3">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {session.user.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
            </div>

            {/* Role Badge */}
            {roleBadge && (
              <div className="flex items-center space-x-2">
                <Badge className={`${roleBadge.color} text-white text-xs`}>
                  <roleBadge.icon className="h-3 w-3 mr-1" />
                  {userRole?.replace(/_/g, ' ')}
                </Badge>
              </div>
            )}

            {/* Current Tenant */}
            {currentTenant && (
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center space-x-1">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{currentTenant.tenant.name}</span>
                </div>
                {currentTenant.isPrimary && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Haupt-Mandant
                  </Badge>
                )}
              </div>
            )}

            <Separator className="my-2" />
          </div>
        )}
        
        <Button
          variant="ghost"
          size={isCollapsed ? 'icon' : 'sm'}
          onClick={handleSignOut}
          className={cn('w-full', isCollapsed && 'h-8 w-8')}
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && <span className="ml-2">Abmelden</span>}
        </Button>
      </div>
    </div>
  );
}

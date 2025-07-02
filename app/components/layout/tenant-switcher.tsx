
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Building2, 
  ChevronDown, 
  Check, 
  Building, 
  Factory, 
  Palette, 
  ShoppingCart, 
  TrendingUp, 
  Users, 
  Briefcase,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Tenant icons mapping
const TENANT_ICONS = {
  'wegroup': Building2,
  'abundance': TrendingUp,
  'depancon': Briefcase,
  'wfs': Building,
  'wetzlar-industry': Factory,
  'wecreate': Palette,
  'wesell': ShoppingCart,
  'wentures': TrendingUp
};

// Tenant colors mapping
const TENANT_COLORS = {
  'wegroup': 'bg-blue-500',
  'abundance': 'bg-green-500',
  'depancon': 'bg-purple-500',
  'wfs': 'bg-orange-500',
  'wetzlar-industry': 'bg-gray-500',
  'wecreate': 'bg-pink-500',
  'wesell': 'bg-red-500',
  'wentures': 'bg-teal-500'
};

interface Tenant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  businessType?: string;
  primaryColor?: string;
  logo?: string;
  isActive: boolean;
  parentTenant?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface UserTenant {
  id: string;
  userId: string;
  tenantId: string;
  role: string;
  isActive: boolean;
  isPrimary: boolean;
  tenant: Tenant;
}

export function TenantSwitcher() {
  const { data: session } = useSession();
  const [userTenants, setUserTenants] = useState<UserTenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<UserTenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  useEffect(() => {
    fetchUserTenants();
  }, [session?.user?.id]);

  const fetchUserTenants = async () => {
    if (!session?.user?.id) return;

    try {
      const response = await fetch('/api/multi-tenant/user-tenants');
      if (response.ok) {
        const data = await response.json();
        setUserTenants(data.userTenants || []);
        
        // Set current tenant (primary tenant or first tenant)
        const primary = data.userTenants?.find((ut: UserTenant) => ut.isPrimary);
        setCurrentTenant(primary || data.userTenants?.[0] || null);
      }
    } catch (error) {
      console.error('Error fetching user tenants:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchTenant = async (tenantId: string) => {
    setIsSwitching(true);
    
    try {
      const response = await fetch('/api/multi-tenant/switch-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tenantId }),
      });

      if (response.ok) {
        const selectedTenant = userTenants.find(ut => ut.tenantId === tenantId);
        setCurrentTenant(selectedTenant || null);
        
        // Refresh the page to load tenant-specific data
        window.location.reload();
      }
    } catch (error) {
      console.error('Error switching tenant:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-gray-500">Lade Mandanten...</span>
      </div>
    );
  }

  if (!currentTenant || userTenants.length === 0) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-md">
        <Building2 className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-gray-500">Kein Mandant</span>
      </div>
    );
  }

  const getCurrentTenantIcon = () => {
    const IconComponent = TENANT_ICONS[currentTenant.tenant.slug as keyof typeof TENANT_ICONS] || Building2;
    return IconComponent;
  };

  const getTenantIcon = (slug: string) => {
    const IconComponent = TENANT_ICONS[slug as keyof typeof TENANT_ICONS] || Building2;
    return IconComponent;
  };

  const getTenantColor = (slug: string) => {
    return TENANT_COLORS[slug as keyof typeof TENANT_COLORS] || 'bg-gray-500';
  };

  const CurrentTenantIcon = getCurrentTenantIcon();

  // Group tenants by parent
  const weGroupTenants = userTenants.filter(ut => 
    ut.tenant.slug === 'wegroup' || ut.tenant.parentTenant?.slug === 'wegroup'
  );
  const otherTenants = userTenants.filter(ut => 
    ut.tenant.slug !== 'wegroup' && ut.tenant.parentTenant?.slug !== 'wegroup'
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            "w-full justify-between h-auto p-3 bg-white/50 backdrop-blur-sm border-white/20",
            isSwitching && "opacity-50 cursor-not-allowed"
          )}
          disabled={isSwitching}
        >
          <div className="flex items-center space-x-3">
            <div className={cn(
              "p-2 rounded-lg text-white",
              getTenantColor(currentTenant.tenant.slug)
            )}>
              <CurrentTenantIcon className="h-4 w-4" />
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">{currentTenant.tenant.name}</div>
              <div className="text-xs text-gray-500 flex items-center space-x-2">
                <span>{currentTenant.role}</span>
                {currentTenant.isPrimary && (
                  <Badge variant="secondary" className="text-xs px-1 py-0">
                    Primary
                  </Badge>
                )}
              </div>
            </div>
          </div>
          {isSwitching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ChevronDown className="h-4 w-4 opacity-50" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="start">
        <DropdownMenuLabel className="text-xs font-normal text-gray-500">
          Verfügbare Mandanten ({userTenants.length})
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* weGROUP Ecosystem */}
        {weGroupTenants.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs font-semibold text-blue-600 flex items-center space-x-2">
              <Building2 className="h-3 w-3" />
              <span>weGROUP Ecosystem</span>
            </DropdownMenuLabel>
            
            {weGroupTenants.map((userTenant) => {
              const TenantIcon = getTenantIcon(userTenant.tenant.slug);
              const isSelected = currentTenant?.tenantId === userTenant.tenantId;
              
              return (
                <DropdownMenuItem
                  key={userTenant.id}
                  className="cursor-pointer p-3"
                  onClick={() => switchTenant(userTenant.tenantId)}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className={cn(
                      "p-2 rounded-md text-white flex-shrink-0",
                      getTenantColor(userTenant.tenant.slug)
                    )}>
                      <TenantIcon className="h-3 w-3" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">
                          {userTenant.tenant.name}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-green-600" />}
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge 
                          variant="outline" 
                          className="text-xs px-1 py-0"
                        >
                          {userTenant.role}
                        </Badge>
                        {userTenant.isPrimary && (
                          <Badge 
                            variant="secondary" 
                            className="text-xs px-1 py-0 bg-blue-100 text-blue-700"
                          >
                            Primary
                          </Badge>
                        )}
                      </div>
                      
                      {userTenant.tenant.description && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                          {userTenant.tenant.description}
                        </p>
                      )}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {/* Other Tenants */}
        {otherTenants.length > 0 && (
          <>
            {weGroupTenants.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuLabel className="text-xs font-semibold text-gray-600">
              Weitere Mandanten
            </DropdownMenuLabel>
            
            {otherTenants.map((userTenant) => {
              const TenantIcon = getTenantIcon(userTenant.tenant.slug);
              const isSelected = currentTenant?.tenantId === userTenant.tenantId;
              
              return (
                <DropdownMenuItem
                  key={userTenant.id}
                  className="cursor-pointer p-3"
                  onClick={() => switchTenant(userTenant.tenantId)}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className={cn(
                      "p-2 rounded-md text-white flex-shrink-0",
                      getTenantColor(userTenant.tenant.slug)
                    )}>
                      <TenantIcon className="h-3 w-3" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">
                          {userTenant.tenant.name}
                        </span>
                        {isSelected && <Check className="h-4 w-4 text-green-600" />}
                      </div>
                      
                      <Badge 
                        variant="outline" 
                        className="text-xs px-1 py-0 mt-1"
                      >
                        {userTenant.role}
                      </Badge>
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        <DropdownMenuSeparator />
        <div className="p-2">
          <div className="text-xs text-gray-500 text-center">
            Mandant wechseln • {userTenants.length} verfügbar
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

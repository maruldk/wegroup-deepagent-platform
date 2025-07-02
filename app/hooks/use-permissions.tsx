
'use client';

import { useSession } from 'next-auth/react';
import { useMemo, useCallback } from 'react';
import { Permission, Role, UserPermissions, rbacService } from '@/lib/enterprise/rbac-service';

export function usePermissions() {
  const { data: session } = useSession();

  const userPermissions = useMemo((): UserPermissions | null => {
    if (!session?.user) return null;

    return {
      userId: session.user.id,
      tenantId: session.user.tenantId || '',
      role: session.user.role as Role,
      customPermissions: [], // TODO: Load from database/API
      deniedPermissions: [], // TODO: Load from database/API
    };
  }, [session]);

  const hasPermission = useCallback((permission: Permission, resourceId?: string): boolean => {
    if (!userPermissions) return false;
    return rbacService.hasPermission(userPermissions, permission, resourceId);
  }, [userPermissions]);

  const hasAnyPermission = useCallback((permissions: Permission[], resourceId?: string): boolean => {
    if (!userPermissions) return false;
    return rbacService.hasAnyPermission(userPermissions, permissions, resourceId);
  }, [userPermissions]);

  const hasAllPermissions = useCallback((permissions: Permission[], resourceId?: string): boolean => {
    if (!userPermissions) return false;
    return rbacService.hasAllPermissions(userPermissions, permissions, resourceId);
  }, [userPermissions]);

  const getAllPermissions = useCallback((): Permission[] => {
    if (!userPermissions) return [];
    return rbacService.getUserPermissions(userPermissions);
  }, [userPermissions]);

  return {
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getAllPermissions,
    isAuthenticated: !!session?.user,
    role: userPermissions?.role,
  };
}


import { PrismaClient, UserRole, Permission, UserPermission, UserTenantPermission } from '@prisma/client';
import { prisma } from '@/lib/db';

export class PermissionService {
  constructor(private db: PrismaClient = prisma) {}

  // ==========================================================================
  // PERMISSION MANAGEMENT
  // ==========================================================================

  async getAllPermissions(): Promise<Permission[]> {
    return this.db.permission.findMany({
      orderBy: [
        { module: 'asc' },
        { action: 'asc' },
        { resource: 'asc' }
      ]
    });
  }

  async getPermissionsByModule(module: string): Promise<Permission[]> {
    return this.db.permission.findMany({
      where: { module },
      orderBy: [
        { action: 'asc' },
        { resource: 'asc' }
      ]
    });
  }

  async createPermission(data: {
    name: string;
    description?: string;
    module: string;
    action: string;
    resource?: string;
    isSystem?: boolean;
  }): Promise<Permission> {
    return this.db.permission.create({
      data
    });
  }

  async getOrCreatePermission(
    module: string,
    action: string,
    resource?: string
  ): Promise<Permission> {
    const existing = await this.db.permission.findUnique({
      where: {
        module_action_resource: {
          module,
          action,
          resource: (resource ?? null) as any
        }
      }
    });

    if (existing) {
      return existing;
    }

    return this.createPermission({
      name: `${module}_${action}${resource ? `_${resource}` : ''}`,
      module,
      action,
      resource,
      isSystem: true
    });
  }

  // ==========================================================================
  // USER PERMISSIONS (Global)
  // ==========================================================================

  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    return this.db.userPermission.findMany({
      where: { userId },
      include: {
        permission: true
      }
    });
  }

  async grantUserPermission(
    userId: string,
    permissionId: string,
    grantedBy?: string,
    expiresAt?: Date
  ): Promise<UserPermission> {
    return this.db.userPermission.upsert({
      where: {
        userId_permissionId: {
          userId,
          permissionId
        }
      },
      create: {
        userId,
        permissionId,
        isGranted: true,
        grantedBy,
        expiresAt
      },
      update: {
        isGranted: true,
        grantedBy,
        grantedAt: new Date(),
        expiresAt
      },
      include: {
        permission: true
      }
    });
  }

  async revokeUserPermission(userId: string, permissionId: string): Promise<UserPermission> {
    return this.db.userPermission.update({
      where: {
        userId_permissionId: {
          userId,
          permissionId
        }
      },
      data: {
        isGranted: false
      }
    });
  }

  // ==========================================================================
  // USER-TENANT PERMISSIONS (Tenant-specific)
  // ==========================================================================

  async getUserTenantPermissions(userId: string, tenantId: string): Promise<UserTenantPermission[]> {
    const userTenant = await this.db.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId
        }
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });

    return userTenant?.permissions || [];
  }

  async grantUserTenantPermission(
    userId: string,
    tenantId: string,
    permissionId: string,
    grantedBy?: string,
    expiresAt?: Date
  ): Promise<UserTenantPermission> {
    // Find the UserTenant record
    const userTenant = await this.db.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId
        }
      }
    });

    if (!userTenant) {
      throw new Error('User is not a member of this tenant');
    }

    return this.db.userTenantPermission.upsert({
      where: {
        userTenantId_permissionId: {
          userTenantId: userTenant.id,
          permissionId
        }
      },
      create: {
        userTenantId: userTenant.id,
        permissionId,
        isGranted: true,
        grantedBy,
        expiresAt
      },
      update: {
        isGranted: true,
        grantedBy,
        grantedAt: new Date(),
        expiresAt
      },
      include: {
        permission: true
      }
    });
  }

  // ==========================================================================
  // ROLE-BASED PERMISSIONS
  // ==========================================================================

  async getRolePermissions(role: UserRole): Promise<Permission[]> {
    const rolePermissions = await this.db.rolePermission.findMany({
      where: { role, isDefault: true },
      include: {
        permission: true
      }
    });

    return rolePermissions.map(rp => rp.permission);
  }

  async assignRolePermission(role: UserRole, permissionId: string): Promise<void> {
    await this.db.rolePermission.upsert({
      where: {
        role_permissionId: {
          role,
          permissionId
        }
      },
      create: {
        role,
        permissionId,
        isDefault: true
      },
      update: {
        isDefault: true
      }
    });
  }

  async bulkAssignRolePermissions(role: UserRole, permissionIds: string[]): Promise<void> {
    await Promise.all(
      permissionIds.map(permissionId =>
        this.assignRolePermission(role, permissionId)
      )
    );
  }

  // ==========================================================================
  // PERMISSION CHECKING
  // ==========================================================================

  async hasGlobalPermission(
    userId: string,
    module: string,
    action: string,
    resource?: string
  ): Promise<boolean> {
    // Check if user has global permission
    const userPermission = await this.db.userPermission.findFirst({
      where: {
        userId,
        isGranted: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ],
        permission: {
          module,
          action,
          resource: resource ?? null
        }
      }
    });

    if (userPermission) return true;

    // Check role-based permissions
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) return false;

    const rolePermission = await this.db.rolePermission.findFirst({
      where: {
        role: user.role,
        isDefault: true,
        permission: {
          module,
          action,
          resource: resource ?? null
        }
      }
    });

    return !!rolePermission;
  }

  async hasTenantPermission(
    userId: string,
    tenantId: string,
    module: string,
    action: string,
    resource?: string
  ): Promise<boolean> {
    // First check if user is member of tenant
    const userTenant = await this.db.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId
        }
      }
    });

    if (!userTenant?.isActive) return false;

    // Check tenant-specific permission
    const tenantPermission = await this.db.userTenantPermission.findFirst({
      where: {
        userTenantId: userTenant.id,
        isGranted: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ],
        permission: {
          module,
          action,
          resource: resource ?? null
        }
      }
    });

    if (tenantPermission) return true;

    // Check role-based permissions for tenant role
    const rolePermission = await this.db.rolePermission.findFirst({
      where: {
        role: userTenant.role,
        isDefault: true,
        permission: {
          module,
          action,
          resource: resource ?? null
        }
      }
    });

    if (rolePermission) return true;

    // Fall back to global permission check
    return this.hasGlobalPermission(userId, module, action, resource);
  }

  async hasAnyTenantPermission(
    userId: string,
    module: string,
    action: string,
    resource?: string
  ): Promise<boolean> {
    const userTenants = await this.db.userTenant.findMany({
      where: { userId, isActive: true }
    });

    for (const userTenant of userTenants) {
      const hasPermission = await this.hasTenantPermission(
        userId,
        userTenant.tenantId,
        module,
        action,
        resource
      );
      if (hasPermission) return true;
    }

    return false;
  }

  // ==========================================================================
  // ADMIN UTILITIES
  // ==========================================================================

  async isSuperAdmin(userId: string): Promise<boolean> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    return user?.role === UserRole.SUPER_ADMIN || user?.role === UserRole.GLOBAL_ADMIN;
  }

  async isAdminInAnyTenant(userId: string): Promise<boolean> {
    const adminTenants = await this.db.userTenant.findMany({
      where: {
        userId,
        isActive: true,
        role: {
          in: [
            UserRole.SUPER_ADMIN,
            UserRole.GLOBAL_ADMIN,
            UserRole.TENANT_ADMIN,
            UserRole.ADMIN
          ]
        }
      }
    });

    return adminTenants.length > 0;
  }

  async canManageUsers(userId: string, tenantId?: string): Promise<boolean> {
    if (await this.isSuperAdmin(userId)) return true;

    if (tenantId) {
      return this.hasTenantPermission(userId, tenantId, 'ADMIN', 'MANAGE_USERS');
    }

    return this.hasGlobalPermission(userId, 'ADMIN', 'MANAGE_USERS');
  }

  async canManageTenants(userId: string): Promise<boolean> {
    return this.isSuperAdmin(userId) ||
           this.hasGlobalPermission(userId, 'ADMIN', 'MANAGE_TENANTS');
  }
}

export const permissionService = new PermissionService();

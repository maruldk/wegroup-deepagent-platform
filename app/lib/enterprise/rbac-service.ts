
export enum Permission {
  // Dashboard permissions
  DASHBOARD_VIEW = 'dashboard:view',
  DASHBOARD_CREATE = 'dashboard:create',
  DASHBOARD_EDIT = 'dashboard:edit',
  DASHBOARD_DELETE = 'dashboard:delete',
  DASHBOARD_SHARE = 'dashboard:share',
  
  // Widget permissions
  WIDGET_VIEW = 'widget:view',
  WIDGET_CREATE = 'widget:create',
  WIDGET_EDIT = 'widget:edit',
  WIDGET_DELETE = 'widget:delete',
  
  // Report permissions
  REPORT_VIEW = 'report:view',
  REPORT_CREATE = 'report:create',
  REPORT_EDIT = 'report:edit',
  REPORT_DELETE = 'report:delete',
  REPORT_EXPORT = 'report:export',
  REPORT_SCHEDULE = 'report:schedule',
  
  // Analytics permissions
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
  ANALYTICS_ADMIN = 'analytics:admin',
  
  // AI/ML permissions
  AI_INSIGHTS_VIEW = 'ai:insights:view',
  AI_INSIGHTS_CREATE = 'ai:insights:create',
  AI_MODELS_VIEW = 'ai:models:view',
  AI_MODELS_TRAIN = 'ai:models:train',
  AI_MODELS_DEPLOY = 'ai:models:deploy',
  
  // Finance permissions
  FINANCE_VIEW = 'finance:view',
  FINANCE_CREATE = 'finance:create',
  FINANCE_EDIT = 'finance:edit',
  FINANCE_DELETE = 'finance:delete',
  FINANCE_EXPORT = 'finance:export',
  
  // Project permissions
  PROJECT_VIEW = 'project:view',
  PROJECT_CREATE = 'project:create',
  PROJECT_EDIT = 'project:edit',
  PROJECT_DELETE = 'project:delete',
  PROJECT_MANAGE = 'project:manage',
  
  // User management permissions
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',
  USER_INVITE = 'user:invite',
  
  // Tenant management permissions
  TENANT_VIEW = 'tenant:view',
  TENANT_EDIT = 'tenant:edit',
  TENANT_MANAGE = 'tenant:manage',
  TENANT_BILLING = 'tenant:billing',
  
  // System administration
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_AUDIT = 'system:audit',
  SYSTEM_BACKUP = 'system:backup',
  SYSTEM_MONITOR = 'system:monitor',
}

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  TENANT_ADMIN = 'TENANT_ADMIN',
  MANAGER = 'MANAGER', 
  ANALYST = 'ANALYST',
  USER = 'USER',
  VIEWER = 'VIEWER',
  AUDITOR = 'AUDITOR',
}

export interface RoleDefinition {
  name: Role;
  description: string;
  permissions: Permission[];
  inherits?: Role[];
}

export interface UserPermissions {
  userId: string;
  tenantId: string;
  role: Role;
  customPermissions: Permission[];
  deniedPermissions: Permission[];
  expiresAt?: Date;
}

export interface ResourcePermission {
  resourceType: 'dashboard' | 'widget' | 'report' | 'project' | 'user';
  resourceId: string;
  userId: string;
  permissions: Permission[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

class RBACService {
  private static instance: RBACService | null = null;
  private roleDefinitions: Map<Role, RoleDefinition> = new Map();

  private constructor() {
    this.initializeRoles();
  }

  static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  private initializeRoles(): void {
    // Define role hierarchy and permissions
    const roles: RoleDefinition[] = [
      {
        name: Role.SUPER_ADMIN,
        description: 'System super administrator with all permissions',
        permissions: Object.values(Permission),
      },
      {
        name: Role.TENANT_ADMIN,
        description: 'Tenant administrator with full tenant permissions',
        permissions: [
          Permission.DASHBOARD_VIEW,
          Permission.DASHBOARD_CREATE,
          Permission.DASHBOARD_EDIT,
          Permission.DASHBOARD_DELETE,
          Permission.DASHBOARD_SHARE,
          Permission.WIDGET_VIEW,
          Permission.WIDGET_CREATE,
          Permission.WIDGET_EDIT,
          Permission.WIDGET_DELETE,
          Permission.REPORT_VIEW,
          Permission.REPORT_CREATE,
          Permission.REPORT_EDIT,
          Permission.REPORT_DELETE,
          Permission.REPORT_EXPORT,
          Permission.REPORT_SCHEDULE,
          Permission.ANALYTICS_VIEW,
          Permission.ANALYTICS_EXPORT,
          Permission.ANALYTICS_ADMIN,
          Permission.AI_INSIGHTS_VIEW,
          Permission.AI_INSIGHTS_CREATE,
          Permission.AI_MODELS_VIEW,
          Permission.FINANCE_VIEW,
          Permission.FINANCE_CREATE,
          Permission.FINANCE_EDIT,
          Permission.FINANCE_DELETE,
          Permission.FINANCE_EXPORT,
          Permission.PROJECT_VIEW,
          Permission.PROJECT_CREATE,
          Permission.PROJECT_EDIT,
          Permission.PROJECT_DELETE,
          Permission.PROJECT_MANAGE,
          Permission.USER_VIEW,
          Permission.USER_CREATE,
          Permission.USER_EDIT,
          Permission.USER_DELETE,
          Permission.USER_INVITE,
          Permission.TENANT_VIEW,
          Permission.TENANT_EDIT,
        ],
      },
      {
        name: Role.MANAGER,
        description: 'Manager with team and project management permissions',
        permissions: [
          Permission.DASHBOARD_VIEW,
          Permission.DASHBOARD_CREATE,
          Permission.DASHBOARD_EDIT,
          Permission.DASHBOARD_SHARE,
          Permission.WIDGET_VIEW,
          Permission.WIDGET_CREATE,
          Permission.WIDGET_EDIT,
          Permission.REPORT_VIEW,
          Permission.REPORT_CREATE,
          Permission.REPORT_EDIT,
          Permission.REPORT_EXPORT,
          Permission.ANALYTICS_VIEW,
          Permission.ANALYTICS_EXPORT,
          Permission.AI_INSIGHTS_VIEW,
          Permission.FINANCE_VIEW,
          Permission.FINANCE_CREATE,
          Permission.FINANCE_EDIT,
          Permission.PROJECT_VIEW,
          Permission.PROJECT_CREATE,
          Permission.PROJECT_EDIT,
          Permission.PROJECT_MANAGE,
          Permission.USER_VIEW,
          Permission.USER_INVITE,
        ],
      },
      {
        name: Role.ANALYST,
        description: 'Analyst with data analysis and reporting permissions',
        permissions: [
          Permission.DASHBOARD_VIEW,
          Permission.DASHBOARD_CREATE,
          Permission.DASHBOARD_EDIT,
          Permission.WIDGET_VIEW,
          Permission.WIDGET_CREATE,
          Permission.WIDGET_EDIT,
          Permission.REPORT_VIEW,
          Permission.REPORT_CREATE,
          Permission.REPORT_EDIT,
          Permission.REPORT_EXPORT,
          Permission.ANALYTICS_VIEW,
          Permission.ANALYTICS_EXPORT,
          Permission.AI_INSIGHTS_VIEW,
          Permission.AI_INSIGHTS_CREATE,
          Permission.AI_MODELS_VIEW,
          Permission.FINANCE_VIEW,
          Permission.PROJECT_VIEW,
        ],
      },
      {
        name: Role.USER,
        description: 'Standard user with basic permissions',
        permissions: [
          Permission.DASHBOARD_VIEW,
          Permission.DASHBOARD_CREATE,
          Permission.WIDGET_VIEW,
          Permission.WIDGET_CREATE,
          Permission.REPORT_VIEW,
          Permission.ANALYTICS_VIEW,
          Permission.AI_INSIGHTS_VIEW,
          Permission.FINANCE_VIEW,
          Permission.PROJECT_VIEW,
        ],
      },
      {
        name: Role.VIEWER,
        description: 'Read-only user with view permissions only',
        permissions: [
          Permission.DASHBOARD_VIEW,
          Permission.WIDGET_VIEW,
          Permission.REPORT_VIEW,
          Permission.ANALYTICS_VIEW,
          Permission.AI_INSIGHTS_VIEW,
          Permission.FINANCE_VIEW,
          Permission.PROJECT_VIEW,
        ],
      },
      {
        name: Role.AUDITOR,
        description: 'Auditor with read-only access to audit trails',
        permissions: [
          Permission.DASHBOARD_VIEW,
          Permission.REPORT_VIEW,
          Permission.ANALYTICS_VIEW,
          Permission.FINANCE_VIEW,
          Permission.PROJECT_VIEW,
          Permission.USER_VIEW,
          Permission.SYSTEM_AUDIT,
        ],
      },
    ];

    roles.forEach(role => {
      this.roleDefinitions.set(role.name, role);
    });
  }

  // Check if user has specific permission
  hasPermission(
    userPermissions: UserPermissions,
    permission: Permission,
    resourceId?: string
  ): boolean {
    // Check if permission is explicitly denied
    if (userPermissions.deniedPermissions.includes(permission)) {
      return false;
    }

    // Check if permission is explicitly granted
    if (userPermissions.customPermissions.includes(permission)) {
      return true;
    }

    // Check role-based permissions
    const roleDefinition = this.roleDefinitions.get(userPermissions.role);
    if (roleDefinition && roleDefinition.permissions.includes(permission)) {
      return true;
    }

    // Check inherited permissions
    if (roleDefinition?.inherits) {
      for (const inheritedRole of roleDefinition.inherits) {
        const inheritedRoleDefinition = this.roleDefinitions.get(inheritedRole);
        if (inheritedRoleDefinition?.permissions.includes(permission)) {
          return true;
        }
      }
    }

    return false;
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(
    userPermissions: UserPermissions,
    permissions: Permission[],
    resourceId?: string
  ): boolean {
    return permissions.some(permission => 
      this.hasPermission(userPermissions, permission, resourceId)
    );
  }

  // Check if user has all of the specified permissions
  hasAllPermissions(
    userPermissions: UserPermissions,
    permissions: Permission[],
    resourceId?: string
  ): boolean {
    return permissions.every(permission => 
      this.hasPermission(userPermissions, permission, resourceId)
    );
  }

  // Get all permissions for a user
  getUserPermissions(userPermissions: UserPermissions): Permission[] {
    const roleDefinition = this.roleDefinitions.get(userPermissions.role);
    const rolePermissions = roleDefinition?.permissions || [];
    
    // Combine role permissions with custom permissions
    const allPermissions = new Set([
      ...rolePermissions,
      ...userPermissions.customPermissions
    ]);

    // Remove denied permissions
    userPermissions.deniedPermissions.forEach(permission => {
      allPermissions.delete(permission);
    });

    return Array.from(allPermissions);
  }

  // Grant permission to user
  grantPermission(
    userPermissions: UserPermissions,
    permission: Permission
  ): UserPermissions {
    const updatedPermissions = { ...userPermissions };
    
    if (!updatedPermissions.customPermissions.includes(permission)) {
      updatedPermissions.customPermissions.push(permission);
    }

    // Remove from denied permissions if present
    updatedPermissions.deniedPermissions = updatedPermissions.deniedPermissions.filter(
      p => p !== permission
    );

    return updatedPermissions;
  }

  // Revoke permission from user
  revokePermission(
    userPermissions: UserPermissions,
    permission: Permission
  ): UserPermissions {
    const updatedPermissions = { ...userPermissions };
    
    // Remove from custom permissions
    updatedPermissions.customPermissions = updatedPermissions.customPermissions.filter(
      p => p !== permission
    );

    // Add to denied permissions if it's a role permission
    const roleDefinition = this.roleDefinitions.get(userPermissions.role);
    if (roleDefinition?.permissions.includes(permission)) {
      if (!updatedPermissions.deniedPermissions.includes(permission)) {
        updatedPermissions.deniedPermissions.push(permission);
      }
    }

    return updatedPermissions;
  }

  // Change user role
  changeUserRole(
    userPermissions: UserPermissions,
    newRole: Role
  ): UserPermissions {
    return {
      ...userPermissions,
      role: newRole,
      // Clear custom permissions when changing role
      customPermissions: [],
      deniedPermissions: [],
    };
  }

  // Get role definition
  getRoleDefinition(role: Role): RoleDefinition | undefined {
    return this.roleDefinitions.get(role);
  }

  // Get all role definitions
  getAllRoles(): RoleDefinition[] {
    return Array.from(this.roleDefinitions.values());
  }

  // Check if user can access resource
  canAccessResource(
    userPermissions: UserPermissions,
    resourceType: string,
    resourceId: string,
    requiredPermission: Permission
  ): boolean {
    // Basic permission check
    if (!this.hasPermission(userPermissions, requiredPermission)) {
      return false;
    }

    // Additional resource-specific checks can be added here
    // For example, checking if user is owner of the resource
    
    return true;
  }

  // Validate permissions array
  validatePermissions(permissions: string[]): Permission[] {
    const validPermissions: Permission[] = [];
    const allPermissions = Object.values(Permission);

    permissions.forEach(permission => {
      if (allPermissions.includes(permission as Permission)) {
        validPermissions.push(permission as Permission);
      }
    });

    return validPermissions;
  }

  // Check if role is valid
  isValidRole(role: string): role is Role {
    return Object.values(Role).includes(role as Role);
  }

  // Get permission hierarchy
  getPermissionHierarchy(): Record<string, Permission[]> {
    const hierarchy: Record<string, Permission[]> = {};

    Object.values(Permission).forEach(permission => {
      const [module] = permission.split(':');
      if (!hierarchy[module]) {
        hierarchy[module] = [];
      }
      hierarchy[module].push(permission);
    });

    return hierarchy;
  }

  // Audit permission check
  auditPermissionCheck(
    userId: string,
    permission: Permission,
    resourceId: string | undefined,
    granted: boolean,
    reason?: string
  ): void {
    // Log permission check for audit purposes
    console.log({
      timestamp: new Date().toISOString(),
      userId,
      permission,
      resourceId,
      granted,
      reason,
      type: 'PERMISSION_CHECK'
    });
  }
}

export const rbacService = RBACService.getInstance();

// RBAC Configuration Types
export interface RBACConfig {
  defaultRole: Role;
  permissionHierarchy: Record<string, Permission[]>;
  roleInheritance: Record<Role, Role[]>;
}

export const DEFAULT_RBAC_CONFIG: RBACConfig = {
  defaultRole: Role.USER,
  permissionHierarchy: {},
  roleInheritance: {
    [Role.SUPER_ADMIN]: [],
    [Role.TENANT_ADMIN]: [],
    [Role.MANAGER]: [],
    [Role.ANALYST]: [],
    [Role.USER]: [],
    [Role.VIEWER]: [],
    [Role.AUDITOR]: [],
  },
};

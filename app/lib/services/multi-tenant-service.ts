
import { PrismaClient, UserRole, Tenant, User, UserTenant } from '@prisma/client';
import { prisma } from '@/lib/db';

export class MultiTenantService {
  constructor(private db: PrismaClient = prisma) {}

  // ==========================================================================
  // TENANT MANAGEMENT
  // ==========================================================================

  async getAllTenants(includeInactive = false): Promise<Tenant[]> {
    return this.db.tenant.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        parentTenant: true,
        childTenants: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: [
        { parentTenantId: { sort: 'asc', nulls: 'first' } },
        { name: 'asc' }
      ]
    });
  }

  async getTenantById(tenantId: string): Promise<Tenant | null> {
    return this.db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        parentTenant: true,
        childTenants: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async getTenantBySlug(slug: string): Promise<Tenant | null> {
    return this.db.tenant.findUnique({
      where: { slug },
      include: {
        parentTenant: true,
        childTenants: true
      }
    });
  }

  async createTenant(data: {
    name: string;
    slug: string;
    description?: string;
    businessType?: string;
    logo?: string;
    primaryColor?: string;
    website?: string;
    createdById?: string;
    parentTenantId?: string;
  }): Promise<Tenant> {
    return this.db.tenant.create({
      data,
      include: {
        parentTenant: true,
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async updateTenant(tenantId: string, data: Partial<Tenant>): Promise<Tenant> {
    return this.db.tenant.update({
      where: { id: tenantId },
      data,
      include: {
        parentTenant: true,
        childTenants: true
      }
    });
  }

  async deactivateTenant(tenantId: string): Promise<Tenant> {
    return this.db.tenant.update({
      where: { id: tenantId },
      data: { isActive: false },
    });
  }

  // ==========================================================================
  // USER-TENANT RELATIONSHIPS
  // ==========================================================================

  async getUserTenants(userId: string, includeInactive = false): Promise<UserTenant[]> {
    return this.db.userTenant.findMany({
      where: {
        userId,
        ...(includeInactive ? {} : { isActive: true })
      },
      include: {
        tenant: true,
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: [
        { isPrimary: 'desc' },
        { joinedAt: 'desc' }
      ]
    });
  }

  async getTenantUsers(tenantId: string, includeInactive = false): Promise<UserTenant[]> {
    return this.db.userTenant.findMany({
      where: {
        tenantId,
        ...(includeInactive ? {} : { isActive: true })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isActive: true,
            createdAt: true,
            updatedAt: true
          }
        },
        permissions: {
          include: {
            permission: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'desc' }
      ]
    });
  }

  async addUserToTenant(
    userId: string,
    tenantId: string,
    role: string = 'USER',
    isPrimary = false,
    invitedBy?: string
  ): Promise<UserTenant> {
    // If setting as primary, remove primary from other tenant relationships for this user
    if (isPrimary) {
      await this.db.userTenant.updateMany({
        where: { userId },
        data: { isPrimary: false }
      });
    }

    return this.db.userTenant.create({
      data: {
        userId,
        tenantId,
        role: role as any,
        isPrimary,
        invitedBy
      },
      include: {
        tenant: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
  }

  async removeUserFromTenant(userId: string, tenantId: string): Promise<UserTenant> {
    return this.db.userTenant.update({
      where: {
        userId_tenantId: {
          userId,
          tenantId
        }
      },
      data: {
        isActive: false,
        leftAt: new Date()
      }
    });
  }

  async updateUserTenantRole(userId: string, tenantId: string, role: UserRole): Promise<UserTenant> {
    return this.db.userTenant.update({
      where: {
        userId_tenantId: {
          userId,
          tenantId
        }
      },
      data: { role }
    });
  }

  async setPrimaryTenant(userId: string, tenantId: string): Promise<UserTenant> {
    // Remove primary from all other tenants for this user
    await this.db.userTenant.updateMany({
      where: { userId },
      data: { isPrimary: false }
    });

    // Set the new primary tenant
    return this.db.userTenant.update({
      where: {
        userId_tenantId: {
          userId,
          tenantId
        }
      },
      data: { isPrimary: true }
    });
  }

  async getUserPrimaryTenant(userId: string): Promise<UserTenant | null> {
    return this.db.userTenant.findFirst({
      where: {
        userId,
        isPrimary: true,
        isActive: true
      },
      include: {
        tenant: true
      }
    });
  }

  // ==========================================================================
  // MULTI-TENANT CONTEXT UTILITIES
  // ==========================================================================

  async canUserAccessTenant(userId: string, tenantId: string): Promise<boolean> {
    const userTenant = await this.db.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId
        }
      }
    });

    return userTenant?.isActive === true;
  }

  async getUserRoleInTenant(userId: string, tenantId: string): Promise<UserRole | null> {
    const userTenant = await this.db.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId
        }
      },
      select: {
        role: true,
        isActive: true
      }
    });

    return userTenant?.isActive ? userTenant.role : null;
  }

  async isUserAdminInTenant(userId: string, tenantId: string): Promise<boolean> {
    const role = await this.getUserRoleInTenant(userId, tenantId);
    return [
      'SUPER_ADMIN',
      'GLOBAL_ADMIN',
      'TENANT_ADMIN',
      'ADMIN'
    ].includes(role as string);
  }

  async isCLevelUser(userId: string): Promise<boolean> {
    const userTenants = await this.db.userTenant.findMany({
      where: {
        userId,
        isActive: true,
        role: {
          in: ['CEO', 'CFO', 'CTO', 'COO']
        }
      }
    });

    return userTenants.length > 0;
  }

  // ==========================================================================
  // TENANT HIERARCHY UTILITIES
  // ==========================================================================

  async getTenantHierarchy(tenantId: string): Promise<{
    parent?: Tenant;
    children: Tenant[];
    siblings: Tenant[];
  }> {
    const tenant = await this.getTenantById(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const children = await this.db.tenant.findMany({
      where: { parentTenantId: tenantId, isActive: true },
      orderBy: { name: 'asc' }
    });

    let parent: Tenant | undefined;
    let siblings: Tenant[] = [];

    if (tenant.parentTenantId) {
      parent = await this.getTenantById(tenant.parentTenantId) || undefined;
      siblings = await this.db.tenant.findMany({
        where: {
          parentTenantId: tenant.parentTenantId,
          id: { not: tenantId },
          isActive: true
        },
        orderBy: { name: 'asc' }
      });
    }

    return { parent, children, siblings };
  }

  async getWeGroupTenants(): Promise<Tenant[]> {
    return this.db.tenant.findMany({
      where: {
        OR: [
          { slug: 'wegroup' },
          { parentTenant: { slug: 'wegroup' } }
        ],
        isActive: true
      },
      include: {
        parentTenant: true
      },
      orderBy: { name: 'asc' }
    });
  }

  // ==========================================================================
  // STATISTICS & ANALYTICS
  // ==========================================================================

  async getTenantStats(tenantId: string) {
    const [
      totalUsers,
      activeUsers,
      adminUsers,
      recentJoins
    ] = await Promise.all([
      this.db.userTenant.count({
        where: { tenantId }
      }),
      this.db.userTenant.count({
        where: { tenantId, isActive: true }
      }),
      this.db.userTenant.count({
        where: {
          tenantId,
          isActive: true,
          role: {
            in: [
              'SUPER_ADMIN',
              'GLOBAL_ADMIN',
              'TENANT_ADMIN',
              'ADMIN'
            ]
          }
        }
      }),
      this.db.userTenant.count({
        where: {
          tenantId,
          isActive: true,
          joinedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })
    ]);

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      recentJoins,
      inactiveUsers: totalUsers - activeUsers
    };
  }

  async getGlobalStats() {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      globalAdmins
    ] = await Promise.all([
      this.db.tenant.count(),
      this.db.tenant.count({ where: { isActive: true } }),
      this.db.userTenant.count({ where: { isActive: true } }),
      this.db.userTenant.count({
        where: {
          isActive: true,
          role: {
            in: ['SUPER_ADMIN', 'GLOBAL_ADMIN']
          }
        }
      })
    ]);

    return {
      totalTenants,
      activeTenants,
      totalUsers,
      globalAdmins,
      inactiveTenants: totalTenants - activeTenants
    };
  }
}

export const multiTenantService = new MultiTenantService();

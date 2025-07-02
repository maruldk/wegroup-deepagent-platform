
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// =============================================================================
// TENANT DATA - weGROUP Ecosystem (8 Mandanten)
// =============================================================================

const TENANTS_DATA = [
  {
    name: 'weGROUP GmbH',
    slug: 'wegroup',
    description: 'Corporate Group Management & Strategic Leadership',
    businessType: 'Corporate Management',
    primaryColor: '#0066CC',
    website: 'https://i.pinimg.com/originals/80/8b/8a/808b8aa7fec975886015e196d626f188.png',
    logo: 'https://media.licdn.com/dms/image/v2/C4E0BAQFtzYmVAiN_Yw/company-logo_200_200/company-logo_200_200/0/1630650330858/wegroup_global_ltd_logo?e=2147483647&v=beta&t=umYbyPR_3rJ6XeGGAvg8lzO-uBUectWBAyGUK1-2D00',
    isParent: true
  },
  {
    name: 'Abundance GmbH',
    slug: 'abundance',
    description: 'Business Development & Growth Strategy',
    businessType: 'Business Development',
    primaryColor: '#28A745',
    website: 'https://abundance.wegroup.de',
    logo: 'https://img.freepik.com/premium-vector/logo-circular-frame-symbolizing-natural-growth-abundance_331474-117.jpg',
    parentSlug: 'wegroup'
  },
  {
    name: 'DePanCon GmbH',
    slug: 'depancon',
    description: 'Consulting & Project Management Excellence',
    businessType: 'Consulting',
    primaryColor: '#6F42C1',
    website: 'https://depancon.wegroup.de',
    logo: 'https://i.pinimg.com/736x/45/74/d0/4574d0eb6e2a598488bf2fbbb1c5ca10.jpg',
    parentSlug: 'wegroup'
  },
  {
    name: 'WFS Fulfillment Solutions GmbH',
    slug: 'wfs',
    description: 'Logistics & Fulfillment Services',
    businessType: 'Logistics',
    primaryColor: '#FD7E14',
    website: 'https://wfs.wegroup.de',
    logo: 'https://static.vecteezy.com/system/resources/previews/012/951/040/original/logistics-logo-icon-illustration-design-distribution-symbol-delivery-of-goods-economy-finance-free-vector.jpg',
    parentSlug: 'wegroup'
  },
  {
    name: 'Wetzlar Industry Solutions GmbH',
    slug: 'wetzlar-industry',
    description: 'Industrial Solutions & Manufacturing Technology',
    businessType: 'Manufacturing',
    primaryColor: '#6C757D',
    website: 'https://wetzlar.wegroup.de',
    logo: 'https://i.pinimg.com/originals/73/f7/74/73f774aadea99db40027979c2081bad8.png',
    parentSlug: 'wegroup'
  },
  {
    name: 'weCREATE GmbH',
    slug: 'wecreate',
    description: 'Creative Agency & Design Studio',
    businessType: 'Creative Services',
    primaryColor: '#E83E8C',
    website: 'https://wecreate.wegroup.de',
    logo: 'https://i.pinimg.com/originals/21/97/54/219754b963eeefbe876201d81de23cc9.png',
    parentSlug: 'wegroup'
  },
  {
    name: 'weSELL GmbH',
    slug: 'wesell',
    description: 'Sales & Distribution Network',
    businessType: 'Sales & Distribution',
    primaryColor: '#DC3545',
    website: 'https://wesell.wegroup.de',
    logo: 'https://cdn0.iconfinder.com/data/icons/business-strategy-3/500/business-strategy-tactic-trick_10-512.png',
    parentSlug: 'wegroup'
  },
  {
    name: 'weVENTURES GmbH',
    slug: 'wentures',
    description: 'Venture Capital & Investment Management',
    businessType: 'Investment',
    primaryColor: '#17A2B8',
    website: 'https://wentures.wegroup.de',
    logo: 'https://i.pinimg.com/736x/50/a0/28/50a0280be7225b372e26be0109e77355.jpg',
    parentSlug: 'wegroup'
  }
];

// =============================================================================
// DEMO USERS DATA - Professional & Realistic
// =============================================================================

const DEMO_USERS_DATA = [
  // ===== LEVEL 1: ADMINISTRATOREN =====
  {
    name: 'John Doe',
    email: 'john@doe.com',
    password: 'johndoe123',
    role: UserRole.SUPER_ADMIN,
    image: 'https://i.pinimg.com/originals/cf/27/61/cf27610284d7f050b8469e2c4e75541c.jpg',
    description: 'Super Administrator with global access to all weGROUP companies',
    tenants: ['wegroup', 'abundance', 'depancon', 'wfs', 'wetzlar-industry', 'wecreate', 'wesell', 'wentures'],
    isPrimaryTenant: 'wegroup'
  },
  {
    name: 'Admin Weber',
    email: 'admin@wegroup.de',
    password: 'admin123',
    role: UserRole.TENANT_ADMIN,
    image: 'https://i.pinimg.com/736x/86/29/a5/8629a5c37d590f3f6e269ca5eb707e7b.jpg',
    description: 'weGROUP Tenant Administrator',
    tenants: ['wegroup'],
    isPrimaryTenant: 'wegroup'
  },

  // ===== LEVEL 2: C-LEVEL =====
  {
    name: 'Dr. Michael Richter',
    email: 'ceo@wegroup.de',
    password: 'ceo123',
    role: UserRole.CEO,
    image: 'https://i.pinimg.com/736x/eb/05/b1/eb05b19e4b5f3f9b9266cb3481a3847a.jpg',
    description: 'Chief Executive Officer - weGROUP GmbH',
    tenants: ['wegroup', 'abundance', 'depancon', 'wfs', 'wetzlar-industry', 'wecreate', 'wesell', 'wentures'],
    isPrimaryTenant: 'wegroup'
  },
  {
    name: 'Dr. Sabine Fischer',
    email: 'cfo@wegroup.de',
    password: 'cfo123',
    role: UserRole.CFO,
    image: 'https://i.pinimg.com/originals/ab/b2/06/abb206b08ddd4df20d55fbfafc7d72aa.jpg',
    description: 'Chief Financial Officer - weGROUP GmbH',
    tenants: ['wegroup', 'abundance', 'depancon', 'wfs', 'wetzlar-industry', 'wecreate', 'wesell', 'wentures'],
    isPrimaryTenant: 'wegroup'
  },
  {
    name: 'Max Mustermann',
    email: 'max.mustermann@depancon.de',
    password: 'max123',
    role: UserRole.CEO,
    image: 'https://img.freepik.com/premium-photo/professional-business-portrait-confident-male-executive-suit_1190610-4621.jpg',
    description: 'Chief Executive Officer - DePanCon GmbH',
    tenants: ['depancon', 'wegroup'],
    isPrimaryTenant: 'depancon'
  },
  {
    name: 'Sandra Schmidt',
    email: 'sandra.schmidt@abundance.de',
    password: 'sandra123',
    role: UserRole.CFO,
    image: 'http://www.watsco.com/wp-content/uploads/2023/03/menendez006_750xx3333-4444-0-0.jpeg',
    description: 'Chief Financial Officer - Abundance GmbH',
    tenants: ['abundance', 'wegroup'],
    isPrimaryTenant: 'abundance'
  },

  // ===== LEVEL 3: MANAGEMENT =====
  {
    name: 'Thomas Wagner',
    email: 'thomas.wagner@wfs.de',
    password: 'thomas123',
    role: UserRole.DEPARTMENT_HEAD,
    image: 'https://logistics-manager.com/wp-content/uploads/2023/02/YOT_0004-edited-696x930.jpg',
    description: 'Head of Logistics - WFS Fulfillment Solutions',
    tenants: ['wfs'],
    isPrimaryTenant: 'wfs'
  },
  {
    name: 'Lisa Zimmermann',
    email: 'lisa.zimmermann@wecreate.de',
    password: 'lisa123',
    role: UserRole.PROJECT_MANAGER,
    image: 'https://cdn.shoutoutarizona.com/wp-content/uploads/2022/10/c-CatBabbie__IMG6076_1665072091727.jpeg',
    description: 'Creative Project Manager - weCREATE GmbH',
    tenants: ['wecreate'],
    isPrimaryTenant: 'wecreate'
  },

  // ===== LEVEL 4: OPERATIVE MITARBEITER =====
  {
    name: 'David Klein',
    email: 'david.klein@wesell.de',
    password: 'david123',
    role: UserRole.SENIOR_EMPLOYEE,
    image: 'https://i.pinimg.com/originals/ff/95/ad/ff95ad8d38d36bf6e6d41f07d037ce98.jpg',
    description: 'Senior Sales Manager - weSELL GmbH',
    tenants: ['wesell'],
    isPrimaryTenant: 'wesell'
  },
  {
    name: 'Julia Hoffmann',
    email: 'julia.hoffmann@wetzlar-industry.de',
    password: 'julia123',
    role: UserRole.EMPLOYEE,
    image: 'https://img.freepik.com/premium-photo/young-attractive-female-professional-engineering-manager-manufacturing-site_755164-21328.jpg',
    description: 'Manufacturing Engineer - Wetzlar Industry Solutions',
    tenants: ['wetzlar-industry'],
    isPrimaryTenant: 'wetzlar-industry'
  },

  // ===== LEVEL 5: KUNDEN =====
  {
    name: 'Tech-Startup CEO',
    email: 'startup@techvisio.com',
    password: 'startup123',
    role: UserRole.CUSTOMER_ADMIN,
    image: 'https://gklabs.tech/wp-content/uploads/2023/06/D918BEB3-5201-464B-9B89-CD6BFF9D6FDB.jpeg',
    description: 'CEO - Tech-Visio Startup (weVENTURES Client)',
    tenants: ['wentures'],
    isPrimaryTenant: 'wentures'
  },
  {
    name: 'Manufacturing Director',
    email: 'director@industrial-client.com',
    password: 'manufacturing123',
    role: UserRole.CUSTOMER_ADMIN,
    image: 'https://pbs.twimg.com/media/FP0whitXsAYM8lC?format=jpg&name=4096x4096',
    description: 'Operations Director - Industrial Manufacturing Client',
    tenants: ['wetzlar-industry'],
    isPrimaryTenant: 'wetzlar-industry'
  },
  {
    name: 'E-Commerce Manager',
    email: 'manager@ecommerce-client.com',
    password: 'ecommerce123',
    role: UserRole.CUSTOMER_USER,
    image: 'http://tourismcareers.qtic.com.au/wp-content/uploads/2019/04/E-commerce-manager-e1554770068877.jpg',
    description: 'E-Commerce Operations Manager (weSELL Client)',
    tenants: ['wesell'],
    isPrimaryTenant: 'wesell'
  },

  // ===== LEVEL 6: LIEFERANTEN =====
  {
    name: 'Supplier Coordinator',
    email: 'coord@logistics-supplier.com',
    password: 'supplier123',
    role: UserRole.SUPPLIER_ADMIN,
    image: 'https://cdn.enhancv.com/images/1080/i/aHR0cHM6Ly9jZG4uZW5oYW5jdi5jb20vcHJlZGVmaW5lZC1leGFtcGxlcy9Va2FDejQ2QUdDdjBVU3ZJWXQ0YlFDY1czUU1rcUxCS0xaeTM1ZWM2L2ltYWdlLnBuZw~~..png',
    description: 'Supply Chain Coordinator - Logistics Partner',
    tenants: ['wfs'],
    isPrimaryTenant: 'wfs'
  },
  {
    name: 'Software Vendor',
    email: 'vendor@software-partner.com',
    password: 'vendor123',
    role: UserRole.SUPPLIER_USER,
    image: 'https://s26500.pcdn.co/wp-content/uploads/2023/08/top-5-rising-vendors-hci-software-thumb.png',
    description: 'Software Solutions Vendor - Technology Partner',
    tenants: ['wegroup'],
    isPrimaryTenant: 'wegroup'
  }
];

// =============================================================================
// CORE PERMISSIONS SETUP
// =============================================================================

const CORE_PERMISSIONS = [
  // ADMIN Module
  { name: 'ADMIN_MANAGE_TENANTS', module: 'ADMIN', action: 'MANAGE_TENANTS', resource: null },
  { name: 'ADMIN_MANAGE_USERS', module: 'ADMIN', action: 'MANAGE_USERS', resource: null },
  { name: 'ADMIN_VIEW_AUDIT', module: 'ADMIN', action: 'VIEW_AUDIT', resource: null },
  { name: 'ADMIN_SYSTEM_CONFIG', module: 'ADMIN', action: 'SYSTEM_CONFIG', resource: null },
  
  // FINANCE Module
  { name: 'FINANCE_READ', module: 'FINANCE', action: 'READ', resource: null },
  { name: 'FINANCE_WRITE', module: 'FINANCE', action: 'WRITE', resource: null },
  { name: 'FINANCE_DELETE', module: 'FINANCE', action: 'DELETE', resource: null },
  { name: 'FINANCE_EXPORT', module: 'FINANCE', action: 'EXPORT', resource: null },
  { name: 'FINANCE_APPROVE', module: 'FINANCE', action: 'APPROVE', resource: null },
  
  // ANALYTICS Module
  { name: 'ANALYTICS_READ', module: 'ANALYTICS', action: 'READ', resource: null },
  { name: 'ANALYTICS_WRITE', module: 'ANALYTICS', action: 'WRITE', resource: null },
  { name: 'ANALYTICS_EXPORT', module: 'ANALYTICS', action: 'EXPORT', resource: null },
  { name: 'ANALYTICS_ADVANCED', module: 'ANALYTICS', action: 'ADVANCED', resource: null },
  
  // PROJECTS Module
  { name: 'PROJECTS_READ', module: 'PROJECTS', action: 'READ', resource: null },
  { name: 'PROJECTS_WRITE', module: 'PROJECTS', action: 'WRITE', resource: null },
  { name: 'PROJECTS_DELETE', module: 'PROJECTS', action: 'DELETE', resource: null },
  { name: 'PROJECTS_MANAGE', module: 'PROJECTS', action: 'MANAGE', resource: null },
  
  // AI Module
  { name: 'AI_READ', module: 'AI', action: 'READ', resource: null },
  { name: 'AI_WRITE', module: 'AI', action: 'WRITE', resource: null },
  { name: 'AI_ADVANCED', module: 'AI', action: 'ADVANCED', resource: null },
  
  // CUSTOMERS Module
  { name: 'CUSTOMERS_READ', module: 'CUSTOMERS', action: 'READ', resource: null },
  { name: 'CUSTOMERS_WRITE', module: 'CUSTOMERS', action: 'WRITE', resource: null },
  { name: 'CUSTOMERS_DELETE', module: 'CUSTOMERS', action: 'DELETE', resource: null }
];

// =============================================================================
// ROLE PERMISSION MAPPINGS
// =============================================================================

const ROLE_PERMISSIONS = {
  [UserRole.SUPER_ADMIN]: 'ALL', // All permissions
  [UserRole.GLOBAL_ADMIN]: 'ALL', // All permissions
  
  [UserRole.TENANT_ADMIN]: [
    'ADMIN_MANAGE_USERS', 'ADMIN_VIEW_AUDIT',
    'FINANCE_READ', 'FINANCE_WRITE', 'FINANCE_EXPORT', 'FINANCE_APPROVE',
    'ANALYTICS_READ', 'ANALYTICS_WRITE', 'ANALYTICS_EXPORT', 'ANALYTICS_ADVANCED',
    'PROJECTS_READ', 'PROJECTS_WRITE', 'PROJECTS_MANAGE',
    'AI_READ', 'AI_WRITE', 'AI_ADVANCED',
    'CUSTOMERS_READ', 'CUSTOMERS_WRITE'
  ],
  
  [UserRole.CEO]: [
    'FINANCE_READ', 'FINANCE_EXPORT', 'FINANCE_APPROVE',
    'ANALYTICS_READ', 'ANALYTICS_EXPORT', 'ANALYTICS_ADVANCED',
    'PROJECTS_READ', 'PROJECTS_MANAGE',
    'AI_READ', 'AI_ADVANCED',
    'CUSTOMERS_READ', 'CUSTOMERS_WRITE'
  ],
  
  [UserRole.CFO]: [
    'FINANCE_READ', 'FINANCE_WRITE', 'FINANCE_EXPORT', 'FINANCE_APPROVE',
    'ANALYTICS_READ', 'ANALYTICS_EXPORT', 'ANALYTICS_ADVANCED',
    'PROJECTS_READ',
    'AI_READ',
    'CUSTOMERS_READ'
  ],
  
  [UserRole.DEPARTMENT_HEAD]: [
    'FINANCE_READ', 'FINANCE_WRITE',
    'ANALYTICS_READ', 'ANALYTICS_WRITE',
    'PROJECTS_READ', 'PROJECTS_WRITE', 'PROJECTS_MANAGE',
    'AI_READ', 'AI_WRITE',
    'CUSTOMERS_READ', 'CUSTOMERS_WRITE'
  ],
  
  [UserRole.PROJECT_MANAGER]: [
    'FINANCE_READ',
    'ANALYTICS_READ', 'ANALYTICS_WRITE',
    'PROJECTS_READ', 'PROJECTS_WRITE', 'PROJECTS_MANAGE',
    'AI_READ', 'AI_WRITE',
    'CUSTOMERS_READ'
  ],
  
  [UserRole.SENIOR_EMPLOYEE]: [
    'FINANCE_READ',
    'ANALYTICS_READ',
    'PROJECTS_READ', 'PROJECTS_WRITE',
    'AI_READ',
    'CUSTOMERS_READ', 'CUSTOMERS_WRITE'
  ],
  
  [UserRole.EMPLOYEE]: [
    'ANALYTICS_READ',
    'PROJECTS_READ', 'PROJECTS_WRITE',
    'AI_READ',
    'CUSTOMERS_READ'
  ],
  
  [UserRole.CUSTOMER_ADMIN]: [
    'ANALYTICS_READ',
    'PROJECTS_READ',
    'AI_READ'
  ],
  
  [UserRole.CUSTOMER_USER]: [
    'ANALYTICS_READ',
    'PROJECTS_READ'
  ],
  
  [UserRole.SUPPLIER_ADMIN]: [
    'PROJECTS_READ',
    'CUSTOMERS_READ'
  ],
  
  [UserRole.SUPPLIER_USER]: [
    'PROJECTS_READ'
  ]
};

// =============================================================================
// SEEDING FUNCTIONS
// =============================================================================

async function seedTenants() {
  console.log('🏢 Seeding Tenants...');
  
  const tenantMap = new Map();
  
  // First pass: Create all tenants without parent relationships
  for (const tenantData of TENANTS_DATA) {
    const { parentSlug, isParent, ...createData } = tenantData;
    
    const tenant = await prisma.tenant.upsert({
      where: { slug: createData.slug },
      update: createData,
      create: createData,
    });
    
    tenantMap.set(tenant.slug, tenant);
    console.log(`  ✅ Created tenant: ${tenant.name}`);
  }
  
  // Second pass: Update parent relationships
  for (const tenantData of TENANTS_DATA) {
    if (tenantData.parentSlug) {
      const parentTenant = tenantMap.get(tenantData.parentSlug);
      const childTenant = tenantMap.get(tenantData.slug);
      
      if (parentTenant && childTenant) {
        await prisma.tenant.update({
          where: { id: childTenant.id },
          data: { parentTenantId: parentTenant.id }
        });
        console.log(`  🔗 Linked ${childTenant.name} → ${parentTenant.name}`);
      }
    }
  }
  
  console.log(`✅ Seeded ${TENANTS_DATA.length} tenants\n`);
  return tenantMap;
}

async function seedPermissions() {
  console.log('🔐 Seeding Permissions...');
  
  const permissionMap = new Map();
  
  for (const permData of CORE_PERMISSIONS) {
    // Try to find existing permission first
    let permission = await prisma.permission.findFirst({
      where: {
        module: permData.module,
        action: permData.action,
        resource: permData.resource
      }
    });
    
    if (!permission) {
      // Create new permission if it doesn't exist
      permission = await prisma.permission.create({
        data: { ...permData, isSystem: true }
      });
      console.log(`  ✅ Created permission: ${permission.name}`);
    } else {
      // Update existing permission
      permission = await prisma.permission.update({
        where: { id: permission.id },
        data: permData
      });
      console.log(`  ✅ Updated permission: ${permission.name}`);
    }
    
    permissionMap.set(permission.name, permission);
  }
  
  console.log(`✅ Seeded ${CORE_PERMISSIONS.length} permissions\n`);
  return permissionMap;
}

async function seedRolePermissions(permissionMap: Map<string, any>) {
  console.log('👤 Seeding Role Permissions...');
  
  for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    if (permissions === 'ALL') {
      // Super admins get all permissions
      for (const permission of permissionMap.values()) {
        await prisma.rolePermission.upsert({
          where: {
            role_permissionId: {
              role: role as UserRole,
              permissionId: permission.id
            }
          },
          update: { isDefault: true },
          create: {
            role: role as UserRole,
            permissionId: permission.id,
            isDefault: true
          }
        });
      }
      console.log(`  ✅ Granted ALL permissions to ${role}`);
    } else {
      // Regular roles get specific permissions
      for (const permName of permissions as string[]) {
        const permission = permissionMap.get(permName);
        if (permission) {
          await prisma.rolePermission.upsert({
            where: {
              role_permissionId: {
                role: role as UserRole,
                permissionId: permission.id
              }
            },
            update: { isDefault: true },
            create: {
              role: role as UserRole,
              permissionId: permission.id,
              isDefault: true
            }
          });
        }
      }
      console.log(`  ✅ Granted ${(permissions as string[]).length} permissions to ${role}`);
    }
  }
  
  console.log(`✅ Seeded role permissions\n`);
}

async function seedDemoUsers(tenantMap: Map<string, any>) {
  console.log('👥 Seeding Demo Users...');
  
  for (const userData of DEMO_USERS_DATA) {
    const { password, tenants, isPrimaryTenant, description, ...userCreateData } = userData;
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create or update user
    const user = await prisma.user.upsert({
      where: { email: userCreateData.email },
      update: {
        ...userCreateData,
        password: hashedPassword,
      },
      create: {
        ...userCreateData,
        password: hashedPassword,
      },
    });
    
    console.log(`  ✅ Created user: ${user.name} (${user.email})`);
    
    // Create tenant relationships
    for (const tenantSlug of tenants) {
      const tenant = tenantMap.get(tenantSlug);
      if (tenant) {
        await prisma.userTenant.upsert({
          where: {
            userId_tenantId: {
              userId: user.id,
              tenantId: tenant.id
            }
          },
          update: {
            role: userData.role,
            isActive: true,
            isPrimary: tenantSlug === isPrimaryTenant
          },
          create: {
            userId: user.id,
            tenantId: tenant.id,
            role: userData.role,
            isActive: true,
            isPrimary: tenantSlug === isPrimaryTenant
          }
        });
        
        console.log(`    🔗 Added to tenant: ${tenant.name} (${userData.role})`);
      }
    }
    
    console.log('');
  }
  
  console.log(`✅ Seeded ${DEMO_USERS_DATA.length} demo users\n`);
}

async function seedTenantSettings(tenantMap: Map<string, any>) {
  console.log('⚙️ Seeding Tenant Settings...');
  
  for (const tenant of tenantMap.values()) {
    // Branding settings
    await prisma.tenantSetting.upsert({
      where: {
        tenantId_category_key: {
          tenantId: tenant.id,
          category: 'BRANDING',
          key: 'PRIMARY_COLOR'
        }
      },
      update: { value: tenant.primaryColor },
      create: {
        tenantId: tenant.id,
        category: 'BRANDING',
        key: 'PRIMARY_COLOR',
        value: tenant.primaryColor,
        dataType: 'STRING'
      }
    });
    
    // Feature settings
    await prisma.tenantSetting.upsert({
      where: {
        tenantId_category_key: {
          tenantId: tenant.id,
          category: 'FEATURES',
          key: 'FINANCE_MODULE'
        }
      },
      update: { value: 'true' },
      create: {
        tenantId: tenant.id,
        category: 'FEATURES',
        key: 'FINANCE_MODULE',
        value: 'true',
        dataType: 'BOOLEAN'
      }
    });
    
    await prisma.tenantSetting.upsert({
      where: {
        tenantId_category_key: {
          tenantId: tenant.id,
          category: 'FEATURES',
          key: 'ANALYTICS_MODULE'
        }
      },
      update: { value: 'true' },
      create: {
        tenantId: tenant.id,
        category: 'FEATURES',
        key: 'ANALYTICS_MODULE',
        value: 'true',
        dataType: 'BOOLEAN'
      }
    });
    
    console.log(`  ✅ Settings for: ${tenant.name}`);
  }
  
  console.log('✅ Seeded tenant settings\n');
}

// =============================================================================
// MAIN SEEDING FUNCTION
// =============================================================================

export async function seedMultiTenant() {
  try {
    console.log('🚀 Starting Multi-Tenant Seeding Process...\n');
    
    const tenantMap = await seedTenants();
    const permissionMap = await seedPermissions();
    await seedRolePermissions(permissionMap);
    await seedDemoUsers(tenantMap);
    await seedTenantSettings(tenantMap);
    
    console.log('🎉 Multi-Tenant Seeding Completed Successfully!\n');
    
    // Print summary
    const stats = await prisma.$transaction([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.userTenant.count(),
      prisma.permission.count(),
      prisma.rolePermission.count()
    ]);
    
    console.log('📊 SEEDING SUMMARY:');
    console.log(`   • Tenants: ${stats[0]}`);
    console.log(`   • Users: ${stats[1]}`);
    console.log(`   • User-Tenant Relations: ${stats[2]}`);
    console.log(`   • Permissions: ${stats[3]}`);
    console.log(`   • Role Permissions: ${stats[4]}`);
    console.log('');
    
  } catch (error) {
    console.error('❌ Error during multi-tenant seeding:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedMultiTenant()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

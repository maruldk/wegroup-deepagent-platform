
import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name?: string | null;
    role: string;
    image?: string | null;
    // Multi-tenant properties
    tenantId?: string | null;
    tenantName?: string | null;
    tenantSlug?: string | null;
    currentRole?: string | null;
    isPrimaryTenant?: boolean;
    totalTenants?: number;
    hasMultipleTenants?: boolean;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role: string;
      image?: string | null;
      // Multi-tenant properties
      tenantId?: string | null;
      tenantName?: string | null;
      tenantSlug?: string | null;
      currentRole?: string | null;
      isPrimaryTenant?: boolean;
      totalTenants?: number;
      hasMultipleTenants?: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    tenantId?: string | null;
    tenantName?: string | null;
    tenantSlug?: string | null;
    currentRole?: string | null;
    isPrimaryTenant?: boolean;
    totalTenants?: number;
    hasMultipleTenants?: boolean;
    image?: string | null;
  }
}

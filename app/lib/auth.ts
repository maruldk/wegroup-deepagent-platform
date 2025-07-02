
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            tenant: true, // Legacy tenant relationship
            userTenants: {
              where: { isActive: true },
              include: {
                tenant: true
              },
              orderBy: [
                { isPrimary: 'desc' },
                { joinedAt: 'desc' }
              ]
            }
          },
        });

        if (!user || !user.password || !user.isActive) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isPasswordValid) {
          return null;
        }

        // Get primary tenant or first available tenant
        const primaryUserTenant = user.userTenants.find(ut => ut.isPrimary) || user.userTenants[0];
        const legacyTenant = user.tenant; // Fallback to legacy tenant

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.image,
          // Multi-tenant info
          tenantId: primaryUserTenant?.tenantId || user.tenantId,
          tenantName: primaryUserTenant?.tenant.name || legacyTenant?.name,
          tenantSlug: primaryUserTenant?.tenant.slug || legacyTenant?.slug,
          currentRole: primaryUserTenant?.role || user.role,
          isPrimaryTenant: primaryUserTenant?.isPrimary || false,
          // Additional tenant info
          totalTenants: user.userTenants.length,
          hasMultipleTenants: user.userTenants.length > 1
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // Store all multi-tenant info in token
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantName = user.tenantName;
        token.tenantSlug = user.tenantSlug;
        token.currentRole = user.currentRole;
        token.isPrimaryTenant = user.isPrimaryTenant;
        token.totalTenants = user.totalTenants;
        token.hasMultipleTenants = user.hasMultipleTenants;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && token.sub) {
        session.user = {
          ...session.user,
          id: token.sub,
          role: token.role as any,
          tenantId: token.tenantId as string | null,
          tenantName: token.tenantName as string | null,
          tenantSlug: token.tenantSlug as string | null,
          currentRole: token.currentRole as string | null,
          isPrimaryTenant: token.isPrimaryTenant as boolean,
          totalTenants: token.totalTenants as number,
          hasMultipleTenants: token.hasMultipleTenants as boolean,
          image: token.image as string | null,
        } as any;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // If url starts with baseUrl, it's a relative URL
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // If it's a callback URL with dashboard, redirect there
      if (url.includes('/dashboard')) {
        return `${baseUrl}/dashboard`;
      }
      // Default redirect to dashboard after sign in
      return `${baseUrl}/dashboard`;
    },
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.callback-url' : 'next-auth.callback-url',
      options: {
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production' ? '__Host-next-auth.csrf-token' : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  },
};

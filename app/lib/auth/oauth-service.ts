
/**
 * HYBRID SPRINT 2.1: OAuth Provider Service
 * Handles OAuth authentication for Google, Microsoft, GitHub
 */

import { PrismaClient } from '@prisma/client';
import { OAuthProviderConfig, SecurityAction } from '@/lib/types';
import { securityAuditService } from './security-audit-service';

const prisma = new PrismaClient();

export interface OAuthConfiguration {
  google: {
    clientId: string;
    clientSecret: string;
    scopes: string[];
  };
  microsoft: {
    clientId: string;
    clientSecret: string;
    scopes: string[];
  };
  github: {
    clientId: string;
    clientSecret: string;
    scopes: string[];
  };
}

export class OAuthService {
  private static instance: OAuthService;
  private providers: Map<string, OAuthProviderConfig> = new Map();

  private constructor() {}

  public static getInstance(): OAuthService {
    if (!OAuthService.instance) {
      OAuthService.instance = new OAuthService();
    }
    return OAuthService.instance;
  }

  /**
   * Initialize OAuth providers for a tenant
   */
  async initializeProviders(tenantId?: string): Promise<void> {
    try {
      const providers = await prisma.oAuthProvider.findMany({
        where: {
          tenantId,
          isActive: true
        }
      });

      providers.forEach(provider => {
        this.providers.set(`${provider.name}_${tenantId || 'global'}`, {
          id: provider.id,
          name: provider.name,
          clientId: provider.clientId,
          clientSecret: provider.clientSecret,
          scopes: provider.scopes,
          isActive: provider.isActive,
          tenantId: provider.tenantId,
          metadata: provider.metadata,
          createdAt: provider.createdAt,
          updatedAt: provider.updatedAt
        });
      });
    } catch (error) {
      console.error('Failed to initialize OAuth providers:', error);
      throw error;
    }
  }

  /**
   * Create or update OAuth provider configuration
   */
  async configureProvider(
    config: Omit<OAuthProviderConfig, 'id' | 'createdAt' | 'updatedAt'>,
    userId?: string
  ): Promise<OAuthProviderConfig> {
    try {
      const provider = await prisma.oAuthProvider.upsert({
        where: {
          name_tenantId: {
            name: config.name,
            tenantId: config.tenantId as string
          }
        },
        create: {
          name: config.name,
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          scopes: config.scopes,
          isActive: config.isActive,
          tenantId: config.tenantId,
          metadata: config.metadata
        },
        update: {
          clientId: config.clientId,
          clientSecret: config.clientSecret,
          scopes: config.scopes,
          isActive: config.isActive,
          metadata: config.metadata
        }
      });

      // Log security event
      if (userId) {
        await securityAuditService.logAction({
          userId,
          action: SecurityAction.OAUTH_LOGIN,
          resource: 'oauth_provider',
          resourceId: provider.id,
          details: { provider: config.name, configured: true },
          tenantId: config.tenantId || undefined
        });
      }

      return {
        id: provider.id,
        name: provider.name,
        clientId: provider.clientId,
        clientSecret: provider.clientSecret,
        scopes: provider.scopes,
        isActive: provider.isActive,
        tenantId: provider.tenantId,
        metadata: provider.metadata,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt
      };
    } catch (error) {
      console.error('Failed to configure OAuth provider:', error);
      throw error;
    }
  }

  /**
   * Get OAuth provider configuration
   */
  async getProvider(name: string, tenantId?: string): Promise<OAuthProviderConfig | null> {
    try {
      const provider = await prisma.oAuthProvider.findUnique({
        where: {
          name_tenantId: {
            name,
            tenantId: tenantId as string
          }
        }
      });

      if (!provider) return null;

      return {
        id: provider.id,
        name: provider.name,
        clientId: provider.clientId,
        clientSecret: provider.clientSecret,
        scopes: provider.scopes,
        isActive: provider.isActive,
        tenantId: provider.tenantId,
        metadata: provider.metadata,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt
      };
    } catch (error) {
      console.error('Failed to get OAuth provider:', error);
      return null;
    }
  }

  /**
   * List all OAuth providers
   */
  async listProviders(tenantId?: string): Promise<OAuthProviderConfig[]> {
    try {
      const providers = await prisma.oAuthProvider.findMany({
        where: {
          tenantId,
          isActive: true
        },
        orderBy: {
          name: 'asc'
        }
      });

      return providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        clientId: provider.clientId,
        clientSecret: provider.clientSecret,
        scopes: provider.scopes,
        isActive: provider.isActive,
        tenantId: provider.tenantId,
        metadata: provider.metadata,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt
      }));
    } catch (error) {
      console.error('Failed to list OAuth providers:', error);
      return [];
    }
  }

  /**
   * Generate OAuth authorization URL
   */
  generateAuthUrl(
    provider: string, 
    redirectUri: string, 
    state: string,
    tenantId?: string
  ): string | null {
    const providerConfig = this.providers.get(`${provider}_${tenantId || 'global'}`);
    if (!providerConfig) return null;

    const baseUrls = {
      google: 'https://accounts.google.com/o/oauth2/auth',
      microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      github: 'https://github.com/login/oauth/authorize'
    };

    const baseUrl = baseUrls[provider as keyof typeof baseUrls];
    if (!baseUrl) return null;

    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: redirectUri,
      scope: providerConfig.scopes.join(' '),
      state,
      response_type: 'code'
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    provider: string,
    code: string,
    redirectUri: string,
    tenantId?: string
  ): Promise<{
    accessToken: string;
    refreshToken?: string;
    expiresIn?: number;
    tokenType: string;
  } | null> {
    const providerConfig = this.providers.get(`${provider}_${tenantId || 'global'}`);
    if (!providerConfig) return null;

    const tokenUrls = {
      google: 'https://oauth2.googleapis.com/token',
      microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      github: 'https://github.com/login/oauth/access_token'
    };

    const tokenUrl = tokenUrls[provider as keyof typeof tokenUrls];
    if (!tokenUrl) return null;

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          client_id: providerConfig.clientId,
          client_secret: providerConfig.clientSecret,
          code,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code'
        })
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
        tokenType: data.token_type || 'Bearer'
      };
    } catch (error) {
      console.error(`Failed to exchange code for token (${provider}):`, error);
      return null;
    }
  }

  /**
   * Get user profile from OAuth provider
   */
  async getUserProfile(
    provider: string,
    accessToken: string
  ): Promise<{
    id: string;
    email: string;
    name: string;
    picture?: string;
  } | null> {
    const profileUrls = {
      google: 'https://www.googleapis.com/oauth2/v2/userinfo',
      microsoft: 'https://graph.microsoft.com/v1.0/me',
      github: 'https://api.github.com/user'
    };

    const profileUrl = profileUrls[provider as keyof typeof profileUrls];
    if (!profileUrl) return null;

    try {
      const response = await fetch(profileUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Profile fetch failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Normalize profile data across providers
      switch (provider) {
        case 'google':
          return {
            id: data.id,
            email: data.email,
            name: data.name,
            picture: data.picture
          };
        case 'microsoft':
          return {
            id: data.id,
            email: data.mail || data.userPrincipalName,
            name: data.displayName,
            picture: data.photo?.['@odata.mediaReadLink']
          };
        case 'github':
          return {
            id: data.id.toString(),
            email: data.email,
            name: data.name || data.login,
            picture: data.avatar_url
          };
        default:
          return null;
      }
    } catch (error) {
      console.error(`Failed to get user profile (${provider}):`, error);
      return null;
    }
  }

  /**
   * Disable OAuth provider
   */
  async disableProvider(providerId: string, userId?: string): Promise<boolean> {
    try {
      const provider = await prisma.oAuthProvider.update({
        where: { id: providerId },
        data: { isActive: false }
      });

      // Log security event
      if (userId) {
        await securityAuditService.logAction({
          userId,
          action: SecurityAction.ADMIN_ACTION,
          resource: 'oauth_provider',
          resourceId: provider.id,
          details: { provider: provider.name, disabled: true },
          tenantId: provider.tenantId || undefined
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to disable OAuth provider:', error);
      return false;
    }
  }
}

export const oauthService = OAuthService.getInstance();

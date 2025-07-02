
/**
 * HYBRID SPRINT 2.1: OAuth Configuration API
 * Configure OAuth providers for authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { oauthService } from '@/lib/auth/oauth-service';
import { securityAuditService } from '@/lib/auth/security-audit-service';
import { SecurityAction } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, clientId, clientSecret, scopes, isActive, tenantId, metadata } = body;

    // Validate required fields
    if (!name || !clientId || !clientSecret || !scopes) {
      return NextResponse.json(
        { error: 'Missing required fields: name, clientId, clientSecret, scopes' },
        { status: 400 }
      );
    }

    // Validate provider name
    const validProviders = ['google', 'microsoft', 'github'];
    if (!validProviders.includes(name.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid provider. Supported: google, microsoft, github' },
        { status: 400 }
      );
    }

    const config = await oauthService.configureProvider(
      {
        name: name.toLowerCase(),
        clientId,
        clientSecret,
        scopes: Array.isArray(scopes) ? scopes : [scopes],
        isActive: isActive !== false,
        tenantId,
        metadata
      },
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        name: config.name,
        clientId: config.clientId,
        // Don't return client secret in response
        scopes: config.scopes,
        isActive: config.isActive,
        tenantId: config.tenantId,
        metadata: config.metadata,
        createdAt: config.createdAt,
        updatedAt: config.updatedAt
      }
    });
  } catch (error) {
    console.error('OAuth configuration error:', error);
    return NextResponse.json(
      { error: 'Failed to configure OAuth provider' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    const providers = await oauthService.listProviders(tenantId || undefined);

    return NextResponse.json({
      success: true,
      data: providers.map(provider => ({
        id: provider.id,
        name: provider.name,
        clientId: provider.clientId,
        // Don't return client secret in response
        scopes: provider.scopes,
        isActive: provider.isActive,
        tenantId: provider.tenantId,
        metadata: provider.metadata,
        createdAt: provider.createdAt,
        updatedAt: provider.updatedAt
      }))
    });
  } catch (error) {
    console.error('OAuth providers list error:', error);
    return NextResponse.json(
      { error: 'Failed to get OAuth providers' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { multiTenantService } from '@/lib/services/multi-tenant-service';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tenantId } = await request.json();
    
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID is required' }, { status: 400 });
    }

    // Check if user has access to this tenant
    const canAccess = await multiTenantService.canUserAccessTenant(session.user.id, tenantId);
    
    if (!canAccess) {
      return NextResponse.json({ error: 'Access denied to this tenant' }, { status: 403 });
    }

    // Set this tenant as primary for the user
    await multiTenantService.setPrimaryTenant(session.user.id, tenantId);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error switching tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

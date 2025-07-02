
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { multiTenantService } from '@/lib/services/multi-tenant-service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userTenants = await multiTenantService.getUserTenants(session.user.id);
    
    return NextResponse.json({
      userTenants,
      currentTenant: userTenants.find(ut => ut.isPrimary) || userTenants[0] || null
    });
  } catch (error) {
    console.error('Error fetching user tenants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { permissionService } from '@/lib/services/permission-service';
import { multiTenantService } from '@/lib/services/multi-tenant-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManageUsers = await permissionService.canManageUsers(session.user.id);
    
    if (!canManageUsers) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Get all user-tenant roles for this user
    const userTenants = await multiTenantService.getUserTenants(params.id, true);

    return NextResponse.json({ userTenants });
  } catch (error) {
    console.error('Error fetching user roles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManageUsers = await permissionService.canManageUsers(session.user.id);
    
    if (!canManageUsers) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { tenantId, role } = await request.json();

    if (!tenantId || !role) {
      return NextResponse.json(
        { error: 'Mandant-ID und Rolle sind erforderlich' },
        { status: 400 }
      );
    }

    // Update user role in specific tenant
    const updatedUserTenant = await multiTenantService.updateUserTenantRole(
      params.id,
      tenantId,
      role
    );

    // Create audit log
    if (session.user.tenantId) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'USER_ROLE_UPDATED',
          resource: 'USER',
          resourceId: params.id,
          details: { tenantId, newRole: role },
          tenantId: session.user.tenantId
        }
      });
    }

    return NextResponse.json({
      userTenant: updatedUserTenant,
      message: 'Benutzerrolle erfolgreich aktualisiert'
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

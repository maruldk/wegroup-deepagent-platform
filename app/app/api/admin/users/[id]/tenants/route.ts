
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

    // Get all tenant associations for this user
    const userTenants = await multiTenantService.getUserTenants(params.id, true);

    return NextResponse.json({ userTenants });
  } catch (error) {
    console.error('Error fetching user tenants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
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

    const { tenantId, role = 'USER', isPrimary = false } = await request.json();

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Mandant-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Check if user is already assigned to this tenant
    const existingAssignment = await prisma.userTenant.findUnique({
      where: {
        userId_tenantId: {
          userId: params.id,
          tenantId
        }
      }
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Benutzer ist bereits diesem Mandanten zugeordnet' },
        { status: 409 }
      );
    }

    // Add user to tenant
    const userTenant = await multiTenantService.addUserToTenant(
      params.id,
      tenantId,
      role,
      isPrimary,
      session.user.id
    );

    // Create audit log
    if (session.user.tenantId) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'USER_TENANT_ASSIGNED',
          resource: 'USER',
          resourceId: params.id,
          details: { tenantId, role, isPrimary },
          tenantId: session.user.tenantId
        }
      });
    }

    return NextResponse.json({
      userTenant,
      message: 'Benutzer erfolgreich dem Mandanten zugeordnet'
    });

  } catch (error) {
    console.error('Error assigning user to tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Mandant-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Remove user from tenant
    const userTenant = await multiTenantService.removeUserFromTenant(params.id, tenantId);

    // Create audit log
    if (session.user.tenantId) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'USER_TENANT_REMOVED',
          resource: 'USER',
          resourceId: params.id,
          details: { tenantId },
          tenantId: session.user.tenantId
        }
      });
    }

    return NextResponse.json({
      userTenant,
      message: 'Benutzer erfolgreich vom Mandanten entfernt'
    });

  } catch (error) {
    console.error('Error removing user from tenant:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

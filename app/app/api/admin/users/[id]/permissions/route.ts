
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { permissionService } from '@/lib/services/permission-service';
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

    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');

    let permissions: any[] = [];

    if (tenantId) {
      // Get tenant-specific permissions
      permissions = await permissionService.getUserTenantPermissions(params.id, tenantId);
    } else {
      // Get global permissions
      permissions = await permissionService.getUserPermissions(params.id);
    }

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
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

    const { permissionId, tenantId, expiresAt } = await request.json();

    if (!permissionId) {
      return NextResponse.json(
        { error: 'Permission-ID ist erforderlich' },
        { status: 400 }
      );
    }

    let grantedPermission: any;

    if (tenantId) {
      // Grant tenant-specific permission
      grantedPermission = await permissionService.grantUserTenantPermission(
        params.id,
        tenantId,
        permissionId,
        session.user.id,
        expiresAt ? new Date(expiresAt) : undefined
      );
    } else {
      // Grant global permission
      grantedPermission = await permissionService.grantUserPermission(
        params.id,
        permissionId,
        session.user.id,
        expiresAt ? new Date(expiresAt) : undefined
      );
    }

    // Create audit log
    if (session.user.tenantId) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PERMISSION_GRANTED',
          resource: 'USER',
          resourceId: params.id,
          details: { permissionId, tenantId, expiresAt },
          tenantId: session.user.tenantId
        }
      });
    }

    return NextResponse.json({
      permission: grantedPermission,
      message: 'Berechtigung erfolgreich gewährt'
    });

  } catch (error) {
    console.error('Error granting permission:', error);
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
    const permissionId = searchParams.get('permissionId');

    if (!permissionId) {
      return NextResponse.json(
        { error: 'Permission-ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Revoke user permission
    const revokedPermission = await permissionService.revokeUserPermission(params.id, permissionId);

    // Create audit log
    if (session.user.tenantId) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PERMISSION_REVOKED',
          resource: 'USER',
          resourceId: params.id,
          details: { permissionId },
          tenantId: session.user.tenantId
        }
      });
    }

    return NextResponse.json({
      permission: revokedPermission,
      message: 'Berechtigung erfolgreich entzogen'
    });

  } catch (error) {
    console.error('Error revoking permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

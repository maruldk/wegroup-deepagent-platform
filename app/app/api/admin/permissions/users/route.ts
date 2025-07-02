
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { permissionService } from '@/lib/services/permission-service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManagePermissions = await permissionService.isSuperAdmin(session.user.id);
    
    if (!canManagePermissions) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const tenantId = searchParams.get('tenantId');
    const limit = parseInt(searchParams.get('limit') || '100');

    let userPermissions: any[] = [];

    if (userId && tenantId) {
      // Get tenant-specific permissions for user
      userPermissions = await permissionService.getUserTenantPermissions(userId, tenantId);
    } else if (userId) {
      // Get global permissions for user
      userPermissions = await permissionService.getUserPermissions(userId);
    } else {
      // Get all user permissions (global only)
      userPermissions = await prisma.userPermission.findMany({
        include: {
          permission: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: [
          { user: { name: 'asc' } },
          { permission: { module: 'asc' } },
          { permission: { action: 'asc' } }
        ],
        take: limit
      });
    }

    return NextResponse.json({ userPermissions });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManagePermissions = await permissionService.isSuperAdmin(session.user.id);
    
    if (!canManagePermissions) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { userId, permissionId, tenantId, expiresAt } = await request.json();

    if (!userId || !permissionId) {
      return NextResponse.json(
        { error: 'Benutzer-ID und Permission-ID sind erforderlich' },
        { status: 400 }
      );
    }

    let grantedPermission: any;

    if (tenantId) {
      // Grant tenant-specific permission
      grantedPermission = await permissionService.grantUserTenantPermission(
        userId,
        tenantId,
        permissionId,
        session.user.id,
        expiresAt ? new Date(expiresAt) : undefined
      );
    } else {
      // Grant global permission
      grantedPermission = await permissionService.grantUserPermission(
        userId,
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
          action: 'USER_PERMISSION_GRANTED',
          resource: 'USER_PERMISSION',
          resourceId: userId,
          details: { userId, permissionId, tenantId, expiresAt },
          tenantId: session.user.tenantId
        }
      });
    }

    return NextResponse.json({
      permission: grantedPermission,
      message: 'Berechtigung erfolgreich gewährt'
    });

  } catch (error) {
    console.error('Error granting user permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canManagePermissions = await permissionService.isSuperAdmin(session.user.id);
    
    if (!canManagePermissions) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const permissionId = searchParams.get('permissionId');

    if (!userId || !permissionId) {
      return NextResponse.json(
        { error: 'Benutzer-ID und Permission-ID sind erforderlich' },
        { status: 400 }
      );
    }

    // Revoke user permission
    const revokedPermission = await permissionService.revokeUserPermission(userId, permissionId);

    // Create audit log
    if (session.user.tenantId) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'USER_PERMISSION_REVOKED',
          resource: 'USER_PERMISSION',
          resourceId: userId,
          details: { userId, permissionId },
          tenantId: session.user.tenantId
        }
      });
    }

    return NextResponse.json({
      permission: revokedPermission,
      message: 'Berechtigung erfolgreich entzogen'
    });

  } catch (error) {
    console.error('Error revoking user permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

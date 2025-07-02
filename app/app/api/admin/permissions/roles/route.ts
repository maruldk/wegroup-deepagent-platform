
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
    const role = searchParams.get('role');

    let rolePermissions: any[] = [];

    if (role) {
      // Get permissions for specific role
      const permissions = await permissionService.getRolePermissions(role as any);
      rolePermissions = permissions.map(permission => ({
        role,
        permission
      }));
    } else {
      // Get all role permissions
      rolePermissions = await prisma.rolePermission.findMany({
        include: {
          permission: true
        },
        orderBy: [
          { role: 'asc' },
          { permission: { module: 'asc' } },
          { permission: { action: 'asc' } }
        ]
      });
    }

    return NextResponse.json({ rolePermissions });
  } catch (error) {
    console.error('Error fetching role permissions:', error);
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

    const { role, permissionId } = await request.json();

    if (!role || !permissionId) {
      return NextResponse.json(
        { error: 'Rolle und Permission-ID sind erforderlich' },
        { status: 400 }
      );
    }

    // Assign permission to role
    await permissionService.assignRolePermission(role, permissionId);

    // Create audit log
    if (session.user.tenantId) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ROLE_PERMISSION_ASSIGNED',
          resource: 'ROLE_PERMISSION',
          resourceId: permissionId,
          details: { role, permissionId },
          tenantId: session.user.tenantId
        }
      });
    }

    return NextResponse.json({
      message: 'Berechtigung erfolgreich der Rolle zugewiesen'
    });

  } catch (error) {
    console.error('Error assigning role permission:', error);
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

    const { role, permissionId } = await request.json();

    if (!role || !permissionId) {
      return NextResponse.json(
        { error: 'Rolle und Permission-ID sind erforderlich' },
        { status: 400 }
      );
    }

    // Remove permission from role
    await prisma.rolePermission.delete({
      where: {
        role_permissionId: {
          role,
          permissionId
        }
      }
    });

    // Create audit log
    if (session.user.tenantId) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'ROLE_PERMISSION_REMOVED',
          resource: 'ROLE_PERMISSION',
          resourceId: permissionId,
          details: { role, permissionId },
          tenantId: session.user.tenantId
        }
      });
    }

    return NextResponse.json({
      message: 'Berechtigung erfolgreich von der Rolle entfernt'
    });

  } catch (error) {
    console.error('Error removing role permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

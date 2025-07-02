
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

    // Check if user has admin permissions
    const canManagePermissions = await permissionService.isSuperAdmin(session.user.id);
    
    if (!canManagePermissions) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const module = searchParams.get('module');
    const action = searchParams.get('action');

    let permissions: any[] = [];

    if (module) {
      permissions = await permissionService.getPermissionsByModule(module);
    } else {
      permissions = await permissionService.getAllPermissions();
    }

    // Additional filtering
    if (action) {
      permissions = permissions.filter(p => p.action === action);
    }

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error('Error fetching permissions:', error);
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

    const { name, description, module, action, resource } = await request.json();

    if (!name || !module || !action) {
      return NextResponse.json(
        { error: 'Name, Modul und Aktion sind erforderlich' },
        { status: 400 }
      );
    }

    // Check if permission already exists
    const existing = await prisma.permission.findUnique({
      where: {
        module_action_resource: {
          module,
          action,
          resource: resource || null
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Berechtigung existiert bereits' },
        { status: 409 }
      );
    }

    const permission = await permissionService.createPermission({
      name,
      description,
      module,
      action,
      resource,
      isSystem: false
    });

    // Create audit log
    if (session.user.tenantId) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'PERMISSION_CREATED',
          resource: 'PERMISSION',
          resourceId: permission.id,
          details: { name, module, action, resource },
          tenantId: session.user.tenantId
        }
      });
    }

    return NextResponse.json({
      permission,
      message: 'Berechtigung erfolgreich erstellt'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

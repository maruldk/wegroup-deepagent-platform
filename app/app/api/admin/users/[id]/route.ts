
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';
import { permissionService } from '@/lib/services/permission-service';

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

    // Get user with all tenant relationships
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userTenants: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true
              }
            },
            permissions: {
              include: {
                permission: true
              }
            }
          }
        },
        userPermissions: {
          include: {
            permission: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
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

    const { name, email, isActive } = await request.json();

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Check if email is already taken by another user
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'E-Mail-Adresse wird bereits verwendet' },
          { status: 409 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        userTenants: {
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      },
    });

    // Create audit log
    if (session.user.tenantId) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'USER_UPDATED',
          resource: 'USER',
          resourceId: params.id,
          details: { name, email, isActive },
          tenantId: session.user.tenantId,
        },
      });
    }

    return NextResponse.json({
      user: updatedUser,
      message: 'Benutzer erfolgreich aktualisiert'
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
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

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        userTenants: true
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }

    // Prevent deleting self
    if (params.id === session.user.id) {
      return NextResponse.json(
        { error: 'Sie können sich nicht selbst löschen' },
        { status: 400 }
      );
    }

    // Instead of hard delete, we'll deactivate the user
    const deletedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        isActive: false,
        email: `deleted_${Date.now()}_${existingUser.email}` // Make email unique for future reuse
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true
      }
    });

    // Deactivate all user-tenant relationships
    await prisma.userTenant.updateMany({
      where: { userId: params.id },
      data: {
        isActive: false,
        leftAt: new Date()
      }
    });

    // Create audit log
    if (session.user.tenantId) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'USER_DELETED',
          resource: 'USER',
          resourceId: params.id,
          details: { originalEmail: existingUser.email },
          tenantId: session.user.tenantId,
        },
      });
    }

    return NextResponse.json({
      user: deletedUser,
      message: 'Benutzer erfolgreich deaktiviert'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

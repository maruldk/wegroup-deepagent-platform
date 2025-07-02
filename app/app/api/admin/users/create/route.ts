
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { permissionService } from '@/lib/services/permission-service';
import { multiTenantService } from '@/lib/services/multi-tenant-service';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin permissions
    const canManageUsers = await permissionService.canManageUsers(session.user.id);
    
    if (!canManageUsers) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { 
      name, 
      email, 
      password, 
      role = 'USER',
      tenantId,
      isActive = true,
      isPrimary = false
    } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, Email und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Mandant ist erforderlich' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits' },
        { status: 409 }
      );
    }

    // Verify tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Mandant nicht gefunden' },
        { status: 404 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isActive
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Add user to tenant
    const userTenant = await multiTenantService.addUserToTenant(
      newUser.id,
      tenantId,
      role,
      isPrimary,
      session.user.id
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'USER_CREATED',
        resource: 'USER',
        resourceId: newUser.id,
        details: { 
          email: newUser.email,
          name: newUser.name,
          role,
          tenantId 
        },
        tenantId: session.user.tenantId || tenantId
      }
    });

    return NextResponse.json({
      user: newUser,
      userTenant,
      message: 'Benutzer erfolgreich erstellt'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

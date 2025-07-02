
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role = 'USER' } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Alle Felder sind erforderlich' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Benutzer mit dieser E-Mail existiert bereits' },
        { status: 400 }
      );
    }

    // Get default tenant
    const defaultTenant = await prisma.tenant.findFirst({
      where: { slug: 'wegroup' },
    });

    if (!defaultTenant) {
      return NextResponse.json(
        { error: 'Standard-Mandant nicht gefunden' },
        { status: 500 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as UserRole,
        tenantId: defaultTenant.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_CREATED',
        resource: 'USER',
        resourceId: user.id,
        details: { email: user.email, role: user.role },
        tenantId: defaultTenant.id,
      },
    });

    return NextResponse.json({
      message: 'Benutzer erfolgreich erstellt',
      user,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}


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
    const canManageUsers = await permissionService.canManageUsers(session.user.id);
    
    if (!canManageUsers) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Fetch all user-tenant relationships with user and tenant info
    const users = await prisma.userTenant.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            isActive: true,
            createdAt: true,
          }
        },
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          }
        }
      },
      orderBy: [
        { user: { name: 'asc' } },
        { tenant: { name: 'asc' } }
      ]
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

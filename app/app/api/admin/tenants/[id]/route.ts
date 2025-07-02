
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

    const canManageTenants = await permissionService.canManageTenants(session.user.id);
    
    if (!canManageTenants) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        parentTenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        childTenants: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        userTenants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true
              }
            }
          }
        },
        _count: {
          select: {
            users: true,
            customers: true,
            leads: true,
            projects: true
          }
        }
      }
    });

    if (!tenant) {
      return NextResponse.json(
        { error: 'Mandant nicht gefunden' },
        { status: 404 }
      );
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    console.error('Get tenant error:', error);
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

    const canManageTenants = await permissionService.canManageTenants(session.user.id);
    
    if (!canManageTenants) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { 
      name, 
      slug, 
      description, 
      businessType, 
      logo, 
      primaryColor, 
      website, 
      isActive 
    } = await request.json();

    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: params.id }
    });

    if (!existingTenant) {
      return NextResponse.json(
        { error: 'Mandant nicht gefunden' },
        { status: 404 }
      );
    }

    // Check if slug is already taken by another tenant
    if (slug && slug !== existingTenant.slug) {
      const slugExists = await prisma.tenant.findUnique({
        where: { slug }
      });

      if (slugExists) {
        return NextResponse.json(
          { error: 'Slug wird bereits verwendet' },
          { status: 409 }
        );
      }
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(slug && { slug: slug.toLowerCase() }),
        ...(description !== undefined && { description }),
        ...(businessType && { businessType }),
        ...(logo && { logo }),
        ...(primaryColor && { primaryColor }),
        ...(website && { website }),
        ...(typeof isActive === 'boolean' && { isActive })
      },
      include: {
        parentTenant: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        childTenants: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            users: true,
            customers: true,
            leads: true,
            projects: true
          }
        }
      }
    });

    // Create audit log
    if (session.user.tenantId) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: 'TENANT_UPDATED',
          resource: 'TENANT',
          resourceId: params.id,
          details: { name, slug, description, businessType, isActive },
          tenantId: session.user.tenantId
        }
      });
    }

    return NextResponse.json({
      tenant: updatedTenant,
      message: 'Mandant erfolgreich aktualisiert'
    });
  } catch (error) {
    console.error('Update tenant error:', error);
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

    const canManageTenants = await permissionService.canManageTenants(session.user.id);
    
    if (!canManageTenants) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Check if tenant exists
    const existingTenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        userTenants: true,
        childTenants: true
      }
    });

    if (!existingTenant) {
      return NextResponse.json(
        { error: 'Mandant nicht gefunden' },
        { status: 404 }
      );
    }

    // Check if tenant has child tenants
    if (existingTenant.childTenants.length > 0) {
      return NextResponse.json(
        { error: 'Mandant kann nicht gelöscht werden, da Unter-Mandanten existieren' },
        { status: 400 }
      );
    }

    // Instead of hard delete, deactivate the tenant
    const deletedTenant = await prisma.tenant.update({
      where: { id: params.id },
      data: {
        isActive: false,
        slug: `deleted_${Date.now()}_${existingTenant.slug}` // Make slug unique for future reuse
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true
      }
    });

    // Deactivate all user-tenant relationships
    await prisma.userTenant.updateMany({
      where: { tenantId: params.id },
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
          action: 'TENANT_DELETED',
          resource: 'TENANT',
          resourceId: params.id,
          details: { originalSlug: existingTenant.slug },
          tenantId: session.user.tenantId
        }
      });
    }

    return NextResponse.json({
      tenant: deletedTenant,
      message: 'Mandant erfolgreich deaktiviert'
    });
  } catch (error) {
    console.error('Delete tenant error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

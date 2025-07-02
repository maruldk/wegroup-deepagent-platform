
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || 'all';
    const type = searchParams.get('type') || 'all';
    const isPublic = searchParams.get('isPublic') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const skip = (page - 1) * limit;

    const where: any = {
      isActive: true,
    };

    // Show tenant templates + public templates from other tenants
    if (isPublic) {
      where.OR = [
        { tenantId: session.user.tenantId },
        { isPublic: true }
      ];
    } else {
      where.tenantId = session.user.tenantId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    if (category !== 'all') {
      where.category = category;
    }

    if (type !== 'all') {
      where.type = type;
    }

    const [templates, total] = await Promise.all([
      prisma.contentTemplate.findMany({
        where,
        orderBy: [
          { downloads: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit,
        include: {
          creator: {
            select: { name: true, email: true },
          },
          _count: {
            select: { projects: true }
          }
        },
      }),
      prisma.contentTemplate.count({ where }),
    ]);

    return NextResponse.json({
      templates,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      name,
      category,
      type,
      content,
      metadata,
      thumbnailUrl,
      tags = [],
      isPublic = false
    } = data;

    if (!name || !category || !type || !content) {
      return NextResponse.json(
        { error: 'Name, Kategorie, Typ und Content sind erforderlich' },
        { status: 400 }
      );
    }

    const template = await prisma.contentTemplate.create({
      data: {
        name,
        category,
        type,
        content,
        metadata,
        thumbnailUrl,
        tags,
        isPublic,
        tenantId: session.user.tenantId,
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: { name: true, email: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CONTENT_TEMPLATE_CREATED',
        resource: 'CONTENT_TEMPLATE',
        resourceId: template.id,
        details: { name: template.name, category: template.category },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Create template error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

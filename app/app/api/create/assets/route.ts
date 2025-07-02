
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
    const projectId = searchParams.get('projectId');
    const type = searchParams.get('type') || 'all';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: session.user.tenantId,
    };

    if (projectId) {
      where.projectId = projectId;
    }

    if (type !== 'all') {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { fileName: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.contentAsset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          project: {
            select: { title: true, category: true },
          },
        },
      }),
      prisma.contentAsset.count({ where }),
    ]);

    return NextResponse.json({
      assets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get assets error:', error);
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
      projectId,
      name,
      fileName,
      type,
      url,
      size,
      mimeType,
      dimensions,
      duration,
      metadata = {},
      tags = [],
      aiGenerated = false,
      aiPrompt,
      isPublic = false
    } = data;

    if (!projectId || !name || !fileName || !type || !url) {
      return NextResponse.json(
        { error: 'ProjectId, Name, FileName, Type und URL sind erforderlich' },
        { status: 400 }
      );
    }

    // Verify project access
    const project = await prisma.contentProject.findFirst({
      where: {
        id: projectId,
        tenantId: session.user.tenantId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projekt nicht gefunden' }, { status: 404 });
    }

    const asset = await prisma.contentAsset.create({
      data: {
        projectId,
        name,
        fileName,
        type,
        url,
        size,
        mimeType,
        dimensions,
        duration,
        metadata,
        tags,
        aiGenerated,
        aiPrompt,
        isPublic,
        tenantId: session.user.tenantId,
      },
      include: {
        project: {
          select: { title: true, category: true },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CONTENT_ASSET_CREATED',
        resource: 'CONTENT_ASSET',
        resourceId: asset.id,
        details: { name: asset.name, type: asset.type, projectId },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(asset, { status: 201 });
  } catch (error) {
    console.error('Create asset error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

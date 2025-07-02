
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
    const status = searchParams.get('status') || 'all';
    const createdBy = searchParams.get('createdBy') || 'all';
    const assignedTo = searchParams.get('assignedTo') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId: session.user.tenantId,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    if (category !== 'all') {
      where.category = category;
    }

    if (status !== 'all') {
      where.status = status;
    }

    if (createdBy !== 'all') {
      where.createdBy = createdBy;
    }

    if (assignedTo !== 'all') {
      where.assignedTo = assignedTo;
    }

    const [projects, total] = await Promise.all([
      prisma.contentProject.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          creator: {
            select: { name: true, email: true },
          },
          assignee: {
            select: { name: true, email: true },
          },
          template: {
            select: { name: true, category: true },
          },
          _count: {
            select: { 
              assets: true,
              versions: true
            },
          },
        },
      }),
      prisma.contentProject.count({ where }),
    ]);

    return NextResponse.json({
      projects,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get projects error:', error);
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
      title,
      description,
      category,
      templateId,
      content = {},
      metadata = {},
      tags = [],
      assignedTo,
      aiGenerated = false,
      aiPrompt
    } = data;

    if (!title || !category) {
      return NextResponse.json(
        { error: 'Titel und Kategorie sind erforderlich' },
        { status: 400 }
      );
    }

    // If template is used, fetch template content
    let projectContent = content;
    if (templateId) {
      const template = await prisma.contentTemplate.findFirst({
        where: {
          id: templateId,
          OR: [
            { tenantId: session.user.tenantId },
            { isPublic: true }
          ]
        }
      });
      
      if (template) {
        projectContent = template.content;
        // Increment download count
        await prisma.contentTemplate.update({
          where: { id: templateId },
          data: { downloads: { increment: 1 } }
        });
      }
    }

    const project = await prisma.contentProject.create({
      data: {
        title,
        description,
        category,
        templateId,
        content: projectContent,
        metadata,
        tags,
        assignedTo,
        aiGenerated,
        aiPrompt,
        tenantId: session.user.tenantId,
        createdBy: session.user.id,
      },
      include: {
        creator: {
          select: { name: true, email: true },
        },
        assignee: {
          select: { name: true, email: true },
        },
        template: {
          select: { name: true, category: true },
        },
      },
    });

    // Create initial version
    await prisma.contentVersion.create({
      data: {
        projectId: project.id,
        version: '1.0',
        title: 'Initial Version',
        content: projectContent,
        changes: 'Project created',
        isActive: true,
        createdBy: session.user.id,
        tenantId: session.user.tenantId,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CONTENT_PROJECT_CREATED',
        resource: 'CONTENT_PROJECT',
        resourceId: project.id,
        details: { title: project.title, category: project.category },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

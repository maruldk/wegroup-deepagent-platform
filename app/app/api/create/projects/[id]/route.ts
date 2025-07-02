
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/db';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.contentProject.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
      include: {
        creator: {
          select: { name: true, email: true },
        },
        assignee: {
          select: { name: true, email: true },
        },
        template: {
          select: { name: true, category: true, type: true },
        },
        assets: {
          orderBy: { createdAt: 'desc' },
        },
        versions: {
          orderBy: { createdAt: 'desc' },
          include: {
            creator: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projekt nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Get project error:', error);
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
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    const {
      title,
      description,
      status,
      content,
      metadata,
      tags,
      assignedTo,
      previewUrl,
      exportedUrl,
      wordCount,
      duration,
      fileSize,
      createVersion = false,
      versionChanges
    } = data;

    // Check if project exists and user has access
    const existingProject = await prisma.contentProject.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Projekt nicht gefunden' }, { status: 404 });
    }

    // Update project
    const project = await prisma.contentProject.update({
      where: { id: params.id },
      data: {
        title,
        description,
        status,
        content,
        metadata,
        tags,
        assignedTo,
        previewUrl,
        exportedUrl,
        wordCount,
        duration,
        fileSize,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
        publishedAt: status === 'PUBLISHED' ? new Date() : undefined,
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

    // Create new version if requested
    if (createVersion && content) {
      // Get last version number
      const lastVersion = await prisma.contentVersion.findFirst({
        where: { projectId: params.id },
        orderBy: { version: 'desc' },
      });

      const versionNumber = lastVersion 
        ? `${parseFloat(lastVersion.version) + 0.1}`.slice(0, 3)
        : '1.1';

      // Deactivate current active version
      await prisma.contentVersion.updateMany({
        where: { 
          projectId: params.id,
          isActive: true 
        },
        data: { isActive: false },
      });

      // Create new version
      await prisma.contentVersion.create({
        data: {
          projectId: params.id,
          version: versionNumber,
          title: `Version ${versionNumber}`,
          content: content,
          changes: versionChanges || 'Project updated',
          isActive: true,
          createdBy: session.user.id,
          tenantId: session.user.tenantId,
        },
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CONTENT_PROJECT_UPDATED',
        resource: 'CONTENT_PROJECT',
        resourceId: project.id,
        details: { title: project.title, status: project.status },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error('Update project error:', error);
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
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if project exists and user has access
    const project = await prisma.contentProject.findFirst({
      where: {
        id: params.id,
        tenantId: session.user.tenantId,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Projekt nicht gefunden' }, { status: 404 });
    }

    // Delete project (cascade will handle assets and versions)
    await prisma.contentProject.delete({
      where: { id: params.id },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'CONTENT_PROJECT_DELETED',
        resource: 'CONTENT_PROJECT',
        resourceId: params.id,
        details: { title: project.title },
        tenantId: session.user.tenantId,
      },
    });

    return NextResponse.json({ message: 'Projekt gelöscht' });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

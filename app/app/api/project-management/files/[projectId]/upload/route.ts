
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TeamCollaborationService } from '@/lib/services/team-collaboration-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId || !session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // In a real implementation, you would upload to a file storage service
    // For now, we'll simulate the upload and return a mock URL
    const fileUrl = `/uploads/${params.projectId}/${file.name}`;
    
    const uploadedFile = await TeamCollaborationService.uploadProjectFile({
      projectId: params.projectId,
      name: file.name,
      originalName: file.name,
      fileType: file.name.split('.').pop()?.toUpperCase() || 'UNKNOWN',
      fileSize: file.size,
      fileUrl,
      uploadedBy: session.user.id,
      tenantId: session.user.tenantId,
    });

    return NextResponse.json({ file: uploadedFile }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload file' },
      { status: 500 }
    );
  }
}

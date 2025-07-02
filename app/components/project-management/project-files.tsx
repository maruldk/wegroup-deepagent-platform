
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Upload,
  File,
  FileText,
  Image,
  Download,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
  FolderOpen,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ProjectFile {
  id: string;
  name: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  createdAt: string;
  uploadedByUser: {
    id: string;
    name: string | null;
    email: string;
  };
  project: {
    id: string;
    name: string;
  };
}

interface ProjectFilesProps {
  projectId: string;
  className?: string;
}

const FILE_TYPE_ICONS = {
  'PDF': FileText,
  'DOC': FileText,
  'DOCX': FileText,
  'TXT': FileText,
  'XLS': FileText,
  'XLSX': FileText,
  'PPT': FileText,
  'PPTX': FileText,
  'JPG': Image,
  'JPEG': Image,
  'PNG': Image,
  'GIF': Image,
  'SVG': Image,
  'default': File,
};

const FILE_TYPE_COLORS = {
  'PDF': 'text-red-600',
  'DOC': 'text-blue-600',
  'DOCX': 'text-blue-600',
  'TXT': 'text-gray-600',
  'XLS': 'text-green-600',
  'XLSX': 'text-green-600',
  'PPT': 'text-orange-600',
  'PPTX': 'text-orange-600',
  'JPG': 'text-purple-600',
  'JPEG': 'text-purple-600',
  'PNG': 'text-purple-600',
  'GIF': 'text-purple-600',
  'SVG': 'text-purple-600',
  'default': 'text-gray-600',
};

export default function ProjectFiles({ projectId, className = "" }: ProjectFilesProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileType, setSelectedFileType] = useState<string>('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<ProjectFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/project-management/files/${projectId}`);
      if (!response.ok) throw new Error('Failed to load files');

      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
      toast.error('Failed to load project files');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles?.length) return;

    try {
      setUploading(true);
      
      for (const file of Array.from(selectedFiles)) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);

        const response = await fetch(`/api/project-management/files/${projectId}/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
      }

      toast.success(`Successfully uploaded ${selectedFiles.length} file(s)`);
      loadFiles();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error('Failed to upload files');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;

    try {
      const response = await fetch(`/api/project-management/files/${fileToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete file');

      toast.success('File deleted successfully');
      loadFiles();
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleDownloadFile = (file: ProjectFile) => {
    const link = document.createElement('a');
    link.href = file.fileUrl;
    link.download = file.originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileIcon = (fileType: string) => {
    const upperType = fileType.toUpperCase() as keyof typeof FILE_TYPE_ICONS;
    const IconComponent = FILE_TYPE_ICONS[upperType] || FILE_TYPE_ICONS.default;
    const colorClass = FILE_TYPE_COLORS[upperType] || FILE_TYPE_COLORS.default;
    return <IconComponent className={`h-5 w-5 ${colorClass}`} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUniqueFileTypes = () => {
    const types = [...new Set(files.map(file => file.fileType.toUpperCase()))];
    return types.sort();
  };

  const filteredFiles = files.filter(file => {
    const matchesSearch = file.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.uploadedByUser.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedFileType || file.fileType.toUpperCase() === selectedFileType;
    return matchesSearch && matchesType;
  });

  const FileCard = ({ file }: { file: ProjectFile }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {getFileIcon(file.fileType)}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate" title={file.originalName}>
                {file.originalName}
              </h4>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.fileSize)}
              </p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownloadFile(file)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.open(file.fileUrl, '_blank')}>
                <Eye className="h-4 w-4 mr-2" />
                View
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => {
                  setFileToDelete(file);
                  setDeleteDialogOpen(true);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src="" />
              <AvatarFallback className="text-xs">
                {file.uploadedByUser.name?.split(' ').map(n => n[0]).join('') || 'U'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {file.uploadedByUser.name || file.uploadedByUser.email}
            </span>
          </div>
          
          <Badge variant="secondary" className="text-xs">
            {file.fileType.toUpperCase()}
          </Badge>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
        </p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Project Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Project Files
              <Badge variant="secondary">{files.length}</Badge>
            </CardTitle>
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* File Controls */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={selectedFileType}
                onChange={(e) => setSelectedFileType(e.target.value)}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">All Types</option>
                {getUniqueFileTypes().map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Files Grid */}
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {files.length === 0 ? 'No files uploaded yet' : 'No files match your search'}
              </p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {files.length === 0 
                  ? 'Upload your first file to get started'
                  : 'Try adjusting your search criteria'
                }
              </p>
              {files.length === 0 && (
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => (
                <FileCard key={file.id} file={file} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.svg"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete File</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{fileToDelete?.originalName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteFile}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

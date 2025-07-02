
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Image, 
  Video, 
  Headphones, 
  Palette, 
  Sparkles, 
  Save, 
  Upload, 
  Download,
  Eye,
  Share2,
  History,
  Settings,
  Plus,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react';

interface ContentProject {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  content: any;
  metadata?: any;
  previewUrl?: string;
  createdAt: string;
  updatedAt: string;
  creator: { name: string; email: string };
  assignee?: { name: string; email: string };
  _count: { assets: number; versions: number };
}

interface ContentTemplate {
  id: string;
  name: string;
  category: string;
  type: string;
  thumbnailUrl?: string;
  tags: string[];
  downloads: number;
  rating?: number;
  creator: { name: string; email: string };
}

export default function ContentCreationStudio() {
  const [projects, setProjects] = useState<ContentProject[]>([]);
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ContentProject | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('projects');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showAIGeneratorDialog, setShowAIGeneratorDialog] = useState(false);
  const { toast } = useToast();

  const categories = [
    { id: 'document', name: 'Dokumente', icon: FileText, color: 'bg-blue-500' },
    { id: 'design', name: 'Design', icon: Palette, color: 'bg-purple-500' },
    { id: 'video', name: 'Video', icon: Video, color: 'bg-red-500' },
    { id: 'audio', name: 'Audio', icon: Headphones, color: 'bg-green-500' },
    { id: 'presentation', name: 'Präsentationen', icon: FileText, color: 'bg-orange-500' },
    { id: 'website', name: 'Website', icon: Image, color: 'bg-indigo-500' },
  ];

  const statusOptions = [
    { id: 'DRAFT', name: 'Entwurf', color: 'bg-gray-500' },
    { id: 'IN_PROGRESS', name: 'In Bearbeitung', color: 'bg-blue-500' },
    { id: 'REVIEW', name: 'Review', color: 'bg-yellow-500' },
    { id: 'APPROVED', name: 'Genehmigt', color: 'bg-green-500' },
    { id: 'COMPLETED', name: 'Abgeschlossen', color: 'bg-emerald-500' },
    { id: 'PUBLISHED', name: 'Veröffentlicht', color: 'bg-purple-500' },
  ];

  useEffect(() => {
    fetchProjects();
    fetchTemplates();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/create/projects');
      const data = await response.json();
      if (response.ok) {
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({
        title: 'Fehler',
        description: 'Projekte konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/create/templates?isPublic=true');
      const data = await response.json();
      if (response.ok) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const createProject = async (projectData: any) => {
    try {
      const response = await fetch('/api/create/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        const newProject = await response.json();
        setProjects([newProject, ...projects]);
        setShowNewProjectDialog(false);
        toast({
          title: 'Erfolg',
          description: 'Projekt wurde erstellt',
        });
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      toast({
        title: 'Fehler',
        description: 'Projekt konnte nicht erstellt werden',
        variant: 'destructive',
      });
    }
  };

  const generateAIContent = async (generationData: any) => {
    try {
      const response = await fetch('/api/create/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(generationData),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Create project with AI-generated content
        const projectData = {
          title: `AI: ${generationData.prompt.substring(0, 50)}...`,
          description: `AI-generierter ${generationData.type} Content`,
          category: generationData.category || generationData.type,
          content: result.structuredContent,
          metadata: result.metadata,
          aiGenerated: true,
          aiPrompt: generationData.prompt,
        };

        await createProject(projectData);
        setShowAIGeneratorDialog(false);

        toast({
          title: 'AI Content generiert',
          description: 'Neues Projekt mit AI-Content wurde erstellt',
        });
      } else {
        throw new Error('Failed to generate AI content');
      }
    } catch (error) {
      console.error('Error generating AI content:', error);
      toast({
        title: 'Fehler',
        description: 'AI-Content konnte nicht generiert werden',
        variant: 'destructive',
      });
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchTerm === '' || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[0];
  };

  const getStatusInfo = (statusId: string) => {
    return statusOptions.find(status => status.id === statusId) || statusOptions[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Content Creation Studio</h1>
          <p className="text-muted-foreground">
            Erstellen, bearbeiten und verwalten Sie all Ihre Inhalte an einem Ort
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAIGeneratorDialog(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Content
          </Button>
          <Button onClick={() => setShowNewProjectDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Projekt
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="projects">Projekte ({projects.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Projekte durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Kategorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kategorien</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                {statusOptions.map(status => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Projects Grid/List */}
          {filteredProjects.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Keine Projekte gefunden</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                    ? 'Keine Projekte entsprechen den aktuellen Filtern'
                    : 'Erstellen Sie Ihr erstes Content-Projekt'}
                </p>
                <Button onClick={() => setShowNewProjectDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Projekt erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              : 'space-y-2'
            }>
              {filteredProjects.map((project) => {
                const categoryInfo = getCategoryInfo(project.category);
                const statusInfo = getStatusInfo(project.status);
                const IconComponent = categoryInfo.icon;

                return (
                  <Card 
                    key={project.id} 
                    className={`cursor-pointer hover:shadow-md transition-shadow ${
                      viewMode === 'list' ? 'p-4' : ''
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <CardHeader className={viewMode === 'list' ? 'pb-2' : ''}>
                      <div className="flex items-start justify-between">
                        <div className={`flex items-center gap-2 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                          <div className={`w-8 h-8 rounded-lg ${categoryInfo.color} flex items-center justify-center`}>
                            <IconComponent className="w-4 h-4 text-white" />
                          </div>
                          <div className={viewMode === 'list' ? 'flex-1' : ''}>
                            <CardTitle className="text-sm line-clamp-1">{project.title}</CardTitle>
                            {viewMode === 'list' && project.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                                {project.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge 
                          className={`${statusInfo.color} text-white text-xs`}
                          variant="secondary"
                        >
                          {statusInfo.name}
                        </Badge>
                      </div>
                    </CardHeader>
                    {viewMode === 'grid' && (
                      <CardContent className="pt-0">
                        {project.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{project._count.assets} Assets</span>
                          <span>{project._count.versions} Versionen</span>
                        </div>
                        <div className="mt-2 pt-2 border-t flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {project.creator.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(project.updatedAt).toLocaleDateString('de-DE')}
                          </span>
                        </div>
                      </CardContent>
                    )}
                    {viewMode === 'list' && (
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span>{project.creator.name}</span>
                            <span>{project._count.assets} Assets</span>
                            <span>{project._count.versions} Versionen</span>
                          </div>
                          <span>{new Date(project.updatedAt).toLocaleDateString('de-DE')}</span>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Template Library</h3>
            <p className="text-muted-foreground">Template-Verwaltung wird hier implementiert</p>
          </div>
        </TabsContent>

        <TabsContent value="assets">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Asset Management</h3>
            <p className="text-muted-foreground">Asset-Verwaltung wird hier implementiert</p>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Content Analytics</h3>
            <p className="text-muted-foreground">Analytics werden hier implementiert</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Project Dialog */}
      <Dialog open={showNewProjectDialog} onOpenChange={setShowNewProjectDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neues Projekt erstellen</DialogTitle>
          </DialogHeader>
          <NewProjectForm onSubmit={createProject} onCancel={() => setShowNewProjectDialog(false)} />
        </DialogContent>
      </Dialog>

      {/* AI Generator Dialog */}
      <Dialog open={showAIGeneratorDialog} onOpenChange={setShowAIGeneratorDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              AI Content Generator
            </DialogTitle>
          </DialogHeader>
          <AIContentGenerator onGenerate={generateAIContent} onCancel={() => setShowAIGeneratorDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// New Project Form Component
function NewProjectForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'document',
    assignedTo: '',
  });

  const categories = [
    { id: 'document', name: 'Dokument' },
    { id: 'design', name: 'Design' },
    { id: 'video', name: 'Video' },
    { id: 'audio', name: 'Audio' },
    { id: 'presentation', name: 'Präsentation' },
    { id: 'website', name: 'Website' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Titel *
        </label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Projekt-Titel eingeben"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-1">
          Beschreibung
        </label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Optionale Beschreibung"
          rows={3}
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">
          Kategorie *
        </label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          Projekt erstellen
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}

// AI Content Generator Component
function AIContentGenerator({ onGenerate, onCancel }: { onGenerate: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    type: 'document',
    prompt: '',
    category: 'document',
    tone: 'professional',
    length: 'medium',
  });

  const contentTypes = [
    { id: 'document', name: 'Dokument' },
    { id: 'copy', name: 'Marketing Copy' },
    { id: 'presentation', name: 'Präsentation' },
    { id: 'social_media', name: 'Social Media' },
    { id: 'design', name: 'Design Brief' },
  ];

  const toneOptions = [
    { id: 'professional', name: 'Professionell' },
    { id: 'casual', name: 'Locker' },
    { id: 'formal', name: 'Formal' },
    { id: 'creative', name: 'Kreativ' },
    { id: 'friendly', name: 'Freundlich' },
  ];

  const lengthOptions = [
    { id: 'short', name: 'Kurz' },
    { id: 'medium', name: 'Mittel' },
    { id: 'long', name: 'Lang' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="type" className="block text-sm font-medium mb-1">
          Content-Typ *
        </label>
        <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value, category: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contentTypes.map(type => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label htmlFor="prompt" className="block text-sm font-medium mb-1">
          Beschreibung / Prompt *
        </label>
        <Textarea
          id="prompt"
          value={formData.prompt}
          onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
          placeholder="Beschreiben Sie den gewünschten Content..."
          rows={4}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="tone" className="block text-sm font-medium mb-1">
            Tonalität
          </label>
          <Select value={formData.tone} onValueChange={(value) => setFormData({ ...formData, tone: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {toneOptions.map(tone => (
                <SelectItem key={tone.id} value={tone.id}>
                  {tone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="length" className="block text-sm font-medium mb-1">
            Länge
          </label>
          <Select value={formData.length} onValueChange={(value) => setFormData({ ...formData, length: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {lengthOptions.map(length => (
                <SelectItem key={length.id} value={length.id}>
                  {length.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          <Sparkles className="w-4 h-4 mr-2" />
          Content generieren
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}

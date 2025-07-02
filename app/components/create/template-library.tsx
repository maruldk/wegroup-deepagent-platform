
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Search,
  Filter,
  Grid,
  List,
  Star,
  Download,
  Eye,
  Plus,
  FileText,
  Image,
  Video,
  Headphones,
  Palette,
  Presentation,
  Globe,
  Heart,
  Users,
  TrendingUp
} from 'lucide-react';

interface ContentTemplate {
  id: string;
  name: string;
  category: string;
  type: string;
  content: any;
  metadata?: any;
  thumbnailUrl?: string;
  tags: string[];
  isActive: boolean;
  isPublic: boolean;
  downloads: number;
  rating?: number;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: { name: string; email: string };
  _count: { projects: number };
}

export default function TemplateLibrary() {
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<ContentTemplate | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('downloads');
  const [showPublicOnly, setShowPublicOnly] = useState(false);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const { toast } = useToast();

  const categories = [
    { id: 'document', name: 'Dokumente', icon: FileText, color: 'bg-blue-500' },
    { id: 'design', name: 'Design', icon: Palette, color: 'bg-purple-500' },
    { id: 'video', name: 'Video', icon: Video, color: 'bg-red-500' },
    { id: 'audio', name: 'Audio', icon: Headphones, color: 'bg-green-500' },
    { id: 'presentation', name: 'Präsentationen', icon: Presentation, color: 'bg-orange-500' },
    { id: 'website', name: 'Website', icon: Globe, color: 'bg-indigo-500' },
  ];

  const templateTypes = [
    { id: 'template', name: 'Template' },
    { id: 'layout', name: 'Layout' },
    { id: 'style', name: 'Style' },
    { id: 'component', name: 'Component' },
  ];

  const sortOptions = [
    { id: 'downloads', name: 'Meist verwendet' },
    { id: 'rating', name: 'Beste Bewertung' },
    { id: 'createdAt', name: 'Neueste' },
    { id: 'name', name: 'Name' },
    { id: 'projects', name: 'Meist genutzt' },
  ];

  useEffect(() => {
    fetchTemplates();
  }, [showPublicOnly]);

  const fetchTemplates = async () => {
    try {
      const url = `/api/create/templates${showPublicOnly ? '?isPublic=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      if (response.ok) {
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast({
        title: 'Fehler',
        description: 'Templates konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const useTemplate = async (template: ContentTemplate) => {
    try {
      const projectData = {
        title: `Projekt basierend auf ${template.name}`,
        description: `Erstellt mit Template: ${template.name}`,
        category: template.category,
        templateId: template.id,
        content: template.content,
        metadata: template.metadata,
      };

      const response = await fetch('/api/create/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectData),
      });

      if (response.ok) {
        toast({
          title: 'Projekt erstellt',
          description: `Neues Projekt basierend auf "${template.name}" wurde erstellt`,
        });
        // Redirect to project or update UI
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      console.error('Error using template:', error);
      toast({
        title: 'Fehler',
        description: 'Projekt konnte nicht erstellt werden',
        variant: 'destructive',
      });
    }
  };

  const filteredAndSortedTemplates = templates
    .filter(template => {
      const matchesSearch = searchTerm === '' || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
      const matchesType = typeFilter === 'all' || template.type === typeFilter;
      
      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'downloads':
          return b.downloads - a.downloads;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        case 'projects':
          return b._count.projects - a._count.projects;
        default:
          return 0;
      }
    });

  const getCategoryInfo = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId) || categories[0];
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
          <h1 className="text-3xl font-bold">Template Library</h1>
          <p className="text-muted-foreground">
            Entdecken Sie professionelle Templates für Ihre Content-Projekte
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showPublicOnly ? 'default' : 'outline'}
            onClick={() => setShowPublicOnly(!showPublicOnly)}
          >
            <Users className="w-4 h-4 mr-2" />
            {showPublicOnly ? 'Alle Templates' : 'Öffentliche Templates'}
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Template erstellen
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Templates durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="flex gap-2">
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
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Typ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Typen</SelectItem>
              {templateTypes.map(type => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sortierung" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-1">
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
      </div>

      {/* Templates Grid/List */}
      {filteredAndSortedTemplates.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Keine Templates gefunden</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all'
                ? 'Keine Templates entsprechen den aktuellen Filtern'
                : 'Es sind noch keine Templates verfügbar'}
            </p>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Erstes Template erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-4'
        }>
          {filteredAndSortedTemplates.map((template) => {
            const categoryInfo = getCategoryInfo(template.category);
            const IconComponent = categoryInfo.icon;

            return (
              <Card 
                key={template.id} 
                className={`group cursor-pointer hover:shadow-lg transition-all duration-200 ${
                  viewMode === 'list' ? 'p-4' : ''
                }`}
              >
                <CardHeader className={`${viewMode === 'list' ? 'pb-2' : 'pb-4'}`}>
                  {viewMode === 'grid' && template.thumbnailUrl && (
                    <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                      <img 
                        src={template.thumbnailUrl} 
                        alt={template.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                  )}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-lg ${categoryInfo.color} flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {template.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-muted-foreground">{template.type}</span>
                          {template.isPublic && (
                            <Badge variant="secondary" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              Öffentlich
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {template.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{template.rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {/* Tags */}
                  {template.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {template.tags.slice(0, viewMode === 'grid' ? 3 : 5).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > (viewMode === 'grid' ? 3 : 5) && (
                        <Badge variant="outline" className="text-xs">
                          +{template.tags.length - (viewMode === 'grid' ? 3 : 5)}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Download className="w-4 h-4" />
                        <span>{template.downloads}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{template._count.projects}</span>
                      </div>
                    </div>
                    <span className="text-xs">
                      {new Date(template.createdAt).toLocaleDateString('de-DE')}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        useTemplate(template);
                      }}
                    >
                      Verwenden
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTemplate(template);
                        setShowPreviewDialog(true);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Add to favorites logic
                      }}
                    >
                      <Heart className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Template Preview Dialog */}
      <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedTemplate && (
                <>
                  <div className={`w-8 h-8 rounded-lg ${getCategoryInfo(selectedTemplate.category).color} flex items-center justify-center`}>
                    {React.createElement(getCategoryInfo(selectedTemplate.category).icon, { className: "w-4 h-4 text-white" })}
                  </div>
                  {selectedTemplate.name}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <TemplatePreview 
              template={selectedTemplate} 
              onUse={() => {
                useTemplate(selectedTemplate);
                setShowPreviewDialog(false);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Template Preview Component
function TemplatePreview({ template, onUse }: { template: ContentTemplate; onUse: () => void }) {
  return (
    <div className="space-y-6">
      {/* Template Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Template Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kategorie:</span>
              <span>{template.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Typ:</span>
              <span>{template.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Downloads:</span>
              <span>{template.downloads}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Verwendet in:</span>
              <span>{template._count.projects} Projekten</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Erstellt von:</span>
              <span>{template.creator.name}</span>
            </div>
            {template.rating && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bewertung:</span>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span>{template.rating.toFixed(1)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">Tags</h3>
          <div className="flex flex-wrap gap-1">
            {template.tags.map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Template Preview */}
      {template.thumbnailUrl && (
        <div>
          <h3 className="font-semibold mb-2">Vorschau</h3>
          <div className="w-full max-h-64 bg-muted rounded-lg overflow-hidden">
            <img 
              src={template.thumbnailUrl} 
              alt={template.name}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}

      {/* Content Structure */}
      <div>
        <h3 className="font-semibold mb-2">Content-Struktur</h3>
        <div className="bg-muted p-4 rounded-lg">
          <pre className="text-sm overflow-x-auto">
            {JSON.stringify(template.content, null, 2)}
          </pre>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={onUse} className="flex-1">
          Template verwenden
        </Button>
        <Button variant="outline">
          <Heart className="w-4 h-4 mr-2" />
          Zu Favoriten
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Download
        </Button>
      </div>
    </div>
  );
}


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
  Plus,
  TrendingUp,
  DollarSign,
  Calendar,
  User,
  Building,
  Phone,
  Mail,
  Eye,
  Edit,
  MoreVertical,
  ArrowRight,
  Target,
  Clock,
  Zap
} from 'lucide-react';

interface SalesOpportunity {
  id: string;
  title: string;
  description?: string;
  amount: number;
  currency: string;
  probability: number;
  stage: string;
  priority: string;
  source?: string;
  expectedCloseDate?: string;
  actualCloseDate?: string;
  customerId?: string;
  assignedTo: string;
  tags: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    companyName: string;
    contactPerson?: string;
    email?: string;
  };
  assignee: {
    name: string;
    email: string;
  };
  _count: {
    quotes: number;
    activities: number;
    products: number;
  };
}

const STAGES = [
  { id: 'PROSPECTING', name: 'Prospektion', color: 'bg-gray-500', probability: 10 },
  { id: 'QUALIFICATION', name: 'Qualifizierung', color: 'bg-blue-500', probability: 25 },
  { id: 'NEEDS_ANALYSIS', name: 'Bedarfsanalyse', color: 'bg-purple-500', probability: 40 },
  { id: 'PROPOSAL', name: 'Angebot', color: 'bg-orange-500', probability: 60 },
  { id: 'NEGOTIATION', name: 'Verhandlung', color: 'bg-yellow-500', probability: 80 },
  { id: 'CLOSED_WON', name: 'Gewonnen', color: 'bg-green-500', probability: 100 },
  { id: 'CLOSED_LOST', name: 'Verloren', color: 'bg-red-500', probability: 0 },
];

const PRIORITIES = [
  { id: 'LOW', name: 'Niedrig', color: 'bg-gray-500' },
  { id: 'MEDIUM', name: 'Mittel', color: 'bg-blue-500' },
  { id: 'HIGH', name: 'Hoch', color: 'bg-orange-500' },
  { id: 'URGENT', name: 'Dringend', color: 'bg-red-500' },
];

export default function SalesPipeline() {
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] = useState<SalesOpportunity | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');
  const [assignedToFilter, setAssignedToFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showNewOpportunityDialog, setShowNewOpportunityDialog] = useState(false);
  const [showOpportunityDetails, setShowOpportunityDetails] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/sell/opportunities');
      const data = await response.json();
      if (response.ok) {
        setOpportunities(data.opportunities || []);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast({
        title: 'Fehler',
        description: 'Opportunities konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createOpportunity = async (opportunityData: any) => {
    try {
      const response = await fetch('/api/sell/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opportunityData),
      });

      if (response.ok) {
        const newOpportunity = await response.json();
        setOpportunities([newOpportunity, ...opportunities]);
        setShowNewOpportunityDialog(false);
        toast({
          title: 'Erfolg',
          description: 'Opportunity wurde erstellt',
        });
      } else {
        throw new Error('Failed to create opportunity');
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast({
        title: 'Fehler',
        description: 'Opportunity konnte nicht erstellt werden',
        variant: 'destructive',
      });
    }
  };

  const updateOpportunityStage = async (opportunityId: string, newStage: string) => {
    try {
      const opportunity = opportunities.find(o => o.id === opportunityId);
      if (!opportunity) return;

      const stageInfo = STAGES.find(s => s.id === newStage);
      const updateData = {
        stage: newStage,
        probability: stageInfo?.probability || opportunity.probability,
        actualCloseDate: ['CLOSED_WON', 'CLOSED_LOST'].includes(newStage) ? new Date().toISOString() : null,
      };

      const response = await fetch(`/api/sell/opportunities/${opportunityId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedOpportunity = await response.json();
        setOpportunities(opportunities.map(o => 
          o.id === opportunityId ? updatedOpportunity : o
        ));
        toast({
          title: 'Status aktualisiert',
          description: `Opportunity zu "${stageInfo?.name}" verschoben`,
        });
      }
    } catch (error) {
      console.error('Error updating opportunity stage:', error);
      toast({
        title: 'Fehler',
        description: 'Status konnte nicht aktualisiert werden',
        variant: 'destructive',
      });
    }
  };

  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = searchTerm === '' || 
      opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opportunity.customer?.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStage = stageFilter === 'all' || opportunity.stage === stageFilter;
    const matchesAssignee = assignedToFilter === 'all' || opportunity.assignedTo === assignedToFilter;
    const matchesPriority = priorityFilter === 'all' || opportunity.priority === priorityFilter;
    
    return matchesSearch && matchesStage && matchesAssignee && matchesPriority;
  });

  const getStageInfo = (stageId: string) => {
    return STAGES.find(stage => stage.id === stageId) || STAGES[0];
  };

  const getPriorityInfo = (priorityId: string) => {
    return PRIORITIES.find(priority => priority.id === priorityId) || PRIORITIES[1];
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const calculatePipelineMetrics = () => {
    const totalValue = filteredOpportunities
      .filter(o => !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage))
      .reduce((sum, o) => sum + o.amount, 0);
    
    const weightedValue = filteredOpportunities
      .filter(o => !['CLOSED_WON', 'CLOSED_LOST'].includes(o.stage))
      .reduce((sum, o) => sum + (o.amount * o.probability / 100), 0);
    
    const wonValue = filteredOpportunities
      .filter(o => o.stage === 'CLOSED_WON')
      .reduce((sum, o) => sum + o.amount, 0);

    return { totalValue, weightedValue, wonValue };
  };

  const metrics = calculatePipelineMetrics();

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
          <h1 className="text-3xl font-bold">Sales Pipeline</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Verkaufschancen und Pipeline
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowNewOpportunityDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Neue Opportunity
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pipeline Wert</p>
                <p className="text-xl font-bold">{formatCurrency(metrics.totalValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gewichteter Wert</p>
                <p className="text-xl font-bold">{formatCurrency(metrics.weightedValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gewonnener Umsatz</p>
                <p className="text-xl font-bold">{formatCurrency(metrics.wonValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Opportunities durchsuchen..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Stages</SelectItem>
            {STAGES.map(stage => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Priorität" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Prioritäten</SelectItem>
            {PRIORITIES.map(priority => (
              <SelectItem key={priority.id} value={priority.id}>
                {priority.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Pipeline View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
          {STAGES.map(stage => {
            const stageOpportunities = filteredOpportunities.filter(o => o.stage === stage.id);
            const stageValue = stageOpportunities.reduce((sum, o) => sum + o.amount, 0);

            return (
              <div key={stage.id} className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
                    <h3 className="font-semibold text-sm">{stage.name}</h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {stageOpportunities.length}
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground mb-4">
                  {formatCurrency(stageValue)}
                </div>
                <div className="space-y-3">
                  {stageOpportunities.map(opportunity => {
                    const priorityInfo = getPriorityInfo(opportunity.priority);
                    
                    return (
                      <Card 
                        key={opportunity.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          setSelectedOpportunity(opportunity);
                          setShowOpportunityDetails(true);
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm line-clamp-2">{opportunity.title}</h4>
                            <div className={`w-2 h-2 rounded-full ${priorityInfo.color} ml-2 mt-1`}></div>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {opportunity.customer?.companyName || 'Unbekannter Kunde'}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-green-600">
                              {formatCurrency(opportunity.amount)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {opportunity.probability}%
                            </span>
                          </div>
                          {opportunity.expectedCloseDate && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(opportunity.expectedCloseDate).toLocaleDateString('de-DE')}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // List View
        <div className="space-y-2">
          {filteredOpportunities.map(opportunity => {
            const stageInfo = getStageInfo(opportunity.stage);
            const priorityInfo = getPriorityInfo(opportunity.priority);

            return (
              <Card 
                key={opportunity.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedOpportunity(opportunity);
                  setShowOpportunityDetails(true);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-3 h-3 rounded-full ${stageInfo.color}`}></div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{opportunity.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {opportunity.customer?.companyName || 'Unbekannter Kunde'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {formatCurrency(opportunity.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {opportunity.probability}% • {stageInfo.name}
                        </p>
                      </div>
                      <Badge className={`${priorityInfo.color} text-white`}>
                        {priorityInfo.name}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {opportunity.assignee.name}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Opportunity Dialog */}
      <Dialog open={showNewOpportunityDialog} onOpenChange={setShowNewOpportunityDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Neue Opportunity erstellen</DialogTitle>
          </DialogHeader>
          <NewOpportunityForm 
            onSubmit={createOpportunity} 
            onCancel={() => setShowNewOpportunityDialog(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* Opportunity Details Dialog */}
      <Dialog open={showOpportunityDetails} onOpenChange={setShowOpportunityDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Opportunity Details</DialogTitle>
          </DialogHeader>
          {selectedOpportunity && (
            <OpportunityDetails 
              opportunity={selectedOpportunity}
              onStageChange={updateOpportunityStage}
              onClose={() => setShowOpportunityDetails(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// New Opportunity Form Component
function NewOpportunityForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    stage: 'PROSPECTING',
    priority: 'MEDIUM',
    probability: '10',
    expectedCloseDate: '',
    source: '',
    customerId: '',
    assignedTo: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      probability: parseInt(formData.probability) || 10,
      expectedCloseDate: formData.expectedCloseDate || null,
    });
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
          placeholder="Opportunity-Titel"
          required
        />
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium mb-1">
          Betrag (EUR) *
        </label>
        <Input
          id="amount"
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="0.00"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="stage" className="block text-sm font-medium mb-1">
            Stage
          </label>
          <Select value={formData.stage} onValueChange={(value) => setFormData({ ...formData, stage: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STAGES.slice(0, -2).map(stage => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="priority" className="block text-sm font-medium mb-1">
            Priorität
          </label>
          <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map(priority => (
                <SelectItem key={priority.id} value={priority.id}>
                  {priority.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <label htmlFor="expectedCloseDate" className="block text-sm font-medium mb-1">
          Erwartetes Abschlussdatum
        </label>
        <Input
          id="expectedCloseDate"
          type="date"
          value={formData.expectedCloseDate}
          onChange={(e) => setFormData({ ...formData, expectedCloseDate: e.target.value })}
        />
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" className="flex-1">
          Opportunity erstellen
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}

// Opportunity Details Component
function OpportunityDetails({ 
  opportunity, 
  onStageChange, 
  onClose 
}: { 
  opportunity: SalesOpportunity; 
  onStageChange: (id: string, stage: string) => void;
  onClose: () => void;
}) {
  const stageInfo = STAGES.find(s => s.id === opportunity.stage);
  const priorityInfo = PRIORITIES.find(p => p.id === opportunity.priority);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{opportunity.title}</h2>
          <p className="text-muted-foreground">{opportunity.description}</p>
        </div>
        <div className="flex gap-2">
          <Badge className={`${stageInfo?.color} text-white`}>
            {stageInfo?.name}
          </Badge>
          <Badge className={`${priorityInfo?.color} text-white`}>
            {priorityInfo?.name}
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: opportunity.currency }).format(opportunity.amount)}
          </p>
          <p className="text-sm text-muted-foreground">Opportunity Wert</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{opportunity.probability}%</p>
          <p className="text-sm text-muted-foreground">Wahrscheinlichkeit</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">
            {opportunity.expectedCloseDate 
              ? Math.ceil((new Date(opportunity.expectedCloseDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
              : '-'}
          </p>
          <p className="text-sm text-muted-foreground">Tage bis Abschluss</p>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3">Kontakt Details</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <span>{opportunity.customer?.companyName || 'Unbekannt'}</span>
            </div>
            {opportunity.customer?.contactPerson && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>{opportunity.customer.contactPerson}</span>
              </div>
            )}
            {opportunity.customer?.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{opportunity.customer.email}</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Verkaufs Details</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>Zuständig: {opportunity.assignee.name}</span>
            </div>
            {opportunity.source && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
                <span>Quelle: {opportunity.source}</span>
              </div>
            )}
            {opportunity.expectedCloseDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span>Erwarteter Abschluss: {new Date(opportunity.expectedCloseDate).toLocaleDateString('de-DE')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Summary */}
      <div>
        <h3 className="font-semibold mb-3">Aktivitäten</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-lg font-semibold">{opportunity._count.quotes}</p>
            <p className="text-sm text-muted-foreground">Angebote</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-lg font-semibold">{opportunity._count.activities}</p>
            <p className="text-sm text-muted-foreground">Aktivitäten</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-lg font-semibold">{opportunity._count.products}</p>
            <p className="text-sm text-muted-foreground">Produkte</p>
          </div>
        </div>
      </div>

      {/* Stage Actions */}
      <div>
        <h3 className="font-semibold mb-3">Stage ändern</h3>
        <div className="flex flex-wrap gap-2">
          {STAGES.filter(s => s.id !== opportunity.stage).map(stage => (
            <Button
              key={stage.id}
              variant="outline"
              size="sm"
              onClick={() => onStageChange(opportunity.id, stage.id)}
              className="text-xs"
            >
              <ArrowRight className="w-3 h-3 mr-1" />
              {stage.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button variant="outline" className="flex-1">
          <Edit className="w-4 h-4 mr-2" />
          Bearbeiten
        </Button>
        <Button variant="outline" className="flex-1">
          <Zap className="w-4 h-4 mr-2" />
          AI Empfehlungen
        </Button>
        <Button onClick={onClose}>
          Schließen
        </Button>
      </div>
    </div>
  );
}

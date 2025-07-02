
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText,
  Plus,
  Trash2,
  Edit,
  Send,
  Eye,
  Download,
  Copy,
  Calculator,
  Package,
  DollarSign,
  Calendar,
  User,
  Building,
  Mail,
  Phone,
  Search,
  Filter
} from 'lucide-react';

interface SalesQuote {
  id: string;
  quoteNumber: string;
  opportunityId: string;
  title: string;
  description?: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  discountPercent?: number;
  totalAmount: number;
  currency: string;
  status: string;
  validUntil: string;
  terms?: string;
  notes?: string;
  customerMessage?: string;
  sentAt?: string;
  viewedAt?: string;
  acceptedAt?: string;
  createdAt: string;
  opportunity: {
    title: string;
    stage: string;
    customer?: {
      companyName: string;
    };
  };
  creator: {
    name: string;
    email: string;
  };
  items: QuoteItem[];
  _count: {
    items: number;
  };
}

interface QuoteItem {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalPrice: number;
  sortOrder: number;
  isOptional: boolean;
  product?: {
    name: string;
    sku?: string;
  };
}

interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  price: number;
  currency: string;
  category?: string;
  isActive: boolean;
}

const QUOTE_STATUSES = [
  { id: 'DRAFT', name: 'Entwurf', color: 'bg-gray-500' },
  { id: 'SENT', name: 'Gesendet', color: 'bg-blue-500' },
  { id: 'VIEWED', name: 'Angesehen', color: 'bg-yellow-500' },
  { id: 'ACCEPTED', name: 'Angenommen', color: 'bg-green-500' },
  { id: 'REJECTED', name: 'Abgelehnt', color: 'bg-red-500' },
  { id: 'EXPIRED', name: 'Abgelaufen', color: 'bg-orange-500' },
];

export default function QuoteGenerator() {
  const [quotes, setQuotes] = useState<SalesQuote[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuote, setSelectedQuote] = useState<SalesQuote | null>(null);
  const [activeTab, setActiveTab] = useState('quotes');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewQuoteDialog, setShowNewQuoteDialog] = useState(false);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Partial<SalesQuote> | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchQuotes();
    fetchProducts();
    fetchOpportunities();
  }, []);

  const fetchQuotes = async () => {
    try {
      const response = await fetch('/api/sell/quotes');
      const data = await response.json();
      if (response.ok) {
        setQuotes(data.quotes || []);
      }
    } catch (error) {
      console.error('Error fetching quotes:', error);
      toast({
        title: 'Fehler',
        description: 'Angebote konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/sell/products');
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/sell/opportunities');
      const data = await response.json();
      if (response.ok) {
        setOpportunities(data.opportunities || []);
      }
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    }
  };

  const createQuote = async (quoteData: any) => {
    try {
      const response = await fetch('/api/sell/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quoteData),
      });

      if (response.ok) {
        const newQuote = await response.json();
        setQuotes([newQuote, ...quotes]);
        setShowNewQuoteDialog(false);
        setEditingQuote(null);
        toast({
          title: 'Erfolg',
          description: 'Angebot wurde erstellt',
        });
      } else {
        throw new Error('Failed to create quote');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      toast({
        title: 'Fehler',
        description: 'Angebot konnte nicht erstellt werden',
        variant: 'destructive',
      });
    }
  };

  const filteredQuotes = quotes.filter(quote => {
    const matchesSearch = searchTerm === '' || 
      quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.opportunity.customer?.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusInfo = (statusId: string) => {
    return QUOTE_STATUSES.find(status => status.id === statusId) || QUOTE_STATUSES[0];
  };

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
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
          <h1 className="text-3xl font-bold">Quote Generator</h1>
          <p className="text-muted-foreground">
            Erstellen und verwalten Sie professionelle Angebote
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowNewQuoteDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Angebot
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="quotes">Angebote ({quotes.length})</TabsTrigger>
          <TabsTrigger value="templates">Vorlagen</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Angebote durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                {QUOTE_STATUSES.map(status => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quotes List */}
          {filteredQuotes.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Keine Angebote gefunden</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Keine Angebote entsprechen den aktuellen Filtern'
                    : 'Erstellen Sie Ihr erstes Angebot'}
                </p>
                <Button onClick={() => setShowNewQuoteDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Angebot erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredQuotes.map((quote) => {
                const statusInfo = getStatusInfo(quote.status);

                return (
                  <Card 
                    key={quote.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelectedQuote(quote);
                      setShowQuoteDetails(true);
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold">{quote.quoteNumber}</h3>
                              <Badge className={`${statusInfo.color} text-white text-xs`}>
                                {statusInfo.name}
                              </Badge>
                            </div>
                            <h4 className="text-sm font-medium mb-1">{quote.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {quote.opportunity.customer?.companyName || 'Unbekannter Kunde'} • 
                              {quote._count.items} Positionen
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(quote.totalAmount, quote.currency)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Gültig bis {new Date(quote.validUntil).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>{quote.creator.name}</p>
                            <p>{new Date(quote.createdAt).toLocaleDateString('de-DE')}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Angebots-Vorlagen</h3>
            <p className="text-muted-foreground">Vorlagen-Verwaltung wird hier implementiert</p>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Angebots-Analytics</h3>
            <p className="text-muted-foreground">Analytics werden hier implementiert</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* New Quote Dialog */}
      <Dialog open={showNewQuoteDialog} onOpenChange={setShowNewQuoteDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neues Angebot erstellen</DialogTitle>
          </DialogHeader>
          <QuoteBuilder 
            opportunities={opportunities}
            products={products}
            onSubmit={createQuote} 
            onCancel={() => setShowNewQuoteDialog(false)}
            editingQuote={editingQuote}
          />
        </DialogContent>
      </Dialog>

      {/* Quote Details Dialog */}
      <Dialog open={showQuoteDetails} onOpenChange={setShowQuoteDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Angebot Details</DialogTitle>
          </DialogHeader>
          {selectedQuote && (
            <QuoteDetails 
              quote={selectedQuote}
              onEdit={() => {
                setEditingQuote(selectedQuote);
                setShowQuoteDetails(false);
                setShowNewQuoteDialog(true);
              }}
              onClose={() => setShowQuoteDetails(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Quote Builder Component
function QuoteBuilder({ 
  opportunities, 
  products, 
  onSubmit, 
  onCancel, 
  editingQuote 
}: { 
  opportunities: any[]; 
  products: Product[]; 
  onSubmit: (data: any) => void; 
  onCancel: () => void;
  editingQuote?: Partial<SalesQuote> | null;
}) {
  const [formData, setFormData] = useState({
    opportunityId: editingQuote?.opportunityId || '',
    title: editingQuote?.title || '',
    description: editingQuote?.description || '',
    validUntil: editingQuote?.validUntil ? editingQuote.validUntil.split('T')[0] : '',
    terms: editingQuote?.terms || '',
    notes: editingQuote?.notes || '',
    customerMessage: editingQuote?.customerMessage || '',
    taxAmount: editingQuote?.taxAmount || 0,
    discountAmount: editingQuote?.discountAmount || 0,
    discountPercent: editingQuote?.discountPercent || 0,
  });

  const [items, setItems] = useState<Partial<QuoteItem>[]>(
    editingQuote?.items || [{ name: '', description: '', quantity: 1, unitPrice: 0, discount: 0, totalPrice: 0, isOptional: false }]
  );

  const addItem = () => {
    setItems([...items, { 
      name: '', 
      description: '', 
      quantity: 1, 
      unitPrice: 0, 
      discount: 0, 
      totalPrice: 0, 
      isOptional: false 
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Recalculate total price for the item
    if (['quantity', 'unitPrice', 'discount'].includes(field)) {
      const item = updatedItems[index];
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;
      updatedItems[index].totalPrice = (quantity * unitPrice) - discount;
    }
    
    setItems(updatedItems);
  };

  const addProductToItems = (product: Product) => {
    const newItem = {
      productId: product.id,
      name: product.name,
      description: product.description || '',
      quantity: 1,
      unitPrice: product.price,
      discount: 0,
      totalPrice: product.price,
      isOptional: false,
    };
    setItems([...items, newItem]);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    const tax = Number(formData.taxAmount) || 0;
    const discount = Number(formData.discountAmount) || 0;
    return subtotal + tax - discount;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const subtotal = calculateSubtotal();
    const totalAmount = calculateTotal();

    const quoteData = {
      ...formData,
      validUntil: new Date(formData.validUntil),
      subtotal,
      totalAmount,
      items: items.map((item, index) => ({
        ...item,
        sortOrder: index,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        discount: Number(item.discount) || 0,
        totalPrice: Number(item.totalPrice) || 0,
      })),
    };

    onSubmit(quoteData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="opportunityId" className="block text-sm font-medium mb-1">
            Opportunity *
          </label>
          <Select value={formData.opportunityId} onValueChange={(value) => setFormData({ ...formData, opportunityId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Opportunity auswählen" />
            </SelectTrigger>
            <SelectContent>
              {opportunities.map(opp => (
                <SelectItem key={opp.id} value={opp.id}>
                  {opp.title} - {opp.customer?.companyName || 'Unbekannt'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Angebot-Titel *
          </label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Angebot für..."
            required
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Beschreibung
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Optionale Beschreibung"
            rows={2}
          />
        </div>

        <div>
          <label htmlFor="validUntil" className="block text-sm font-medium mb-1">
            Gültig bis *
          </label>
          <Input
            id="validUntil"
            type="date"
            value={formData.validUntil}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Products Quick Add */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Produkte hinzufügen</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-32 overflow-y-auto">
          {products.slice(0, 9).map(product => (
            <Button
              key={product.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addProductToItems(product)}
              className="justify-start text-left h-auto p-2"
            >
              <div>
                <p className="font-medium text-xs">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: product.currency }).format(product.price)}
                </p>
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Quote Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Angebots-Positionen</h3>
          <Button type="button" onClick={addItem} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Position hinzufügen
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-3 items-end">
                  <div className="col-span-3">
                    <label className="block text-xs font-medium mb-1">Name *</label>
                    <Input
                      value={item.name || ''}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      placeholder="Position..."
                      required
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="block text-xs font-medium mb-1">Beschreibung</label>
                    <Input
                      value={item.description || ''}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Details..."
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium mb-1">Menge</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.quantity || ''}
                      onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium mb-1">Einzelpreis</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice || ''}
                      onChange={(e) => updateItem(index, 'unitPrice', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium mb-1">Rabatt</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.discount || ''}
                      onChange={(e) => updateItem(index, 'discount', e.target.value)}
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium mb-1">Gesamt</label>
                    <Input
                      value={new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(item.totalPrice || 0)}
                      disabled
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Calculations */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Zwischensumme:</span>
              <span className="font-semibold">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(calculateSubtotal())}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Steuer (EUR)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.taxAmount}
                  onChange={(e) => setFormData({ ...formData, taxAmount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Rabatt (EUR)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-between text-lg font-bold border-t pt-3">
              <span>Gesamtsumme:</span>
              <span className="text-green-600">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(calculateTotal())}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="terms" className="block text-sm font-medium mb-1">
            Bedingungen
          </label>
          <Textarea
            id="terms"
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            placeholder="Zahlungsbedingungen, Lieferzeit, etc."
            rows={3}
          />
        </div>
        <div>
          <label htmlFor="customerMessage" className="block text-sm font-medium mb-1">
            Nachricht an Kunde
          </label>
          <Textarea
            id="customerMessage"
            value={formData.customerMessage}
            onChange={(e) => setFormData({ ...formData, customerMessage: e.target.value })}
            placeholder="Persönliche Nachricht..."
            rows={3}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button type="submit" className="flex-1">
          {editingQuote ? 'Angebot aktualisieren' : 'Angebot erstellen'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}

// Quote Details Component
function QuoteDetails({ quote, onEdit, onClose }: { quote: SalesQuote; onEdit: () => void; onClose: () => void }) {
  const statusInfo = getStatusInfo(quote.status);

  const sendQuote = async () => {
    // Implement quote sending logic
    console.log('Sending quote:', quote.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{quote.quoteNumber}</h2>
          <h3 className="text-lg">{quote.title}</h3>
          <p className="text-muted-foreground">{quote.description}</p>
        </div>
        <Badge className={`${statusInfo.color} text-white`}>
          {statusInfo.name}
        </Badge>
      </div>

      {/* Customer Info */}
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Kunde</h3>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-muted-foreground" />
              <span>{quote.opportunity.customer?.companyName || 'Unbekannt'}</span>
            </div>
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Angebot Details</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>Gültig bis:</span>
              <span>{new Date(quote.validUntil).toLocaleDateString('de-DE')}</span>
            </div>
            <div className="flex justify-between">
              <span>Erstellt von:</span>
              <span>{quote.creator.name}</span>
            </div>
            <div className="flex justify-between">
              <span>Erstellt am:</span>
              <span>{new Date(quote.createdAt).toLocaleDateString('de-DE')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Items */}
      <div>
        <h3 className="font-semibold mb-3">Positionen</h3>
        <div className="space-y-2">
          {quote.items.map((item, index) => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium">{item.name}</h4>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm">
                  {item.quantity} × {new Intl.NumberFormat('de-DE', { style: 'currency', currency: quote.currency }).format(item.unitPrice)}
                  {item.discount > 0 && <span className="text-red-600"> -{new Intl.NumberFormat('de-DE', { style: 'currency', currency: quote.currency }).format(item.discount)}</span>}
                </div>
                <div className="font-semibold">
                  {new Intl.NumberFormat('de-DE', { style: 'currency', currency: quote.currency }).format(item.totalPrice)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Zwischensumme:</span>
              <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: quote.currency }).format(quote.subtotal)}</span>
            </div>
            {quote.taxAmount > 0 && (
              <div className="flex justify-between">
                <span>Steuer:</span>
                <span>{new Intl.NumberFormat('de-DE', { style: 'currency', currency: quote.currency }).format(quote.taxAmount)}</span>
              </div>
            )}
            {quote.discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Rabatt:</span>
                <span>-{new Intl.NumberFormat('de-DE', { style: 'currency', currency: quote.currency }).format(quote.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Gesamtsumme:</span>
              <span className="text-green-600">
                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: quote.currency }).format(quote.totalAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms and Notes */}
      {(quote.terms || quote.notes || quote.customerMessage) && (
        <div className="space-y-4">
          {quote.terms && (
            <div>
              <h3 className="font-semibold mb-2">Bedingungen</h3>
              <p className="text-sm bg-muted p-3 rounded-lg">{quote.terms}</p>
            </div>
          )}
          {quote.customerMessage && (
            <div>
              <h3 className="font-semibold mb-2">Nachricht</h3>
              <p className="text-sm bg-muted p-3 rounded-lg">{quote.customerMessage}</p>
            </div>
          )}
          {quote.notes && (
            <div>
              <h3 className="font-semibold mb-2">Interne Notizen</h3>
              <p className="text-sm bg-muted p-3 rounded-lg">{quote.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={onEdit} variant="outline" className="flex-1">
          <Edit className="w-4 h-4 mr-2" />
          Bearbeiten
        </Button>
        <Button onClick={sendQuote} className="flex-1" disabled={quote.status !== 'DRAFT'}>
          <Send className="w-4 h-4 mr-2" />
          Senden
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          PDF
        </Button>
        <Button onClick={onClose}>
          Schließen
        </Button>
      </div>
    </div>
  );
}

function getStatusInfo(statusId: string) {
  return QUOTE_STATUSES.find(status => status.id === statusId) || QUOTE_STATUSES[0];
}

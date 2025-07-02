
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Package,
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Edit,
  Trash2,
  Eye,
  Copy,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Tag,
  Layers,
  BarChart3,
  Settings,
  Upload,
  Download,
  Star,
  AlertTriangle
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  category?: string;
  subcategory?: string;
  price: number;
  cost?: number;
  currency: string;
  unit?: string;
  weight?: number;
  dimensions?: any;
  imageUrl?: string;
  isService: boolean;
  isRecurring: boolean;
  billingCycle?: string;
  isActive: boolean;
  taxRate?: number;
  minQuantity?: number;
  maxQuantity?: number;
  stockLevel?: number;
  reorderLevel?: number;
  tags: string[];
  customFields?: any;
  createdAt: string;
  updatedAt: string;
  _count: {
    quoteItems: number;
    opportunityProducts: number;
  };
}

export default function ProductCatalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // product, service
  const [statusFilter, setStatusFilter] = useState('active');
  const [sortBy, setSortBy] = useState('name');
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const { toast } = useToast();

  const categories = [
    'Software',
    'Hardware',
    'Beratung',
    'Training',
    'Support',
    'Lizenz',
    'Wartung',
    'Development',
    'Marketing',
    'Design'
  ];

  const sortOptions = [
    { id: 'name', name: 'Name' },
    { id: 'price', name: 'Preis' },
    { id: 'category', name: 'Kategorie' },
    { id: 'createdAt', name: 'Erstellungsdatum' },
    { id: 'usage', name: 'Verwendung' },
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/sell/products');
      const data = await response.json();
      if (response.ok) {
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Fehler',
        description: 'Produkte konnten nicht geladen werden',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createProduct = async (productData: any) => {
    try {
      const response = await fetch('/api/sell/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        const newProduct = await response.json();
        setProducts([newProduct, ...products]);
        setShowNewProductDialog(false);
        setEditingProduct(null);
        toast({
          title: 'Erfolg',
          description: 'Produkt wurde erstellt',
        });
      } else {
        throw new Error('Failed to create product');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: 'Fehler',
        description: 'Produkt konnte nicht erstellt werden',
        variant: 'destructive',
      });
    }
  };

  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = searchTerm === '' || 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
      const matchesType = typeFilter === 'all' || 
        (typeFilter === 'product' && !product.isService) ||
        (typeFilter === 'service' && product.isService);
      const matchesStatus = 
        (statusFilter === 'active' && product.isActive) ||
        (statusFilter === 'inactive' && !product.isActive) ||
        statusFilter === 'all';
      
      return matchesSearch && matchesCategory && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return b.price - a.price;
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        case 'createdAt':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'usage':
          const aUsage = a._count.quoteItems + a._count.opportunityProducts;
          const bUsage = b._count.quoteItems + b._count.opportunityProducts;
          return bUsage - aUsage;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const calculateMargin = (price: number, cost: number) => {
    if (!cost || cost === 0) return null;
    return ((price - cost) / price * 100);
  };

  const getStockStatus = (product: Product) => {
    if (product.isService) return null;
    if (!product.stockLevel && product.stockLevel !== 0) return null;
    
    const reorderLevel = product.reorderLevel || 0;
    if (product.stockLevel === 0) return { status: 'out', color: 'bg-red-500', text: 'Ausverkauft' };
    if (product.stockLevel <= reorderLevel) return { status: 'low', color: 'bg-yellow-500', text: 'Niedrig' };
    return { status: 'good', color: 'bg-green-500', text: 'Verfügbar' };
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
          <h1 className="text-3xl font-bold">Produkt-Katalog</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihr Produktportfolio und Services
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button onClick={() => setShowNewProductDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Produkt
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="products">Produkte ({products.length})</TabsTrigger>
          <TabsTrigger value="categories">Kategorien</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Einstellungen</TabsTrigger>
        </TabsList>

        <TabsContent value="products" className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Produkte durchsuchen..."
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
                    <SelectItem key={category} value={category}>
                      {category}
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
                  <SelectItem value="product">Produkte</SelectItem>
                  <SelectItem value="service">Services</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktiv</SelectItem>
                  <SelectItem value="inactive">Inaktiv</SelectItem>
                  <SelectItem value="all">Alle</SelectItem>
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

          {/* Products Grid/List */}
          {filteredAndSortedProducts.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Keine Produkte gefunden</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all'
                    ? 'Keine Produkte entsprechen den aktuellen Filtern'
                    : 'Fügen Sie Ihr erstes Produkt hinzu'}
                </p>
                <Button onClick={() => setShowNewProductDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Produkt hinzufügen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
              : 'space-y-4'
            }>
              {filteredAndSortedProducts.map((product) => {
                const stockStatus = getStockStatus(product);
                const margin = product.cost ? calculateMargin(product.price, product.cost) : null;
                const totalUsage = product._count.quoteItems + product._count.opportunityProducts;

                return (
                  <Card 
                    key={product.id} 
                    className={`group cursor-pointer hover:shadow-lg transition-all duration-200 ${
                      !product.isActive ? 'opacity-60' : ''
                    } ${viewMode === 'list' ? 'p-4' : ''}`}
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowProductDetails(true);
                    }}
                  >
                    <CardHeader className={`${viewMode === 'list' ? 'pb-2' : 'pb-4'}`}>
                      {viewMode === 'grid' && product.imageUrl && (
                        <div className="w-full h-32 bg-muted rounded-lg mb-3 overflow-hidden">
                          <img 
                            src={product.imageUrl} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            {product.isService ? (
                              <Settings className="w-5 h-5 text-blue-600" />
                            ) : (
                              <Package className="w-5 h-5 text-blue-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base line-clamp-1 group-hover:text-blue-600 transition-colors">
                              {product.name}
                            </CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              {product.sku && (
                                <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
                              )}
                              {product.category && (
                                <Badge variant="secondary" className="text-xs">
                                  {product.category}
                                </Badge>
                              )}
                              {product.isService && (
                                <Badge variant="outline" className="text-xs">
                                  Service
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-lg font-bold text-green-600">
                            {formatCurrency(product.price, product.currency)}
                          </span>
                          {margin !== null && (
                            <span className="text-xs text-muted-foreground">
                              {margin.toFixed(1)}% Marge
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {product.description && viewMode === 'grid' && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {product.description}
                        </p>
                      )}

                      {/* Stock Status */}
                      {stockStatus && (
                        <div className="flex items-center gap-2 mb-3">
                          <div className={`w-2 h-2 rounded-full ${stockStatus.color}`}></div>
                          <span className="text-xs">{stockStatus.text}</span>
                          {product.stockLevel !== undefined && (
                            <span className="text-xs text-muted-foreground">
                              ({product.stockLevel} {product.unit || 'Stk'})
                            </span>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {product.tags.length > 0 && viewMode === 'grid' && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {product.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {product.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{product.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Usage Stats */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <ShoppingCart className="w-4 h-4" />
                            <span>{product._count.quoteItems}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>{totalUsage}</span>
                          </div>
                        </div>
                        <span className="text-xs">
                          {new Date(product.updatedAt).toLocaleDateString('de-DE')}
                        </span>
                      </div>

                      {viewMode === 'list' && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {product.description && (
                                <span className="text-sm text-muted-foreground max-w-md truncate">
                                  {product.description}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProduct(product);
                                  setShowNewProductDialog(true);
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Copy to clipboard or duplicate
                                }}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Kategorie-Verwaltung</h3>
            <p className="text-muted-foreground">Kategorie-Management wird hier implementiert</p>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Produkt-Analytics</h3>
            <p className="text-muted-foreground">Analytics werden hier implementiert</p>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Katalog-Einstellungen</h3>
            <p className="text-muted-foreground">Einstellungen werden hier implementiert</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* New/Edit Product Dialog */}
      <Dialog open={showNewProductDialog} onOpenChange={setShowNewProductDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? 'Produkt bearbeiten' : 'Neues Produkt erstellen'}
            </DialogTitle>
          </DialogHeader>
          <ProductForm 
            product={editingProduct}
            categories={categories}
            onSubmit={createProduct} 
            onCancel={() => {
              setShowNewProductDialog(false);
              setEditingProduct(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Product Details Dialog */}
      <Dialog open={showProductDetails} onOpenChange={setShowProductDetails}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Produkt Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <ProductDetails 
              product={selectedProduct}
              onEdit={() => {
                setEditingProduct(selectedProduct);
                setShowProductDetails(false);
                setShowNewProductDialog(true);
              }}
              onClose={() => setShowProductDetails(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Product Form Component
function ProductForm({ 
  product, 
  categories, 
  onSubmit, 
  onCancel 
}: { 
  product?: Product | null; 
  categories: string[]; 
  onSubmit: (data: any) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    sku: product?.sku || '',
    category: product?.category || '',
    subcategory: product?.subcategory || '',
    price: product?.price || '',
    cost: product?.cost || '',
    currency: product?.currency || 'EUR',
    unit: product?.unit || '',
    weight: product?.weight || '',
    imageUrl: product?.imageUrl || '',
    isService: product?.isService || false,
    isRecurring: product?.isRecurring || false,
    billingCycle: product?.billingCycle || '',
    taxRate: product?.taxRate || '',
    minQuantity: product?.minQuantity || 1,
    maxQuantity: product?.maxQuantity || '',
    stockLevel: product?.stockLevel || '',
    reorderLevel: product?.reorderLevel || '',
    tags: product?.tags.join(', ') || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      ...formData,
      price: parseFloat(formData.price as string) || 0,
      cost: formData.cost ? parseFloat(formData.cost as string) : null,
      weight: formData.weight ? parseFloat(formData.weight as string) : null,
      taxRate: formData.taxRate ? parseFloat(formData.taxRate as string) : null,
      minQuantity: parseInt(formData.minQuantity as string) || 1,
      maxQuantity: formData.maxQuantity ? parseInt(formData.maxQuantity as string) : null,
      stockLevel: formData.stockLevel ? parseInt(formData.stockLevel as string) : null,
      reorderLevel: formData.reorderLevel ? parseInt(formData.reorderLevel as string) : null,
      tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
    };

    onSubmit(productData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Grundinformationen</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Produktname *
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="z.B. Premium Software Lizenz"
              required
            />
          </div>

          <div>
            <label htmlFor="sku" className="block text-sm font-medium mb-1">
              SKU / Artikelnummer
            </label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="z.B. SW-LIC-001"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium mb-1">
            Beschreibung
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detaillierte Produktbeschreibung..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium mb-1">
              Kategorie
            </label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Kategorie wählen" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="subcategory" className="block text-sm font-medium mb-1">
              Unterkategorie
            </label>
            <Input
              id="subcategory"
              value={formData.subcategory}
              onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
              placeholder="z.B. Enterprise"
            />
          </div>

          <div>
            <label htmlFor="imageUrl" className="block text-sm font-medium mb-1">
              Bild URL
            </label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://lh5.googleusercontent.com/Yf9i9O2r6slSTdppICp8vIB5t00jw7HkUSfnW4I4gVtTMHtvkUknLY8pWsuSU49e9GBiNsB873mT-Nwv_xg2CoDJ6-CAAPOD7OrraZcyVdX0WT81plxJvuCIX4NVpGAelXZmvCyPYvnGE4qQz2ekxpTYrrYO8rlhrKsrPw5psmp7gYZudQGrDSaZ8A"
            />
          </div>
        </div>
      </div>

      {/* Product Type */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Produkttyp</h3>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="isService"
              checked={formData.isService}
              onCheckedChange={(checked) => setFormData({ ...formData, isService: checked })}
            />
            <label htmlFor="isService" className="text-sm font-medium">
              Service (nicht physisches Produkt)
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isRecurring"
              checked={formData.isRecurring}
              onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
            />
            <label htmlFor="isRecurring" className="text-sm font-medium">
              Wiederkehrende Abrechnung
            </label>
          </div>
        </div>

        {formData.isRecurring && (
          <div>
            <label htmlFor="billingCycle" className="block text-sm font-medium mb-1">
              Abrechnungszyklus
            </label>
            <Select value={formData.billingCycle} onValueChange={(value) => setFormData({ ...formData, billingCycle: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Zyklus wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monatlich</SelectItem>
                <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                <SelectItem value="yearly">Jährlich</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Preise & Finanzen</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium mb-1">
              Verkaufspreis *
            </label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div>
            <label htmlFor="cost" className="block text-sm font-medium mb-1">
              Einkaufspreis
            </label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost}
              onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium mb-1">
              Währung
            </label>
            <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="GBP">GBP</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label htmlFor="taxRate" className="block text-sm font-medium mb-1">
              Steuersatz (%)
            </label>
            <Input
              id="taxRate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={formData.taxRate}
              onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Physical Properties (only for products) */}
      {!formData.isService && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Physische Eigenschaften</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="unit" className="block text-sm font-medium mb-1">
                Einheit
              </label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="z.B. Stück, kg, m"
              />
            </div>

            <div>
              <label htmlFor="weight" className="block text-sm font-medium mb-1">
                Gewicht (kg)
              </label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                min="0"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Inventory (only for products) */}
      {!formData.isService && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Lagerbestand</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="stockLevel" className="block text-sm font-medium mb-1">
                Aktueller Bestand
              </label>
              <Input
                id="stockLevel"
                type="number"
                min="0"
                value={formData.stockLevel}
                onChange={(e) => setFormData({ ...formData, stockLevel: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="reorderLevel" className="block text-sm font-medium mb-1">
                Nachbestellgrenze
              </label>
              <Input
                id="reorderLevel"
                type="number"
                min="0"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="minQuantity" className="block text-sm font-medium mb-1">
                Mindestmenge
              </label>
              <Input
                id="minQuantity"
                type="number"
                min="1"
                value={formData.minQuantity}
                onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="maxQuantity" className="block text-sm font-medium mb-1">
                Höchstmenge
              </label>
              <Input
                id="maxQuantity"
                type="number"
                min="1"
                value={formData.maxQuantity}
                onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <label htmlFor="tags" className="block text-sm font-medium mb-1">
          Tags (kommagetrennt)
        </label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="z.B. Premium, Software, Enterprise"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button type="submit" className="flex-1">
          {product ? 'Produkt aktualisieren' : 'Produkt erstellen'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
      </div>
    </form>
  );
}

// Product Details Component
function ProductDetails({ product, onEdit, onClose }: { product: Product; onEdit: () => void; onClose: () => void }) {
  const margin = product.cost ? ((product.price - product.cost) / product.price * 100) : null;
  const stockStatus = product.isService ? null : 
    !product.stockLevel && product.stockLevel !== 0 ? null :
    product.stockLevel === 0 ? { status: 'out', color: 'bg-red-500', text: 'Ausverkauft' } :
    product.stockLevel <= (product.reorderLevel || 0) ? { status: 'low', color: 'bg-yellow-500', text: 'Niedrig' } :
    { status: 'good', color: 'bg-green-500', text: 'Verfügbar' };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded-lg" />
          ) : (
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
              {product.isService ? (
                <Settings className="w-8 h-8 text-muted-foreground" />
              ) : (
                <Package className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold">{product.name}</h2>
            <p className="text-muted-foreground">{product.description}</p>
            {product.sku && (
              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {product.category && (
            <Badge variant="secondary">{product.category}</Badge>
          )}
          {product.isService && (
            <Badge variant="outline">Service</Badge>
          )}
          <Badge variant={product.isActive ? 'default' : 'secondary'}>
            {product.isActive ? 'Aktiv' : 'Inaktiv'}
          </Badge>
        </div>
      </div>

      {/* Price & Margin */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-green-600">
            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: product.currency }).format(product.price)}
          </p>
          <p className="text-sm text-muted-foreground">Verkaufspreis</p>
        </div>
        {product.cost && (
          <div className="text-center">
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat('de-DE', { style: 'currency', currency: product.currency }).format(product.cost)}
            </p>
            <p className="text-sm text-muted-foreground">Einkaufspreis</p>
          </div>
        )}
        {margin !== null && (
          <div className="text-center">
            <p className="text-2xl font-bold">{margin.toFixed(1)}%</p>
            <p className="text-sm text-muted-foreground">Gewinnmarge</p>
          </div>
        )}
        <div className="text-center">
          <p className="text-2xl font-bold">{product._count.quoteItems + product._count.opportunityProducts}</p>
          <p className="text-sm text-muted-foreground">Verwendungen</p>
        </div>
      </div>

      {/* Stock Status (for products only) */}
      {stockStatus && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Lagerbestand</h3>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${stockStatus.color}`}></div>
                  <span>{stockStatus.text}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{product.stockLevel}</p>
                <p className="text-sm text-muted-foreground">{product.unit || 'Stück'}</p>
                {product.reorderLevel && (
                  <p className="text-xs text-muted-foreground">
                    Nachbestellen bei {product.reorderLevel}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3">Produktdetails</h3>
          <div className="space-y-2 text-sm">
            {product.category && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kategorie:</span>
                <span>{product.category}</span>
              </div>
            )}
            {product.subcategory && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unterkategorie:</span>
                <span>{product.subcategory}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Typ:</span>
              <span>{product.isService ? 'Service' : 'Produkt'}</span>
            </div>
            {product.unit && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Einheit:</span>
                <span>{product.unit}</span>
              </div>
            )}
            {product.weight && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gewicht:</span>
                <span>{product.weight} kg</span>
              </div>
            )}
            {product.taxRate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Steuersatz:</span>
                <span>{product.taxRate}%</span>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3">Verkaufsregeln</h3>
          <div className="space-y-2 text-sm">
            {product.minQuantity && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mindestmenge:</span>
                <span>{product.minQuantity}</span>
              </div>
            )}
            {product.maxQuantity && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Höchstmenge:</span>
                <span>{product.maxQuantity}</span>
              </div>
            )}
            {product.isRecurring && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Abrechnung:</span>
                <span>{product.billingCycle || 'Wiederkehrend'}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tags */}
      {product.tags.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {product.tags.map((tag, index) => (
              <Badge key={index} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Usage Statistics */}
      <div>
        <h3 className="font-semibold mb-3">Verwendungsstatistiken</h3>
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-lg font-semibold">{product._count.quoteItems}</p>
              <p className="text-sm text-muted-foreground">In Angeboten</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-lg font-semibold">{product._count.opportunityProducts}</p>
              <p className="text-sm text-muted-foreground">In Opportunities</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={onEdit} variant="outline" className="flex-1">
          <Edit className="w-4 h-4 mr-2" />
          Bearbeiten
        </Button>
        <Button variant="outline">
          <Copy className="w-4 h-4 mr-2" />
          Duplizieren
        </Button>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
        <Button onClick={onClose}>
          Schließen
        </Button>
      </div>
    </div>
  );
}

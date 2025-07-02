
'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Brain, 
  Filter, 
  Clock, 
  User, 
  Building, 
  Mail, 
  Phone,
  Sparkles,
  TrendingUp,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SearchResult {
  id: string;
  type: 'contact' | 'company' | 'deal' | 'project' | 'document';
  title: string;
  subtitle?: string;
  description: string;
  relevanceScore: number;
  aiInsight?: string;
  metadata: Record<string, any>;
  lastInteraction?: string;
}

interface AISearchComponentProps {
  placeholder?: string;
  categories?: string[];
  onResultSelect?: (result: SearchResult) => void;
  showAIInsights?: boolean;
  maxResults?: number;
}

export function AISearchComponent({
  placeholder = "Mit KI-Unterstützung suchen...",
  categories = ['all'],
  onResultSelect,
  showAIInsights = true,
  maxResults = 8
}: AISearchComponentProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock search results generator
  const generateMockResults = (searchQuery: string): SearchResult[] => {
    const mockResults: SearchResult[] = [
      {
        id: '1',
        type: 'contact',
        title: 'Max Mustermann',
        subtitle: 'Senior Developer',
        description: 'Leads technical implementation at TechCorp',
        relevanceScore: 0.95,
        aiInsight: 'High-value contact with 3 successful projects',
        metadata: { 
          company: 'TechCorp GmbH', 
          email: 'max@techcorp.de',
          phone: '+49 123 456789',
          lastContact: '2024-01-15'
        },
        lastInteraction: '2 Tage'
      },
      {
        id: '2',
        type: 'company',
        title: 'InnovateTech Solutions',
        subtitle: 'Software Development',
        description: 'Enterprise software solutions provider',
        relevanceScore: 0.87,
        aiInsight: 'Growing company with potential for expansion',
        metadata: { 
          industry: 'Technology',
          employees: '50-100',
          revenue: '€2M+',
          stage: 'Growth'
        },
        lastInteraction: '1 Woche'
      },
      {
        id: '3',
        type: 'deal',
        title: 'Enterprise Platform Deal',
        subtitle: '€50.000 - Verhandlung',
        description: 'Custom platform development for logistics company',
        relevanceScore: 0.82,
        aiInsight: '78% Abschlusswahrscheinlichkeit basierend auf ähnlichen Deals',
        metadata: { 
          value: 50000,
          stage: 'negotiation',
          probability: 0.78,
          closeDate: '2024-02-28'
        },
        lastInteraction: '3 Stunden'
      },
      {
        id: '4',
        type: 'project',
        title: 'Mobile App Redesign',
        subtitle: 'In Bearbeitung',
        description: 'Complete redesign of customer mobile application',
        relevanceScore: 0.76,
        aiInsight: 'Projekt liegt im Zeitplan, Team-Performance überdurchschnittlich',
        metadata: { 
          status: 'in_progress',
          completion: 0.65,
          team: 4,
          deadline: '2024-03-15'
        },
        lastInteraction: '5 Stunden'
      },
      {
        id: '5',
        type: 'document',
        title: 'Q4 Sales Report 2023',
        subtitle: 'Geschäftsbericht',
        description: 'Comprehensive quarterly sales analysis and forecasts',
        relevanceScore: 0.71,
        aiInsight: 'Enthält wichtige Insights für Q1 2024 Strategie',
        metadata: { 
          type: 'pdf',
          pages: 24,
          created: '2024-01-10',
          author: 'Sales Team'
        },
        lastInteraction: '1 Tag'
      }
    ];

    return mockResults
      .filter(result => 
        result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        result.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (result.subtitle && result.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .filter(result => selectedCategory === 'all' || result.type === selectedCategory)
      .slice(0, maxResults);
  };

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    
    // Simulate AI-powered search with delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const searchResults = generateMockResults(searchQuery);
    setResults(searchResults);
    setShowResults(true);
    setIsSearching(false);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, selectedCategory]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'contact': return <User className="h-4 w-4" />;
      case 'company': return <Building className="h-4 w-4" />;
      case 'deal': return <TrendingUp className="h-4 w-4" />;
      case 'project': return <Filter className="h-4 w-4" />;
      case 'document': return <Search className="h-4 w-4" />;
      default: return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'contact': return 'bg-blue-500';
      case 'company': return 'bg-green-500';
      case 'deal': return 'bg-orange-500';
      case 'project': return 'bg-purple-500';
      case 'document': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result);
    setShowResults(false);
    setQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <Brain className="h-4 w-4 text-blue-500 animate-pulse" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setShowResults(true)}
          className="pl-10 pr-10 h-12 text-lg"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full mt-2 w-full z-50"
          >
            <Card className="shadow-lg border-2">
              <CardContent className="p-0">
                {results.length > 0 ? (
                  <div className="max-h-96 overflow-y-auto">
                    {/* Category filters */}
                    {categories.length > 1 && (
                      <div className="p-3 border-b">
                        <div className="flex gap-2 flex-wrap">
                          {['all', 'contact', 'company', 'deal', 'project', 'document'].map((category) => (
                            <Button
                              key={category}
                              variant={selectedCategory === category ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setSelectedCategory(category)}
                              className="text-xs"
                            >
                              {category === 'all' ? 'Alle' : category}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Results */}
                    <div className="divide-y">
                      {results.map((result, index) => (
                        <motion.div
                          key={result.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleResultClick(result)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${getTypeColor(result.type)} text-white`}>
                              {getTypeIcon(result.type)}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium">{result.title}</h4>
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">
                                    {Math.round(result.relevanceScore * 100)}% Match
                                  </Badge>
                                  {result.lastInteraction && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {result.lastInteraction}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {result.subtitle && (
                                <p className="text-sm text-muted-foreground">{result.subtitle}</p>
                              )}
                              <p className="text-sm">{result.description}</p>
                              
                              {/* AI Insight */}
                              {showAIInsights && result.aiInsight && (
                                <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="flex items-center gap-2">
                                    <Sparkles className="h-3 w-3 text-blue-500" />
                                    <span className="text-xs font-medium text-blue-700">KI-Insight</span>
                                  </div>
                                  <p className="text-xs text-blue-600 mt-1">{result.aiInsight}</p>
                                </div>
                              )}

                              {/* Metadata */}
                              <div className="flex gap-2 mt-2">
                                {result.type === 'contact' && result.metadata.email && (
                                  <Badge variant="outline" className="text-xs">
                                    <Mail className="h-3 w-3 mr-1" />
                                    {result.metadata.email}
                                  </Badge>
                                )}
                                {result.type === 'contact' && result.metadata.phone && (
                                  <Badge variant="outline" className="text-xs">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {result.metadata.phone}
                                  </Badge>
                                )}
                                {result.type === 'company' && result.metadata.industry && (
                                  <Badge variant="outline" className="text-xs">
                                    {result.metadata.industry}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : query && !isSearching ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Keine Ergebnisse für "{query}" gefunden</p>
                    <p className="text-sm mt-1">KI sucht in allen verfügbaren Daten...</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

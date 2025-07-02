
import { PrismaClient } from '@prisma/client';
import { LLMService } from '../llm-service';

export interface SearchQuery {
  query: string;
  context?: 'CRM' | 'HR' | 'FINANCE' | 'PROJECT' | 'ALL';
  filters?: {
    dateRange?: { start: Date; end: Date };
    modules?: string[];
    confidence?: number;
    limit?: number;
  };
  includeSemanticSimilarity?: boolean;
  enhanceWithAI?: boolean;
}

export interface SearchResult {
  id: string;
  type: 'CONTACT' | 'OPPORTUNITY' | 'EMPLOYEE' | 'DOCUMENT' | 'INSIGHT' | 'OTHER';
  title: string;
  description: string;
  content: string;
  relevanceScore: number;
  semanticScore?: number;
  metadata: {
    module: string;
    createdAt: Date;
    updatedAt?: Date;
    tags?: string[];
    category?: string;
  };
  highlights?: string[];
  relatedItems?: Array<{
    id: string;
    type: string;
    title: string;
    relationship: string;
  }>;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  searchTime: number;
  suggestions?: string[];
  semanticInsights?: {
    queryIntent: string;
    conceptsIdentified: string[];
    relatedQueries: string[];
  };
  aggregations?: {
    byModule: Record<string, number>;
    byType: Record<string, number>;
    byDateRange: Record<string, number>;
  };
}

export class SemanticSearchService {
  private prisma: PrismaClient;
  private llmService: LLMService;
  private queryCache: Map<string, { result: SearchResponse; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.prisma = new PrismaClient();
    this.llmService = new LLMService(this.prisma);
  }

  /**
   * Main Semantic Search Method
   */
  async search(searchQuery: SearchQuery, tenantId: string): Promise<SearchResponse> {
    const startTime = Date.now();
    
    // Check cache first
    const cacheKey = this.generateCacheKey(searchQuery, tenantId);
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Enhance query with AI if requested
      let enhancedQuery = searchQuery.query;
      let semanticInsights = null;
      
      if (searchQuery.enhanceWithAI) {
        const enhancement = await this.enhanceQueryWithAI(searchQuery.query, searchQuery.context);
        enhancedQuery = enhancement.enhancedQuery;
        semanticInsights = enhancement.insights;
      }

      // Perform multi-source search
      const searchResults = await Promise.all([
        this.searchContacts(enhancedQuery, tenantId, searchQuery.filters),
        this.searchOpportunities(enhancedQuery, tenantId, searchQuery.filters),
        this.searchEmployees(enhancedQuery, tenantId, searchQuery.filters),
        this.searchDocuments(enhancedQuery, tenantId, searchQuery.filters),
        this.searchInsights(enhancedQuery, tenantId, searchQuery.filters)
      ]);

      // Flatten and merge results
      const allResults = searchResults.flat().filter(result => result !== null);

      // Calculate semantic similarity if requested
      if (searchQuery.includeSemanticSimilarity) {
        await this.calculateSemanticSimilarity(searchQuery.query, allResults);
      }

      // Sort by relevance
      const sortedResults = this.sortByRelevance(allResults, searchQuery);

      // Apply final filters and limits
      const finalResults = this.applyFinalFilters(sortedResults, searchQuery.filters);

      // Generate suggestions
      const suggestions = await this.generateSearchSuggestions(searchQuery.query, finalResults, tenantId);

      // Calculate aggregations
      const aggregations = this.calculateAggregations(finalResults);

      const searchResponse: SearchResponse = {
        results: finalResults.slice(0, searchQuery.filters?.limit || 20),
        totalCount: finalResults.length,
        searchTime: Date.now() - startTime,
        suggestions,
        semanticInsights,
        aggregations
      };

      // Cache the result
      this.setCachedResult(cacheKey, searchResponse);

      return searchResponse;
    } catch (error) {
      console.error('Semantic search failed:', error);
      return this.generateFallbackResponse(searchQuery, startTime);
    }
  }

  /**
   * Natural Language Query Processing
   */
  async processNaturalLanguageQuery(
    query: string, 
    tenantId: string,
    context?: string
  ): Promise<SearchResponse> {
    try {
      // Parse natural language query
      const parsedQuery = await this.parseNaturalLanguageQuery(query, context);
      
      // Convert to structured search
      const searchQuery: SearchQuery = {
        query: parsedQuery.cleanedQuery,
        context: parsedQuery.inferredContext,
        filters: parsedQuery.extractedFilters,
        includeSemanticSimilarity: true,
        enhanceWithAI: true
      };

      return await this.search(searchQuery, tenantId);
    } catch (error) {
      console.error('Natural language query processing failed:', error);
      // Fallback to simple search
      return await this.search({ query, enhanceWithAI: false }, tenantId);
    }
  }

  /**
   * Auto-completion and Suggestions
   */
  async getAutoCompletions(
    partialQuery: string,
    tenantId: string,
    context?: string,
    limit: number = 10
  ): Promise<Array<{
    completion: string;
    type: string;
    confidence: number;
    preview?: string;
  }>> {
    try {
      // Get completions from different sources
      const [
        entityCompletions,
        contentCompletions,
        aiCompletions
      ] = await Promise.all([
        this.getEntityBasedCompletions(partialQuery, tenantId, context),
        this.getContentBasedCompletions(partialQuery, tenantId, context),
        this.getAIGeneratedCompletions(partialQuery, context)
      ]);

      // Merge and rank completions
      const allCompletions = [...entityCompletions, ...contentCompletions, ...aiCompletions];
      const rankedCompletions = this.rankCompletions(allCompletions, partialQuery);

      return rankedCompletions.slice(0, limit);
    } catch (error) {
      console.error('Auto-completion failed:', error);
      return [];
    }
  }

  /**
   * Search Individual Sources
   */
  private async searchContacts(
    query: string, 
    tenantId: string, 
    filters?: SearchQuery['filters']
  ): Promise<SearchResult[]> {
    try {
      const whereClause = this.buildContactsWhereClause(query, tenantId, filters);
      
      const contacts = await this.prisma.contact.findMany({
        where: whereClause,
        include: {
          company: true,
          opportunities: { take: 3 },
          deals: { take: 3 }
        },
        take: 50
      });

      return contacts.map(contact => ({
        id: contact.id,
        type: 'CONTACT' as const,
        title: `${contact.firstName} ${contact.lastName}`,
        description: `${contact.position || 'Contact'} at ${contact.company?.name || 'Unknown Company'}`,
        content: this.buildContactSearchContent(contact),
        relevanceScore: this.calculateContactRelevance(contact, query),
        metadata: {
          module: 'CRM',
          createdAt: contact.createdAt,
          updatedAt: contact.updatedAt,
          tags: [contact.company?.industry || 'Unknown'].filter(Boolean),
          category: 'contact'
        },
        highlights: this.extractHighlights(this.buildContactSearchContent(contact), query),
        relatedItems: this.buildContactRelatedItems(contact)
      }));
    } catch (error) {
      console.error('Contact search failed:', error);
      return [];
    }
  }

  private async searchOpportunities(
    query: string, 
    tenantId: string, 
    filters?: SearchQuery['filters']
  ): Promise<SearchResult[]> {
    try {
      const whereClause = this.buildOpportunitiesWhereClause(query, tenantId, filters);
      
      const opportunities = await this.prisma.opportunity.findMany({
        where: whereClause,
        include: {
          contact: true,
          assignedUser: true
        },
        take: 50
      });

      return opportunities.map(opp => ({
        id: opp.id,
        type: 'OPPORTUNITY' as const,
        title: opp.title,
        description: `${opp.status} opportunity - €${opp.estimatedValue?.toLocaleString() || 'N/A'}`,
        content: this.buildOpportunitySearchContent(opp),
        relevanceScore: this.calculateOpportunityRelevance(opp, query),
        metadata: {
          module: 'CRM',
          createdAt: opp.createdAt,
          updatedAt: opp.updatedAt,
          tags: [opp.status, opp.priority || 'normal'].filter(Boolean),
          category: 'opportunity'
        },
        highlights: this.extractHighlights(this.buildOpportunitySearchContent(opp), query),
        relatedItems: this.buildOpportunityRelatedItems(opp)
      }));
    } catch (error) {
      console.error('Opportunity search failed:', error);
      return [];
    }
  }

  private async searchEmployees(
    query: string, 
    tenantId: string, 
    filters?: SearchQuery['filters']
  ): Promise<SearchResult[]> {
    try {
      const whereClause = this.buildEmployeesWhereClause(query, tenantId, filters);
      
      const employees = await this.prisma.employee.findMany({
        where: whereClause,
        include: {
          department: true,
          position: true,
          user: true
        },
        take: 50
      });

      return employees.map(employee => ({
        id: employee.id,
        type: 'EMPLOYEE' as const,
        title: `${employee.firstName} ${employee.lastName}`,
        description: `${employee.position?.title || 'Employee'} in ${employee.department?.name || 'Unknown Department'}`,
        content: this.buildEmployeeSearchContent(employee),
        relevanceScore: this.calculateEmployeeRelevance(employee, query),
        metadata: {
          module: 'HR',
          createdAt: employee.startDate || new Date(),
          updatedAt: employee.updatedAt,
          tags: [employee.department?.name, employee.position?.title].filter(Boolean),
          category: 'employee'
        },
        highlights: this.extractHighlights(this.buildEmployeeSearchContent(employee), query),
        relatedItems: this.buildEmployeeRelatedItems(employee)
      }));
    } catch (error) {
      console.error('Employee search failed:', error);
      return [];
    }
  }

  private async searchDocuments(
    query: string, 
    tenantId: string, 
    filters?: SearchQuery['filters']
  ): Promise<SearchResult[]> {
    try {
      // Search in AI insights as document-like content
      const insights = await this.prisma.aIInsight.findMany({
        where: {
          tenantId,
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } }
          ],
          ...(filters?.dateRange && {
            createdAt: {
              gte: filters.dateRange.start,
              lte: filters.dateRange.end
            }
          })
        },
        take: 30
      });

      return insights.map(insight => ({
        id: insight.id,
        type: 'DOCUMENT' as const,
        title: insight.title,
        description: insight.description,
        content: `${insight.title} ${insight.description}`,
        relevanceScore: this.calculateDocumentRelevance(insight, query),
        metadata: {
          module: insight.category,
          createdAt: insight.createdAt,
          updatedAt: insight.updatedAt,
          tags: [insight.type, insight.severity].filter(Boolean),
          category: 'insight'
        },
        highlights: this.extractHighlights(`${insight.title} ${insight.description}`, query),
        relatedItems: []
      }));
    } catch (error) {
      console.error('Document search failed:', error);
      return [];
    }
  }

  private async searchInsights(
    query: string, 
    tenantId: string, 
    filters?: SearchQuery['filters']
  ): Promise<SearchResult[]> {
    try {
      const decisions = await this.prisma.aIDecision.findMany({
        where: {
          tenantId,
          OR: [
            { decision: { contains: query, mode: 'insensitive' } },
            { category: { contains: query, mode: 'insensitive' } }
          ],
          ...(filters?.dateRange && {
            createdAt: {
              gte: filters.dateRange.start,
              lte: filters.dateRange.end
            }
          })
        },
        take: 30
      });

      return decisions.map(decision => ({
        id: decision.id,
        type: 'INSIGHT' as const,
        title: `AI Decision: ${decision.decision}`,
        description: `${decision.category} decision with ${(decision.confidence * 100).toFixed(0)}% confidence`,
        content: `${decision.decision} ${decision.category}`,
        relevanceScore: this.calculateInsightRelevance(decision, query),
        metadata: {
          module: decision.category,
          createdAt: decision.createdAt,
          updatedAt: decision.updatedAt,
          tags: [decision.category, `${(decision.confidence * 100).toFixed(0)}% confidence`],
          category: 'ai-decision'
        },
        highlights: this.extractHighlights(`${decision.decision} ${decision.category}`, query),
        relatedItems: []
      }));
    } catch (error) {
      console.error('Insights search failed:', error);
      return [];
    }
  }

  /**
   * AI Enhancement Methods
   */
  private async enhanceQueryWithAI(
    query: string, 
    context?: string
  ): Promise<{
    enhancedQuery: string;
    insights: {
      queryIntent: string;
      conceptsIdentified: string[];
      relatedQueries: string[];
    };
  }> {
    try {
      const prompt = `
        Als Semantic Search Enhancer der weGROUP DeepAgent Platform, analysiere und verbessere diese Suchanfrage:
        
        Suchanfrage: "${query}"
        Kontext: ${context || 'ALL'}
        
        Erstelle eine verbesserte Suche mit:
        1. enhancedQuery: Optimierte Suchbegriffe und Synonyme
        2. queryIntent: Erkannte Suchintention
        3. conceptsIdentified: Identifizierte Konzepte und Entitäten
        4. relatedQueries: Verwandte Suchanfragen
        
        Antworte mit strukturiertem JSON.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'Du bist ein Semantic Search Enhancer. Verbessere Suchanfragen für optimale Ergebnisse.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      const enhancement = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      return {
        enhancedQuery: enhancement.enhancedQuery || query,
        insights: {
          queryIntent: enhancement.queryIntent || 'General search',
          conceptsIdentified: enhancement.conceptsIdentified || [],
          relatedQueries: enhancement.relatedQueries || []
        }
      };
    } catch (error) {
      console.error('Query enhancement failed:', error);
      return {
        enhancedQuery: query,
        insights: {
          queryIntent: 'General search',
          conceptsIdentified: [],
          relatedQueries: []
        }
      };
    }
  }

  private async parseNaturalLanguageQuery(
    query: string, 
    context?: string
  ): Promise<{
    cleanedQuery: string;
    inferredContext: 'CRM' | 'HR' | 'FINANCE' | 'PROJECT' | 'ALL';
    extractedFilters: any;
  }> {
    try {
      const prompt = `
        Parse this natural language search query:
        
        Query: "${query}"
        Context: ${context || 'unknown'}
        
        Extract:
        1. cleanedQuery: Core search terms without filters
        2. inferredContext: Best matching module (CRM, HR, FINANCE, PROJECT, ALL)
        3. extractedFilters: Date ranges, types, statuses, etc.
        
        Respond with JSON only.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a natural language query parser. Extract search intent and filters from natural language.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      return {
        cleanedQuery: parsed.cleanedQuery || query,
        inferredContext: parsed.inferredContext || 'ALL',
        extractedFilters: parsed.extractedFilters || {}
      };
    } catch (error) {
      console.error('Natural language parsing failed:', error);
      return {
        cleanedQuery: query,
        inferredContext: 'ALL',
        extractedFilters: {}
      };
    }
  }

  /**
   * Semantic Similarity Calculation
   */
  private async calculateSemanticSimilarity(
    query: string,
    results: SearchResult[]
  ): Promise<void> {
    try {
      // Use AI to calculate semantic similarity
      for (const result of results) {
        result.semanticScore = await this.getSemanticSimilarityScore(query, result.content);
      }
    } catch (error) {
      console.error('Semantic similarity calculation failed:', error);
      // Set default semantic scores
      results.forEach(result => {
        result.semanticScore = result.relevanceScore * 0.8;
      });
    }
  }

  private async getSemanticSimilarityScore(query: string, content: string): Promise<number> {
    try {
      // Simplified semantic similarity using AI
      const prompt = `
        Rate the semantic similarity between this query and content on a scale of 0.0 to 1.0:
        
        Query: "${query}"
        Content: "${content.substring(0, 500)}"
        
        Consider:
        - Conceptual similarity
        - Intent matching
        - Context relevance
        
        Respond with just a number between 0.0 and 1.0.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a semantic similarity calculator. Rate content similarity accurately.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1
      });

      const score = parseFloat(response.choices[0]?.message?.content || '0');
      return Math.max(0, Math.min(1, score));
    } catch (error) {
      console.error('Semantic similarity scoring failed:', error);
      return 0.5; // Default similarity score
    }
  }

  /**
   * Auto-completion Methods
   */
  private async getEntityBasedCompletions(
    partialQuery: string,
    tenantId: string,
    context?: string
  ): Promise<Array<{ completion: string; type: string; confidence: number; preview?: string }>> {
    const completions = [];

    try {
      // Contact name completions
      if (!context || context === 'CRM' || context === 'ALL') {
        const contacts = await this.prisma.contact.findMany({
          where: {
            tenantId,
            OR: [
              { firstName: { startsWith: partialQuery, mode: 'insensitive' } },
              { lastName: { startsWith: partialQuery, mode: 'insensitive' } }
            ]
          },
          take: 5,
          include: { company: true }
        });

        contacts.forEach(contact => {
          completions.push({
            completion: `${contact.firstName} ${contact.lastName}`,
            type: 'Contact',
            confidence: 0.9,
            preview: `${contact.position || 'Contact'} at ${contact.company?.name || 'Unknown Company'}`
          });
        });
      }

      // Employee name completions
      if (!context || context === 'HR' || context === 'ALL') {
        const employees = await this.prisma.employee.findMany({
          where: {
            tenantId,
            OR: [
              { firstName: { startsWith: partialQuery, mode: 'insensitive' } },
              { lastName: { startsWith: partialQuery, mode: 'insensitive' } }
            ]
          },
          take: 5,
          include: { department: true, position: true }
        });

        employees.forEach(employee => {
          completions.push({
            completion: `${employee.firstName} ${employee.lastName}`,
            type: 'Employee',
            confidence: 0.9,
            preview: `${employee.position?.title || 'Employee'} in ${employee.department?.name || 'Unknown Department'}`
          });
        });
      }

      return completions;
    } catch (error) {
      console.error('Entity-based completions failed:', error);
      return [];
    }
  }

  private async getContentBasedCompletions(
    partialQuery: string,
    tenantId: string,
    context?: string
  ): Promise<Array<{ completion: string; type: string; confidence: number; preview?: string }>> {
    try {
      // Search in various content fields
      const [opportunities, insights] = await Promise.all([
        this.prisma.opportunity.findMany({
          where: {
            tenantId,
            title: { contains: partialQuery, mode: 'insensitive' }
          },
          take: 3
        }),
        this.prisma.aIInsight.findMany({
          where: {
            tenantId,
            title: { contains: partialQuery, mode: 'insensitive' }
          },
          take: 3
        })
      ]);

      const completions = [];

      opportunities.forEach(opp => {
        completions.push({
          completion: opp.title,
          type: 'Opportunity',
          confidence: 0.8,
          preview: `${opp.status} - €${opp.estimatedValue?.toLocaleString() || 'N/A'}`
        });
      });

      insights.forEach(insight => {
        completions.push({
          completion: insight.title,
          type: 'Insight',
          confidence: 0.7,
          preview: insight.description.substring(0, 100) + '...'
        });
      });

      return completions;
    } catch (error) {
      console.error('Content-based completions failed:', error);
      return [];
    }
  }

  private async getAIGeneratedCompletions(
    partialQuery: string,
    context?: string
  ): Promise<Array<{ completion: string; type: string; confidence: number; preview?: string }>> {
    try {
      const prompt = `
        Generate 3 intelligent search query completions for: "${partialQuery}"
        Context: ${context || 'business search'}
        
        Suggest completions that would be useful in a business context.
        
        Respond with JSON array: [{"completion": "...", "type": "suggestion", "confidence": 0.6}]
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a search suggestion generator. Create helpful search completions.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5
      });

      const suggestions = JSON.parse(response.choices[0]?.message?.content || '{}');
      return Array.isArray(suggestions.completions) ? suggestions.completions : [];
    } catch (error) {
      console.error('AI-generated completions failed:', error);
      return [];
    }
  }

  /**
   * Helper Methods
   */
  private buildContactsWhereClause(query: string, tenantId: string, filters?: SearchQuery['filters']): any {
    const whereClause: any = {
      tenantId,
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { position: { contains: query, mode: 'insensitive' } },
        { company: { name: { contains: query, mode: 'insensitive' } } }
      ]
    };

    if (filters?.dateRange) {
      whereClause.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      };
    }

    return whereClause;
  }

  private buildOpportunitiesWhereClause(query: string, tenantId: string, filters?: SearchQuery['filters']): any {
    const whereClause: any = {
      tenantId,
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { status: { contains: query, mode: 'insensitive' } },
        { contact: { 
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } }
          ]
        }}
      ]
    };

    if (filters?.dateRange) {
      whereClause.createdAt = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      };
    }

    return whereClause;
  }

  private buildEmployeesWhereClause(query: string, tenantId: string, filters?: SearchQuery['filters']): any {
    const whereClause: any = {
      tenantId,
      OR: [
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { employeeNumber: { contains: query, mode: 'insensitive' } },
        { department: { name: { contains: query, mode: 'insensitive' } } },
        { position: { title: { contains: query, mode: 'insensitive' } } }
      ]
    };

    if (filters?.dateRange) {
      whereClause.startDate = {
        gte: filters.dateRange.start,
        lte: filters.dateRange.end
      };
    }

    return whereClause;
  }

  private buildContactSearchContent(contact: any): string {
    return [
      contact.firstName,
      contact.lastName,
      contact.email,
      contact.phone,
      contact.position,
      contact.company?.name,
      contact.company?.industry
    ].filter(Boolean).join(' ');
  }

  private buildOpportunitySearchContent(opportunity: any): string {
    return [
      opportunity.title,
      opportunity.description,
      opportunity.status,
      opportunity.priority,
      opportunity.contact?.firstName,
      opportunity.contact?.lastName,
      opportunity.assignedUser?.name
    ].filter(Boolean).join(' ');
  }

  private buildEmployeeSearchContent(employee: any): string {
    return [
      employee.firstName,
      employee.lastName,
      employee.email,
      employee.employeeNumber,
      employee.department?.name,
      employee.position?.title,
      employee.position?.description
    ].filter(Boolean).join(' ');
  }

  private calculateContactRelevance(contact: any, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Name matches get highest score
    if (contact.firstName?.toLowerCase().includes(queryLower) || 
        contact.lastName?.toLowerCase().includes(queryLower)) {
      score += 0.4;
    }
    
    // Email matches
    if (contact.email?.toLowerCase().includes(queryLower)) {
      score += 0.3;
    }
    
    // Company matches
    if (contact.company?.name?.toLowerCase().includes(queryLower)) {
      score += 0.2;
    }
    
    // Position matches
    if (contact.position?.toLowerCase().includes(queryLower)) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private calculateOpportunityRelevance(opportunity: any, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Title matches get highest score
    if (opportunity.title?.toLowerCase().includes(queryLower)) {
      score += 0.4;
    }
    
    // Description matches
    if (opportunity.description?.toLowerCase().includes(queryLower)) {
      score += 0.3;
    }
    
    // Status matches
    if (opportunity.status?.toLowerCase().includes(queryLower)) {
      score += 0.2;
    }
    
    // Contact name matches
    if (opportunity.contact?.firstName?.toLowerCase().includes(queryLower) ||
        opportunity.contact?.lastName?.toLowerCase().includes(queryLower)) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private calculateEmployeeRelevance(employee: any, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Name matches get highest score
    if (employee.firstName?.toLowerCase().includes(queryLower) || 
        employee.lastName?.toLowerCase().includes(queryLower)) {
      score += 0.4;
    }
    
    // Department matches
    if (employee.department?.name?.toLowerCase().includes(queryLower)) {
      score += 0.3;
    }
    
    // Position matches
    if (employee.position?.title?.toLowerCase().includes(queryLower)) {
      score += 0.2;
    }
    
    // Employee number matches
    if (employee.employeeNumber?.toLowerCase().includes(queryLower)) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private calculateDocumentRelevance(document: any, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Title matches get highest score
    if (document.title?.toLowerCase().includes(queryLower)) {
      score += 0.5;
    }
    
    // Description matches
    if (document.description?.toLowerCase().includes(queryLower)) {
      score += 0.3;
    }
    
    // Type/category matches
    if (document.type?.toLowerCase().includes(queryLower) ||
        document.category?.toLowerCase().includes(queryLower)) {
      score += 0.2;
    }

    return Math.min(score, 1.0);
  }

  private calculateInsightRelevance(insight: any, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();
    
    // Decision text matches
    if (insight.decision?.toLowerCase().includes(queryLower)) {
      score += 0.4;
    }
    
    // Category matches
    if (insight.category?.toLowerCase().includes(queryLower)) {
      score += 0.3;
    }
    
    // Higher confidence insights get bonus
    score += insight.confidence * 0.3;

    return Math.min(score, 1.0);
  }

  private extractHighlights(content: string, query: string, maxHighlights: number = 3): string[] {
    const highlights = [];
    const queryLower = query.toLowerCase();
    const words = queryLower.split(' ').filter(word => word.length > 2);
    
    for (const word of words) {
      const regex = new RegExp(`(.{0,30}${word}.{0,30})`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        highlights.push(...matches.slice(0, maxHighlights - highlights.length));
        if (highlights.length >= maxHighlights) break;
      }
    }
    
    return highlights.slice(0, maxHighlights);
  }

  private buildContactRelatedItems(contact: any): Array<{ id: string; type: string; title: string; relationship: string }> {
    const related = [];
    
    if (contact.company) {
      related.push({
        id: contact.company.id,
        type: 'Company',
        title: contact.company.name,
        relationship: 'works at'
      });
    }
    
    contact.opportunities?.forEach((opp: any) => {
      related.push({
        id: opp.id,
        type: 'Opportunity',
        title: opp.title,
        relationship: 'associated with'
      });
    });
    
    return related.slice(0, 3);
  }

  private buildOpportunityRelatedItems(opportunity: any): Array<{ id: string; type: string; title: string; relationship: string }> {
    const related = [];
    
    if (opportunity.contact) {
      related.push({
        id: opportunity.contact.id,
        type: 'Contact',
        title: `${opportunity.contact.firstName} ${opportunity.contact.lastName}`,
        relationship: 'primary contact'
      });
    }
    
    if (opportunity.assignedUser) {
      related.push({
        id: opportunity.assignedUser.id,
        type: 'User',
        title: opportunity.assignedUser.name,
        relationship: 'assigned to'
      });
    }
    
    return related;
  }

  private buildEmployeeRelatedItems(employee: any): Array<{ id: string; type: string; title: string; relationship: string }> {
    const related = [];
    
    if (employee.department) {
      related.push({
        id: employee.department.id,
        type: 'Department',
        title: employee.department.name,
        relationship: 'member of'
      });
    }
    
    if (employee.position) {
      related.push({
        id: employee.position.id,
        type: 'Position',
        title: employee.position.title,
        relationship: 'holds position'
      });
    }
    
    return related;
  }

  private sortByRelevance(results: SearchResult[], searchQuery: SearchQuery): SearchResult[] {
    return results.sort((a, b) => {
      // Primary sort by semantic score if available
      if (a.semanticScore !== undefined && b.semanticScore !== undefined) {
        const semanticDiff = b.semanticScore - a.semanticScore;
        if (Math.abs(semanticDiff) > 0.1) return semanticDiff;
      }
      
      // Secondary sort by relevance score
      const relevanceDiff = b.relevanceScore - a.relevanceScore;
      if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;
      
      // Tertiary sort by recency
      return new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime();
    });
  }

  private applyFinalFilters(results: SearchResult[], filters?: SearchQuery['filters']): SearchResult[] {
    let filteredResults = results;
    
    if (filters?.confidence) {
      filteredResults = filteredResults.filter(result => 
        result.relevanceScore >= filters.confidence!
      );
    }
    
    if (filters?.modules?.length) {
      filteredResults = filteredResults.filter(result =>
        filters.modules!.includes(result.metadata.module)
      );
    }
    
    return filteredResults;
  }

  private async generateSearchSuggestions(
    query: string,
    results: SearchResult[],
    tenantId: string
  ): Promise<string[]> {
    try {
      if (results.length === 0) {
        return [
          `"${query}" in contacts`,
          `"${query}" in opportunities`,
          `"${query}" employees`,
          `recent ${query}`,
          `${query} reports`
        ];
      }
      
      // Generate suggestions based on results
      const suggestions = new Set<string>();
      
      // Add type-based suggestions
      const types = [...new Set(results.map(r => r.type))];
      types.forEach(type => {
        suggestions.add(`${query} in ${type.toLowerCase()}s`);
      });
      
      // Add module-based suggestions
      const modules = [...new Set(results.map(r => r.metadata.module))];
      modules.forEach(module => {
        suggestions.add(`${query} in ${module}`);
      });
      
      return Array.from(suggestions).slice(0, 5);
    } catch (error) {
      console.error('Search suggestions generation failed:', error);
      return [];
    }
  }

  private calculateAggregations(results: SearchResult[]): {
    byModule: Record<string, number>;
    byType: Record<string, number>;
    byDateRange: Record<string, number>;
  } {
    const byModule: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byDateRange: Record<string, number> = {};
    
    results.forEach(result => {
      // Module aggregation
      byModule[result.metadata.module] = (byModule[result.metadata.module] || 0) + 1;
      
      // Type aggregation
      byType[result.type] = (byType[result.type] || 0) + 1;
      
      // Date range aggregation
      const date = new Date(result.metadata.createdAt);
      const month = date.toISOString().slice(0, 7); // YYYY-MM
      byDateRange[month] = (byDateRange[month] || 0) + 1;
    });
    
    return { byModule, byType, byDateRange };
  }

  private rankCompletions(
    completions: Array<{ completion: string; type: string; confidence: number; preview?: string }>,
    partialQuery: string
  ): Array<{ completion: string; type: string; confidence: number; preview?: string }> {
    return completions
      .sort((a, b) => {
        // Sort by confidence first
        const confidenceDiff = b.confidence - a.confidence;
        if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;
        
        // Then by how well it starts with the partial query
        const aStartsWith = a.completion.toLowerCase().startsWith(partialQuery.toLowerCase());
        const bStartsWith = b.completion.toLowerCase().startsWith(partialQuery.toLowerCase());
        
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        // Finally by length (shorter is better for completions)
        return a.completion.length - b.completion.length;
      })
      // Remove duplicates
      .filter((completion, index, array) => 
        array.findIndex(c => c.completion === completion.completion) === index
      );
  }

  private generateCacheKey(searchQuery: SearchQuery, tenantId: string): string {
    const keyData = {
      query: searchQuery.query,
      context: searchQuery.context,
      filters: searchQuery.filters,
      tenantId
    };
    return btoa(JSON.stringify(keyData)).substring(0, 50);
  }

  private getCachedResult(key: string): SearchResponse | null {
    const cached = this.queryCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.result;
    }
    if (cached) {
      this.queryCache.delete(key); // Remove expired cache
    }
    return null;
  }

  private setCachedResult(key: string, result: SearchResponse): void {
    this.queryCache.set(key, {
      result,
      timestamp: Date.now()
    });
    
    // Cleanup old cache entries (keep max 100 entries)
    if (this.queryCache.size > 100) {
      const oldestKeys = Array.from(this.queryCache.keys()).slice(0, 20);
      oldestKeys.forEach(key => this.queryCache.delete(key));
    }
  }

  private generateFallbackResponse(searchQuery: SearchQuery, startTime: number): SearchResponse {
    return {
      results: [],
      totalCount: 0,
      searchTime: Date.now() - startTime,
      suggestions: [
        'Try searching for contact names',
        'Search for opportunity titles',
        'Look for employee names',
        'Try searching in specific modules'
      ],
      semanticInsights: {
        queryIntent: 'Search intent could not be determined',
        conceptsIdentified: [],
        relatedQueries: []
      },
      aggregations: {
        byModule: {},
        byType: {},
        byDateRange: {}
      }
    };
  }
}

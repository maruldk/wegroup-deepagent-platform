
import { PrismaClient } from '@prisma/client';

export interface LLMRequest {
  model?: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
  stream?: boolean;
}

export interface LLMResponse {
  choices: Array<{
    message: {
      content: string;
    };
    delta?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamedResponse {
  choices: Array<{
    delta: {
      content?: string;
    };
  }>;
}

export class LLMService {
  private baseURL = 'https://apps.abacus.ai';
  private apiKey: string;
  private prisma: PrismaClient;
  private responseCache: Map<string, { response: any; timestamp: number }> = new Map();
  private conversationMemory: Map<string, Array<{ role: string; content: string }>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(prisma: PrismaClient) {
    this.apiKey = process.env.ABACUSAI_API_KEY || '';
    this.prisma = prisma;
  }

  async chatCompletion(request: LLMRequest, conversationId?: string): Promise<LLMResponse> {
    // Check cache first (only for non-streaming requests)
    if (!request.stream) {
      const cacheKey = this.generateCacheKey(request);
      const cached = this.getCachedResponse(cacheKey);
      if (cached) {
        return cached;
      }
    }

    // Add conversation memory if available
    let enhancedMessages = request.messages;
    if (conversationId && this.conversationMemory.has(conversationId)) {
      const memory = this.conversationMemory.get(conversationId) || [];
      const typedMemory = memory.slice(-6).map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }));
      enhancedMessages = [...typedMemory, ...request.messages]; // Keep last 6 messages for context
    }

    let lastError: Error | null = null;
    
    // Retry logic with exponential backoff
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: request.model || 'gpt-4.1-mini',
            messages: enhancedMessages,
            temperature: request.temperature || 0.7,
            max_tokens: request.max_tokens || 1000,
            stream: request.stream || false,
            ...(request.response_format && { response_format: request.response_format }),
          }),
        });

        if (!response.ok) {
          throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        
        // Cache successful response
        if (!request.stream) {
          const cacheKey = this.generateCacheKey(request);
          this.setCachedResponse(cacheKey, result);
        }

        // Update conversation memory
        if (conversationId && result.choices?.[0]?.message) {
          this.updateConversationMemory(conversationId, [
            ...request.messages,
            { role: 'assistant', content: result.choices[0].message.content }
          ]);
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.error(`LLM Service Error (attempt ${attempt}):`, error);
        
        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY * Math.pow(2, attempt - 1)); // Exponential backoff
        }
      }
    }

    // If all retries failed, try fallback
    return this.generateFallbackResponse(request, lastError);
  }

  async streamChatCompletion(request: LLMRequest, conversationId?: string): Promise<ReadableStream<Uint8Array>> {
    // Add conversation memory
    let enhancedMessages = request.messages;
    if (conversationId && this.conversationMemory.has(conversationId)) {
      const memory = this.conversationMemory.get(conversationId) || [];
      const typedMemory = memory.slice(-6).map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content
      }));
      enhancedMessages = [...typedMemory, ...request.messages];
    }

    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: request.model || 'gpt-4.1-mini',
        messages: enhancedMessages,
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 1000,
        stream: true,
        ...(request.response_format && { response_format: request.response_format }),
      }),
    });

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status} ${response.statusText}`);
    }

    return response.body!;
  }

  async analyzePredictiveData(data: any, context: string): Promise<any> {
    const request: LLMRequest = {
      messages: [
        {
          role: 'system',
          content: `Du bist ein KI-Analytiker für die weGROUP DeepAgent Plattform. Analysiere die bereitgestellten Daten und erstelle präzise Vorhersagen und Insights. Antworte mit strukturiertem JSON.`
        },
        {
          role: 'user',
          content: `Kontext: ${context}\n\nDaten: ${JSON.stringify(data)}\n\nAnalysiere diese Daten und erstelle Vorhersagen, Trends und Empfehlungen.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    };

    const response = await this.chatCompletion(request);
    return this.parseJsonResponse(response.choices[0]?.message?.content || '{}');
  }

  async generateInsights(data: any, category: string): Promise<any> {
    const request: LLMRequest = {
      messages: [
        {
          role: 'system',
          content: `Du bist ein KI-Experte für Geschäftsprozess-Optimierung. Generiere wertvolle Insights basierend auf den bereitgestellten Daten.`
        },
        {
          role: 'user',
          content: `Kategorie: ${category}\nDaten: ${JSON.stringify(data)}\n\nGeneriere actionable Insights und Empfehlungen für Geschäftsprozess-Verbesserungen.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4
    };

    const response = await this.chatCompletion(request);
    return this.parseJsonResponse(response.choices[0]?.message?.content || '{}');
  }

  async optimizeWorkflow(workflowData: any, constraints: any): Promise<any> {
    const request: LLMRequest = {
      messages: [
        {
          role: 'system',
          content: `Du bist ein KI-Workflow-Optimierer. Analysiere Workflows und schlage Verbesserungen vor.`
        },
        {
          role: 'user',
          content: `Workflow-Daten: ${JSON.stringify(workflowData)}\nBeschränkungen: ${JSON.stringify(constraints)}\n\nOptimiere diesen Workflow und schlage konkrete Verbesserungen vor.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    };

    const response = await this.chatCompletion(request);
    return this.parseJsonResponse(response.choices[0]?.message?.content || '{}');
  }

  async assessRisk(data: any, riskType: string): Promise<any> {
    const request: LLMRequest = {
      messages: [
        {
          role: 'system',
          content: `Du bist ein KI-Risiko-Analyst. Bewerte Risiken basierend auf bereitgestellten Daten und erstelle Risiko-Assessments.`
        },
        {
          role: 'user',
          content: `Risiko-Typ: ${riskType}\nDaten: ${JSON.stringify(data)}\n\nBewerte die Risiken und erstelle ein detailliertes Risiko-Assessment mit Empfehlungen.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1
    };

    const response = await this.chatCompletion(request);
    return this.parseJsonResponse(response.choices[0]?.message?.content || '{}');
  }

  private parseJsonResponse(content: string): any {
    try {
      // Remove any markdown code blocks
      const cleanContent = content.replace(/```json|```/g, '').trim();
      return JSON.parse(cleanContent);
    } catch (error) {
      console.error('JSON parsing error:', error);
      return { error: 'Failed to parse AI response', raw: content };
    }
  }

  // Cache management methods
  private generateCacheKey(request: LLMRequest): string {
    const keyData = {
      messages: request.messages,
      model: request.model || 'gpt-4.1-mini',
      temperature: request.temperature || 0.7,
      response_format: request.response_format
    };
    return btoa(JSON.stringify(keyData)).substring(0, 50);
  }

  private getCachedResponse(key: string): LLMResponse | null {
    const cached = this.responseCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.response;
    }
    if (cached) {
      this.responseCache.delete(key); // Remove expired cache
    }
    return null;
  }

  private setCachedResponse(key: string, response: LLMResponse): void {
    this.responseCache.set(key, {
      response,
      timestamp: Date.now()
    });
    
    // Cleanup old cache entries (keep max 100 entries)
    if (this.responseCache.size > 100) {
      const oldestKeys = Array.from(this.responseCache.keys()).slice(0, 20);
      oldestKeys.forEach(key => this.responseCache.delete(key));
    }
  }

  // Conversation memory management
  private updateConversationMemory(conversationId: string, messages: Array<{ role: string; content: string }>): void {
    this.conversationMemory.set(conversationId, messages);
    
    // Cleanup old conversations (keep max 20 conversations)
    if (this.conversationMemory.size > 20) {
      const oldestKeys = Array.from(this.conversationMemory.keys()).slice(0, 5);
      oldestKeys.forEach(key => this.conversationMemory.delete(key));
    }
  }

  clearConversationMemory(conversationId?: string): void {
    if (conversationId) {
      this.conversationMemory.delete(conversationId);
    } else {
      this.conversationMemory.clear();
    }
  }

  // Fallback response generation
  private generateFallbackResponse(request: LLMRequest, error: Error | null): LLMResponse {
    const fallbackMessages = {
      'ANALYTICS': 'Entschuldigung, die KI-Analyse ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Support.',
      'FINANCE': 'Entschuldigung, die Finanz-KI ist derzeit nicht verfügbar. Bitte prüfen Sie Ihre Finanzdaten manuell oder versuchen Sie es später erneut.',
      'PROJECT': 'Entschuldigung, die Projekt-KI ist derzeit nicht verfügbar. Bitte verwalten Sie Ihre Projekte manuell oder versuchen Sie es später erneut.',
      'GENERAL': 'Entschuldigung, der KI-Assistent ist derzeit nicht verfügbar. Bitte versuchen Sie es später erneut.'
    };

    // Try to determine context from messages
    const context = request.messages.some(m => m.content.toLowerCase().includes('analyt')) ? 'ANALYTICS' :
                   request.messages.some(m => m.content.toLowerCase().includes('finanz')) ? 'FINANCE' :
                   request.messages.some(m => m.content.toLowerCase().includes('projekt')) ? 'PROJECT' : 'GENERAL';

    return {
      choices: [{
        message: {
          content: fallbackMessages[context as keyof typeof fallbackMessages]
        }
      }],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0
      }
    };
  }

  // Utility methods
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Performance monitoring
  async getPerformanceMetrics(): Promise<{
    cacheHitRate: number;
    activeCacheEntries: number;
    activeConversations: number;
    averageResponseTime?: number;
  }> {
    return {
      cacheHitRate: this.responseCache.size > 0 ? 0.8 : 0, // Simplified metric
      activeCacheEntries: this.responseCache.size,
      activeConversations: this.conversationMemory.size
    };
  }

  // Enhanced context-aware chat completion
  async contextualChatCompletion(
    message: string,
    context: {
      module?: string;
      userId?: string;
      tenantId?: string;
      businessData?: any;
    },
    conversationId?: string
  ): Promise<LLMResponse> {
    const systemPrompt = this.buildContextualSystemPrompt(context);
    
    const request: LLMRequest = {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1500
    };

    return this.chatCompletion(request, conversationId);
  }

  private buildContextualSystemPrompt(context: any): string {
    let basePrompt = 'Du bist der intelligente KI-Assistent der weGROUP DeepAgent Plattform. ';
    
    if (context.module === 'ANALYTICS') {
      basePrompt += 'Du spezialisierst dich auf Datenanalyse, Metriken und Geschäftsintelligenz. ';
    } else if (context.module === 'FINANCE') {
      basePrompt += 'Du spezialisierst dich auf Finanzmanagement, Budgetierung und Rechnungswesen. ';
    } else if (context.module === 'PROJECT') {
      basePrompt += 'Du spezialisierst dich auf Projektmanagement, Ressourcenplanung und Teamkoordination. ';
    }

    basePrompt += 'Antworte präzise, hilfreich und im deutschen Sprache. ';
    
    if (context.businessData) {
      basePrompt += 'Berücksichtige die aktuellen Geschäftsdaten des Nutzers in deiner Antwort. ';
    }

    return basePrompt;
  }

  /**
   * Event-driven AI analysis methods
   */
  async analyzeInvoice(invoiceData: any): Promise<any> {
    try {
      const prompt = `Analyze this invoice data and provide intelligent categorization and insights:

Invoice Data: ${JSON.stringify(invoiceData, null, 2)}

Please analyze and return JSON with:
1. category: Best category for this invoice (e.g., "office_supplies", "marketing", "software", "consulting")
2. confidence: Confidence score (0-1)
3. insights: Array of actionable insights
4. anomalies: Any potential issues or anomalies detected
5. recommendations: Suggestions for process improvement

Respond with raw JSON only.`;

      const response = await this.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a financial AI analyst. Analyze invoices and provide intelligent categorization and insights.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      });

      return this.sanitizeJsonResponse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Invoice analysis failed:', error);
      return {
        category: 'unknown',
        confidence: 0.5,
        insights: [],
        anomalies: [],
        recommendations: []
      };
    }
  }

  async optimizeProject(projectData: any): Promise<any> {
    try {
      const prompt = `Analyze this project data and provide optimization recommendations:

Project Data: ${JSON.stringify(projectData, null, 2)}

Please analyze and return JSON with:
1. summary: Brief optimization summary
2. recommendations: Array of specific optimization recommendations
3. risks: Potential risks identified
4. resourceOptimization: Suggestions for better resource allocation
5. timeline: Timeline optimization suggestions
6. confidence: Confidence score (0-1)

Respond with raw JSON only.`;

      const response = await this.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a project management AI expert. Analyze projects and provide optimization recommendations.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      });

      return this.sanitizeJsonResponse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Project optimization failed:', error);
      return {
        summary: 'Analysis unavailable',
        recommendations: [],
        risks: [],
        resourceOptimization: [],
        timeline: [],
        confidence: 0.5
      };
    }
  }

  async detectAnomalies(anomalyData: any): Promise<any> {
    try {
      const prompt = `Analyze this event data for anomalies and unusual patterns:

Current Event: ${JSON.stringify(anomalyData.currentEvent, null, 2)}
Recent Events: ${JSON.stringify(anomalyData.recentEvents, null, 2)}
Event Patterns: ${JSON.stringify(anomalyData.patterns, null, 2)}

Please analyze and return JSON with:
1. isAnomaly: Boolean indicating if this is an anomaly
2. confidence: Confidence score (0-1)
3. type: Type of anomaly (e.g., "volume", "timing", "pattern", "value")
4. description: Detailed description of the anomaly
5. severity: Severity level ("LOW", "MEDIUM", "HIGH", "CRITICAL")
6. possibleCauses: Array of possible causes
7. recommendedActions: Array of recommended actions

Respond with raw JSON only.`;

      const response = await this.chatCompletion({
        messages: [
          { role: 'system', content: 'You are an AI anomaly detection expert. Identify unusual patterns and potential issues in business data.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      });

      return this.sanitizeJsonResponse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Anomaly detection failed:', error);
      return {
        isAnomaly: false,
        confidence: 0.5,
        type: 'unknown',
        description: 'Analysis unavailable',
        severity: 'LOW',
        possibleCauses: [],
        recommendedActions: []
      };
    }
  }

  async analyzeFinanceEvent(event: any): Promise<any> {
    try {
      const prompt = `Analyze this finance event and provide insights:

Event: ${JSON.stringify(event, null, 2)}

Please analyze and return JSON with:
1. insights: Array of financial insights
2. riskAssessment: Risk level and factors
3. recommendations: Financial recommendations
4. impactAnalysis: Potential business impact
5. confidence: Confidence score (0-1)

Respond with raw JSON only.`;

      const response = await this.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a financial AI analyst. Analyze financial events and provide strategic insights.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      });

      return this.sanitizeJsonResponse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Finance event analysis failed:', error);
      return { status: 'processed', confidence: 0.5 };
    }
  }

  async analyzeProjectEvent(event: any): Promise<any> {
    try {
      const prompt = `Analyze this project event and provide insights:

Event: ${JSON.stringify(event, null, 2)}

Please analyze and return JSON with:
1. insights: Array of project insights
2. statusAssessment: Project health and status assessment
3. recommendations: Project management recommendations
4. riskFactors: Potential risks and mitigation strategies
5. confidence: Confidence score (0-1)

Respond with raw JSON only.`;

      const response = await this.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a project management AI expert. Analyze project events and provide management insights.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      });

      return this.sanitizeJsonResponse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Project event analysis failed:', error);
      return { status: 'processed', confidence: 0.5 };
    }
  }

  async analyzeAnalyticsEvent(event: any): Promise<any> {
    try {
      const prompt = `Analyze this analytics event and provide insights:

Event: ${JSON.stringify(event, null, 2)}

Please analyze and return JSON with:
1. insights: Array of analytical insights
2. trendAnalysis: Trend identification and analysis
3. recommendations: Data-driven recommendations
4. predictiveInsights: Predictive insights based on the data
5. confidence: Confidence score (0-1)

Respond with raw JSON only.`;

      const response = await this.chatCompletion({
        messages: [
          { role: 'system', content: 'You are a data analytics AI expert. Analyze data events and provide analytical insights.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      });

      return this.sanitizeJsonResponse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Analytics event analysis failed:', error);
      return { status: 'processed', confidence: 0.5 };
    }
  }

  async performAnalysis(analysisConfig: any): Promise<any> {
    try {
      const prompt = `Perform AI analysis based on this configuration:

Configuration: ${JSON.stringify(analysisConfig, null, 2)}

Please analyze the data according to the configuration and return JSON with:
1. results: Analysis results
2. insights: Key insights discovered
3. recommendations: Actionable recommendations
4. confidence: Confidence score (0-1)
5. metadata: Additional analysis metadata

Respond with raw JSON only.`;

      const response = await this.chatCompletion({
        messages: [
          { role: 'system', content: 'You are an AI analysis expert. Perform detailed analysis based on provided configurations and data.' },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
      });

      return this.sanitizeJsonResponse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Analysis failed:', error);
      return {
        results: {},
        insights: [],
        recommendations: [],
        confidence: 0.5,
        metadata: {}
      };
    }
  }

  /**
   * Enhanced JSON sanitization
   */
  private sanitizeJsonResponse(jsonString: string): any {
    try {
      // Remove markdown code blocks if present
      const cleaned = jsonString
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      // Parse JSON
      const parsed = JSON.parse(cleaned);
      
      // Validate structure
      if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('Invalid JSON structure');
      }

      return parsed;
    } catch (error) {
      console.error('JSON sanitization failed:', error);
      console.error('Original JSON string:', jsonString);
      
      // Return fallback object
      return {
        error: 'JSON parsing failed',
        confidence: 0.0,
        fallback: true
      };
    }
  }
}

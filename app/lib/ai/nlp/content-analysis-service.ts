
import { PrismaClient } from '@prisma/client';
import { LLMService } from '../llm-service';

export interface ContentAnalysisRequest {
  content: string;
  type: 'EMAIL' | 'DOCUMENT' | 'NOTE' | 'DESCRIPTION' | 'COMMENT' | 'OTHER';
  context?: {
    module?: 'CRM' | 'HR' | 'FINANCE' | 'PROJECT';
    relatedEntityId?: string;
    relatedEntityType?: string;
  };
  analysisTypes: Array<'SENTIMENT' | 'KEYWORDS' | 'ENTITIES' | 'SUMMARY' | 'CLASSIFICATION' | 'INTENT' | 'LANGUAGE'>;
  options?: {
    language?: string;
    confidenceThreshold?: number;
    maxKeywords?: number;
    maxEntities?: number;
  };
}

export interface ContentAnalysisResult {
  contentId: string;
  sentiment?: {
    score: number; // -1 (negative) to 1 (positive)
    magnitude: number; // 0 to 1 (strength of emotion)
    label: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | 'MIXED';
    confidence: number;
    emotions?: Array<{
      emotion: string;
      intensity: number;
    }>;
  };
  keywords?: Array<{
    keyword: string;
    relevance: number;
    frequency: number;
    category?: string;
  }>;
  entities?: Array<{
    entity: string;
    type: 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'DATE' | 'MONEY' | 'PRODUCT' | 'OTHER';
    confidence: number;
    mentions: Array<{
      text: string;
      startOffset: number;
      endOffset: number;
    }>;
  }>;
  summary?: {
    text: string;
    keyPoints: string[];
    confidence: number;
  };
  classification?: {
    categories: Array<{
      category: string;
      confidence: number;
      subcategories?: string[];
    }>;
    intent?: string;
    urgency?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  };
  language?: {
    detected: string;
    confidence: number;
    alternatives?: Array<{
      language: string;
      confidence: number;
    }>;
  };
  metadata: {
    processingTime: number;
    modelVersion: string;
    analysisTimestamp: Date;
    wordCount: number;
    charCount: number;
  };
}

export class ContentAnalysisService {
  private prisma: PrismaClient;
  private llmService: LLMService;
  private analysisCache: Map<string, { result: ContentAnalysisResult; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.prisma = new PrismaClient();
    this.llmService = new LLMService(this.prisma);
  }

  /**
   * Main Content Analysis Method
   */
  async analyzeContent(request: ContentAnalysisRequest): Promise<ContentAnalysisResult> {
    const startTime = Date.now();
    
    // Generate content ID for tracking
    const contentId = this.generateContentId(request.content);
    
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const result: ContentAnalysisResult = {
        contentId,
        metadata: {
          processingTime: 0,
          modelVersion: '1.0.0',
          analysisTimestamp: new Date(),
          wordCount: this.countWords(request.content),
          charCount: request.content.length
        }
      };

      // Perform requested analyses
      const analysisPromises = request.analysisTypes.map(type => 
        this.performSpecificAnalysis(type, request)
      );

      const analysisResults = await Promise.allSettled(analysisPromises);

      // Merge results
      analysisResults.forEach((promiseResult, index) => {
        if (promiseResult.status === 'fulfilled') {
          const analysisType = request.analysisTypes[index];
          this.mergeAnalysisResult(result, analysisType, promiseResult.value);
        } else {
          console.error(`Analysis ${request.analysisTypes[index]} failed:`, promiseResult.reason);
        }
      });

      // Update processing time
      result.metadata.processingTime = Date.now() - startTime;

      // Cache the result
      this.setCachedResult(cacheKey, result);

      // Store analysis in database for learning
      await this.storeAnalysisResult(request, result);

      return result;
    } catch (error) {
      console.error('Content analysis failed:', error);
      return this.generateFallbackResult(contentId, request, startTime);
    }
  }

  /**
   * Batch Content Analysis
   */
  async analyzeBatch(
    requests: ContentAnalysisRequest[]
  ): Promise<ContentAnalysisResult[]> {
    try {
      // Process in batches to avoid overwhelming the system
      const batchSize = 5;
      const results = [];

      for (let i = 0; i < requests.length; i += batchSize) {
        const batch = requests.slice(i, i + batchSize);
        const batchPromises = batch.map(request => this.analyzeContent(request));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error('Batch analysis item failed:', result.reason);
            // Add fallback result for failed items
            results.push(this.generateFallbackResult('batch_failed', batch[0], Date.now()));
          }
        });
      }

      return results;
    } catch (error) {
      console.error('Batch content analysis failed:', error);
      return [];
    }
  }

  /**
   * Smart Text Extraction and Preprocessing
   */
  async extractAndAnalyze(
    rawContent: string,
    contentType: string = 'text/plain'
  ): Promise<{
    extractedText: string;
    analysis: ContentAnalysisResult;
    extractionMetadata: {
      originalFormat: string;
      extractionMethod: string;
      confidence: number;
    };
  }> {
    try {
      // Extract text based on content type
      const extraction = await this.extractText(rawContent, contentType);
      
      // Analyze extracted text
      const analysis = await this.analyzeContent({
        content: extraction.text,
        type: 'DOCUMENT',
        analysisTypes: ['SENTIMENT', 'KEYWORDS', 'ENTITIES', 'SUMMARY', 'CLASSIFICATION'],
        options: {
          confidenceThreshold: 0.6,
          maxKeywords: 20,
          maxEntities: 15
        }
      });

      return {
        extractedText: extraction.text,
        analysis,
        extractionMetadata: {
          originalFormat: contentType,
          extractionMethod: extraction.method,
          confidence: extraction.confidence
        }
      };
    } catch (error) {
      console.error('Text extraction and analysis failed:', error);
      throw error;
    }
  }

  /**
   * Specific Analysis Methods
   */
  private async performSpecificAnalysis(
    type: ContentAnalysisRequest['analysisTypes'][0],
    request: ContentAnalysisRequest
  ): Promise<any> {
    switch (type) {
      case 'SENTIMENT':
        return this.analyzeSentiment(request.content);
      case 'KEYWORDS':
        return this.extractKeywords(request.content, request.options);
      case 'ENTITIES':
        return this.extractEntities(request.content, request.options);
      case 'SUMMARY':
        return this.generateSummary(request.content);
      case 'CLASSIFICATION':
        return this.classifyContent(request.content, request.context);
      case 'INTENT':
        return this.analyzeIntent(request.content, request.context);
      case 'LANGUAGE':
        return this.detectLanguage(request.content);
      default:
        throw new Error(`Unsupported analysis type: ${type}`);
    }
  }

  /**
   * Sentiment Analysis
   */
  private async analyzeSentiment(content: string): Promise<any> {
    try {
      const prompt = `
        Analyze the sentiment of this text:
        
        "${content}"
        
        Provide a detailed sentiment analysis with:
        1. score: Number from -1 (very negative) to 1 (very positive)
        2. magnitude: Emotional intensity from 0 to 1
        3. label: POSITIVE, NEGATIVE, NEUTRAL, or MIXED
        4. confidence: Confidence in the analysis (0-1)
        5. emotions: Array of detected emotions with intensity
        
        Respond with JSON only.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Analyze text sentiment accurately and provide detailed emotional insights.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return {
        score: 0,
        magnitude: 0.5,
        label: 'NEUTRAL',
        confidence: 0.5,
        emotions: []
      };
    }
  }

  /**
   * Keyword Extraction
   */
  private async extractKeywords(
    content: string,
    options?: ContentAnalysisRequest['options']
  ): Promise<any> {
    try {
      const maxKeywords = options?.maxKeywords || 10;
      
      const prompt = `
        Extract the most important keywords from this text:
        
        "${content}"
        
        Extract up to ${maxKeywords} keywords with:
        1. keyword: The actual keyword or phrase
        2. relevance: Relevance score 0-1
        3. frequency: How often it appears
        4. category: Type of keyword (topic, entity, action, etc.)
        
        Focus on business-relevant terms, proper nouns, and key concepts.
        
        Respond with JSON array of keyword objects.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a keyword extraction expert. Identify the most important and relevant keywords from business text.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      return result.keywords || [];
    } catch (error) {
      console.error('Keyword extraction failed:', error);
      return [];
    }
  }

  /**
   * Entity Extraction
   */
  private async extractEntities(
    content: string,
    options?: ContentAnalysisRequest['options']
  ): Promise<any> {
    try {
      const maxEntities = options?.maxEntities || 15;
      
      const prompt = `
        Extract named entities from this text:
        
        "${content}"
        
        Extract up to ${maxEntities} entities with:
        1. entity: The entity text
        2. type: PERSON, ORGANIZATION, LOCATION, DATE, MONEY, PRODUCT, or OTHER
        3. confidence: Confidence score 0-1
        4. mentions: Array of mentions with text, startOffset, endOffset
        
        Focus on business-relevant entities like people, companies, products, dates, and amounts.
        
        Respond with JSON array of entity objects.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a named entity recognition expert. Extract business-relevant entities accurately.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      return result.entities || [];
    } catch (error) {
      console.error('Entity extraction failed:', error);
      return [];
    }
  }

  /**
   * Text Summarization
   */
  private async generateSummary(content: string): Promise<any> {
    try {
      const prompt = `
        Create a concise summary of this text:
        
        "${content}"
        
        Provide:
        1. text: A concise summary (2-3 sentences max)
        2. keyPoints: Array of the most important points (max 5)
        3. confidence: Confidence in the summary quality (0-1)
        
        Focus on the main business points and actionable information.
        
        Respond with JSON only.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a text summarization expert. Create concise, accurate summaries that capture the essential business information.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Summary generation failed:', error);
      return {
        text: 'Summary not available',
        keyPoints: [],
        confidence: 0.5
      };
    }
  }

  /**
   * Content Classification
   */
  private async classifyContent(
    content: string,
    context?: ContentAnalysisRequest['context']
  ): Promise<any> {
    try {
      const contextInfo = context ? `
        Context: ${context.module || 'Unknown module'}
        Related to: ${context.relatedEntityType || 'Unknown'} (${context.relatedEntityId || 'N/A'})
      ` : '';

      const prompt = `
        Classify this business content:
        
        "${content}"
        ${contextInfo}
        
        Provide classification with:
        1. categories: Array of relevant categories with confidence scores
        2. intent: Main intent or purpose of the content
        3. urgency: LOW, MEDIUM, HIGH, or URGENT
        
        Consider business context like customer service, sales, HR, finance, project management.
        
        Respond with JSON only.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a content classification expert. Classify business content accurately considering context and intent.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Content classification failed:', error);
      return {
        categories: [],
        intent: 'Unknown',
        urgency: 'MEDIUM'
      };
    }
  }

  /**
   * Intent Analysis
   */
  private async analyzeIntent(
    content: string,
    context?: ContentAnalysisRequest['context']
  ): Promise<string> {
    try {
      const prompt = `
        Analyze the intent behind this text:
        
        "${content}"
        
        What is the primary intent or goal? Consider if it's:
        - Information seeking
        - Making a request
        - Providing feedback
        - Reporting an issue
        - Making a decision
        - Other business intent
        
        Provide a brief, clear description of the intent.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are an intent analysis expert. Identify the primary intent or goal behind business communications.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      return response.choices[0]?.message?.content || 'Intent unclear';
    } catch (error) {
      console.error('Intent analysis failed:', error);
      return 'Intent analysis unavailable';
    }
  }

  /**
   * Language Detection
   */
  private async detectLanguage(content: string): Promise<any> {
    try {
      // Simple language detection using character patterns and common words
      const languagePatterns = {
        'en': /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi,
        'de': /\b(der|die|das|und|oder|aber|in|an|zu|für|von|mit|bei)\b/gi,
        'fr': /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi,
        'es': /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi,
        'it': /\b(il|la|gli|le|e|o|ma|in|su|a|per|di|con|da)\b/gi
      };

      const scores: Record<string, number> = {};
      
      for (const [lang, pattern] of Object.entries(languagePatterns)) {
        const matches = content.match(pattern);
        scores[lang] = matches ? matches.length : 0;
      }

      // Find the language with the highest score
      const detectedLang = Object.entries(scores).reduce((a, b) => 
        scores[a[0]] > scores[b[0]] ? a : b
      )[0];

      const totalMatches = Object.values(scores).reduce((sum, score) => sum + score, 0);
      const confidence = totalMatches > 0 ? scores[detectedLang] / totalMatches : 0.5;

      return {
        detected: detectedLang,
        confidence: Math.min(confidence, 0.95),
        alternatives: Object.entries(scores)
          .filter(([lang]) => lang !== detectedLang)
          .map(([lang, score]) => ({
            language: lang,
            confidence: totalMatches > 0 ? score / totalMatches : 0
          }))
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 2)
      };
    } catch (error) {
      console.error('Language detection failed:', error);
      return {
        detected: 'en',
        confidence: 0.5,
        alternatives: []
      };
    }
  }

  /**
   * Text Extraction Methods
   */
  private async extractText(rawContent: string, contentType: string): Promise<{
    text: string;
    method: string;
    confidence: number;
  }> {
    try {
      // For now, assume content is already text
      // In production, this would handle various file formats
      if (contentType.includes('text') || contentType.includes('json')) {
        return {
          text: rawContent,
          method: 'direct',
          confidence: 1.0
        };
      }

      // For other types, use AI to extract meaningful content
      const prompt = `
        Extract the main text content from this data:
        
        ${rawContent.substring(0, 2000)}
        
        Extract only the readable text content, removing formatting, metadata, etc.
        If this appears to be structured data, extract the key textual information.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a text extraction expert. Extract clean, readable text from various content formats.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2
      });

      return {
        text: response.choices[0]?.message?.content || rawContent,
        method: 'ai_extraction',
        confidence: 0.8
      };
    } catch (error) {
      console.error('Text extraction failed:', error);
      return {
        text: rawContent,
        method: 'fallback',
        confidence: 0.5
      };
    }
  }

  /**
   * Helper Methods
   */
  private mergeAnalysisResult(
    result: ContentAnalysisResult,
    analysisType: string,
    analysisResult: any
  ): void {
    switch (analysisType) {
      case 'SENTIMENT':
        result.sentiment = analysisResult;
        break;
      case 'KEYWORDS':
        result.keywords = analysisResult;
        break;
      case 'ENTITIES':
        result.entities = analysisResult;
        break;
      case 'SUMMARY':
        result.summary = analysisResult;
        break;
      case 'CLASSIFICATION':
        result.classification = analysisResult;
        break;
      case 'LANGUAGE':
        result.language = analysisResult;
        break;
    }
  }

  private generateContentId(content: string): string {
    // Generate a hash-like ID for content tracking
    const hashInput = content.substring(0, 100) + content.length;
    return `content_${Date.now()}_${hashInput.length}`;
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  private generateCacheKey(request: ContentAnalysisRequest): string {
    const keyData = {
      content: request.content.substring(0, 100), // First 100 chars
      type: request.type,
      analysisTypes: request.analysisTypes.sort(),
      options: request.options
    };
    return btoa(JSON.stringify(keyData)).substring(0, 50);
  }

  private getCachedResult(key: string): ContentAnalysisResult | null {
    const cached = this.analysisCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.result;
    }
    if (cached) {
      this.analysisCache.delete(key);
    }
    return null;
  }

  private setCachedResult(key: string, result: ContentAnalysisResult): void {
    this.analysisCache.set(key, {
      result,
      timestamp: Date.now()
    });
    
    // Cleanup old cache entries
    if (this.analysisCache.size > 200) {
      const oldestKeys = Array.from(this.analysisCache.keys()).slice(0, 50);
      oldestKeys.forEach(key => this.analysisCache.delete(key));
    }
  }

  private async storeAnalysisResult(
    request: ContentAnalysisRequest,
    result: ContentAnalysisResult
  ): Promise<void> {
    try {
      // Store for learning and improvement
      // This would typically go to a dedicated analytics table
      console.log('Storing analysis result for learning:', {
        contentId: result.contentId,
        analysisTypes: request.analysisTypes,
        confidence: result.sentiment?.confidence || 0.5
      });
    } catch (error) {
      console.error('Failed to store analysis result:', error);
    }
  }

  private generateFallbackResult(
    contentId: string,
    request: ContentAnalysisRequest,
    startTime: number
  ): ContentAnalysisResult {
    return {
      contentId,
      sentiment: request.analysisTypes.includes('SENTIMENT') ? {
        score: 0,
        magnitude: 0.5,
        label: 'NEUTRAL',
        confidence: 0.3
      } : undefined,
      keywords: request.analysisTypes.includes('KEYWORDS') ? [] : undefined,
      entities: request.analysisTypes.includes('ENTITIES') ? [] : undefined,
      summary: request.analysisTypes.includes('SUMMARY') ? {
        text: 'Summary not available',
        keyPoints: [],
        confidence: 0.3
      } : undefined,
      classification: request.analysisTypes.includes('CLASSIFICATION') ? {
        categories: [],
        intent: 'Unknown',
        urgency: 'MEDIUM'
      } : undefined,
      language: request.analysisTypes.includes('LANGUAGE') ? {
        detected: 'en',
        confidence: 0.5
      } : undefined,
      metadata: {
        processingTime: Date.now() - startTime,
        modelVersion: '1.0.0-fallback',
        analysisTimestamp: new Date(),
        wordCount: this.countWords(request.content),
        charCount: request.content.length
      }
    };
  }
}

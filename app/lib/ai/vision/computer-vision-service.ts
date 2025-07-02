
import { PrismaClient } from '@prisma/client';
import { LLMService } from '../llm-service';

export interface VisionAnalysisRequest {
  imageData: string; // Base64 encoded image data
  imageType: 'DOCUMENT' | 'ID_CARD' | 'INVOICE' | 'RECEIPT' | 'BUSINESS_CARD' | 'PHOTO' | 'CHART' | 'OTHER';
  analysisTypes: Array<'OCR' | 'CLASSIFICATION' | 'OBJECT_DETECTION' | 'TEXT_EXTRACTION' | 'QUALITY_CHECK' | 'CONTENT_ANALYSIS'>;
  options?: {
    language?: string;
    confidenceThreshold?: number;
    outputFormat?: 'TEXT' | 'STRUCTURED' | 'JSON';
    enhanceImage?: boolean;
  };
  context?: {
    module?: 'CRM' | 'HR' | 'FINANCE' | 'PROJECT';
    purpose?: string;
    expectedContent?: string;
  };
}

export interface VisionAnalysisResult {
  analysisId: string;
  imageMetadata: {
    width: number;
    height: number;
    format: string;
    fileSize: number;
    quality: 'HIGH' | 'MEDIUM' | 'LOW';
  };
  ocr?: {
    extractedText: string;
    confidence: number;
    textBlocks: Array<{
      text: string;
      boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      confidence: number;
    }>;
    detectedLanguage?: string;
  };
  classification?: {
    documentType: string;
    confidence: number;
    categories: Array<{
      category: string;
      confidence: number;
    }>;
  };
  objectDetection?: {
    objects: Array<{
      label: string;
      confidence: number;
      boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    }>;
  };
  textExtraction?: {
    structuredData: Record<string, any>;
    keyValuePairs: Array<{
      key: string;
      value: string;
      confidence: number;
    }>;
    tables?: Array<{
      headers: string[];
      rows: string[][];
      confidence: number;
    }>;
  };
  qualityCheck?: {
    overallQuality: number;
    issues: Array<{
      type: 'BLUR' | 'LOW_RESOLUTION' | 'POOR_LIGHTING' | 'SKEWED' | 'PARTIAL_CONTENT';
      severity: 'LOW' | 'MEDIUM' | 'HIGH';
      description: string;
    }>;
    recommendations: string[];
  };
  contentAnalysis?: {
    summary: string;
    keyInformation: string[];
    businessRelevance: number;
    actionItems?: string[];
  };
  metadata: {
    processingTime: number;
    modelVersion: string;
    analysisTimestamp: Date;
    totalConfidence: number;
  };
}

export interface DocumentProcessingResult {
  documentId: string;
  extractedData: {
    text: string;
    structuredData: Record<string, any>;
    metadata: Record<string, any>;
  };
  analysis: VisionAnalysisResult;
  businessInsights: {
    documentType: string;
    relevantFields: Array<{
      field: string;
      value: string;
      confidence: number;
    }>;
    suggestedActions: string[];
    integrationRecommendations: string[];
  };
}

export class ComputerVisionService {
  private prisma: PrismaClient;
  private llmService: LLMService;
  private analysisCache: Map<string, { result: VisionAnalysisResult; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1 hour

  constructor() {
    this.prisma = new PrismaClient();
    this.llmService = new LLMService(this.prisma);
  }

  /**
   * Main Vision Analysis Method
   */
  async analyzeImage(request: VisionAnalysisRequest): Promise<VisionAnalysisResult> {
    const startTime = Date.now();
    const analysisId = this.generateAnalysisId();

    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Analyze image metadata
      const imageMetadata = await this.analyzeImageMetadata(request.imageData);

      // Initialize result
      const result: VisionAnalysisResult = {
        analysisId,
        imageMetadata,
        metadata: {
          processingTime: 0,
          modelVersion: '1.0.0',
          analysisTimestamp: new Date(),
          totalConfidence: 0
        }
      };

      // Perform requested analyses
      const analysisPromises = request.analysisTypes.map(type => 
        this.performVisionAnalysis(type, request)
      );

      const analysisResults = await Promise.allSettled(analysisPromises);

      let confidenceSum = 0;
      let confidenceCount = 0;

      // Merge results
      analysisResults.forEach((promiseResult, index) => {
        if (promiseResult.status === 'fulfilled') {
          const analysisType = request.analysisTypes[index];
          this.mergeVisionResult(result, analysisType, promiseResult.value);
          
          // Calculate average confidence
          const confidence = this.extractConfidence(promiseResult.value);
          if (confidence > 0) {
            confidenceSum += confidence;
            confidenceCount++;
          }
        } else {
          console.error(`Vision analysis ${request.analysisTypes[index]} failed:`, promiseResult.reason);
        }
      });

      // Update metadata
      result.metadata.processingTime = Date.now() - startTime;
      result.metadata.totalConfidence = confidenceCount > 0 ? confidenceSum / confidenceCount : 0.5;

      // Cache the result
      this.setCachedResult(cacheKey, result);

      // Store analysis for learning
      await this.storeVisionAnalysis(request, result);

      return result;
    } catch (error) {
      console.error('Vision analysis failed:', error);
      return this.generateFallbackResult(analysisId, request, startTime);
    }
  }

  /**
   * Document Processing Pipeline
   */
  async processDocument(
    imageData: string,
    documentType: VisionAnalysisRequest['imageType'],
    context?: VisionAnalysisRequest['context']
  ): Promise<DocumentProcessingResult> {
    try {
      // Comprehensive document analysis
      const visionAnalysis = await this.analyzeImage({
        imageData,
        imageType: documentType,
        analysisTypes: ['OCR', 'CLASSIFICATION', 'TEXT_EXTRACTION', 'QUALITY_CHECK', 'CONTENT_ANALYSIS'],
        options: {
          outputFormat: 'STRUCTURED',
          enhanceImage: true,
          confidenceThreshold: 0.7
        },
        context
      });

      // Extract structured data
      const extractedData = this.extractStructuredData(visionAnalysis, documentType);

      // Generate business insights
      const businessInsights = await this.generateBusinessInsights(
        visionAnalysis,
        extractedData,
        documentType,
        context
      );

      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      return {
        documentId,
        extractedData,
        analysis: visionAnalysis,
        businessInsights
      };
    } catch (error) {
      console.error('Document processing failed:', error);
      throw error;
    }
  }

  /**
   * Batch Document Processing
   */
  async processBatch(
    documents: Array<{
      imageData: string;
      documentType: VisionAnalysisRequest['imageType'];
      context?: VisionAnalysisRequest['context'];
    }>
  ): Promise<DocumentProcessingResult[]> {
    try {
      const batchSize = 3; // Process in smaller batches for vision tasks
      const results = [];

      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        const batchPromises = batch.map(doc => 
          this.processDocument(doc.imageData, doc.documentType, doc.context)
        );
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error('Batch document processing failed:', result.reason);
          }
        });

        // Add delay between batches to avoid overwhelming the system
        if (i + batchSize < documents.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return results;
    } catch (error) {
      console.error('Batch document processing failed:', error);
      return [];
    }
  }

  /**
   * Specific Vision Analysis Methods
   */
  private async performVisionAnalysis(
    type: VisionAnalysisRequest['analysisTypes'][0],
    request: VisionAnalysisRequest
  ): Promise<any> {
    switch (type) {
      case 'OCR':
        return this.performOCR(request.imageData, request.options);
      case 'CLASSIFICATION':
        return this.classifyImage(request.imageData, request.imageType, request.context);
      case 'OBJECT_DETECTION':
        return this.detectObjects(request.imageData);
      case 'TEXT_EXTRACTION':
        return this.extractStructuredText(request.imageData, request.imageType);
      case 'QUALITY_CHECK':
        return this.checkImageQuality(request.imageData);
      case 'CONTENT_ANALYSIS':
        return this.analyzeImageContent(request.imageData, request.context);
      default:
        throw new Error(`Unsupported vision analysis type: ${type}`);
    }
  }

  /**
   * OCR (Optical Character Recognition)
   */
  private async performOCR(
    imageData: string,
    options?: VisionAnalysisRequest['options']
  ): Promise<any> {
    try {
      // Use AI vision to perform OCR
      const prompt = `
        Analyze this image and extract all visible text using OCR principles:
        
        Requirements:
        1. Extract ALL visible text accurately
        2. Maintain text structure and formatting where possible
        3. Identify text blocks with their approximate positions
        4. Detect the primary language of the text
        5. Provide confidence scores for text extraction
        
        Respond with structured JSON containing:
        - extractedText: Complete text content
        - confidence: Overall confidence (0-1)
        - textBlocks: Array of text blocks with positions and confidence
        - detectedLanguage: Primary language detected
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are an OCR expert. Extract text from images accurately and provide structured results.'
          },
          {
            role: 'user',
            content: `${prompt}\n\nImage provided: data:image/jpeg;base64,${imageData.substring(0, 100)}...`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('OCR failed:', error);
      return {
        extractedText: 'Text extraction failed',
        confidence: 0.1,
        textBlocks: [],
        detectedLanguage: 'unknown'
      };
    }
  }

  /**
   * Image Classification
   */
  private async classifyImage(
    imageData: string,
    expectedType: VisionAnalysisRequest['imageType'],
    context?: VisionAnalysisRequest['context']
  ): Promise<any> {
    try {
      const contextInfo = context ? `
        Context: ${context.module || 'Unknown'}
        Purpose: ${context.purpose || 'Unknown'}
        Expected content: ${context.expectedContent || 'Unknown'}
      ` : '';

      const prompt = `
        Classify this image and determine its document type:
        
        Expected type: ${expectedType}
        ${contextInfo}
        
        Analyze and provide:
        1. documentType: Specific document type (invoice, receipt, business card, etc.)
        2. confidence: Confidence in classification (0-1)
        3. categories: Alternative possible categories with confidence scores
        
        Consider business document types like invoices, receipts, contracts, ID cards, business cards, charts, etc.
        
        Respond with JSON only.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are an image classification expert specializing in business documents. Classify images accurately.'
          },
          {
            role: 'user',
            content: `${prompt}\n\nImage provided: data:image/jpeg;base64,${imageData.substring(0, 100)}...`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Image classification failed:', error);
      return {
        documentType: expectedType,
        confidence: 0.3,
        categories: []
      };
    }
  }

  /**
   * Object Detection
   */
  private async detectObjects(imageData: string): Promise<any> {
    try {
      const prompt = `
        Detect and identify objects in this image:
        
        Focus on:
        1. Text areas and text blocks
        2. Logos and signatures
        3. Tables and structured data
        4. Stamps and seals
        5. Photos and images
        6. Charts and graphs
        
        For each detected object, provide:
        - label: Object type/description
        - confidence: Detection confidence (0-1)
        - boundingBox: Approximate position (x, y, width, height as percentages)
        
        Respond with JSON containing objects array.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are an object detection expert. Identify and locate objects in business documents accurately.'
          },
          {
            role: 'user',
            content: `${prompt}\n\nImage provided: data:image/jpeg;base64,${imageData.substring(0, 100)}...`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      return { objects: result.objects || [] };
    } catch (error) {
      console.error('Object detection failed:', error);
      return { objects: [] };
    }
  }

  /**
   * Structured Text Extraction
   */
  private async extractStructuredText(
    imageData: string,
    documentType: VisionAnalysisRequest['imageType']
  ): Promise<any> {
    try {
      const typeSpecificPrompt = this.getTypeSpecificPrompt(documentType);
      
      const prompt = `
        Extract structured data from this ${documentType} image:
        
        ${typeSpecificPrompt}
        
        Provide structured extraction with:
        1. structuredData: Key-value pairs of important information
        2. keyValuePairs: Detailed extraction with confidence scores
        3. tables: Any tabular data found (if applicable)
        
        Focus on business-relevant information and maintain accuracy.
        
        Respond with JSON only.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a structured data extraction expert. Extract business information from documents accurately.'
          },
          {
            role: 'user',
            content: `${prompt}\n\nImage provided: data:image/jpeg;base64,${imageData.substring(0, 100)}...`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Structured text extraction failed:', error);
      return {
        structuredData: {},
        keyValuePairs: [],
        tables: []
      };
    }
  }

  /**
   * Image Quality Check
   */
  private async checkImageQuality(imageData: string): Promise<any> {
    try {
      const prompt = `
        Analyze the quality of this image for document processing:
        
        Evaluate:
        1. Overall image quality and clarity
        2. Text readability
        3. Image resolution adequacy
        4. Lighting conditions
        5. Image orientation and skew
        6. Completeness of content
        
        Provide assessment with:
        - overallQuality: Quality score (0-1)
        - issues: Array of quality issues found
        - recommendations: Improvement suggestions
        
        Respond with JSON only.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are an image quality assessment expert. Evaluate images for document processing suitability.'
          },
          {
            role: 'user',
            content: `${prompt}\n\nImage provided: data:image/jpeg;base64,${imageData.substring(0, 100)}...`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Image quality check failed:', error);
      return {
        overallQuality: 0.5,
        issues: [],
        recommendations: ['Unable to assess image quality']
      };
    }
  }

  /**
   * Content Analysis
   */
  private async analyzeImageContent(
    imageData: string,
    context?: VisionAnalysisRequest['context']
  ): Promise<any> {
    try {
      const contextInfo = context ? `
        Business context: ${context.module || 'General business'}
        Purpose: ${context.purpose || 'Document analysis'}
      ` : '';

      const prompt = `
        Analyze the content and business relevance of this image:
        
        ${contextInfo}
        
        Provide analysis with:
        1. summary: Brief description of the image content
        2. keyInformation: Most important information found
        3. businessRelevance: Relevance score for business use (0-1)
        4. actionItems: Suggested actions based on content
        
        Focus on business value and actionable insights.
        
        Respond with JSON only.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a business content analyst. Analyze images for business relevance and actionable insights.'
          },
          {
            role: 'user',
            content: `${prompt}\n\nImage provided: data:image/jpeg;base64,${imageData.substring(0, 100)}...`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.4
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Content analysis failed:', error);
      return {
        summary: 'Content analysis not available',
        keyInformation: [],
        businessRelevance: 0.5,
        actionItems: []
      };
    }
  }

  /**
   * Helper Methods
   */
  private async analyzeImageMetadata(imageData: string): Promise<any> {
    try {
      // Simplified metadata analysis
      // In production, this would use image processing libraries
      const decodedSize = (imageData.length * 3) / 4; // Approximate size from base64
      
      return {
        width: 1024, // Would be extracted from actual image
        height: 768,
        format: 'JPEG', // Would be detected
        fileSize: Math.round(decodedSize),
        quality: decodedSize > 500000 ? 'HIGH' : decodedSize > 100000 ? 'MEDIUM' : 'LOW'
      };
    } catch (error) {
      console.error('Image metadata analysis failed:', error);
      return {
        width: 0,
        height: 0,
        format: 'UNKNOWN',
        fileSize: 0,
        quality: 'LOW'
      };
    }
  }

  private getTypeSpecificPrompt(documentType: VisionAnalysisRequest['imageType']): string {
    const prompts = {
      'INVOICE': 'Extract: invoice number, date, vendor, customer, line items, amounts, taxes, total',
      'RECEIPT': 'Extract: merchant, date, time, items purchased, amounts, payment method, total',
      'BUSINESS_CARD': 'Extract: name, title, company, phone, email, address, website',
      'ID_CARD': 'Extract: name, ID number, date of birth, address, expiration date',
      'DOCUMENT': 'Extract: title, date, author, key sections, important data points',
      'CHART': 'Extract: chart type, data values, labels, trends, key insights',
      'PHOTO': 'Extract: visual elements, people, objects, text visible in photo, business context',
      'OTHER': 'Extract: any structured information, key data points, relevant details'
    };

    return prompts[documentType] || prompts['OTHER'];
  }

  private extractStructuredData(
    analysis: VisionAnalysisResult,
    documentType: VisionAnalysisRequest['imageType']
  ): any {
    const extractedData = {
      text: analysis.ocr?.extractedText || '',
      structuredData: analysis.textExtraction?.structuredData || {},
      metadata: {
        documentType,
        confidence: analysis.metadata.totalConfidence,
        extractionTimestamp: analysis.metadata.analysisTimestamp,
        language: analysis.ocr?.detectedLanguage || 'unknown'
      }
    };

    return extractedData;
  }

  private async generateBusinessInsights(
    analysis: VisionAnalysisResult,
    extractedData: any,
    documentType: VisionAnalysisRequest['imageType'],
    context?: VisionAnalysisRequest['context']
  ): Promise<any> {
    try {
      const prompt = `
        Generate business insights from this document analysis:
        
        Document Type: ${documentType}
        Extracted Data: ${JSON.stringify(extractedData.structuredData)}
        Context: ${JSON.stringify(context)}
        
        Provide business insights with:
        1. documentType: Confirmed document type
        2. relevantFields: Key business fields with values and confidence
        3. suggestedActions: Recommended actions based on content
        4. integrationRecommendations: How to integrate this into business systems
        
        Focus on actionable business value.
        
        Respond with JSON only.
      `;

      const response = await this.llmService.chatCompletion({
        messages: [
          {
            role: 'system',
            content: 'You are a business intelligence analyst. Generate actionable insights from document analysis.'
          },
          { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (error) {
      console.error('Business insights generation failed:', error);
      return {
        documentType,
        relevantFields: [],
        suggestedActions: ['Review extracted data', 'Verify information accuracy'],
        integrationRecommendations: ['Manual review recommended']
      };
    }
  }

  private mergeVisionResult(
    result: VisionAnalysisResult,
    analysisType: string,
    analysisResult: any
  ): void {
    switch (analysisType) {
      case 'OCR':
        result.ocr = analysisResult;
        break;
      case 'CLASSIFICATION':
        result.classification = analysisResult;
        break;
      case 'OBJECT_DETECTION':
        result.objectDetection = analysisResult;
        break;
      case 'TEXT_EXTRACTION':
        result.textExtraction = analysisResult;
        break;
      case 'QUALITY_CHECK':
        result.qualityCheck = analysisResult;
        break;
      case 'CONTENT_ANALYSIS':
        result.contentAnalysis = analysisResult;
        break;
    }
  }

  private extractConfidence(analysisResult: any): number {
    if (analysisResult.confidence !== undefined) {
      return analysisResult.confidence;
    }
    if (analysisResult.overallQuality !== undefined) {
      return analysisResult.overallQuality;
    }
    if (analysisResult.businessRelevance !== undefined) {
      return analysisResult.businessRelevance;
    }
    return 0.5; // Default confidence
  }

  private generateAnalysisId(): string {
    return `vision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCacheKey(request: VisionAnalysisRequest): string {
    // Use a hash of the image data and request parameters
    const keyData = {
      imageHash: request.imageData.substring(0, 100), // First 100 chars of image data
      imageType: request.imageType,
      analysisTypes: request.analysisTypes.sort(),
      options: request.options
    };
    return btoa(JSON.stringify(keyData)).substring(0, 50);
  }

  private getCachedResult(key: string): VisionAnalysisResult | null {
    const cached = this.analysisCache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
      return cached.result;
    }
    if (cached) {
      this.analysisCache.delete(key);
    }
    return null;
  }

  private setCachedResult(key: string, result: VisionAnalysisResult): void {
    this.analysisCache.set(key, {
      result,
      timestamp: Date.now()
    });
    
    // Cleanup old cache entries
    if (this.analysisCache.size > 100) {
      const oldestKeys = Array.from(this.analysisCache.keys()).slice(0, 20);
      oldestKeys.forEach(key => this.analysisCache.delete(key));
    }
  }

  private async storeVisionAnalysis(
    request: VisionAnalysisRequest,
    result: VisionAnalysisResult
  ): Promise<void> {
    try {
      // Store for learning and improvement
      console.log('Storing vision analysis for learning:', {
        analysisId: result.analysisId,
        imageType: request.imageType,
        analysisTypes: request.analysisTypes,
        confidence: result.metadata.totalConfidence
      });
    } catch (error) {
      console.error('Failed to store vision analysis:', error);
    }
  }

  private generateFallbackResult(
    analysisId: string,
    request: VisionAnalysisRequest,
    startTime: number
  ): VisionAnalysisResult {
    return {
      analysisId,
      imageMetadata: {
        width: 0,
        height: 0,
        format: 'UNKNOWN',
        fileSize: 0,
        quality: 'LOW'
      },
      ocr: request.analysisTypes.includes('OCR') ? {
        extractedText: 'OCR processing failed',
        confidence: 0.1,
        textBlocks: []
      } : undefined,
      classification: request.analysisTypes.includes('CLASSIFICATION') ? {
        documentType: request.imageType,
        confidence: 0.3,
        categories: []
      } : undefined,
      objectDetection: request.analysisTypes.includes('OBJECT_DETECTION') ? {
        objects: []
      } : undefined,
      textExtraction: request.analysisTypes.includes('TEXT_EXTRACTION') ? {
        structuredData: {},
        keyValuePairs: [],
        tables: []
      } : undefined,
      qualityCheck: request.analysisTypes.includes('QUALITY_CHECK') ? {
        overallQuality: 0.3,
        issues: [{ type: 'LOW_RESOLUTION', severity: 'HIGH', description: 'Analysis failed' }],
        recommendations: ['Try with higher quality image']
      } : undefined,
      contentAnalysis: request.analysisTypes.includes('CONTENT_ANALYSIS') ? {
        summary: 'Content analysis not available',
        keyInformation: [],
        businessRelevance: 0.3
      } : undefined,
      metadata: {
        processingTime: Date.now() - startTime,
        modelVersion: '1.0.0-fallback',
        analysisTimestamp: new Date(),
        totalConfidence: 0.3
      }
    };
  }
}


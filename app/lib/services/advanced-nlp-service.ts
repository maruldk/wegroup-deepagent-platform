
// SPRINT 2.8 - Advanced NLP Service
import { prisma } from '@/lib/db'
import natural from 'natural'
import compromise from 'compromise'
import Sentiment from 'sentiment'

export interface NLPProcessorConfig {
  name: string
  processorType: 'SENTIMENT' | 'ENTITY' | 'INTENT' | 'TOPIC' | 'TRANSLATION'
  language: string
  configuration: any
}

export interface NLPQueryRequest {
  text: string
  processorType: string
  language?: string
  options?: any
}

export interface NLPResult {
  processedResult: any
  confidence: number
  processingTime: number
  language?: string
  metadata?: any
}

export class AdvancedNLPService {
  private static instance: AdvancedNLPService
  private sentiment: any
  private processors: Map<string, any> = new Map()

  static getInstance(): AdvancedNLPService {
    if (!AdvancedNLPService.instance) {
      AdvancedNLPService.instance = new AdvancedNLPService()
    }
    return AdvancedNLPService.instance
  }

  constructor() {
    this.sentiment = new Sentiment()
    this.initializeProcessors()
  }

  private initializeProcessors(): void {
    // Initialize various NLP processors
    this.processors.set('sentiment', this.sentiment)
    this.processors.set('tokenizer', natural.WordTokenizer)
    this.processors.set('stemmer', natural.PorterStemmer)
    this.processors.set('classifier', natural.BayesClassifier)
  }

  async createProcessor(
    config: NLPProcessorConfig,
    tenantId: string
  ): Promise<string> {
    try {
      const processor = await prisma.nLPProcessor.create({
        data: {
          name: config.name,
          processorType: config.processorType,
          language: config.language,
          configuration: config.configuration,
          tenantId
        }
      })

      return processor.id
    } catch (error) {
      console.error('Failed to create NLP processor:', error)
      throw new Error('NLP processor creation failed')
    }
  }

  async processText(
    request: NLPQueryRequest,
    tenantId: string,
    userId: string
  ): Promise<NLPResult> {
    const startTime = performance.now()

    try {
      let result: any
      let confidence = 0.8
      let language = request.language || 'en'
      let metadata = {}

      switch (request.processorType) {
        case 'SENTIMENT':
          result = await this.analyzeSentiment(request.text)
          confidence = Math.abs(result.score) / 5 // Normalize sentiment score
          break

        case 'ENTITY':
          result = await this.extractEntities(request.text)
          confidence = result.confidence || 0.7
          break

        case 'INTENT':
          result = await this.classifyIntent(request.text)
          confidence = result.confidence || 0.6
          break

        case 'TOPIC':
          result = await this.extractTopics(request.text)
          confidence = 0.75
          break

        case 'TRANSLATION':
          result = await this.translateText(request.text, request.options)
          confidence = 0.85
          language = request.options?.targetLanguage || 'en'
          break

        default:
          throw new Error(`Unsupported processor type: ${request.processorType}`)
      }

      const processingTime = performance.now() - startTime

      // Save query to database
      const processor = await this.getOrCreateProcessor(request.processorType, tenantId)
      
      await prisma.nLPQuery.create({
        data: {
          processorId: processor.id,
          inputText: request.text,
          processedResult: result,
          confidence,
          processingTime,
          language,
          metadata,
          tenantId,
          userId
        }
      })

      return {
        processedResult: result,
        confidence,
        processingTime,
        language,
        metadata
      }

    } catch (error) {
      console.error('NLP processing failed:', error)
      throw new Error('NLP processing failed')
    }
  }

  private async analyzeSentiment(text: string): Promise<any> {
    try {
      const result = this.sentiment.analyze(text)
      
      // Enhanced sentiment analysis
      const doc = compromise(text)
      const emotions = this.extractEmotions(text)
      const intensity = this.calculateIntensity(text)

      return {
        score: result.score,
        comparative: result.comparative,
        classification: this.classifySentiment(result.score),
        positive: result.positive,
        negative: result.negative,
        emotions,
        intensity,
        wordCount: result.words?.length || 0
      }
    } catch (error) {
      console.error('Sentiment analysis failed:', error)
      return { score: 0, classification: 'neutral', error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private extractEmotions(text: string): string[] {
    const emotionKeywords = {
      joy: ['happy', 'excited', 'thrilled', 'delighted', 'pleased'],
      anger: ['angry', 'furious', 'mad', 'irritated', 'annoyed'],
      fear: ['scared', 'afraid', 'worried', 'anxious', 'nervous'],
      sadness: ['sad', 'depressed', 'upset', 'disappointed', 'miserable'],
      surprise: ['surprised', 'amazed', 'shocked', 'astonished'],
      disgust: ['disgusted', 'revolted', 'appalled', 'repulsed']
    }

    const emotions: string[] = []
    const lowerText = text.toLowerCase()

    Object.entries(emotionKeywords).forEach(([emotion, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        emotions.push(emotion)
      }
    })

    return emotions
  }

  private calculateIntensity(text: string): number {
    const intensifiers = ['very', 'extremely', 'absolutely', 'completely', 'totally']
    const diminishers = ['slightly', 'somewhat', 'rather', 'quite', 'fairly']
    
    let intensity = 1.0
    const words = text.toLowerCase().split(/\s+/)

    words.forEach(word => {
      if (intensifiers.includes(word)) intensity += 0.2
      if (diminishers.includes(word)) intensity -= 0.1
    })

    return Math.max(0.1, Math.min(2.0, intensity))
  }

  private classifySentiment(score: number): string {
    if (score > 0.1) return 'positive'
    if (score < -0.1) return 'negative'
    return 'neutral'
  }

  private async extractEntities(text: string): Promise<any> {
    try {
      const doc = compromise(text)
      
      const entities = {
        people: doc.people().out('array'),
        places: doc.places().out('array'),
        organizations: doc.organizations().out('array'),
        dates: (doc as any).dates ? (doc as any).dates().out('array') : [],
        numbers: (doc as any).values ? (doc as any).values().out('array') : [],
        topics: doc.topics().out('array')
      }

      // Extract custom entities using patterns
      const emails = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g) || []
      const phones = text.match(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g) || []
      const urls = text.match(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g) || []

      return {
        ...entities,
        emails,
        phones,
        urls,
        confidence: 0.8
      }
    } catch (error) {
      console.error('Entity extraction failed:', error)
      return { entities: [], confidence: 0.1 }
    }
  }

  private async classifyIntent(text: string): Promise<any> {
    try {
      // Simple intent classification using keywords and patterns
      const intents = {
        question: ['what', 'how', 'when', 'where', 'why', 'which', 'who', '?'],
        request: ['please', 'can you', 'could you', 'would you', 'help'],
        complaint: ['problem', 'issue', 'wrong', 'error', 'bug', 'broken'],
        compliment: ['good', 'great', 'excellent', 'amazing', 'perfect', 'love'],
        booking: ['book', 'reserve', 'schedule', 'appointment'],
        cancellation: ['cancel', 'refund', 'return', 'change'],
        information: ['info', 'about', 'details', 'explain', 'tell me']
      }

      const lowerText = text.toLowerCase()
      const scores: { [key: string]: number } = {}

      Object.entries(intents).forEach(([intent, keywords]) => {
        scores[intent] = keywords.filter(keyword => lowerText.includes(keyword)).length
      })

      const maxIntent = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)
      const confidence = maxIntent[1] > 0 ? Math.min(0.9, maxIntent[1] * 0.2 + 0.5) : 0.3

      const intentKey = maxIntent[0] as keyof typeof intents
      return {
        intent: maxIntent[0],
        confidence,
        scores,
        keywords: intents[intentKey]
      }
    } catch (error) {
      console.error('Intent classification failed:', error)
      return { intent: 'unknown', confidence: 0.1 }
    }
  }

  private async extractTopics(text: string): Promise<any> {
    try {
      const doc = compromise(text)
      
      // Extract nouns as potential topics
      const nouns = doc.nouns().out('array')
      const topics = doc.topics().out('array')
      
      // Use TF-IDF for topic extraction
      const tokenizer = new natural.WordTokenizer()
      const words = tokenizer.tokenize(text.toLowerCase()) || []
      const stemmed = words.map((word: string) => natural.PorterStemmer.stem(word))
      
      // Remove stop words
      const stopWords = natural.stopwords
      const filtered = stemmed.filter((word: string) => !stopWords.includes(word) && word.length > 2)
      
      // Calculate word frequency
      const frequency: { [key: string]: number } = {}
      filtered.forEach((word: string) => {
        frequency[word] = (frequency[word] || 0) + 1
      })

      // Get top topics by frequency
      const sortedTopics = Object.entries(frequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([word, freq]) => ({ word, frequency: freq }))

      return {
        topics: sortedTopics,
        nouns,
        namedTopics: topics,
        wordCount: words?.length || 0,
        uniqueWords: Object.keys(frequency).length
      }
    } catch (error) {
      console.error('Topic extraction failed:', error)
      return { topics: [], confidence: 0.1 }
    }
  }

  private async translateText(text: string, options: any): Promise<any> {
    // Simplified translation service (would integrate with Google Translate API or similar)
    try {
      const sourceLanguage = options?.sourceLanguage || 'auto'
      const targetLanguage = options?.targetLanguage || 'en'

      // Mock translation for demo purposes
      const translatedText = `[TRANSLATED FROM ${sourceLanguage} TO ${targetLanguage}]: ${text}`

      return {
        originalText: text,
        translatedText,
        sourceLanguage,
        targetLanguage,
        confidence: 0.85
      }
    } catch (error) {
      console.error('Translation failed:', error)
      return { translatedText: text, confidence: 0.1 }
    }
  }

  private async getOrCreateProcessor(type: string, tenantId: string): Promise<any> {
    try {
      let processor = await prisma.nLPProcessor.findFirst({
        where: {
          processorType: type,
          tenantId
        }
      })

      if (!processor) {
        processor = await prisma.nLPProcessor.create({
          data: {
            name: `Default ${type} Processor`,
            processorType: type,
            language: 'en',
            configuration: {},
            tenantId
          }
        })
      }

      return processor
    } catch (error) {
      console.error('Failed to get/create processor:', error)
      throw error
    }
  }

  async batchProcess(
    texts: string[],
    processorType: string,
    tenantId: string,
    userId: string
  ): Promise<NLPResult[]> {
    try {
      const results: NLPResult[] = []

      for (const text of texts) {
        const result = await this.processText({
          text,
          processorType
        }, tenantId, userId)
        results.push(result)
      }

      return results
    } catch (error) {
      console.error('Batch NLP processing failed:', error)
      throw new Error('Batch NLP processing failed')
    }
  }

  async getProcessorPerformance(processorId: string): Promise<any> {
    try {
      const processor = await prisma.nLPProcessor.findUnique({
        where: { id: processorId },
        include: {
          queries: {
            orderBy: { createdAt: 'desc' },
            take: 100
          }
        }
      })

      if (!processor) {
        throw new Error('Processor not found')
      }

      const queries = processor.queries
      const avgConfidence = queries.reduce((sum, q) => sum + (q.confidence || 0), 0) / queries.length
      const avgProcessingTime = queries.reduce((sum, q) => sum + q.processingTime, 0) / queries.length

      return {
        processorId,
        name: processor.name,
        type: processor.processorType,
        totalQueries: queries.length,
        avgConfidence,
        avgProcessingTime,
        lastUsed: queries[0]?.createdAt
      }
    } catch (error) {
      console.error('Failed to get processor performance:', error)
      return null
    }
  }
}

export const advancedNLP = AdvancedNLPService.getInstance()


// SPRINT 2.8 - Voice Command Service
import { prisma } from '@/lib/db'

export interface VoiceCommandConfig {
  language: string
  sensitivity: number // 0-1
  commands: VoiceCommandDefinition[]
}

export interface VoiceCommandDefinition {
  phrase: string
  intent: string
  parameters?: { [key: string]: string }
  action: string
  confidence: number
}

export interface VoiceProcessingResult {
  command: string
  intent: string
  parameters: any
  confidence: number
  action?: any
  executionTime: number
}

export class VoiceCommandService {
  private static instance: VoiceCommandService
  private isListening: boolean = false
  private commandDefinitions: Map<string, VoiceCommandDefinition[]> = new Map()
  private speechRecognition: any = null

  static getInstance(): VoiceCommandService {
    if (!VoiceCommandService.instance) {
      VoiceCommandService.instance = new VoiceCommandService()
    }
    return VoiceCommandService.instance
  }

  constructor() {
    this.initializeDefaultCommands()
  }

  private initializeDefaultCommands(): void {
    const defaultCommands: VoiceCommandDefinition[] = [
      // Navigation Commands
      {
        phrase: 'go to dashboard',
        intent: 'NAVIGATE',
        parameters: { destination: 'dashboard' },
        action: 'navigate_to_dashboard',
        confidence: 0.9
      },
      {
        phrase: 'open projects',
        intent: 'NAVIGATE',
        parameters: { destination: 'projects' },
        action: 'navigate_to_projects',
        confidence: 0.9
      },
      {
        phrase: 'show analytics',
        intent: 'NAVIGATE',
        parameters: { destination: 'analytics' },
        action: 'navigate_to_analytics',
        confidence: 0.9
      },
      {
        phrase: 'go to finance',
        intent: 'NAVIGATE',
        parameters: { destination: 'finance' },
        action: 'navigate_to_finance',
        confidence: 0.9
      },

      // Search Commands
      {
        phrase: 'search for *',
        intent: 'SEARCH',
        parameters: { query: '*' },
        action: 'perform_search',
        confidence: 0.8
      },
      {
        phrase: 'find project *',
        intent: 'SEARCH',
        parameters: { type: 'project', query: '*' },
        action: 'search_projects',
        confidence: 0.85
      },
      {
        phrase: 'show me invoices',
        intent: 'SEARCH',
        parameters: { type: 'invoice' },
        action: 'show_invoices',
        confidence: 0.9
      },

      // Creation Commands
      {
        phrase: 'create new project',
        intent: 'CREATE',
        parameters: { type: 'project' },
        action: 'create_project',
        confidence: 0.9
      },
      {
        phrase: 'new task',
        intent: 'CREATE',
        parameters: { type: 'task' },
        action: 'create_task',
        confidence: 0.9
      },
      {
        phrase: 'add invoice',
        intent: 'CREATE',
        parameters: { type: 'invoice' },
        action: 'create_invoice',
        confidence: 0.9
      },

      // Update Commands
      {
        phrase: 'mark task complete',
        intent: 'UPDATE',
        parameters: { action: 'complete', type: 'task' },
        action: 'complete_task',
        confidence: 0.85
      },
      {
        phrase: 'update project status',
        intent: 'UPDATE',
        parameters: { action: 'status', type: 'project' },
        action: 'update_project_status',
        confidence: 0.8
      },

      // AI Commands
      {
        phrase: 'analyze performance',
        intent: 'ANALYZE',
        parameters: { type: 'performance' },
        action: 'analyze_performance',
        confidence: 0.8
      },
      {
        phrase: 'predict revenue',
        intent: 'PREDICT',
        parameters: { type: 'revenue' },
        action: 'predict_revenue',
        confidence: 0.8
      },
      {
        phrase: 'optimize resources',
        intent: 'OPTIMIZE',
        parameters: { type: 'resources' },
        action: 'optimize_resources',
        confidence: 0.8
      },

      // System Commands
      {
        phrase: 'refresh data',
        intent: 'SYSTEM',
        parameters: { action: 'refresh' },
        action: 'refresh_data',
        confidence: 0.9
      },
      {
        phrase: 'export report',
        intent: 'SYSTEM',
        parameters: { action: 'export', type: 'report' },
        action: 'export_report',
        confidence: 0.85
      },
      {
        phrase: 'help',
        intent: 'SYSTEM',
        parameters: { action: 'help' },
        action: 'show_help',
        confidence: 0.95
      }
    ]

    this.commandDefinitions.set('default', defaultCommands)
  }

  async initializeSpeechRecognition(): Promise<boolean> {
    try {
      // Check if browser supports speech recognition
      if (typeof window !== 'undefined') {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        
        if (!SpeechRecognition) {
          console.warn('Speech recognition not supported in this browser')
          return false
        }

        this.speechRecognition = new SpeechRecognition()
        this.speechRecognition.continuous = true
        this.speechRecognition.interimResults = true
        this.speechRecognition.lang = 'en-US'

        // Set up event handlers
        this.speechRecognition.onresult = this.handleSpeechResult.bind(this)
        this.speechRecognition.onerror = this.handleSpeechError.bind(this)
        this.speechRecognition.onend = this.handleSpeechEnd.bind(this)

        console.log('Speech recognition initialized successfully')
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to initialize speech recognition:', error)
      return false
    }
  }

  async startListening(): Promise<boolean> {
    try {
      if (!this.speechRecognition) {
        const initialized = await this.initializeSpeechRecognition()
        if (!initialized) return false
      }

      if (!this.isListening) {
        this.speechRecognition.start()
        this.isListening = true
        console.log('Voice command listening started')
      }

      return true
    } catch (error) {
      console.error('Failed to start listening:', error)
      return false
    }
  }

  async stopListening(): Promise<void> {
    try {
      if (this.speechRecognition && this.isListening) {
        this.speechRecognition.stop()
        this.isListening = false
        console.log('Voice command listening stopped')
      }
    } catch (error) {
      console.error('Failed to stop listening:', error)
    }
  }

  private handleSpeechResult(event: any): void {
    try {
      const results = event.results
      const lastResult = results[results.length - 1]
      
      if (lastResult.isFinal) {
        const transcript = lastResult[0].transcript.trim().toLowerCase()
        const confidence = lastResult[0].confidence

        console.log('Voice command detected:', transcript, 'Confidence:', confidence)

        // Process the command
        this.processVoiceCommand(transcript, confidence)
      }
    } catch (error) {
      console.error('Error handling speech result:', error)
    }
  }

  private handleSpeechError(event: any): void {
    console.error('Speech recognition error:', event.error)
    
    // Restart listening on certain errors
    if (event.error === 'no-speech' || event.error === 'audio-capture') {
      setTimeout(() => {
        if (this.isListening) {
          this.speechRecognition?.start()
        }
      }, 1000)
    }
  }

  private handleSpeechEnd(): void {
    // Restart listening if still supposed to be listening
    if (this.isListening) {
      setTimeout(() => {
        try {
          this.speechRecognition?.start()
        } catch (error) {
          console.error('Failed to restart speech recognition:', error)
        }
      }, 100)
    }
  }

  async processVoiceCommand(
    command: string,
    confidence: number,
    tenantId?: string,
    userId?: string
  ): Promise<VoiceProcessingResult> {
    const startTime = performance.now()

    try {
      // Find matching command
      const matchedCommand = this.findBestMatch(command, confidence)
      
      if (!matchedCommand) {
        return {
          command,
          intent: 'UNKNOWN',
          parameters: {},
          confidence: 0,
          executionTime: performance.now() - startTime
        }
      }

      // Extract parameters
      const parameters = this.extractParameters(command, matchedCommand)

      // Execute action if confidence is high enough
      let action = null
      if (confidence >= 0.7 && matchedCommand.confidence >= 0.7) {
        action = await this.executeAction(matchedCommand.action, parameters)
      }

      // Save to database if tenant/user provided
      if (tenantId && userId) {
        await this.saveVoiceCommand(
          command,
          matchedCommand.intent,
          parameters,
          confidence,
          performance.now() - startTime,
          tenantId,
          userId
        )
      }

      return {
        command,
        intent: matchedCommand.intent,
        parameters,
        confidence: Math.min(confidence, matchedCommand.confidence),
        action,
        executionTime: performance.now() - startTime
      }

    } catch (error) {
      console.error('Voice command processing failed:', error)
      return {
        command,
        intent: 'ERROR',
        parameters: { error: error instanceof Error ? error.message : String(error) },
        confidence: 0,
        executionTime: performance.now() - startTime
      }
    }
  }

  private findBestMatch(command: string, confidence: number): VoiceCommandDefinition | null {
    const commands = this.commandDefinitions.get('default') || []
    let bestMatch: VoiceCommandDefinition | null = null
    let bestScore = 0

    for (const cmd of commands) {
      const score = this.calculateMatchScore(command, cmd.phrase)
      if (score > bestScore && score >= 0.6) {
        bestMatch = cmd
        bestScore = score
      }
    }

    return bestMatch
  }

  private calculateMatchScore(input: string, pattern: string): number {
    // Handle wildcard patterns
    if (pattern.includes('*')) {
      const parts = pattern.split('*')
      let score = 0
      
      for (const part of parts) {
        if (part.trim() && input.includes(part.trim())) {
          score += 0.5
        }
      }
      
      return Math.min(1, score)
    }

    // Exact phrase matching
    if (input === pattern) return 1.0

    // Word-based similarity
    const inputWords = input.split(' ')
    const patternWords = pattern.split(' ')
    
    const matches = patternWords.filter(word => 
      inputWords.some(inputWord => 
        inputWord.includes(word) || word.includes(inputWord)
      )
    ).length

    return matches / patternWords.length
  }

  private extractParameters(input: string, command: VoiceCommandDefinition): any {
    const parameters = { ...command.parameters }

    // Handle wildcard extraction
    if (command.phrase.includes('*')) {
      const parts = command.phrase.split('*')
      if (parts.length === 2) {
        const prefix = parts[0].trim()
        const suffix = parts[1].trim()
        
        let extracted = input
        if (prefix) extracted = extracted.replace(prefix, '').trim()
        if (suffix) extracted = extracted.replace(suffix, '').trim()
        
        // Find parameter key that has '*' value
        Object.keys(parameters).forEach(key => {
          if (parameters[key] === '*') {
            parameters[key] = extracted
          }
        })
      }
    }

    // Extract common entities
    parameters.extractedEntities = this.extractEntities(input)

    return parameters
  }

  private extractEntities(text: string): any {
    const entities: any = {}

    // Extract numbers
    const numbers = text.match(/\d+/g)
    if (numbers) entities.numbers = numbers.map(n => parseInt(n))

    // Extract dates (simple patterns)
    const datePatterns = [
      /today/i,
      /tomorrow/i,
      /yesterday/i,
      /this week/i,
      /next week/i,
      /this month/i,
      /next month/i
    ]

    for (const pattern of datePatterns) {
      if (pattern.test(text)) {
        entities.timeReference = pattern.source.replace(/[/\\]/g, '').toLowerCase()
        break
      }
    }

    return entities
  }

  private async executeAction(actionName: string, parameters: any): Promise<any> {
    try {
      switch (actionName) {
        case 'navigate_to_dashboard':
          return { action: 'navigate', url: '/dashboard' }

        case 'navigate_to_projects':
          return { action: 'navigate', url: '/projects' }

        case 'navigate_to_analytics':
          return { action: 'navigate', url: '/analytics' }

        case 'navigate_to_finance':
          return { action: 'navigate', url: '/finance' }

        case 'perform_search':
          return { 
            action: 'search',
            query: parameters.query,
            type: 'global'
          }

        case 'search_projects':
          return {
            action: 'search',
            query: parameters.query,
            type: 'projects'
          }

        case 'show_invoices':
          return { action: 'navigate', url: '/finance/invoices' }

        case 'create_project':
          return { action: 'modal', type: 'create_project' }

        case 'create_task':
          return { action: 'modal', type: 'create_task' }

        case 'create_invoice':
          return { action: 'modal', type: 'create_invoice' }

        case 'refresh_data':
          return { action: 'refresh' }

        case 'show_help':
          return { 
            action: 'help',
            commands: this.getAvailableCommands()
          }

        default:
          return { action: 'unknown', message: `Action ${actionName} not implemented` }
      }
    } catch (error) {
      console.error(`Action execution failed for ${actionName}:`, error)
      return { action: 'error', error: error instanceof Error ? error.message : String(error) }
    }
  }

  private async saveVoiceCommand(
    command: string,
    intent: string,
    parameters: any,
    confidence: number,
    executionTime: number,
    tenantId: string,
    userId: string
  ): Promise<void> {
    try {
      await prisma.voiceCommand.create({
        data: {
          command,
          intent,
          parameters,
          confidence,
          executionTime,
          tenantId,
          userId
        }
      })
    } catch (error) {
      console.error('Failed to save voice command:', error)
    }
  }

  getAvailableCommands(): string[] {
    const commands = this.commandDefinitions.get('default') || []
    return commands.map(cmd => cmd.phrase).sort()
  }

  addCustomCommand(command: VoiceCommandDefinition, category: string = 'custom'): void {
    const existing = this.commandDefinitions.get(category) || []
    existing.push(command)
    this.commandDefinitions.set(category, existing)
  }

  removeCustomCommand(phrase: string, category: string = 'custom'): void {
    const existing = this.commandDefinitions.get(category) || []
    const filtered = existing.filter(cmd => cmd.phrase !== phrase)
    this.commandDefinitions.set(category, filtered)
  }

  async getVoiceCommandAnalytics(tenantId: string): Promise<any> {
    try {
      const commands = await prisma.voiceCommand.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 100
      })

      const analytics = {
        totalCommands: commands.length,
        avgConfidence: commands.reduce((sum, cmd) => sum + cmd.confidence, 0) / commands.length,
        avgExecutionTime: commands.reduce((sum, cmd) => sum + cmd.executionTime, 0) / commands.length,
        mostUsedIntents: this.groupByIntent(commands),
        successRate: commands.filter(cmd => cmd.confidence >= 0.7).length / commands.length,
        recentActivity: this.getRecentActivity(commands)
      }

      return analytics
    } catch (error) {
      console.error('Failed to get voice command analytics:', error)
      return {}
    }
  }

  private groupByIntent(commands: any[]): any {
    return commands.reduce((groups, cmd) => {
      const intent = cmd.intent
      groups[intent] = (groups[intent] || 0) + 1
      return groups
    }, {})
  }

  private getRecentActivity(commands: any[]): any[] {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)
    return commands
      .filter(cmd => new Date(cmd.createdAt) > last24Hours)
      .map(cmd => ({
        time: cmd.createdAt,
        command: cmd.command,
        intent: cmd.intent,
        confidence: cmd.confidence
      }))
  }
}

export const voiceCommandService = VoiceCommandService.getInstance()

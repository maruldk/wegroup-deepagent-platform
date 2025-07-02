
// SPRINT 2.9 - GraphQL Service
import { prisma } from '@/lib/db'
import { ApolloServer } from 'apollo-server-micro'
import { buildSchema, GraphQLObjectType, GraphQLString, GraphQLList, GraphQLFloat, GraphQLInt, GraphQLID, GraphQLBoolean } from 'graphql'

export interface GraphQLQueryAnalytics {
  queryHash: string
  operationName?: string
  complexity: number
  executionTime: number
  cacheHit: boolean
  errors?: any[]
}

export interface GraphQLSchemaConfig {
  version: string
  types: any[]
  queries: any[]
  mutations: any[]
  subscriptions?: any[]
}

export class GraphQLService {
  private static instance: GraphQLService
  private apolloServer: ApolloServer | null = null
  private queryComplexityMap: Map<string, number> = new Map()
  private queryCache: Map<string, any> = new Map()

  static getInstance(): GraphQLService {
    if (!GraphQLService.instance) {
      GraphQLService.instance = new GraphQLService()
    }
    return GraphQLService.instance
  }

  constructor() {
    this.initializeComplexityRules()
  }

  private initializeComplexityRules(): void {
    // Define complexity rules for different query types
    this.queryComplexityMap.set('user', 1)
    this.queryComplexityMap.set('users', 5)
    this.queryComplexityMap.set('project', 2)
    this.queryComplexityMap.set('projects', 10)
    this.queryComplexityMap.set('task', 1)
    this.queryComplexityMap.set('tasks', 8)
    this.queryComplexityMap.set('invoice', 2)
    this.queryComplexityMap.set('invoices', 10)
    this.queryComplexityMap.set('analytics', 15)
    this.queryComplexityMap.set('reports', 20)
  }

  // Schema Management
  async createSchema(config: GraphQLSchemaConfig, tenantId: string): Promise<string> {
    try {
      const schemaDefinition = this.buildSchemaDefinition(config)
      
      const schema = await prisma.graphQLSchema.create({
        data: {
          version: config.version,
          schema: schemaDefinition,
          tenantId
        }
      })

      return schema.id
    } catch (error) {
      console.error('Failed to create GraphQL schema:', error)
      throw new Error('Schema creation failed')
    }
  }

  private buildSchemaDefinition(config: GraphQLSchemaConfig): string {
    let schema = `
      scalar DateTime
      scalar JSON
      
      type Query {
    `

    // Add predefined queries
    const defaultQueries = [
      'users(limit: Int, offset: Int): [User!]!',
      'user(id: ID!): User',
      'projects(limit: Int, offset: Int, status: String): [Project!]!',
      'project(id: ID!): Project',
      'tasks(limit: Int, offset: Int, status: String, projectId: ID): [Task!]!',
      'task(id: ID!): Task',
      'invoices(limit: Int, offset: Int, status: String): [Invoice!]!',
      'invoice(id: ID!): Invoice',
      'analytics(type: String!, dateRange: String): AnalyticsResult',
      'reports(type: String!, filters: JSON): [Report!]!'
    ]

    defaultQueries.forEach(query => {
      schema += `    ${query}\n`
    })

    // Add custom queries from config
    config.queries.forEach(query => {
      schema += `    ${query}\n`
    })

    schema += `  }\n\n`

    // Add mutations
    schema += `  type Mutation {\n`
    
    const defaultMutations = [
      'createUser(input: CreateUserInput!): User!',
      'updateUser(id: ID!, input: UpdateUserInput!): User!',
      'deleteUser(id: ID!): Boolean!',
      'createProject(input: CreateProjectInput!): Project!',
      'updateProject(id: ID!, input: UpdateProjectInput!): Project!',
      'deleteProject(id: ID!): Boolean!',
      'createTask(input: CreateTaskInput!): Task!',
      'updateTask(id: ID!, input: UpdateTaskInput!): Task!',
      'deleteTask(id: ID!): Boolean!',
      'createInvoice(input: CreateInvoiceInput!): Invoice!',
      'updateInvoice(id: ID!, input: UpdateInvoiceInput!): Invoice!',
      'deleteInvoice(id: ID!): Boolean!'
    ]

    defaultMutations.forEach(mutation => {
      schema += `    ${mutation}\n`
    })

    config.mutations.forEach(mutation => {
      schema += `    ${mutation}\n`
    })

    schema += `  }\n\n`

    // Add type definitions
    schema += this.getTypeDefinitions()

    return schema
  }

  private getTypeDefinitions(): string {
    return `
      type User {
        id: ID!
        name: String
        email: String!
        role: String!
        isActive: Boolean!
        createdAt: DateTime!
        updatedAt: DateTime!
        projects: [Project!]!
        tasks: [Task!]!
      }

      type Project {
        id: ID!
        name: String!
        description: String
        status: String!
        startDate: DateTime
        endDate: DateTime
        budget: Float
        progress: Float
        createdAt: DateTime!
        updatedAt: DateTime!
        manager: User
        tasks: [Task!]!
        team: [User!]!
      }

      type Task {
        id: ID!
        title: String!
        description: String
        status: String!
        priority: String!
        dueDate: DateTime
        estimatedHours: Float
        actualHours: Float
        createdAt: DateTime!
        updatedAt: DateTime!
        project: Project
        assignee: User
      }

      type Invoice {
        id: ID!
        invoiceNumber: String!
        amount: Float!
        status: String!
        issueDate: DateTime!
        dueDate: DateTime!
        paidDate: DateTime
        createdAt: DateTime!
        updatedAt: DateTime!
        customer: Customer
        items: [InvoiceItem!]!
      }

      type Customer {
        id: ID!
        companyName: String!
        contactPerson: String
        email: String
        phone: String
        address: String
        createdAt: DateTime!
        updatedAt: DateTime!
        invoices: [Invoice!]!
      }

      type InvoiceItem {
        id: ID!
        description: String!
        quantity: Float!
        unitPrice: Float!
        amount: Float!
        invoice: Invoice!
      }

      type AnalyticsResult {
        type: String!
        data: JSON!
        metadata: JSON
        generatedAt: DateTime!
      }

      type Report {
        id: ID!
        name: String!
        type: String!
        data: JSON!
        createdAt: DateTime!
        updatedAt: DateTime!
      }

      input CreateUserInput {
        name: String
        email: String!
        password: String!
        role: String!
      }

      input UpdateUserInput {
        name: String
        email: String
        role: String
        isActive: Boolean
      }

      input CreateProjectInput {
        name: String!
        description: String
        status: String!
        startDate: DateTime
        endDate: DateTime
        budget: Float
        managerId: ID
      }

      input UpdateProjectInput {
        name: String
        description: String
        status: String
        startDate: DateTime
        endDate: DateTime
        budget: Float
        progress: Float
        managerId: ID
      }

      input CreateTaskInput {
        title: String!
        description: String
        status: String!
        priority: String!
        dueDate: DateTime
        estimatedHours: Float
        projectId: ID
        assigneeId: ID
      }

      input UpdateTaskInput {
        title: String
        description: String
        status: String
        priority: String
        dueDate: DateTime
        estimatedHours: Float
        actualHours: Float
        assigneeId: ID
      }

      input CreateInvoiceInput {
        invoiceNumber: String!
        amount: Float!
        issueDate: DateTime!
        dueDate: DateTime!
        customerId: ID!
        items: [CreateInvoiceItemInput!]!
      }

      input UpdateInvoiceInput {
        amount: Float
        status: String
        dueDate: DateTime
        paidDate: DateTime
      }

      input CreateInvoiceItemInput {
        description: String!
        quantity: Float!
        unitPrice: Float!
      }
    `
  }

  // Query Execution and Analytics
  async executeQuery(
    query: string,
    variables: any,
    context: any,
    tenantId: string
  ): Promise<any> {
    const startTime = performance.now()

    try {
      // Calculate query complexity
      const complexity = this.calculateQueryComplexity(query)
      
      // Check if query exceeds complexity limit
      if (complexity > 100) {
        throw new Error('Query complexity exceeds limit')
      }

      // Check cache first
      const cacheKey = this.generateCacheKey(query, variables)
      const cachedResult = this.queryCache.get(cacheKey)
      
      if (cachedResult) {
        await this.recordQueryAnalytics({
          queryHash: cacheKey,
          complexity,
          executionTime: performance.now() - startTime,
          cacheHit: true
        }, tenantId)
        
        return cachedResult
      }

      // Execute query
      const result = await this.executeGraphQLQuery(query, variables, context)
      
      // Cache result if successful
      if (!result.errors) {
        this.queryCache.set(cacheKey, result)
        // Set TTL for cache entry
        setTimeout(() => this.queryCache.delete(cacheKey), 5 * 60 * 1000) // 5 minutes
      }

      // Record analytics
      await this.recordQueryAnalytics({
        queryHash: cacheKey,
        complexity,
        executionTime: performance.now() - startTime,
        cacheHit: false,
        errors: result.errors
      }, tenantId)

      return result
    } catch (error) {
      console.error('GraphQL query execution failed:', error)
      
      await this.recordQueryAnalytics({
        queryHash: this.generateCacheKey(query, variables),
        complexity: 0,
        executionTime: performance.now() - startTime,
        cacheHit: false,
        errors: [error instanceof Error ? error.message : String(error)]
      }, tenantId)

      throw error
    }
  }

  private calculateQueryComplexity(query: string): number {
    let complexity = 0

    // Simple complexity calculation based on query structure
    const fields = this.extractQueryFields(query)
    
    fields.forEach(field => {
      const baseComplexity = this.queryComplexityMap.get(field) || 1
      complexity += baseComplexity
      
      // Add complexity for nested fields
      if (query.includes(`${field} {`)) {
        complexity += 2
      }
      
      // Add complexity for list operations
      if (query.includes(`${field}(`)) {
        complexity += 3
      }
    })

    return complexity
  }

  private extractQueryFields(query: string): string[] {
    const fields: string[] = []
    
    // Extract field names from GraphQL query
    const fieldRegex = /\b(\w+)(?:\s*\(|\s*{|\s*$)/g
    let match

    while ((match = fieldRegex.exec(query)) !== null) {
      const field = match[1]
      if (field !== 'query' && field !== 'mutation' && field !== 'subscription') {
        fields.push(field)
      }
    }

    return fields
  }

  private generateCacheKey(query: string, variables: any): string {
    const content = query + JSON.stringify(variables || {})
    return Buffer.from(content).toString('base64').substring(0, 32)
  }

  private async executeGraphQLQuery(query: string, variables: any, context: any): Promise<any> {
    // This would execute the actual GraphQL query
    // For now, we'll simulate query execution based on field detection
    
    const fields = this.extractQueryFields(query)
    const results: any = { data: {} }

    for (const field of fields) {
      results.data[field] = await this.resolveField(field, variables, context)
    }

    return results
  }

  private async resolveField(field: string, variables: any, context: any): Promise<any> {
    try {
      switch (field) {
        case 'users':
          return await this.resolveUsers(variables, context)
        
        case 'user':
          return await this.resolveUser(variables, context)
        
        case 'projects':
          return await this.resolveProjects(variables, context)
        
        case 'project':
          return await this.resolveProject(variables, context)
        
        case 'tasks':
          return await this.resolveTasks(variables, context)
        
        case 'task':
          return await this.resolveTask(variables, context)
        
        case 'invoices':
          return await this.resolveInvoices(variables, context)
        
        case 'invoice':
          return await this.resolveInvoice(variables, context)
        
        case 'analytics':
          return await this.resolveAnalytics(variables, context)
        
        default:
          return null
      }
    } catch (error) {
      console.error(`Failed to resolve field ${field}:`, error instanceof Error ? error.message : 'Unknown error')
      return null
    }
  }

  private async resolveUsers(variables: any, context: any): Promise<any[]> {
    const { limit = 50, offset = 0 } = variables
    
    const users = await prisma.user.findMany({
      where: { tenantId: context.tenantId },
      take: limit,
      skip: offset,
      include: {
        managedProjects: true,
        assignedTasks: true
      }
    })

    return users
  }

  private async resolveUser(variables: any, context: any): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: variables.id },
      include: {
        managedProjects: true,
        assignedTasks: true
      }
    })

    return user
  }

  private async resolveProjects(variables: any, context: any): Promise<any[]> {
    const { limit = 50, offset = 0, status } = variables
    
    const where: any = { tenantId: context.tenantId }
    if (status) where.status = status

    const projects = await prisma.project.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        manager: true,
        tasks: true
      }
    })

    return projects
  }

  private async resolveProject(variables: any, context: any): Promise<any> {
    const project = await prisma.project.findUnique({
      where: { id: variables.id },
      include: {
        manager: true,
        tasks: true
      }
    })

    return project
  }

  private async resolveTasks(variables: any, context: any): Promise<any[]> {
    const { limit = 50, offset = 0, status, projectId } = variables
    
    const where: any = { tenantId: context.tenantId }
    if (status) where.status = status
    if (projectId) where.projectId = projectId

    const tasks = await prisma.task.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        project: true,
        assignee: true
      }
    })

    return tasks
  }

  private async resolveTask(variables: any, context: any): Promise<any> {
    const task = await prisma.task.findUnique({
      where: { id: variables.id },
      include: {
        project: true,
        assignee: true
      }
    })

    return task
  }

  private async resolveInvoices(variables: any, context: any): Promise<any[]> {
    const { limit = 50, offset = 0, status } = variables
    
    const where: any = { tenantId: context.tenantId }
    if (status) where.status = status

    const invoices = await prisma.invoice.findMany({
      where,
      take: limit,
      skip: offset,
      include: {
        customer: true
      }
    })

    return invoices
  }

  private async resolveInvoice(variables: any, context: any): Promise<any> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: variables.id },
      include: {
        customer: true
      }
    })

    return invoice
  }

  private async resolveAnalytics(variables: any, context: any): Promise<any> {
    const { type, dateRange } = variables
    
    // This would integrate with existing analytics services
    return {
      type,
      data: {
        summary: 'Analytics data would be generated here',
        dateRange
      },
      metadata: {
        generatedAt: new Date()
      },
      generatedAt: new Date()
    }
  }

  private async recordQueryAnalytics(
    analytics: GraphQLQueryAnalytics,
    tenantId: string
  ): Promise<void> {
    try {
      // Get or create schema
      const schema = await this.getActiveSchema(tenantId)
      if (!schema) return

      await prisma.graphQLQuery.create({
        data: {
          schemaId: schema.id,
          query: 'query content', // Would store actual query
          variables: {},
          operationName: analytics.operationName,
          executionTime: analytics.executionTime,
          complexity: analytics.complexity,
          cacheHit: analytics.cacheHit,
          errors: analytics.errors,
          tenantId
        }
      })
    } catch (error) {
      console.error('Failed to record GraphQL analytics:', error)
    }
  }

  private async getActiveSchema(tenantId: string): Promise<any> {
    return await prisma.graphQLSchema.findFirst({
      where: {
        tenantId,
        isActive: true
      }
    })
  }

  // Schema Versioning
  async activateSchema(schemaId: string, tenantId: string): Promise<boolean> {
    try {
      // Deactivate current schema
      await prisma.graphQLSchema.updateMany({
        where: { tenantId, isActive: true },
        data: { isActive: false }
      })

      // Activate new schema
      await prisma.graphQLSchema.update({
        where: { id: schemaId },
        data: { isActive: true }
      })

      return true
    } catch (error) {
      console.error('Failed to activate schema:', error)
      return false
    }
  }

  async deprecateSchema(
    schemaId: string,
    reason: string,
    deprecationDate?: Date
  ): Promise<boolean> {
    try {
      await prisma.graphQLSchema.update({
        where: { id: schemaId },
        data: {
          deprecationReason: reason,
          // Note: would need to add deprecationDate field to schema
        }
      })

      return true
    } catch (error) {
      console.error('Failed to deprecate schema:', error)
      return false
    }
  }

  // Analytics and Monitoring
  async getGraphQLAnalytics(tenantId: string, timeRange: number = 7): Promise<any> {
    try {
      const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000)

      const queries = await prisma.graphQLQuery.findMany({
        where: {
          tenantId,
          createdAt: { gte: startDate }
        },
        include: { schema: true }
      })

      const analytics = {
        totalQueries: queries.length,
        avgExecutionTime: this.calculateAverage(queries, 'executionTime'),
        avgComplexity: this.calculateAverage(queries, 'complexity'),
        cacheHitRate: this.calculateCacheHitRate(queries),
        errorRate: this.calculateErrorRate(queries),
        topQueries: this.getTopQueries(queries),
        performanceTrends: this.analyzePerformanceTrends(queries),
        schemaUsage: this.analyzeSchemaUsage(queries)
      }

      return analytics
    } catch (error) {
      console.error('Failed to get GraphQL analytics:', error)
      return {}
    }
  }

  private calculateAverage(queries: any[], field: string): number {
    if (queries.length === 0) return 0
    const sum = queries.reduce((total, query) => total + (query[field] || 0), 0)
    return sum / queries.length
  }

  private calculateCacheHitRate(queries: any[]): number {
    if (queries.length === 0) return 0
    const hits = queries.filter(query => query.cacheHit).length
    return (hits / queries.length) * 100
  }

  private calculateErrorRate(queries: any[]): number {
    if (queries.length === 0) return 0
    const errors = queries.filter(query => query.errors && query.errors.length > 0).length
    return (errors / queries.length) * 100
  }

  private getTopQueries(queries: any[]): any[] {
    const queryCount = new Map<string, number>()
    
    queries.forEach(query => {
      const operationName = query.operationName || 'anonymous'
      queryCount.set(operationName, (queryCount.get(operationName) || 0) + 1)
    })

    return Array.from(queryCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }

  private analyzePerformanceTrends(queries: any[]): any {
    // Group queries by day and calculate average performance
    const daily = new Map<string, { count: number, totalTime: number }>()

    queries.forEach(query => {
      const date = new Date(query.createdAt).toISOString().split('T')[0]
      const existing = daily.get(date) || { count: 0, totalTime: 0 }
      daily.set(date, {
        count: existing.count + 1,
        totalTime: existing.totalTime + query.executionTime
      })
    })

    return Array.from(daily.entries())
      .map(([date, data]) => ({
        date,
        avgExecutionTime: data.totalTime / data.count,
        queryCount: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  private analyzeSchemaUsage(queries: any[]): any {
    const schemaUsage = new Map<string, number>()

    queries.forEach(query => {
      const schemaVersion = query.schema?.version || 'unknown'
      schemaUsage.set(schemaVersion, (schemaUsage.get(schemaVersion) || 0) + 1)
    })

    return Array.from(schemaUsage.entries())
      .map(([version, count]) => ({ version, count }))
      .sort((a, b) => b.count - a.count)
  }

  // Subscription Management (for real-time features)
  async createSubscription(
    subscriptionQuery: string,
    variables: any,
    context: any
  ): Promise<any> {
    // Implementation for GraphQL subscriptions
    // This would typically use WebSocket or Server-Sent Events
    return {
      id: `subscription_${Date.now()}`,
      query: subscriptionQuery,
      variables,
      active: true
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    // Cancel active subscription
    return true
  }
}

export const graphqlService = GraphQLService.getInstance()

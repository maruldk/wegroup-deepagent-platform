
import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'weGROUP DeepAgent Platform API',
    version: '2.2.0',
    description: `
## weGROUP DeepAgent Platform API Documentation

Das weGROUP DeepAgent Platform API bietet Zugang zu allen Enterprise-Features:

### 🎯 Core Modules
- **weANALYTICS**: Advanced Dashboard Builder, AI-Enhanced Analytics
- **weFINANCE**: Invoice Management, Financial Reports, DATEV Export  
- **wePROJECT**: Project Management, Task Tracking, Time Management
- **weAI**: AI Orchestrator, ML Pipeline, Predictive Analytics

### 🔧 Enterprise Features
- **Multi-tenant Architecture**: Sichere Datentrennung zwischen Mandanten
- **Advanced RBAC**: Granulare Berechtigungen und Rollen
- **Real-time Updates**: WebSocket-basierte Live-Daten
- **Audit Trail**: Vollständige Nachverfolgung aller Aktionen

### 🚀 AI/ML Capabilities
- **Natural Language Processing**: Query Interface für Analytics
- **Predictive Analytics**: Umsatz- und Trend-Prognosen
- **Anomaly Detection**: Automatische Erkennung von Abweichungen
- **Auto-ML**: Selbstoptimierende Machine Learning Modelle

### 📊 API Features
- **RESTful Design**: Standardkonforme REST API
- **Rate Limiting**: Schutz vor Missbrauch
- **Caching**: Redis-basierte Performance-Optimierung
- **Versioning**: API-Versionierung für Stabilität
    `,
    termsOfService: 'https://wegroup.ai/terms',
    contact: {
      name: 'weGROUP API Support',
      url: 'https://wegroup.ai/support',
      email: 'api-support@wegroup.ai',
    },
    license: {
      name: 'Commercial License',
      url: 'https://wegroup.ai/license',
    },
  },
  servers: [
    {
      url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      description: 'Development Server',
    },
    {
      url: 'https://platform.wegroup.ai',
      description: 'Production Server',
    },
    {
      url: 'https://staging.wegroup.ai',
      description: 'Staging Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer Token Authentication',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API Key Authentication',
      },
      sessionCookie: {
        type: 'apiKey',
        in: 'cookie',
        name: 'next-auth.session-token',
        description: 'Session Cookie Authentication',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        required: ['error', 'status'],
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Resource not found',
          },
          status: {
            type: 'integer',
            description: 'HTTP status code',
            example: 404,
          },
          details: {
            type: 'object',
            description: 'Additional error details',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Error timestamp',
          },
        },
      },
      PaginationResponse: {
        type: 'object',
        required: ['total', 'page', 'limit', 'pages'],
        properties: {
          total: {
            type: 'integer',
            description: 'Total number of items',
            example: 150,
          },
          page: {
            type: 'integer',
            description: 'Current page number',
            example: 1,
          },
          limit: {
            type: 'integer',
            description: 'Items per page',
            example: 10,
          },
          pages: {
            type: 'integer',
            description: 'Total number of pages',
            example: 15,
          },
        },
      },
      Dashboard: {
        type: 'object',
        required: ['id', 'name', 'tenantId', 'userId'],
        properties: {
          id: {
            type: 'string',
            description: 'Dashboard unique identifier',
            example: 'clh1234567890',
          },
          name: {
            type: 'string',
            description: 'Dashboard name',
            example: 'Executive Dashboard',
          },
          description: {
            type: 'string',
            description: 'Dashboard description',
            example: 'High-level overview of key business metrics',
          },
          layout: {
            type: 'object',
            description: 'Dashboard layout configuration',
          },
          isDefault: {
            type: 'boolean',
            description: 'Whether this is the default dashboard',
            example: false,
          },
          tenantId: {
            type: 'string',
            description: 'Tenant identifier',
          },
          userId: {
            type: 'string',
            description: 'Owner user identifier',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
          widgets: {
            type: 'array',
            items: { $ref: '#/components/schemas/Widget' },
            description: 'Dashboard widgets',
          },
        },
      },
      Widget: {
        type: 'object',
        required: ['id', 'dashboardId', 'name', 'type'],
        properties: {
          id: {
            type: 'string',
            description: 'Widget unique identifier',
          },
          dashboardId: {
            type: 'string',
            description: 'Parent dashboard identifier',
          },
          name: {
            type: 'string',
            description: 'Widget name',
            example: 'Revenue Chart',
          },
          type: {
            type: 'string',
            enum: ['CHART_LINE', 'CHART_BAR', 'CHART_PIE', 'METRIC_CARD', 'TABLE', 'GAUGE'],
            description: 'Widget type',
            example: 'CHART_LINE',
          },
          config: {
            type: 'object',
            description: 'Widget configuration',
          },
          position: {
            type: 'object',
            description: 'Widget position on dashboard',
          },
          size: {
            type: 'object',
            description: 'Widget size',
          },
          dataSource: {
            type: 'string',
            description: 'Data source configuration',
          },
        },
      },
      AIInsight: {
        type: 'object',
        required: ['id', 'category', 'type', 'title'],
        properties: {
          id: {
            type: 'string',
            description: 'Insight unique identifier',
          },
          category: {
            type: 'string',
            enum: ['ANALYTICS', 'FINANCE', 'PROJECT', 'CUSTOMER'],
            description: 'Insight category',
          },
          type: {
            type: 'string',
            enum: ['ANOMALY', 'TREND', 'PREDICTION', 'OPTIMIZATION', 'RISK', 'OPPORTUNITY', 'ALERT'],
            description: 'Insight type',
          },
          title: {
            type: 'string',
            description: 'Insight title',
            example: 'Revenue growth predicted',
          },
          description: {
            type: 'string',
            description: 'Insight description',
          },
          severity: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            description: 'Insight severity',
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'AI confidence score',
            example: 0.87,
          },
          data: {
            type: 'object',
            description: 'Supporting data and metrics',
          },
          isRead: {
            type: 'boolean',
            description: 'Whether insight has been read',
          },
          isActionable: {
            type: 'boolean',
            description: 'Whether insight requires action',
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Authentication required',
              status: 401,
              timestamp: '2024-01-15T10:30:00Z',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Insufficient permissions',
              status: 403,
              timestamp: '2024-01-15T10:30:00Z',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Resource not found',
              status: 404,
              timestamp: '2024-01-15T10:30:00Z',
            },
          },
        },
      },
      ValidationError: {
        description: 'Request validation failed',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Validation failed',
              status: 400,
              details: {
                field: 'name',
                message: 'Name is required',
              },
              timestamp: '2024-01-15T10:30:00Z',
            },
          },
        },
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Rate limit exceeded',
              status: 429,
              details: {
                retryAfter: 60,
                limit: 100,
              },
              timestamp: '2024-01-15T10:30:00Z',
            },
          },
        },
      },
    },
    parameters: {
      tenantId: {
        name: 'tenantId',
        in: 'header',
        required: false,
        description: 'Tenant identifier (extracted from session if not provided)',
        schema: {
          type: 'string',
        },
      },
      page: {
        name: 'page',
        in: 'query',
        required: false,
        description: 'Page number for pagination',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
      },
      limit: {
        name: 'limit',
        in: 'query',
        required: false,
        description: 'Number of items per page',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 10,
        },
      },
      sortBy: {
        name: 'sortBy',
        in: 'query',
        required: false,
        description: 'Field to sort by',
        schema: {
          type: 'string',
        },
      },
      sortOrder: {
        name: 'sortOrder',
        in: 'query',
        required: false,
        description: 'Sort order',
        schema: {
          type: 'string',
          enum: ['asc', 'desc'],
          default: 'desc',
        },
      },
    },
  },
  security: [
    { bearerAuth: [] },
    { sessionCookie: [] },
    { apiKey: [] },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and session management',
    },
    {
      name: 'Analytics',
      description: 'Dashboard, widgets, reports, and metrics management',
    },
    {
      name: 'AI/ML',
      description: 'AI orchestrator, insights, and machine learning features',
    },
    {
      name: 'Finance',
      description: 'Invoice management, transactions, and financial reports',
    },
    {
      name: 'Projects',
      description: 'Project management, tasks, and time tracking',
    },
    {
      name: 'Admin',
      description: 'Administrative functions and tenant management',
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './app/api/**/*.ts',
    './lib/api/**/*.ts',
    './app/api/**/*.js',
  ],
};

export interface SwaggerSpecType {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
    [key: string]: any;
  };
  servers: any[];
  components: any;
  [key: string]: any;
}

export const swaggerSpec = swaggerJSDoc(options) as SwaggerSpecType;

// Type definitions for API responses
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  meta?: {
    timestamp: string;
    version: string;
    requestId: string;
  };
}

export interface APIError {
  error: string;
  status: number;
  details?: any;
  timestamp: string;
  requestId?: string;
}

// API versioning configuration
export const API_VERSIONS = {
  v1: '1.0.0',
  v2: '2.0.0',
  current: '2.2.0',
} as const;

export const SUPPORTED_API_VERSIONS = ['v1', 'v2'] as const;

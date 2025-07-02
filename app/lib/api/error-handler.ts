
import { NextRequest, NextResponse } from 'next/server';
import { APIError } from './swagger-config';

export enum ErrorCode {
  // Authentication & Authorization
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_REQUEST = 'INVALID_REQUEST',
  MISSING_PARAMETER = 'MISSING_PARAMETER',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  
  // Resources
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_EXISTS = 'RESOURCE_EXISTS',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Server Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Business Logic
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',
  TENANT_SUSPENDED = 'TENANT_SUSPENDED',
  
  // AI/ML Specific
  MODEL_NOT_AVAILABLE = 'MODEL_NOT_AVAILABLE',
  PREDICTION_FAILED = 'PREDICTION_FAILED',
  TRAINING_IN_PROGRESS = 'TRAINING_IN_PROGRESS',
}

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  field?: string;
  value?: any;
  metadata?: Record<string, any>;
}

export class APIErrorHandler {
  
  static createError(
    code: ErrorCode,
    message: string,
    status: number,
    details?: any,
    field?: string
  ): APIError {
    return {
      error: message,
      status,
      details: {
        code,
        field,
        ...details,
      },
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };
  }

  static unauthorized(message: string = 'Authentication required'): APIError {
    return this.createError(ErrorCode.UNAUTHORIZED, message, 401);
  }

  static forbidden(message: string = 'Insufficient permissions'): APIError {
    return this.createError(ErrorCode.FORBIDDEN, message, 403);
  }

  static notFound(resource: string = 'Resource'): APIError {
    return this.createError(
      ErrorCode.NOT_FOUND, 
      `${resource} not found`, 
      404
    );
  }

  static validationError(field: string, message: string, value?: any): APIError {
    return this.createError(
      ErrorCode.VALIDATION_ERROR,
      `Validation failed: ${message}`,
      400,
      { value },
      field
    );
  }

  static rateLimitExceeded(
    limit: number,
    retryAfter: number,
    type: string = 'requests'
  ): APIError {
    return this.createError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded: ${limit} ${type} per hour`,
      429,
      { limit, retryAfter, type }
    );
  }

  static internalError(message: string = 'Internal server error', details?: any): APIError {
    return this.createError(ErrorCode.INTERNAL_ERROR, message, 500, details);
  }

  static serviceUnavailable(service: string, retryAfter?: number): APIError {
    return this.createError(
      ErrorCode.SERVICE_UNAVAILABLE,
      `Service temporarily unavailable: ${service}`,
      503,
      { service, retryAfter }
    );
  }

  static modelNotAvailable(modelName: string): APIError {
    return this.createError(
      ErrorCode.MODEL_NOT_AVAILABLE,
      `AI model not available: ${modelName}`,
      503,
      { modelName }
    );
  }

  static tenantSuspended(tenantId: string): APIError {
    return this.createError(
      ErrorCode.TENANT_SUSPENDED,
      'Tenant account is suspended',
      403,
      { tenantId }
    );
  }

  // Convert errors to NextResponse
  static toResponse(error: APIError): NextResponse {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add retry-after header for rate limiting
    if (error.details?.retryAfter) {
      headers['Retry-After'] = error.details.retryAfter.toString();
    }

    // Add correlation ID for debugging
    if (error.requestId) {
      headers['X-Request-ID'] = error.requestId;
    }

    return NextResponse.json(error, {
      status: error.status,
      headers,
    });
  }

  // Handle common async errors
  static async handleAsyncError<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      console.error(`Error in ${context || 'operation'}:`, error);
      
      if (error instanceof Error) {
        // Database connection errors
        if (error.message.includes('connection')) {
          throw this.serviceUnavailable('database');
        }
        
        // Validation errors from Prisma
        if (error.message.includes('Unique constraint')) {
          throw this.createError(
            ErrorCode.RESOURCE_EXISTS,
            'Resource already exists',
            409
          );
        }
        
        // Generic error handling
        throw this.internalError(
          process.env.NODE_ENV === 'development' 
            ? error.message 
            : 'An unexpected error occurred'
        );
      }
      
      throw this.internalError();
    }
  }

  // Validation helpers
  static validateRequired(fields: Record<string, any>): void {
    for (const [field, value] of Object.entries(fields)) {
      if (value === undefined || value === null || value === '') {
        throw this.validationError(field, `${field} is required`);
      }
    }
  }

  static validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw this.validationError('email', 'Invalid email format', email);
    }
  }

  static validateUUID(id: string, field: string = 'id'): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw this.validationError(field, `Invalid ${field} format`, id);
    }
  }

  static validatePagination(page?: number, limit?: number): { page: number; limit: number } {
    const validatedPage = Math.max(1, page || 1);
    const validatedLimit = Math.min(100, Math.max(1, limit || 10));
    
    return { page: validatedPage, limit: validatedLimit };
  }

  // Log errors with context
  static logError(error: any, context: string, request?: NextRequest): void {
    const logData = {
      error: error.message || error,
      context,
      timestamp: new Date().toISOString(),
      url: request?.url,
      method: request?.method,
      userAgent: request?.headers.get('user-agent'),
      ip: request?.headers.get('x-forwarded-for') || request?.headers.get('x-real-ip'),
    };

    console.error('API Error:', logData);
    
    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry, LogRocket, etc.
      // errorTracker.captureException(error, logData);
    }
  }
}

// Middleware wrapper for error handling
export function withErrorHandler(
  handler: (request: NextRequest, params?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, params?: any) => {
    try {
      return await handler(request, params);
    } catch (error) {
      APIErrorHandler.logError(error, 'API Handler', request);
      
      if (error && typeof error === 'object' && 'status' in error) {
        return APIErrorHandler.toResponse(error as APIError);
      }
      
      return APIErrorHandler.toResponse(
        APIErrorHandler.internalError()
      );
    }
  };
}

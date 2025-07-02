
import { NextRequest, NextResponse } from 'next/server';
import { API_VERSIONS, SUPPORTED_API_VERSIONS } from './swagger-config';

export interface VersionedAPIHandler {
  v1?: (request: NextRequest, params?: any) => Promise<NextResponse>;
  v2?: (request: NextRequest, params?: any) => Promise<NextResponse>;
}

export class APIVersioning {
  
  static extractVersion(request: NextRequest): string {
    // Check for version in header
    const headerVersion = request.headers.get('X-API-Version');
    if (headerVersion && SUPPORTED_API_VERSIONS.includes(headerVersion as any)) {
      return headerVersion;
    }

    // Check for version in URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const versionFromPath = pathParts.find(part => 
      SUPPORTED_API_VERSIONS.includes(part as any)
    );
    if (versionFromPath) {
      return versionFromPath;
    }

    // Check for version in query parameter
    const queryVersion = url.searchParams.get('version');
    if (queryVersion && SUPPORTED_API_VERSIONS.includes(queryVersion as any)) {
      return queryVersion;
    }

    // Default to latest stable version
    return 'v2';
  }

  static createVersionedHandler(handlers: VersionedAPIHandler) {
    return async (request: NextRequest, params?: any) => {
      const version = this.extractVersion(request);
      const handler = handlers[version as keyof VersionedAPIHandler];

      if (!handler) {
        return NextResponse.json(
          {
            error: `API version ${version} not supported`,
            supportedVersions: SUPPORTED_API_VERSIONS,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      try {
        const response = await handler(request, params);
        
        // Add version headers to response
        response.headers.set('X-API-Version', version);
        response.headers.set('X-API-Version-Current', API_VERSIONS.current);
        response.headers.set('X-API-Supported-Versions', SUPPORTED_API_VERSIONS.join(','));

        return response;
      } catch (error) {
        console.error(`Error in API ${version}:`, error);
        return NextResponse.json(
          {
            error: 'Internal server error',
            version,
            timestamp: new Date().toISOString(),
          },
          { status: 500 }
        );
      }
    };
  }

  static handleDeprecation(request: NextRequest, version: string, deprecationDate?: string) {
    const response = NextResponse.next();
    
    if (version === 'v1') {
      response.headers.set('Warning', '299 - "API version v1 is deprecated"');
      
      if (deprecationDate) {
        response.headers.set('Sunset', deprecationDate);
      }
      
      response.headers.set(
        'Link', 
        '</api/v2>; rel="successor-version"; type="application/json"'
      );
    }
    
    return response;
  }

  static getVersionInfo() {
    return {
      current: API_VERSIONS.current,
      supported: SUPPORTED_API_VERSIONS,
      deprecated: ['v1'],
      sunset: {
        v1: '2024-12-31', // Example sunset date
      },
      changelog: {
        'v2.2.0': [
          'Added advanced analytics endpoints',
          'Enhanced AI/ML capabilities',
          'Improved error handling',
          'Added WebSocket support',
        ],
        'v2.0.0': [
          'Breaking: Restructured response format',
          'Added multi-tenant support',
          'Enhanced authentication',
          'New dashboard builder APIs',
        ],
        'v1.0.0': [
          'Initial API release',
          'Basic CRUD operations',
          'Simple authentication',
        ],
      },
    };
  }
}

// Middleware helper for automatic version detection
export function withAPIVersioning(
  handlers: VersionedAPIHandler
) {
  return APIVersioning.createVersionedHandler(handlers);
}

// Response wrapper with version metadata
export function createVersionedResponse<T>(
  data: T, 
  version: string, 
  status: number = 200
) {
  return NextResponse.json(
    {
      success: true,
      data,
      meta: {
        version,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    },
    { 
      status,
      headers: {
        'X-API-Version': version,
        'X-API-Version-Current': API_VERSIONS.current,
      },
    }
  );
}

// Error response with version info
export function createVersionedError(
  error: string, 
  version: string, 
  status: number = 400,
  details?: any
) {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
      meta: {
        version,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      },
    },
    { 
      status,
      headers: {
        'X-API-Version': version,
        'X-API-Version-Current': API_VERSIONS.current,
      },
    }
  );
}

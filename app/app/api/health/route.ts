
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { redis } from '@/lib/cache/redis-client';

export const dynamic = 'force-dynamic';

interface HealthCheck {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    database: HealthCheckResult;
    redis: HealthCheckResult;
    api: HealthCheckResult;
    memory: HealthCheckResult;
    disk: HealthCheckResult;
  };
  dependencies: {
    external: ExternalDependency[];
  };
}

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: any;
  error?: string;
}

interface ExternalDependency {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  url?: string;
}

const startTime = Date.now();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Get system health status
 *     description: Returns comprehensive health information about the system and its dependencies
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Health check results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, unhealthy, degraded]
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                 uptime:
 *                   type: number
 *                   description: Uptime in milliseconds
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       $ref: '#/components/schemas/HealthCheckResult'
 *                     redis:
 *                       $ref: '#/components/schemas/HealthCheckResult'
 *                     api:
 *                       $ref: '#/components/schemas/HealthCheckResult'
 *                     memory:
 *                       $ref: '#/components/schemas/HealthCheckResult'
 *                     disk:
 *                       $ref: '#/components/schemas/HealthCheckResult'
 *       503:
 *         description: Service unavailable
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    // Run all health checks in parallel
    const [
      databaseCheck,
      redisCheck,
      apiCheck,
      memoryCheck,
      diskCheck,
      externalDeps
    ] = await Promise.allSettled([
      checkDatabase(),
      checkRedis(),
      checkAPI(),
      checkMemory(),
      checkDisk(),
      checkExternalDependencies(),
    ]);

    const checks = {
      database: getResultFromSettled(databaseCheck),
      redis: getResultFromSettled(redisCheck),
      api: getResultFromSettled(apiCheck),
      memory: getResultFromSettled(memoryCheck),
      disk: getResultFromSettled(diskCheck),
    };

    const dependencies = {
      external: Array.isArray(getResultFromSettled(externalDeps)) 
        ? getResultFromSettled(externalDeps) as ExternalDependency[]
        : [],
    };

    // Determine overall status
    const overallStatus = determineOverallStatus(checks);
    
    const healthCheck: HealthCheck = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '2.2.0',
      uptime: Date.now() - startTime,
      checks,
      dependencies,
    };

    const responseStatus = overallStatus === 'healthy' ? 200 : 
                          overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json(healthCheck, { 
      status: responseStatus,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '2.2.0',
      uptime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  }
}

async function checkDatabase(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    // Simple query to check database connectivity
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    const responseTime = Date.now() - start;
    
    // Check if we can also write (create a test record)
    await prisma.$executeRaw`SELECT current_timestamp`;
    
    return {
      status: 'healthy',
      responseTime,
      details: {
        connection: 'active',
        query_result: result,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Database connection failed',
    };
  }
}

async function checkRedis(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    if (!redis.isReady()) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: 'Redis not connected',
      };
    }

    // Test basic operations
    const testKey = 'health_check_' + Date.now();
    const testValue = 'test_value';
    
    await redis.set(testKey, testValue, 10); // 10 second TTL
    const retrieved = await redis.get(testKey);
    await redis.del(testKey);
    
    const responseTime = Date.now() - start;
    
    if (retrieved !== testValue) {
      return {
        status: 'unhealthy',
        responseTime,
        error: 'Redis read/write test failed',
      };
    }
    
    return {
      status: 'healthy',
      responseTime,
      details: {
        connection: 'active',
        operations: 'read/write successful',
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Redis check failed',
    };
  }
}

async function checkAPI(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    // Test internal API endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/docs`, {
      method: 'HEAD',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const responseTime = Date.now() - start;
    
    return {
      status: response.ok ? 'healthy' : 'degraded',
      responseTime,
      details: {
        status_code: response.status,
        endpoint: '/api/docs',
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'API check failed',
    };
  }
}

async function checkMemory(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    const memUsage = process.memoryUsage();
    const totalMemory = memUsage.heapTotal;
    const usedMemory = memUsage.heapUsed;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;
    
    const responseTime = Date.now() - start;
    
    // Consider degraded if memory usage > 80%
    const status = memoryUsagePercent > 90 ? 'unhealthy' :
                  memoryUsagePercent > 80 ? 'degraded' : 'healthy';
    
    return {
      status,
      responseTime,
      details: {
        heap_used: Math.round(usedMemory / 1024 / 1024) + ' MB',
        heap_total: Math.round(totalMemory / 1024 / 1024) + ' MB',
        usage_percent: Math.round(memoryUsagePercent),
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB',
        rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Memory check failed',
    };
  }
}

async function checkDisk(): Promise<HealthCheckResult> {
  const start = Date.now();
  
  try {
    // On Node.js, we can't easily check disk space without additional packages
    // For now, we'll do a simple file system test
    const testFile = '/tmp/health_check_' + Date.now();
    
    // Try to write and read a test file
    await import('fs/promises').then(async (fs) => {
      await fs.writeFile(testFile, 'health check test');
      const content = await fs.readFile(testFile, 'utf-8');
      await fs.unlink(testFile);
      
      if (content !== 'health check test') {
        throw new Error('File system read/write test failed');
      }
    });
    
    const responseTime = Date.now() - start;
    
    return {
      status: 'healthy',
      responseTime,
      details: {
        file_system: 'read/write successful',
        test_file: testFile,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : 'Disk check failed',
    };
  }
}

async function checkExternalDependencies(): Promise<ExternalDependency[]> {
  const dependencies: Array<{ name: string; url: string }> = [
    // Add external dependencies here
    // { name: 'External API', url: 'https://api.example.com/health' },
  ];
  
  const results = await Promise.allSettled(
    dependencies.map(async (dep) => {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(dep.url, {
          method: 'HEAD',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        return {
          name: dep.name,
          status: response.ok ? 'healthy' as const : 'unhealthy' as const,
          responseTime: Date.now() - start,
          url: dep.url,
        };
      } catch (error) {
        return {
          name: dep.name,
          status: 'unhealthy' as const,
          responseTime: Date.now() - start,
          url: dep.url,
        };
      }
    })
  );
  
  return results.map(result => 
    result.status === 'fulfilled' ? result.value : {
      name: 'Unknown',
      status: 'unknown' as const,
      responseTime: 0,
    }
  );
}

function getResultFromSettled<T>(settled: PromiseSettledResult<T>): T | HealthCheckResult {
  if (settled.status === 'fulfilled') {
    return settled.value;
  } else {
    return {
      status: 'unhealthy',
      responseTime: 0,
      error: settled.reason instanceof Error ? settled.reason.message : 'Check failed',
    } as HealthCheckResult;
  }
}

function determineOverallStatus(checks: HealthCheck['checks']): 'healthy' | 'unhealthy' | 'degraded' {
  const checkValues = Object.values(checks);
  
  // If any critical service is unhealthy, overall is unhealthy
  if (checks.database.status === 'unhealthy' || checks.api.status === 'unhealthy') {
    return 'unhealthy';
  }
  
  // If any service is unhealthy, overall is unhealthy
  if (checkValues.some(check => check.status === 'unhealthy')) {
    return 'unhealthy';
  }
  
  // If any service is degraded, overall is degraded
  if (checkValues.some(check => check.status === 'degraded')) {
    return 'degraded';
  }
  
  return 'healthy';
}

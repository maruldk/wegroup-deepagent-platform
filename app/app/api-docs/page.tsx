// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Book, 
  Code, 
  Download, 
  ExternalLink, 
  Key, 
  Rocket,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

// Dynamic import for Swagger UI to avoid SSR issues
const SwaggerUI = dynamic(
  // @ts-ignore
  () => import('swagger-ui-react'),
  { 
    ssr: false,
    loading: () => <SwaggerUILoader />
  }
);

function SwaggerUILoader() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-64 w-full" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function ApiDocsPage() {
  const [swaggerSpec, setSwaggerSpec] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSwaggerSpec();
  }, []);

  const fetchSwaggerSpec = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/docs');
      
      if (!response.ok) {
        throw new Error('Failed to fetch API documentation');
      }
      
      const spec = await response.json();
      setSwaggerSpec(spec);
    } catch (error) {
      console.error('Error fetching Swagger spec:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SwaggerUILoader />;
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Fehler beim Laden der API-Dokumentation: {error}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={fetchSwaggerSpec}
              className="ml-4"
            >
              Erneut versuchen
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="flex items-center justify-center gap-3 mb-4">
          <Book className="w-8 h-8 text-blue-600" />
          <h1 className="text-4xl font-bold">API Documentation</h1>
          <Badge variant="secondary" className="text-sm">
            v{swaggerSpec?.info?.version || '2.2.0'}
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Vollständige API-Dokumentation für die weGROUP DeepAgent Plattform. 
          Explore endpoints, test API calls, and integrate with your applications.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <Card>
          <CardContent className="p-4 text-center">
            <Rocket className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">50+</p>
            <p className="text-sm text-muted-foreground">API Endpoints</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Zap className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">&lt; 200ms</p>
            <p className="text-sm text-muted-foreground">Avg Response Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">99.9%</p>
            <p className="text-sm text-muted-foreground">Uptime SLA</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold">Multi-tenant</p>
            <p className="text-sm text-muted-foreground">Architecture</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content */}
      <Tabs defaultValue="explorer" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="explorer">API Explorer</TabsTrigger>
          <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
          <TabsTrigger value="authentication">Authentication</TabsTrigger>
          <TabsTrigger value="sdk">SDK & Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="explorer" className="space-y-4">
          <div className="border rounded-lg">
            {swaggerSpec && (
              <SwaggerUI 
                spec={swaggerSpec}
                deepLinking={true}
                displayRequestDuration={true}
                tryItOutEnabled={true}
                persistAuthorization={true}
                docExpansion="list"
                defaultModelsExpandDepth={2}
                displayOperationId={true}
                showExtensions={true}
                showCommonExtensions={true}
              />
            )}
          </div>
        </TabsContent>

        <TabsContent value="getting-started" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="w-5 h-5" />
                  Quick Start
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex items-center justify-center mt-1">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">Authentifizierung erhalten</h4>
                      <p className="text-sm text-muted-foreground">
                        Erstellen Sie ein Account und erhalten Sie Ihre API-Credentials
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex items-center justify-center mt-1">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">Erste API-Anfrage</h4>
                      <p className="text-sm text-muted-foreground">
                        Testen Sie die API mit einem einfachen GET-Request
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold flex items-center justify-center mt-1">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">Integration entwickeln</h4>
                      <p className="text-sm text-muted-foreground">
                        Nutzen Sie unsere SDKs oder REST-API direkt
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Code Example
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-gray-100 overflow-x-auto">
                  <pre>{`// TypeScript/JavaScript
import { WeGroupAPI } from '@wegroup/api';

const client = new WeGroupAPI({
  apiKey: 'your-api-key',
  baseURL: 'https://platform.wegroup.ai'
});

// Get dashboards
const dashboards = await client.analytics
  .getDashboards({ page: 1, limit: 10 });

// Create new dashboard  
const newDashboard = await client.analytics
  .createDashboard({
    name: 'My Dashboard',
    description: 'Custom analytics dashboard'
  });`}</pre>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Rate Limits & Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Rate Limits</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• 1000 requests/hour (Standard)</li>
                    <li>• 5000 requests/hour (Pro)</li>
                    <li>• Unlimited (Enterprise)</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Best Practices</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Verwenden Sie Pagination</li>
                    <li>• Implementieren Sie Retry-Logic</li>
                    <li>• Cachen Sie häufige Anfragen</li>
                  </ul>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Error Handling</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Standardisierte HTTP Status Codes</li>
                    <li>• Detaillierte Error Messages</li>
                    <li>• Request IDs für Debugging</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="authentication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5" />
                Authentication Methods
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Bearer Token</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    JWT-basierte Authentifizierung für API-Zugriff
                  </p>
                  <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                    Authorization: Bearer eyJ0eXAiOiJKV1...
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">API Key</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Einfache API-Key Authentifizierung
                  </p>
                  <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                    X-API-Key: wg_1234567890abcdef...
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Session Cookie</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Browser-basierte Session-Authentifizierung
                  </p>
                  <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                    Cookie: next-auth.session-token=...
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Sicherheitshinweis:</strong> Bewahren Sie Ihre API-Keys sicher auf und teilen Sie sie niemals öffentlich. 
                  Verwenden Sie Umgebungsvariablen für die Speicherung in Ihren Anwendungen.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Scopes & Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Analytics Scopes</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <code className="bg-gray-100 px-2 py-1 rounded">analytics:read</code>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <code className="bg-gray-100 px-2 py-1 rounded">analytics:write</code>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <code className="bg-gray-100 px-2 py-1 rounded">dashboards:manage</code>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">AI/ML Scopes</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <code className="bg-gray-100 px-2 py-1 rounded">ai:insights</code>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <code className="bg-gray-100 px-2 py-1 rounded">ml:predictions</code>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <code className="bg-gray-100 px-2 py-1 rounded">models:train</code>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sdk" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Official SDKs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">TypeScript/JavaScript</h4>
                      <p className="text-sm text-muted-foreground">For Node.js and Browser</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">v2.2.0</Badge>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-1" />
                        Install
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-semibold">Python</h4>
                      <p className="text-sm text-muted-foreground">For Data Science & ML</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">v2.1.0</Badge>
                      <Button size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-1" />
                        Install
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg opacity-50">
                    <div>
                      <h4 className="font-semibold">Go</h4>
                      <p className="text-sm text-muted-foreground">Coming Soon</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary">
                        <Clock className="w-3 h-3 mr-1" />
                        Soon
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/api/docs" target="_blank">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    OpenAPI Specification
                  </a>
                </Button>
                
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://github.com/wegroup/api-examples" target="_blank">
                    <Code className="w-4 h-4 mr-2" />
                    Code Examples
                  </a>
                </Button>
                
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="https://postman.com/wegroup/workspace" target="_blank">
                    <Download className="w-4 h-4 mr-2" />
                    Postman Collection
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Integration Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="javascript" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="javascript">JavaScript</TabsTrigger>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>

                <TabsContent value="javascript">
                  <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-gray-100 overflow-x-auto">
                    <pre>{`// Analytics Dashboard Example
import { WeGroupAPI } from '@wegroup/api';

const api = new WeGroupAPI({
  apiKey: process.env.WEGROUP_API_KEY
});

async function createAnalyticsDashboard() {
  try {
    // Create dashboard
    const dashboard = await api.analytics.createDashboard({
      name: 'Sales Dashboard',
      description: 'Key sales metrics and trends'
    });

    // Add widgets
    await api.analytics.createWidget(dashboard.id, {
      name: 'Revenue Chart',
      type: 'CHART_LINE',
      config: {
        dataSource: 'revenue',
        period: '30d'
      }
    });

    console.log('Dashboard created:', dashboard.id);
  } catch (error) {
    console.error('Error:', error.message);
  }
}`}</pre>
                  </div>
                </TabsContent>

                <TabsContent value="python">
                  <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-gray-100 overflow-x-auto">
                    <pre>{`# AI Insights Example
import wegroup

client = wegroup.Client(api_key=os.getenv('WEGROUP_API_KEY'))

# Get AI insights
insights = client.ai.get_insights(
    category='ANALYTICS',
    severity=['MEDIUM', 'HIGH']
)

for insight in insights:
    print(f"Insight: {insight.title}")
    print(f"Confidence: {insight.confidence:.2%}")
    print(f"Description: {insight.description}")
    print("---")

# Generate predictions
predictions = client.ai.predict(
    model='revenue_forecast',
    data={'period': '90d'}
)

print(f"Revenue prediction: €{predictions.value:,.2f}")
print(f"Confidence: {predictions.confidence:.2%}")`}</pre>
                  </div>
                </TabsContent>

                <TabsContent value="curl">
                  <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-gray-100 overflow-x-auto">
                    <pre>{`# Get dashboards
curl -X GET "https://platform.wegroup.ai/api/analytics/dashboards" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json"

# Create dashboard
curl -X POST "https://platform.wegroup.ai/api/analytics/dashboards" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Executive Dashboard",
    "description": "High-level business metrics",
    "layout": {
      "columns": 12,
      "rows": 8
    }
  }'

# Get AI insights
curl -X GET "https://platform.wegroup.ai/api/ai/insights?category=ANALYTICS" \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json"`}</pre>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

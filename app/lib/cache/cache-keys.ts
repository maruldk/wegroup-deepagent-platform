
export const CacheKeys = {
  // Dashboard caching
  DASHBOARD_LIST: (tenantId: string, userId: string) => `dashboard:list:${tenantId}:${userId}`,
  DASHBOARD_DETAIL: (dashboardId: string) => `dashboard:detail:${dashboardId}`,
  DASHBOARD_WIDGETS: (dashboardId: string) => `dashboard:widgets:${dashboardId}`,
  
  // Analytics caching  
  ANALYTICS_METRICS: (tenantId: string) => `analytics:metrics:${tenantId}`,
  ANALYTICS_REPORTS: (tenantId: string, filters: string) => `analytics:reports:${tenantId}:${filters}`,
  ANALYTICS_KPI: (tenantId: string, period: string) => `analytics:kpi:${tenantId}:${period}`,
  
  // AI/ML caching
  AI_INSIGHTS: (tenantId: string, type: string) => `ai:insights:${tenantId}:${type}`,
  AI_PREDICTIONS: (tenantId: string, model: string) => `ai:predictions:${tenantId}:${model}`,
  ML_MODEL_CACHE: (modelId: string) => `ml:model:${modelId}`,
  
  // User & Session caching
  USER_PROFILE: (userId: string) => `user:profile:${userId}`,
  USER_PERMISSIONS: (userId: string, tenantId: string) => `user:permissions:${userId}:${tenantId}`,
  SESSION_DATA: (sessionId: string) => `session:${sessionId}`,
  
  // API Response caching
  API_RESPONSE: (endpoint: string, params: string) => `api:${endpoint}:${params}`,
  
  // Real-time data
  REALTIME_METRICS: (tenantId: string) => `realtime:metrics:${tenantId}`,
  LIVE_DASHBOARD: (dashboardId: string) => `live:dashboard:${dashboardId}`,
} as const;

export const CacheTTL = {
  SHORT: 300,      // 5 minutes
  MEDIUM: 1800,    // 30 minutes  
  LONG: 3600,      // 1 hour
  VERY_LONG: 86400, // 24 hours
  PERMANENT: -1,    // No expiration
} as const;


'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Bell, 
  X, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Users,
  DollarSign,
  Lightbulb,
  CheckCircle,
  Clock,
  Zap,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { aiWebSocketService } from '@/lib/ai/realtime/websocket-ai-service';

export interface RealTimeNotification {
  id: string;
  type: 'ai_insight' | 'ai_alert' | 'ai_recommendation' | 'system_update' | 'performance_alert';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'sales' | 'customer' | 'marketing' | 'operations' | 'system';
  timestamp: string;
  actionUrl?: string;
  actionText?: string;
  dismissed: boolean;
  autoExpire?: number; // seconds
  data?: any;
}

interface RealTimeNotificationsProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
  autoExpireDefault?: number;
  showTimestamp?: boolean;
}

export function RealTimeNotifications({
  position = 'top-right',
  maxNotifications = 5,
  autoExpireDefault = 10,
  showTimestamp = true
}: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<RealTimeNotification[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // Listen for AI WebSocket notifications
    const handleAIRecommendation = (data: any) => {
      addNotification({
        type: 'ai_recommendation',
        title: 'Neue KI-Empfehlung',
        message: data.recommendation || 'Neue Geschäftsmöglichkeit erkannt',
        priority: 'medium',
        category: 'sales',
        actionUrl: '/analytics/insights',
        actionText: 'Details anzeigen'
      });
    };

    const handleAIInsight = (data: any) => {
      addNotification({
        type: 'ai_insight',
        title: 'KI-Erkenntnisse verfügbar',
        message: data.trend || 'Neue Markttrends identifiziert',
        priority: 'medium',
        category: 'marketing',
        actionUrl: '/analytics/dashboard',
        actionText: 'Dashboard öffnen'
      });
    };

    const handleAIAlert = (data: any) => {
      addNotification({
        type: 'ai_alert',
        title: 'KI-Warnung',
        message: data.anomaly || 'Ungewöhnliche Aktivität erkannt',
        priority: 'high',
        category: 'system',
        actionUrl: '/security',
        actionText: 'Prüfen'
      });
    };

    // Subscribe to AI WebSocket events
    aiWebSocketService.on('ai_recommendation', handleAIRecommendation);
    aiWebSocketService.on('ai_insight', handleAIInsight);
    aiWebSocketService.on('ai_alert', handleAIAlert);

    // Generate initial mock notifications
    generateInitialNotifications();

    // Simulate real-time notifications
    const interval = setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every 30 seconds
        generateRandomNotification();
      }
    }, 30000);

    return () => {
      aiWebSocketService.off('ai_recommendation', handleAIRecommendation);
      aiWebSocketService.off('ai_insight', handleAIInsight);
      aiWebSocketService.off('ai_alert', handleAIAlert);
      clearInterval(interval);
    };
  }, []);

  const generateInitialNotifications = () => {
    const initialNotifications: Partial<RealTimeNotification>[] = [
      {
        type: 'ai_insight',
        title: 'Umsatz-Prognose aktualisiert',
        message: 'Q4 Umsatz wird voraussichtlich 15% über Plan liegen',
        priority: 'high',
        category: 'sales',
        actionUrl: '/analytics/dashboard',
        actionText: 'Dashboard'
      },
      {
        type: 'ai_alert',
        title: 'Churn-Risiko erkannt',
        message: '23 Kunden mit hohem Abwanderungsrisiko',
        priority: 'critical',
        category: 'customer',
        actionUrl: '/crm/customers',
        actionText: 'Kunden anzeigen'
      }
    ];

    initialNotifications.forEach(notification => {
      setTimeout(() => addNotification(notification), Math.random() * 3000);
    });
  };

  const generateRandomNotification = () => {
    const notifications: Partial<RealTimeNotification>[] = [
      {
        type: 'ai_recommendation',
        title: 'Neue Lead-Opportunity',
        message: 'Enterprise-Lead mit hoher Conversion-Wahrscheinlichkeit',
        priority: 'medium',
        category: 'sales',
        actionUrl: '/leads',
        actionText: 'Lead anzeigen'
      },
      {
        type: 'ai_insight',
        title: 'Market Trend erkannt',
        message: 'Healthcare-Sektor zeigt erhöhte Nachfrage',
        priority: 'medium',
        category: 'marketing',
        actionUrl: '/analytics/insights',
        actionText: 'Trend analysieren'
      },
      {
        type: 'performance_alert',
        title: 'Performance-Update',
        message: 'KI-Model Performance um 3% verbessert',
        priority: 'low',
        category: 'system',
        autoExpire: 5
      },
      {
        type: 'ai_alert',
        title: 'Anomalie erkannt',
        message: 'Ungewöhnliche API-Aufrufmuster',
        priority: 'high',
        category: 'system',
        actionUrl: '/security',
        actionText: 'Sicherheit prüfen'
      }
    ];

    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    addNotification(randomNotification);
  };

  const addNotification = (notification: Partial<RealTimeNotification>) => {
    const newNotification: RealTimeNotification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: notification.type || 'ai_insight',
      title: notification.title || 'Neue Benachrichtigung',
      message: notification.message || '',
      priority: notification.priority || 'medium',
      category: notification.category || 'system',
      timestamp: new Date().toISOString(),
      actionUrl: notification.actionUrl,
      actionText: notification.actionText,
      dismissed: false,
      autoExpire: notification.autoExpire || autoExpireDefault,
      data: notification.data
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, maxNotifications);
      return updated;
    });

    // Auto-expire notification
    if (newNotification.autoExpire) {
      setTimeout(() => {
        dismissNotification(newNotification.id);
      }, newNotification.autoExpire * 1000);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const dismissAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: RealTimeNotification['type']) => {
    switch (type) {
      case 'ai_insight': return <Lightbulb className="h-4 w-4" />;
      case 'ai_alert': return <AlertTriangle className="h-4 w-4" />;
      case 'ai_recommendation': return <Target className="h-4 w-4" />;
      case 'system_update': return <CheckCircle className="h-4 w-4" />;
      case 'performance_alert': return <Zap className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationColor = (priority: RealTimeNotification['priority']) => {
    switch (priority) {
      case 'critical': return 'border-red-500 bg-red-50';
      case 'high': return 'border-orange-500 bg-orange-50';
      case 'medium': return 'border-blue-500 bg-blue-50';
      case 'low': return 'border-gray-500 bg-gray-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getPriorityBadgeColor = (priority: RealTimeNotification['priority']) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getCategoryIcon = (category: RealTimeNotification['category']) => {
    switch (category) {
      case 'sales': return <DollarSign className="h-3 w-3" />;
      case 'customer': return <Users className="h-3 w-3" />;
      case 'marketing': return <Target className="h-3 w-3" />;
      case 'operations': return <Zap className="h-3 w-3" />;
      case 'system': return <Brain className="h-3 w-3" />;
      default: return <Bell className="h-3 w-3" />;
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-right': return 'top-4 right-4';
      case 'top-left': return 'top-4 left-4';
      case 'bottom-right': return 'bottom-4 right-4';
      case 'bottom-left': return 'bottom-4 left-4';
      default: return 'top-4 right-4';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'gerade eben';
    if (diffMins < 60) return `vor ${diffMins}m`;
    if (diffMins < 1440) return `vor ${Math.floor(diffMins / 60)}h`;
    return time.toLocaleDateString('de-DE');
  };

  if (notifications.length === 0) return null;

  return (
    <div className={cn('fixed z-50 w-96 max-w-sm', getPositionClasses())}>
      <AnimatePresence>
        {!isMinimized && (
          <motion.div
            initial={{ opacity: 0, x: position.includes('right') ? 100 : -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: position.includes('right') ? 100 : -100 }}
            className="space-y-2"
          >
            {/* Header */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      KI-Benachrichtigungen
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {notifications.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={dismissAll}
                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                    >
                      <CheckCircle className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsMinimized(true)}
                      className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            {notifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={cn('border-l-4', getNotificationColor(notification.priority))}>
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'p-1 rounded-full',
                            notification.priority === 'critical' ? 'bg-red-100 text-red-600' :
                            notification.priority === 'high' ? 'bg-orange-100 text-orange-600' :
                            notification.priority === 'medium' ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-600'
                          )}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-gray-900">
                                {notification.title}
                              </h4>
                              <Badge variant={getPriorityBadgeColor(notification.priority)} className="text-xs">
                                {notification.priority}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <div className="text-gray-500">
                                {getCategoryIcon(notification.category)}
                              </div>
                              <span className="text-xs text-gray-500 capitalize">
                                {notification.category}
                              </span>
                              {showTimestamp && (
                                <>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatTimestamp(notification.timestamp)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissNotification(notification.id)}
                          className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Message */}
                      <p className="text-sm text-gray-700">
                        {notification.message}
                      </p>

                      {/* Action */}
                      {notification.actionUrl && notification.actionText && (
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Navigate to action URL
                              window.location.href = notification.actionUrl!;
                              dismissNotification(notification.id);
                            }}
                            className="text-xs h-7"
                          >
                            {notification.actionText}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Minimized state */}
      {isMinimized && notifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <Button
            onClick={() => setIsMinimized(false)}
            className="relative bg-blue-600 hover:bg-blue-700 text-white rounded-full h-12 w-12 shadow-lg"
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
              >
                {notifications.length}
              </Badge>
            )}
          </Button>
          {notifications.some(n => n.priority === 'critical') && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </motion.div>
      )}
    </div>
  );
}

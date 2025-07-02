
'use client';

/**
 * HYBRID SPRINT 2.1: Offline Page
 * Page shown when app is offline
 */

import React from 'react';
import { Wifi, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ResponsiveCard from '@/components/ui/responsive-card';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <ResponsiveCard 
        className="max-w-md mx-auto text-center"
        animate={false}
      >
        <div className="p-8">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Wifi className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">You're Offline</h1>
          
          <p className="text-muted-foreground mb-6">
            It looks like you've lost your internet connection. Some features may not be available while offline.
          </p>
          
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.reload()}
              className="w-full"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
          
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Available Offline:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• View cached dashboard</li>
              <li>• Access recent data</li>
              <li>• Browse saved reports</li>
            </ul>
          </div>
        </div>
      </ResponsiveCard>
    </div>
  );
}

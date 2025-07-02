
'use client';

/**
 * HYBRID SPRINT 2.1: Responsive Grid Component
 * Mobile-first responsive grid system
 */

import React from 'react';
import { mobileLayoutService } from '@/lib/mobile/mobile-layout-service';
import { cn } from '@/lib/utils';

interface ResponsiveGridProps {
  children: React.ReactNode;
  cols?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  gap?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = { mobile: 'gap-4', tablet: 'gap-6', desktop: 'gap-6' },
  className
}) => {
  const gridClasses = mobileLayoutService.getGridClasses(cols);
  const gapClasses = mobileLayoutService.getSpacingClasses(gap);

  return (
    <div className={cn('grid', gridClasses, gapClasses, className)}>
      {children}
    </div>
  );
};

interface ResponsiveGridItemProps {
  children: React.ReactNode;
  span?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  className?: string;
}

export const ResponsiveGridItem: React.FC<ResponsiveGridItemProps> = ({
  children,
  span,
  className
}) => {
  const spanClasses = span ? Object.entries(span).map(([device, spanValue]) => {
    if (device === 'mobile') return `col-span-${spanValue}`;
    if (device === 'tablet') return `md:col-span-${spanValue}`;
    if (device === 'desktop') return `lg:col-span-${spanValue}`;
    return '';
  }).filter(Boolean).join(' ') : '';

  return (
    <div className={cn(spanClasses, className)}>
      {children}
    </div>
  );
};

export { ResponsiveGrid as default };

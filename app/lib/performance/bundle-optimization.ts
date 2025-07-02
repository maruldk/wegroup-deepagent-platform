
/**
 * Bundle Optimization Utilities
 * Reduces bundle size to prevent memory issues
 */

import React from 'react';

// Tree-shaking optimized imports
export const optimizedImports = {
  // Only import what we need from lodash
  debounce: () => import('lodash/debounce'),
  throttle: () => import('lodash/throttle'),
  
  // Lazy load heavy libraries
  charts: () => import('recharts'),
  plotly: () => import('react-plotly.js'),
  
  // Split form libraries
  formik: () => import('formik'),
  yup: () => import('yup'),
  
  // Date utilities
  dayjs: () => import('dayjs'),
  dateFns: () => import('date-fns'),
};

// Bundle size monitoring
export function getBundleSize() {
  if (typeof window === 'undefined') return null;
  
  const resources = performance.getEntriesByType('navigation');
  const resource = resources[0] as PerformanceNavigationTiming;
  
  return {
    transferSize: resource.transferSize,
    encodedBodySize: resource.encodedBodySize,
    decodedBodySize: resource.decodedBodySize,
    estimatedSavings: resource.decodedBodySize - resource.transferSize
  };
}

// Code splitting helper
export function createAsyncComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
): React.ComponentType<React.ComponentProps<T>> {
  const LazyComponent = React.lazy(importFn);
  
  return function AsyncComponent(props: React.ComponentProps<T>) {
    return React.createElement(
      React.Suspense,
      { fallback: fallback ? React.createElement(fallback) : React.createElement('div', null, 'Loading...') },
      React.createElement(LazyComponent, props)
    );
  };
}

// Memory-efficient component factory
export function createMemoizedComponent<P>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return React.memo(Component, propsAreEqual);
}

// Virtualization helper for large lists
export function createVirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}) {
  const [scrollTop, setScrollTop] = React.useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  
  return {
    visibleItems,
    visibleStart,
    visibleEnd,
    totalHeight: items.length * itemHeight,
    offsetY: visibleStart * itemHeight,
    setScrollTop,
  };
}

// Image optimization
export const imageOptimization = {
  // Lazy load images
  createLazyImage: (src: string, alt: string) => ({
    src: `${src}?w=800&q=75`, // Optimize size and quality
    alt,
    loading: 'lazy' as const,
    decoding: 'async' as const,
  }),
  
  // Generate responsive image sources
  createResponsiveSources: (baseSrc: string) => ({
    mobile: `${baseSrc}?w=400&q=75`,
    tablet: `${baseSrc}?w=800&q=80`,
    desktop: `${baseSrc}?w=1200&q=85`,
  }),
};

// Performance monitoring
export function createPerformanceMonitor() {
  const marks = new Map<string, number>();
  
  return {
    mark: (name: string) => {
      marks.set(name, performance.now());
      performance.mark(name);
    },
    
    measure: (name: string, startMark: string, endMark?: string) => {
      const startTime = marks.get(startMark);
      const endTime = endMark ? marks.get(endMark) : performance.now();
      
      if (startTime && endTime) {
        const duration = endTime - startTime;
        performance.measure(name, startMark, endMark);
        return duration;
      }
      return null;
    },
    
    getMetrics: () => {
      const entries = performance.getEntriesByType('measure');
      return entries.map(entry => ({
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime,
      }));
    },
    
    clear: () => {
      marks.clear();
      performance.clearMarks();
      performance.clearMeasures();
    },
  };
}

export default {
  optimizedImports,
  getBundleSize,
  createAsyncComponent,
  createMemoizedComponent,
  createVirtualizedList,
  imageOptimization,
  createPerformanceMonitor,
};

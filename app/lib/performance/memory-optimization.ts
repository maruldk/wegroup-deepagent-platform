
/**
 * Memory Optimization Utilities
 * Alternative solutions for memory management without modifying next.config.js
 */

// Debounce function for API calls
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
}

// Throttle function for frequent operations
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Memory-efficient data fetching with pagination
export async function fetchWithPagination(
  url: string,
  page: number = 1,
  limit: number = 10
) {
  try {
    const response = await fetch(`${url}?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Fetch with pagination error:', error);
    return { data: [], total: 0, page, limit };
  }
}

// Cleanup function for component unmounting
export function createCleanupManager() {
  const cleanupFunctions: (() => void)[] = [];
  
  const addCleanup = (cleanup: () => void) => {
    cleanupFunctions.push(cleanup);
  };
  
  const cleanup = () => {
    cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });
    cleanupFunctions.length = 0;
  };
  
  return { addCleanup, cleanup };
}

// Memory-efficient image loading
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

// Bundle size optimization through tree shaking
export const optimizedExports = {
  debounce,
  throttle,
  fetchWithPagination,
  createCleanupManager,
  preloadImage,
};

// Virtual scrolling utility for large lists
export function calculateVisibleItems(
  containerHeight: number,
  itemHeight: number,
  scrollTop: number,
  totalItems: number
) {
  const visibleCount = Math.ceil(containerHeight / itemHeight);
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + 1, totalItems);
  
  return {
    startIndex: Math.max(0, startIndex),
    endIndex,
    visibleCount
  };
}

// Memory monitoring (development only)
export function monitorMemoryUsage() {
  if (typeof window !== 'undefined' && 'memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
      usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
    };
  }
  return null;
}

// Garbage collection helper
export function forceGarbageCollection() {
  if (typeof window !== 'undefined') {
    // Clear any cached data
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('temp') || name.includes('old')) {
            caches.delete(name);
          }
        });
      });
    }
    
    // Clear performance marks and measures
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
  }
}

export default optimizedExports;

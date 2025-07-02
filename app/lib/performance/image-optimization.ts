
import { NextRequest } from 'next/server';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
  priority?: boolean;
  sizes?: string;
  className?: string;
}

export class ImageOptimizer {
  
  static getOptimizedSrc(
    src: string, 
    width?: number, 
    height?: number, 
    quality: number = 75,
    format: string = 'webp'
  ): string {
    if (!src || src.startsWith('data:') || src.startsWith('blob:')) {
      return src;
    }

    const params = new URLSearchParams();
    
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality !== 75) params.set('q', quality.toString());
    if (format !== 'webp') params.set('f', format);

    const queryString = params.toString();
    const separator = src.includes('?') ? '&' : '?';
    
    return queryString ? `${src}${separator}${queryString}` : src;
  }

  static generateSrcSet(src: string, sizes: number[], format: string = 'webp'): string {
    return sizes
      .map(size => `${this.getOptimizedSrc(src, size, undefined, 75, format)} ${size}w`)
      .join(', ');
  }

  static getResponsiveSizes(breakpoints: { [key: string]: number }): string {
    const entries = Object.entries(breakpoints).sort(([,a], [,b]) => b - a);
    
    return entries
      .map(([breakpoint, size], index) => {
        if (index === entries.length - 1) {
          return `${size}px`;
        }
        return `(min-width: ${breakpoint}) ${size}px`;
      })
      .join(', ');
  }

  static detectWebPSupport(request: NextRequest): boolean {
    const acceptHeader = request.headers.get('accept') || '';
    return acceptHeader.includes('image/webp');
  }

  static detectAVIFSupport(request: NextRequest): boolean {
    const acceptHeader = request.headers.get('accept') || '';
    return acceptHeader.includes('image/avif');
  }

  static getBestFormat(request: NextRequest, preferredFormat?: string): string {
    if (preferredFormat && preferredFormat !== 'auto') {
      return preferredFormat;
    }

    if (this.detectAVIFSupport(request)) {
      return 'avif';
    }
    
    if (this.detectWebPSupport(request)) {
      return 'webp';
    }
    
    return 'jpeg';
  }
}

// Responsive image breakpoints
export const IMAGE_BREAKPOINTS = {
  mobile: 320,
  tablet: 768,
  desktop: 1200,
  large: 1600,
} as const;

// Common image sizes for optimization
export const COMMON_SIZES = [320, 480, 640, 768, 1024, 1280, 1600] as const;

// Image quality presets
export const QUALITY_PRESETS = {
  low: 50,
  medium: 75,
  high: 90,
  lossless: 100,
} as const;

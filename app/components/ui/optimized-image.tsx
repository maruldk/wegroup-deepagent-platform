
'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { OptimizedImageProps, ImageOptimizer, IMAGE_BREAKPOINTS } from '@/lib/performance/image-optimization';

interface OptimizedImageComponentProps extends OptimizedImageProps {
  fallback?: string;
  loading?: 'lazy' | 'eager';
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 75,
  format = 'auto',
  priority = false,
  sizes,
  className,
  fallback = '/images/placeholder.webp',
  loading = 'lazy',
  onError,
  ...props
}: OptimizedImageComponentProps) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError && fallback && currentSrc !== fallback) {
      setHasError(true);
      setCurrentSrc(fallback);
      onError?.();
    }
  };

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || ImageOptimizer.getResponsiveSizes({
    '(max-width: 640px)': IMAGE_BREAKPOINTS.mobile,
    '(max-width: 1024px)': IMAGE_BREAKPOINTS.tablet,
    '(max-width: 1280px)': IMAGE_BREAKPOINTS.desktop,
  });

  return (
    <Image
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      quality={quality}
      priority={priority}
      sizes={responsiveSizes}
      loading={loading}
      className={cn('transition-opacity duration-300', className)}
      onError={handleError}
      {...props}
    />
  );
}

// Specialized components for common use cases
export function AvatarImage({ 
  src, 
  alt, 
  size = 40,
  className,
  ...props 
}: Omit<OptimizedImageComponentProps, 'width' | 'height'> & { size?: number }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      quality={90}
      priority={false}
      className={cn('rounded-full object-cover', className)}
      {...props}
    />
  );
}

export function HeroImage({ 
  src, 
  alt, 
  className,
  ...props 
}: OptimizedImageComponentProps) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      quality={90}
      priority={true}
      sizes="100vw"
      className={cn('w-full h-auto object-cover', className)}
      {...props}
    />
  );
}

export function ThumbnailImage({ 
  src, 
  alt, 
  size = 200,
  className,
  ...props 
}: Omit<OptimizedImageComponentProps, 'width' | 'height'> & { size?: number }) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      quality={80}
      priority={false}
      className={cn('object-cover rounded-lg', className)}
      {...props}
    />
  );
}

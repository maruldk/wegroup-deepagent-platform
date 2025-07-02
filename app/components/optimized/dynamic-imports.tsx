
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Memory-optimierte Dynamic Imports für CREATE und SELL Module
export const DynamicContentCreationStudio = dynamic(
  () => import('@/components/create/content-creation-studio').then(mod => ({ default: mod.ContentCreationStudio })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }
);

export const DynamicTemplateLibrary = dynamic(
  () => import('@/components/create/template-library').then(mod => ({ default: mod.TemplateLibrary })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }
);

export const DynamicSalesPipeline = dynamic(
  () => import('@/components/sell/sales-pipeline').then(mod => ({ default: mod.SalesPipeline })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    )
  }
);

export const DynamicQuoteGenerator = dynamic(
  () => import('@/components/sell/quote-generator').then(mod => ({ default: mod.QuoteGenerator })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
      </div>
    )
  }
);

export const DynamicProductCatalog = dynamic(
  () => import('@/components/sell/product-catalog').then(mod => ({ default: mod.ProductCatalog })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-32">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-green-600 border-t-transparent"></div>
      </div>
    )
  }
);

// Wrapper Komponenten für bessere Performance
export function LazyContentCreationStudio() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    }>
      <DynamicContentCreationStudio />
    </Suspense>
  );
}

export function LazySalesPipeline() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    }>
      <DynamicSalesPipeline />
    </Suspense>
  );
}

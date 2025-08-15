import { QueryClient } from '@tanstack/react-query';
import { RouteConfig, Flight, CacheStats } from './types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - optimization results are fairly stable
      gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache for 30 minutes
      retry: 2,
      refetchOnWindowFocus: false, // Don't refetch when user returns to tab
      refetchOnReconnect: true, // Do refetch when network reconnects
    },
    mutations: {
      retry: 1,
    },
  },
});

// Query Keys Factory - centralized key management
export const queryKeys = {
  // Route optimization queries
  optimization: (config: RouteConfig) => ['optimization', config] as const,
  
  // Pricing queries  
  routePricing: (flightPath: Flight[]) => ['routePricing', flightPath] as const,
  pricingComparison: (origin: string, destination: string, date: string, flightNumber: string) => 
    ['pricingComparison', { origin, destination, date, flightNumber }] as const,
    
  // Flight data queries
  flights: () => ['flights'] as const,
  
  // Cache stats
  cacheStats: () => ['cacheStats'] as const,
} as const;

// Cache utilities
export const cacheUtils = {
  // Clear specific optimization cache
  clearOptimizationCache: () => {
    queryClient.removeQueries({ 
      queryKey: queryKeys.optimization({}),
      exact: false 
    });
  },
  
  // Clear all pricing cache
  clearPricingCache: () => {
    queryClient.removeQueries({ 
      queryKey: ['routePricing'],
      exact: false 
    });
    queryClient.removeQueries({ 
      queryKey: ['pricingComparison'],
      exact: false 
    });
  },
  
  // Clear all cache
  clearAllCache: () => {
    queryClient.clear();
  },
  
  // Get cache statistics  
  getCacheStats: (): CacheStats => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const stats = {
      totalQueries: queries.length,
      optimizationQueries: queries.filter(q => q.queryKey[0] === 'optimization').length,
      pricingQueries: queries.filter(q => 
        q.queryKey[0] === 'routePricing' || q.queryKey[0] === 'pricingComparison'
      ).length,
      cacheSize: queries.reduce((acc, query) => {
        const data = query.state.data;
        return acc + (data ? JSON.stringify(data).length : 0);
      }, 0),
      lastUpdated: new Date(),
    };
    
    return stats;
  },
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteConfig, Results } from '../lib/types';
import { queryKeys } from '../lib/queryClient';

// Create a hash from the route config for consistent caching
const createConfigHash = (config: RouteConfig): string => {
  const normalized = {
    ...config,
    startAirports: config.startAirports.split(',').map(s => s.trim()).sort().join(','),
    endAirports: config.endAirports.split(',').map(s => s.trim()).sort().join(','),
    visitedAirports: config.visitedAirports.split(',').map(s => s.trim()).filter(Boolean).sort().join(','),
  };
  return JSON.stringify(normalized);
};

// Optimization API call
const fetchOptimization = async (config: RouteConfig): Promise<Results> => {
  const response = await fetch('/api/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ config }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
};

export const useOptimization = (config: RouteConfig | null) => {
  const queryClient = useQueryClient();

  // Query for getting cached optimization results
  const query = useQuery({
    queryKey: queryKeys.optimization(config || {} as RouteConfig),
    queryFn: () => fetchOptimization(config!),
    enabled: !!config, // Only run when config is provided
    staleTime: 10 * 60 * 1000, // 10 minutes - optimization results are stable
    gcTime: 60 * 60 * 1000, // 1 hour - keep optimization results longer
    retry: 2,
    meta: {
      configHash: config ? createConfigHash(config) : null,
    },
  });

  // Mutation for triggering new optimization
  const mutation = useMutation({
    mutationFn: fetchOptimization,
    onSuccess: (data, variables) => {
      // Update the cache with new results
      queryClient.setQueryData(queryKeys.optimization(variables), data);
    },
    onError: (error) => {
      console.error('Optimization failed:', error);
    },
  });

  // Check if we have cached results for this exact config
  const hasCachedResult = (checkConfig: RouteConfig): boolean => {
    const cachedData = queryClient.getQueryData(queryKeys.optimization(checkConfig));
    return !!cachedData;
  };

  // Get cached result without triggering a fetch
  const getCachedResult = (checkConfig: RouteConfig): Results | undefined => {
    return queryClient.getQueryData(queryKeys.optimization(checkConfig));
  };

  // Clear cache for specific config
  const clearCache = (clearConfig?: RouteConfig) => {
    if (clearConfig) {
      queryClient.removeQueries({ 
        queryKey: queryKeys.optimization(clearConfig),
        exact: true 
      });
    } else {
      // Clear all optimization cache
      queryClient.removeQueries({ 
        queryKey: ['optimization'],
        exact: false 
      });
    }
  };

  return {
    // Query results
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isError: query.isError,
    isFetching: query.isFetching,
    
    // Mutation for new optimizations
    optimize: mutation.mutate,
    isOptimizing: mutation.isPending,
    optimizeError: mutation.error,
    
    // Cache utilities
    hasCachedResult,
    getCachedResult,
    clearCache,
    
    // Status flags
    isFromCache: query.isSuccess && !query.isFetching,
  };
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RouteConfig, Results } from '../lib/types';
import { queryKeys } from '../lib/queryClient';
import { optimizeRoute as apiOptimizeRoute, hybridOptimizeRoute as apiHybridOptimizeRoute, getErrorMessage } from '../lib/apiService';

// Validate route configuration
const validateConfig = (config: RouteConfig): boolean => {
  return !!(
    config?.startDate &&
    config?.startTime &&
    config?.endDate &&
    config?.endTime &&
    config?.startAirports &&
    config?.endAirports &&
    config?.minConnectionTime !== undefined &&
    config?.domesticOnly !== undefined
  );
};

// Create a hash from the route config for consistent caching
const createConfigHash = (config: RouteConfig): string => {
  if (!validateConfig(config)) {
    throw new Error('Invalid config provided to createConfigHash');
  }
  
  const normalized = {
    ...config,
    startAirports: config.startAirports.split(',').map(s => s.trim()).sort().join(','),
    endAirports: config.endAirports.split(',').map(s => s.trim()).sort().join(','),
          visitedAirports: config.visitedAirports && config.visitedAirports.trim() !== '' 
        ? config.visitedAirports.split(',').map(s => s.trim()).filter(Boolean).sort().join(',')
        : '',
  };
  return JSON.stringify(normalized);
};

// Optimization API call using hybrid algorithm by default, with fallback to A*
const fetchOptimization = async (config: RouteConfig, algorithmVersion: 'old' | 'improved' = 'old'): Promise<Results> => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🌐 Making API call to hybrid optimization with config:', config);
  }
  
  try {
    // Try hybrid optimization first
    const result = await apiHybridOptimizeRoute(config, algorithmVersion);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Hybrid optimization successful, result:', result);
    }
    
    return result;
  } catch (hybridError) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Hybrid optimization failed, falling back to A*:', hybridError);
    }
    
    try {
      // Fallback to original A* optimization
      const result = await apiOptimizeRoute(config);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ A* fallback successful, result:', result);
      }
      
      return result;
    } catch (astarError) {
      // Log technical details in development only
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Both optimizations failed:', { hybridError, astarError });
      }
      
      // Re-throw with user-friendly message - the hook will handle displaying it
      throw new Error(getErrorMessage(astarError));
    }
  }
};

export const useOptimization = (config: RouteConfig | null, algorithmVersion: 'old' | 'improved' = 'old') => {
  const queryClient = useQueryClient();

  // Debug logging (development only)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 useOptimization hook called with config:', config);
    console.log('🔍 Hook enabled:', !!config);
  }

  // Query for getting cached optimization results
  const query = useQuery({
    queryKey: queryKeys.optimization(config || {} as RouteConfig),
    queryFn: () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 fetchOptimization called with config:', config);
      }
      return fetchOptimization(config!, algorithmVersion);
    },
    enabled: !!(config && validateConfig(config)), // Only run when config is provided and valid
    staleTime: 10 * 60 * 1000, // 10 minutes - optimization results are stable
    gcTime: 60 * 60 * 1000, // 1 hour - keep optimization results longer
    retry: 2,
    meta: {
      configHash: config ? createConfigHash(config) : null,
    },
  });

  // Mutation for triggering new optimization
  const mutation = useMutation({
    mutationFn: (config: RouteConfig) => fetchOptimization(config, algorithmVersion),
    onSuccess: (data, variables) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🎉 Mutation success! Data:', data, 'Variables:', variables);
      }
      // Update the cache with new results
      queryClient.setQueryData(queryKeys.optimization(variables), data);
      if (process.env.NODE_ENV === 'development') {
        console.log('💾 Cache updated with new results');
      }
    },
    onError: (error) => {
      // Only log technical details in development
      if (process.env.NODE_ENV === 'development') {
        console.error('❌ Mutation error:', error);
      }
      // Error will already have user-friendly message from fetchOptimization
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

  const result = {
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

  if (process.env.NODE_ENV === 'development') {
    console.log('📊 useOptimization hook returning:', {
      data: result.data,
      isLoading: result.isLoading,
      error: result.error,
      isOptimizing: result.isOptimizing,
      isFromCache: result.isFromCache
    });
  }

  return result;
};
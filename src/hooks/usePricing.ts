import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Flight, RoutePricingData, PricingComparison } from '../lib/types';
import { queryKeys } from '../lib/queryClient';
import { getRoutePricing, getPricingComparison } from '../lib/apiService';

export const useRoutePricing = (flightPath: Flight[] | null) => {
  return useQuery({
    queryKey: queryKeys.routePricing(flightPath || []),
    queryFn: () => getRoutePricing(flightPath!),
    enabled: !!flightPath && flightPath.length > 0,
    staleTime: 15 * 60 * 1000, // 15 minutes - pricing changes more frequently
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
};

export const usePricingComparison = (
  flight: Flight | null,
  enabled: boolean = true
) => {
  const departureDate = flight?.['Departure Datetime']?.split(' ')[0] || '';
  
  return useQuery({
    queryKey: queryKeys.pricingComparison(
      flight?.Origin || '',
      flight?.Destination || '',
      departureDate,
      flight?.['Flight Number'] || ''
    ),
    queryFn: () => getPricingComparison(
      flight!.Origin,
      flight!.Destination,
      departureDate,
      flight!['Flight Number']
    ),
    enabled: !!flight && enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
    retry: 1,
  });
};

export const usePricingCache = () => {
  const queryClient = useQueryClient();

  const clearRoutePricing = () => {
    queryClient.removeQueries({ 
      queryKey: ['routePricing'],
      exact: false 
    });
  };

  const clearPricingComparisons = () => {
    queryClient.removeQueries({ 
      queryKey: ['pricingComparison'],
      exact: false 
    });
  };

  const clearAllPricing = () => {
    clearRoutePricing();
    clearPricingComparisons();
  };

  const getPricingCacheStats = () => {
    const cache = queryClient.getQueryCache();
    const allQueries = cache.getAll();
    
    const routePricingQueries = allQueries.filter(q => q.queryKey[0] === 'routePricing');
    const comparisonQueries = allQueries.filter(q => q.queryKey[0] === 'pricingComparison');
    
    return {
      routePricingCached: routePricingQueries.length,
      comparisonsCached: comparisonQueries.length,
      totalPricingQueries: routePricingQueries.length + comparisonQueries.length,
    };
  };

  return {
    clearRoutePricing,
    clearPricingComparisons,
    clearAllPricing,
    getPricingCacheStats,
  };
};
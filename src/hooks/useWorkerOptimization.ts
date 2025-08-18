import { useState, useCallback, useRef, useEffect } from 'react';
import { RouteConfig, Results, Flight } from '../lib/types';
import { ACTIVE_CONFIG } from '../lib/optimizationConfig';

interface OptimizationProgress {
  iterations: number;
  maxIterations: number;
  bestScore: number;
  openSetSize: number;
}

interface UseWorkerOptimizationReturn {
  optimize: (flights: Flight[], config: RouteConfig) => Promise<Results>;
  isOptimizing: boolean;
  progress: OptimizationProgress | null;
  cancel: () => void;
  supportsWorkers: boolean;
}

export const useWorkerOptimization = (): UseWorkerOptimizationReturn => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [progress, setProgress] = useState<OptimizationProgress | null>(null);
  const [supportsWorkers, setSupportsWorkers] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const resolverRef = useRef<{
    resolve: (value: Results) => void;
    reject: (error: Error) => void;
  } | null>(null);

  // Check if Web Workers are supported (client-side only)
  useEffect(() => {
    setSupportsWorkers(typeof Worker !== 'undefined');
  }, []);

  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    setIsOptimizing(false);
    setProgress(null);
    resolverRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    if (resolverRef.current) {
      resolverRef.current.reject(new Error('Optimization cancelled'));
    }
    cleanup();
  }, [cleanup]);

  const optimize = useCallback(
    (flights: Flight[], config: RouteConfig): Promise<Results> => {
      if (!supportsWorkers) {
        return Promise.reject(new Error('Web Workers not supported in this environment'));
      }

      if (isOptimizing) {
        return Promise.reject(new Error('Optimization already in progress'));
      }

      return new Promise((resolve, reject) => {
        try {
          setIsOptimizing(true);
          setProgress(null);
          
          // Create new worker
          workerRef.current = new Worker('/workers/optimization.worker.js');
          resolverRef.current = { resolve, reject };

          const optimizationId = Date.now().toString();

          // Set up worker message handler
          workerRef.current.onmessage = (e) => {
            const { type, result, error, id, iterations, maxIterations, bestScore, openSetSize } = e.data;

            if (type === 'progress') {
              setProgress({
                iterations: iterations || 0,
                maxIterations: maxIterations || 50000,
                bestScore: bestScore || 0,
                openSetSize: openSetSize || 0,
              });
            } else if (type === 'result' && id === optimizationId) {
              if (resolverRef.current) {
                resolverRef.current.resolve(result);
              }
              cleanup();
            } else if (type === 'error' && id === optimizationId) {
              if (resolverRef.current) {
                resolverRef.current.reject(new Error(error));
              }
              cleanup();
            }
          };

          // Handle worker errors
          workerRef.current.onerror = (error) => {
            console.error('Worker error:', error);
            if (resolverRef.current) {
              resolverRef.current.reject(new Error('Worker encountered an error'));
            }
            cleanup();
          };

          // Start optimization with current optimization configuration
          workerRef.current.postMessage({
            type: 'optimize',
            flights,
            config,
            optimizationConfig: ACTIVE_CONFIG,
            id: optimizationId
          });

        } catch (error) {
          setIsOptimizing(false);
          reject(error instanceof Error ? error : new Error('Failed to start worker optimization'));
        }
      });
    },
    [supportsWorkers, isOptimizing, cleanup]
  );

  return {
    optimize,
    isOptimizing,
    progress,
    cancel,
    supportsWorkers,
  };
};
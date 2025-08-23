/**
 * Configuration for the optimization algorithm
 * Adjust these values based on your needs and system performance
 */

export interface OptimizationConfig {
  maxIterations: number;
  maxHeapSize: number;
  timeoutMs: number;
}

// Conservative settings (faster, less thorough)
export const CONSERVATIVE_CONFIG: OptimizationConfig = {
  maxIterations: 10000,  // 10k iterations
  maxHeapSize: 1000,     // 1k heap size
  timeoutMs: 15000       // 15 second timeout
};

// Moderate settings (balanced performance and thoroughness) - DEFAULT
export const MODERATE_CONFIG: OptimizationConfig = {
  maxIterations: 25000,  // 25k iterations
  maxHeapSize: 2000,     // 2k heap size
  timeoutMs: 30000       // 30 second timeout
};

// Aggressive settings (more thorough, slower)
export const AGGRESSIVE_CONFIG: OptimizationConfig = {
  maxIterations: 50000,  // 50k iterations
  maxHeapSize: 3000,     // 3k heap size
  timeoutMs: 60000       // 60 second timeout
};

// Very aggressive settings (most thorough, slowest)
export const VERY_AGGRESSIVE_CONFIG: OptimizationConfig = {
  maxIterations: 100000, // 100k iterations
  maxHeapSize: 5000,     // 5k heap size
  timeoutMs: 120000      // 2 minute timeout
};

// Large airport set configuration (for when users input many end airports)
export const LARGE_AIRPORT_CONFIG: OptimizationConfig = {
  maxIterations: 150000, // 150k iterations
  maxHeapSize: 15000,    // 15k heap size
  timeoutMs: 180000      // 3 minute timeout
};

// Current active configuration
export const ACTIVE_CONFIG: OptimizationConfig = MODERATE_CONFIG;

/**
 * Get optimization configuration
 * @param level - Configuration level ('conservative', 'moderate', 'aggressive', 'very-aggressive', 'large-airport')
 * @returns Optimization configuration object
 */
export const getOptimizationConfig = (level: string = 'moderate'): OptimizationConfig => {
  switch (level.toLowerCase()) {
    case 'conservative':
      return CONSERVATIVE_CONFIG;
    case 'aggressive':
      return AGGRESSIVE_CONFIG;
    case 'very-aggressive':
      return VERY_AGGRESSIVE_CONFIG;
    case 'large-airport':
      return LARGE_AIRPORT_CONFIG;
    case 'moderate':
    default:
      return MODERATE_CONFIG;
  }
};

/**
 * Update the active configuration
 * @param config - New configuration to use
 */
export const updateActiveConfig = (config: OptimizationConfig): void => {
  Object.assign(ACTIVE_CONFIG, config);
}; 
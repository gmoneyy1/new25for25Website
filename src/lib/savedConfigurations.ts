import { RouteConfig } from './types';

export interface SavedConfiguration {
  id: string;
  name: string;
  config: RouteConfig;
  createdAt: Date;
  lastUsed: Date;
  useCount: number;
  tags?: string[];
  description?: string;
}

const STORAGE_KEY = 'jetblue-saved-configurations';
const MAX_SAVED_CONFIGS = 20; // Limit to prevent localStorage bloat

// Helper to generate unique ID
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

// Helper to serialize dates for localStorage
const serializeConfig = (config: SavedConfiguration): any => ({
  ...config,
  createdAt: config.createdAt.toISOString(),
  lastUsed: config.lastUsed.toISOString(),
});

// Helper to deserialize dates from localStorage
const deserializeConfig = (data: any): SavedConfiguration => ({
  ...data,
  createdAt: new Date(data.createdAt),
  lastUsed: new Date(data.lastUsed),
});

// Load configurations from localStorage
export const loadSavedConfigurations = (): SavedConfiguration[] => {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    return parsed.map(deserializeConfig);
  } catch (error) {
    console.error('Failed to load saved configurations:', error);
    return [];
  }
};

// Save configurations to localStorage
const saveTostorage = (configurations: SavedConfiguration[]): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const serialized = configurations.map(serializeConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error('Failed to save configurations:', error);
  }
};

// Save a new configuration
export const saveConfiguration = (
  config: RouteConfig, 
  name: string, 
  options: { description?: string; tags?: string[] } = {}
): SavedConfiguration => {
  const configurations = loadSavedConfigurations();
  
  const newConfig: SavedConfiguration = {
    id: generateId(),
    name: name.trim(),
    config,
    createdAt: new Date(),
    lastUsed: new Date(),
    useCount: 0,
    tags: options.tags || [],
    description: options.description,
  };
  
  // Remove oldest if we hit the limit
  if (configurations.length >= MAX_SAVED_CONFIGS) {
    configurations.sort((a, b) => a.lastUsed.getTime() - b.lastUsed.getTime());
    configurations.splice(0, configurations.length - MAX_SAVED_CONFIGS + 1);
  }
  
  configurations.push(newConfig);
  saveTostorage(configurations);
  
  return newConfig;
};

// Update an existing configuration
export const updateConfiguration = (
  id: string, 
  updates: Partial<Omit<SavedConfiguration, 'id' | 'createdAt'>>
): SavedConfiguration | null => {
  const configurations = loadSavedConfigurations();
  const index = configurations.findIndex(c => c.id === id);
  
  if (index === -1) return null;
  
  const updated = {
    ...configurations[index],
    ...updates,
    lastUsed: new Date(),
  };
  
  configurations[index] = updated;
  saveTostorage(configurations);
  
  return updated;
};

// Delete a configuration
export const deleteConfiguration = (id: string): boolean => {
  const configurations = loadSavedConfigurations();
  const index = configurations.findIndex(c => c.id === id);
  
  if (index === -1) return false;
  
  configurations.splice(index, 1);
  saveTostorage(configurations);
  
  return true;
};

// Mark configuration as used (increment use count and update last used)
export const markConfigurationUsed = (id: string): void => {
  const configurations = loadSavedConfigurations();
  const config = configurations.find(c => c.id === id);
  
  if (config) {
    config.useCount += 1;
    config.lastUsed = new Date();
    saveTostorage(configurations);
  }
};

// Get frequently used configurations
export const getFrequentConfigurations = (limit: number = 5): SavedConfiguration[] => {
  const configurations = loadSavedConfigurations();
  return configurations
    .sort((a, b) => b.useCount - a.useCount)
    .slice(0, limit);
};

// Get recently used configurations
export const getRecentConfigurations = (limit: number = 5): SavedConfiguration[] => {
  const configurations = loadSavedConfigurations();
  return configurations
    .sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime())
    .slice(0, limit);
};

// Search configurations by name, description, or tags
export const searchConfigurations = (query: string): SavedConfiguration[] => {
  if (!query.trim()) return loadSavedConfigurations();
  
  const configurations = loadSavedConfigurations();
  const lowerQuery = query.toLowerCase();
  
  return configurations.filter(config => 
    config.name.toLowerCase().includes(lowerQuery) ||
    config.description?.toLowerCase().includes(lowerQuery) ||
    config.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

// Export configurations as JSON
export const exportConfigurations = (): string => {
  const configurations = loadSavedConfigurations();
  return JSON.stringify(configurations.map(serializeConfig), null, 2);
};

// Import configurations from JSON
export const importConfigurations = (jsonString: string): number => {
  try {
    const imported = JSON.parse(jsonString);
    if (!Array.isArray(imported)) {
      throw new Error('Invalid format: expected array');
    }
    
    const configurations = loadSavedConfigurations();
    const validImports = imported
      .map(data => {
        try {
          return deserializeConfig(data);
        } catch {
          return null;
        }
      })
      .filter((config): config is SavedConfiguration => config !== null);
    
    // Merge with existing, avoiding duplicates by name
    const existingNames = new Set(configurations.map(c => c.name));
    const newConfigs = validImports.filter(config => !existingNames.has(config.name));
    
    const merged = [...configurations, ...newConfigs];
    
    // Trim to max limit
    if (merged.length > MAX_SAVED_CONFIGS) {
      merged.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
      merged.splice(MAX_SAVED_CONFIGS);
    }
    
    saveTostorage(merged);
    return newConfigs.length;
  } catch (error) {
    console.error('Failed to import configurations:', error);
    throw new Error('Invalid JSON format');
  }
};

// Clear all configurations
export const clearAllConfigurations = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
};

// Generate a descriptive name for a configuration
export const generateConfigName = (config: RouteConfig): string => {
  const startAirports = config.startAirports.split(',').map(a => a.trim());
  const endAirports = config.endAirports.split(',').map(a => a.trim());
  
  const startStr = startAirports.length === 1 ? startAirports[0] : `${startAirports[0]} (+${startAirports.length - 1})`;
  const endStr = endAirports.length === 1 ? endAirports[0] : `${endAirports[0]} (+${endAirports.length - 1})`;
  
  const startDate = new Date(config.startDate).toLocaleDateString();
  const endDate = new Date(config.endDate).toLocaleDateString();
  
  if (config.startDate === config.endDate) {
    return `${startStr} → ${endStr} (${startDate})`;
  } else {
    return `${startStr} → ${endStr} (${startDate} - ${endDate})`;
  }
};
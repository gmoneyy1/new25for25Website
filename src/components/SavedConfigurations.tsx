import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Star, 
  Clock, 
  Search, 
  Trash2, 
  Download, 
  Upload, 
  Tag,
  Calendar,
  MapPin,
  Edit3
} from 'lucide-react';
import { RouteConfig } from '../lib/types';
import { 
  SavedConfiguration,
  loadSavedConfigurations,
  saveConfiguration,
  deleteConfiguration,
  markConfigurationUsed,
  getFrequentConfigurations,
  getRecentConfigurations,
  searchConfigurations,
  generateConfigName,
  exportConfigurations,
  importConfigurations
} from '../lib/savedConfigurations';

interface SavedConfigurationsProps {
  currentConfig: RouteConfig;
  onLoadConfiguration: (config: RouteConfig) => void;
  className?: string;
}

export const SavedConfigurations: React.FC<SavedConfigurationsProps> = ({
  currentConfig,
  onLoadConfiguration,
  className = ''
}) => {
  const [savedConfigs, setSavedConfigs] = useState<SavedConfiguration[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveTags, setSaveTags] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'recent' | 'frequent'>('all');

  // Load configurations on mount
  useEffect(() => {
    refreshConfigurations();
  }, []);

  const refreshConfigurations = () => {
    setSavedConfigs(loadSavedConfigurations());
  };

  // Get configurations based on active tab and search
  const getDisplayedConfigurations = (): SavedConfiguration[] => {
    let configs: SavedConfiguration[];
    
    if (searchQuery.trim()) {
      configs = searchConfigurations(searchQuery);
    } else {
      switch (activeTab) {
        case 'recent':
          configs = getRecentConfigurations(10);
          break;
        case 'frequent':
          configs = getFrequentConfigurations(10);
          break;
        default:
          configs = savedConfigs;
      }
    }
    
    return configs.sort((a, b) => b.lastUsed.getTime() - a.lastUsed.getTime());
  };

  const handleSaveConfig = () => {
    if (!saveName.trim()) return;
    
    const tags = saveTags.split(',').map(tag => tag.trim()).filter(Boolean);
    
    saveConfiguration(currentConfig, saveName, {
      description: saveDescription.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
    
    refreshConfigurations();
    setShowSaveModal(false);
    setSaveName('');
    setSaveDescription('');
    setSaveTags('');
  };

  const handleLoadConfig = (config: SavedConfiguration) => {
    markConfigurationUsed(config.id);
    onLoadConfiguration(config.config);
    refreshConfigurations();
  };

  const handleDeleteConfig = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this configuration?')) {
      deleteConfiguration(id);
      refreshConfigurations();
    }
  };

  const handleExport = () => {
    const json = exportConfigurations();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jetblue-configs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const importedCount = importConfigurations(json);
        alert(`Successfully imported ${importedCount} configurations`);
        refreshConfigurations();
      } catch (error) {
        alert('Failed to import configurations: ' + (error as Error).message);
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const openSaveModal = () => {
    setSaveName(generateConfigName(currentConfig));
    setShowSaveModal(true);
  };

  const displayedConfigs = getDisplayedConfigurations();

  return (
    <div className={`${className} bg-white rounded-lg shadow-md`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Saved Configurations</h3>
          <div className="flex space-x-2">
            <button
              onClick={openSaveModal}
              className="flex items-center px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm"
            >
              <Save className="h-4 w-4 mr-1" />
              Save Current
            </button>
            <button
              onClick={handleExport}
              className="flex items-center px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
            <label className="flex items-center px-3 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors text-sm cursor-pointer">
              <Upload className="h-4 w-4 mr-1" />
              Import
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search configurations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-md p-1">
          {[
            { key: 'all', label: 'All', icon: MapPin },
            { key: 'recent', label: 'Recent', icon: Clock },
            { key: 'frequent', label: 'Frequent', icon: Star },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 mr-1" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Configuration List */}
      <div className="max-h-96 overflow-y-auto">
        {displayedConfigs.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {searchQuery ? 'No configurations match your search' : 'No saved configurations yet'}
            </p>
            <p className="text-xs">
              {!searchQuery && 'Save your current settings to quickly access them later'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {displayedConfigs.map((config) => (
              <div
                key={config.id}
                onClick={() => handleLoadConfig(config)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {config.name}
                      </h4>
                      {config.useCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                          <Star className="h-3 w-3 mr-1" />
                          {config.useCount}
                        </span>
                      )}
                    </div>
                    
                    {config.description && (
                      <p className="text-xs text-gray-600 mb-2">{config.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(config.config.startDate).toLocaleDateString()} - {new Date(config.config.endDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {config.lastUsed.toLocaleDateString()}
                      </div>
                    </div>
                    
                    {config.tags && config.tags.length > 0 && (
                      <div className="flex items-center space-x-1 mt-2">
                        <Tag className="h-3 w-3 text-gray-400" />
                        {config.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteConfig(config.id, e)}
                    className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Save Configuration</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., NYC to LA Weekend"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Optional description..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  value={saveTags}
                  onChange={(e) => setSaveTags(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., weekend, business, vacation (comma-separated)"
                />
              </div>
            </div>
            <div className="p-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                disabled={!saveName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedConfigurations;
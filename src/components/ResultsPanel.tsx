import React from 'react';
import { Plane, MapPin, Download } from 'lucide-react';
import { Results, OptimizationResults } from '../lib/types';
import { FlightCard } from './FlightCard';
import { downloadFlightsAsCsv } from '../lib/csvUtils';
import { minutesToHours } from '../lib/dateUtils';

interface ResultsPanelProps {
  results: Results;
  onDownload: () => void;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ results, onDownload }) => {
  const handleDownload = () => {
    if (results && 'path' in results) {
      downloadFlightsAsCsv(results.path);
      onDownload();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Plane className="mr-2" size={20} />
        Optimization Results
      </h2>

      {!results && (
        <div className="text-center py-12 text-gray-500">
          <MapPin size={48} className="mx-auto mb-4 opacity-50" />
          <p>Configure your route parameters and click "Optimize Route" to see results</p>
        </div>
      )}

      {'error' in results && results.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700">
          <p className="font-medium">Error:</p>
          <p>{results.error}</p>
        </div>
      )}

      {'path' in results && results.path && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{results.totalFlights}</p>
                <p className="text-sm text-gray-600">Total Flights</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{results.newAirportsVisited.length}</p>
                <p className="text-sm text-gray-600">New Airports</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{results.totalDistance.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Total Miles</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{minutesToHours(results.totalDuration)}</p>
                <p className="text-sm text-gray-600">Hours</p>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Flight Itinerary</h3>
            <button
              onClick={handleDownload}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center"
            >
              <Download className="mr-2" size={16} />
              Download CSV
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.path.map((flight, index) => (
              <FlightCard key={index} flight={flight} index={index} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 
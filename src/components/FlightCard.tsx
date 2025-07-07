import React from 'react';
import { Plane, ArrowRight } from 'lucide-react';
import { Flight } from '../lib/types';
import { kilometersToMiles } from '../lib/distanceUtils';

interface FlightCardProps {
  flight: Flight;
  index: number;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight, index }) => {
  const distanceInMiles = kilometersToMiles(flight['Distance (KM)'] || 0);
  const departureTime = new Date(flight['Departure Datetime']);
  const arrivalTime = new Date(flight['Arrival Datetime']);

  return (
    <div className="border border-gray-200 rounded-md p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-blue-100 rounded-full p-2 mr-3">
            <Plane size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="font-semibold">{flight['Flight Number']}</p>
            <p className="text-sm text-gray-600">{flight.Equipment}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">{distanceInMiles}mi | {flight['Elapsed Minutes']}min</p>
        </div>
      </div>
      <div className="mt-2 flex items-center">
        <div className="text-center">
          <p className="font-medium">{flight.Origin}</p>
          <p className="text-sm text-gray-600">
            {departureTime.toLocaleString()}
          </p>
        </div>
        <ArrowRight className="mx-4 text-gray-400" size={16} />
        <div className="text-center">
          <p className="font-medium">{flight.Destination}</p>
          <p className="text-sm text-gray-600">
            {arrivalTime.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}; 
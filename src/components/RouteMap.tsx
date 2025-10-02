'use client';

import React, { useEffect, useState } from 'react';
import { Flight } from '../lib/types';
import { Plane, MapPin } from 'lucide-react';

// Airport coordinates database (lat, lng)
const airportCoordinates: { [key: string]: { lat: number; lng: number; name: string; city: string } } = {
  'JFK': { lat: 40.6413, lng: -73.7781, name: 'John F. Kennedy International', city: 'New York' },
  'LGA': { lat: 40.7769, lng: -73.8740, name: 'LaGuardia Airport', city: 'New York' },
  'EWR': { lat: 40.6895, lng: -74.1745, name: 'Newark Liberty International', city: 'Newark' },
  'BOS': { lat: 42.3656, lng: -71.0096, name: 'Logan International Airport', city: 'Boston' },
  'DCA': { lat: 38.8512, lng: -77.0402, name: 'Ronald Reagan Washington National', city: 'Washington DC' },
  'BWI': { lat: 39.1774, lng: -76.6684, name: 'Baltimore/Washington International', city: 'Baltimore' },
  'PHL': { lat: 39.8744, lng: -75.2424, name: 'Philadelphia International', city: 'Philadelphia' },
  'PIT': { lat: 40.4951, lng: -80.2387, name: 'Pittsburgh International', city: 'Pittsburgh' },
  'LAX': { lat: 33.9416, lng: -118.4085, name: 'Los Angeles International', city: 'Los Angeles' },
  'SFO': { lat: 37.6213, lng: -122.3790, name: 'San Francisco International', city: 'San Francisco' },
  'SAN': { lat: 32.7338, lng: -117.1933, name: 'San Diego International', city: 'San Diego' },
  'SEA': { lat: 47.4502, lng: -122.3088, name: 'Seattle-Tacoma International', city: 'Seattle' },
  'DEN': { lat: 39.8561, lng: -104.6737, name: 'Denver International', city: 'Denver' },
  'ORD': { lat: 41.9742, lng: -87.9073, name: 'O\'Hare International', city: 'Chicago' },
  'ATL': { lat: 33.6407, lng: -84.4277, name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta' },
  'MIA': { lat: 25.7959, lng: -80.2870, name: 'Miami International', city: 'Miami' },
  'FLL': { lat: 26.0742, lng: -80.1506, name: 'Fort Lauderdale-Hollywood International', city: 'Fort Lauderdale' },
  'MCO': { lat: 28.4312, lng: -81.3081, name: 'Orlando International', city: 'Orlando' },
  'TPA': { lat: 27.9755, lng: -82.5332, name: 'Tampa International', city: 'Tampa' },
  'BED': { lat: 42.4699, lng: -71.2893, name: 'Laurence G. Hanscom Field', city: 'Bedford' },
  'HPN': { lat: 41.0672, lng: -73.7076, name: 'Westchester County Airport', city: 'White Plains' },
  'BDL': { lat: 41.9389, lng: -72.6832, name: 'Bradley International Airport', city: 'Hartford' },
  // Caribbean airports
  'SJU': { lat: 18.4394, lng: -66.0018, name: 'Luis Muñoz Marín International', city: 'San Juan' },
  'STI': { lat: 19.7570, lng: -70.5697, name: 'Cibao International Airport', city: 'Santiago' },
  'SDQ': { lat: 18.4297, lng: -69.6689, name: 'Las Américas International', city: 'Santo Domingo' },
  'PUJ': { lat: 18.5674, lng: -68.3634, name: 'Punta Cana International', city: 'Punta Cana' },
  'NAS': { lat: 25.0389, lng: -77.4661, name: 'Lynden Pindling International', city: 'Nassau' },
  'MVY': { lat: 41.3931, lng: -70.6143, name: 'Martha\'s Vineyard Airport', city: 'Martha\'s Vineyard' },
  
  // Additional JetBlue destinations
  'BUF': { lat: 42.9405, lng: -78.7322, name: 'Buffalo Niagara International Airport', city: 'Buffalo' },
  'SYR': { lat: 43.1112, lng: -76.1063, name: 'Syracuse Hancock International Airport', city: 'Syracuse' },
  'LAS': { lat: 36.0840, lng: -115.1537, name: 'McCarran International Airport', city: 'Las Vegas' },
  'MSY': { lat: 29.9934, lng: -90.2581, name: 'Louis Armstrong New Orleans International', city: 'New Orleans' },
  'RSW': { lat: 26.5362, lng: -81.7552, name: 'Southwest Florida International Airport', city: 'Fort Myers' },
  'JAX': { lat: 30.4941, lng: -81.6879, name: 'Jacksonville International Airport', city: 'Jacksonville' },
  'SAV': { lat: 32.1276, lng: -81.2021, name: 'Savannah/Hilton Head International Airport', city: 'Savannah' },
  'CHS': { lat: 32.8986, lng: -80.0405, name: 'Charleston International Airport', city: 'Charleston' },
  'RDU': { lat: 35.8776, lng: -78.7875, name: 'Raleigh-Durham International Airport', city: 'Raleigh' },
  'BTV': { lat: 44.4719, lng: -73.1533, name: 'Burlington International Airport', city: 'Burlington' },
  'PWM': { lat: 43.6462, lng: -70.3093, name: 'Portland International Jetport', city: 'Portland' },
  'BGR': { lat: 44.8074, lng: -68.8281, name: 'Bangor International Airport', city: 'Bangor' },
  'ACK': { lat: 41.2532, lng: -70.0602, name: 'Nantucket Memorial Airport', city: 'Nantucket' },
  'PVD': { lat: 41.7240, lng: -71.4281, name: 'T.F. Green Airport', city: 'Providence' },
  
  // International JetBlue destinations
  'CUN': { lat: 21.0365, lng: -86.8771, name: 'Cancún International Airport', city: 'Cancún' },
  'AMS': { lat: 52.3105, lng: 4.7683, name: 'Amsterdam Airport Schiphol', city: 'Amsterdam' },
  'CDG': { lat: 49.0097, lng: 2.5479, name: 'Charles de Gaulle Airport', city: 'Paris' },
  'LHR': { lat: 51.4700, lng: -0.4543, name: 'Heathrow Airport', city: 'London' },
  'LGW': { lat: 51.1481, lng: -0.1903, name: 'Gatwick Airport', city: 'London' },
  'DUB': { lat: 53.4213, lng: -6.2701, name: 'Dublin Airport', city: 'Dublin' },
  'EDI': { lat: 55.9500, lng: -3.3725, name: 'Edinburgh Airport', city: 'Edinburgh' },
  'MAD': { lat: 40.4983, lng: -3.5676, name: 'Adolfo Suárez Madrid–Barajas Airport', city: 'Madrid' },
  'LIR': { lat: 10.5933, lng: -85.5444, name: 'Daniel Oduber Quirós International Airport', city: 'Liberia' },
  'SJD': { lat: 23.1518, lng: -110.1003, name: 'Los Cabos International Airport', city: 'Los Cabos' },
  'SJO': { lat: 9.9939, lng: -84.2089, name: 'Juan Santamaría International Airport', city: 'San José' },
  'GUA': { lat: 14.5833, lng: -90.5275, name: 'La Aurora International Airport', city: 'Guatemala City' },
  'SAP': { lat: 15.4526, lng: -87.9236, name: 'Ramón Villeda Morales International Airport', city: 'San Pedro Sula' },
  'MDE': { lat: 6.1649, lng: -75.4231, name: 'José María Córdova International Airport', city: 'Medellín' },
  'CTG': { lat: 10.4424, lng: -75.5130, name: 'Rafael Núñez International Airport', city: 'Cartagena' },
  'GEO': { lat: 6.4986, lng: -58.2541, name: 'Cheddi Jagan International Airport', city: 'Georgetown' },
  'GYE': { lat: -2.1574, lng: -79.8836, name: 'José Joaquín de Olmedo International Airport', city: 'Guayaquil' },
  'BZE': { lat: 17.5392, lng: -88.3082, name: 'Philip S. W. Goldson International Airport', city: 'Belize City' },
  'CUR': { lat: 12.1889, lng: -68.9598, name: 'Curaçao International Airport', city: 'Willemstad' },
  'GND': { lat: 12.0042, lng: -61.7861, name: 'Maurice Bishop International Airport', city: 'Grenada' },
  'ANU': { lat: 17.1367, lng: -61.7928, name: 'V. C. Bird International Airport', city: 'Antigua' },
  'BGI': { lat: 13.0746, lng: -59.4925, name: 'Grantley Adams International Airport', city: 'Bridgetown' },
  'KIN': { lat: 17.9356, lng: -76.7875, name: 'Norman Manley International Airport', city: 'Kingston' },
  'MBJ': { lat: 18.5037, lng: -77.9134, name: 'Sangster International Airport', city: 'Montego Bay' },
  'POP': { lat: 19.7579, lng: -70.5700, name: 'Gregorio Luperón International Airport', city: 'Puerto Plata' },
  'POS': { lat: 10.5954, lng: -61.3372, name: 'Piarco International Airport', city: 'Port of Spain' },
  'SKB': { lat: 17.3112, lng: -62.7187, name: 'Robert L. Bradshaw International Airport', city: 'Basseterre' },
  'BON': { lat: 12.1314, lng: -68.2685, name: 'Flamingo International Airport', city: 'Kralendijk' },
  'GCM': { lat: 19.2928, lng: -81.3577, name: 'Owen Roberts International Airport', city: 'Grand Cayman' },
  'HYA': { lat: 41.6693, lng: -70.2803, name: 'Cape Cod Gateway Airport', city: 'Hyannis' },
  'ORH': { lat: 42.2679, lng: -71.8757, name: 'Worcester Regional Airport', city: 'Worcester' },
  'PQI': { lat: 46.6891, lng: -68.0448, name: 'Northern Maine Regional Airport', city: 'Presque Isle' },
  'PSE': { lat: 18.0083, lng: -66.5630, name: 'Mercedita Airport', city: 'Ponce' },
  'SRQ': { lat: 27.3954, lng: -82.5544, name: 'Sarasota-Bradenton International Airport', city: 'Sarasota' },
  'BQN': { lat: 18.4949, lng: -67.1294, name: 'Rafael Hernández Airport', city: 'Aguadilla' },
  'PLS': { lat: 21.7736, lng: -72.2659, name: 'Providenciales International Airport', city: 'Providenciales' },
  
  // Additional US destinations
  'ABQ': { lat: 35.0402, lng: -106.6091, name: 'Albuquerque International Sunport', city: 'Albuquerque' },
  'ALB': { lat: 42.7483, lng: -73.8017, name: 'Albany International Airport', city: 'Albany' },
  'AUS': { lat: 30.1975, lng: -97.6664, name: 'Austin-Bergstrom International Airport', city: 'Austin' },
  'AVL': { lat: 35.4362, lng: -82.5418, name: 'Asheville Regional Airport', city: 'Asheville' },
  'BNA': { lat: 36.1263, lng: -86.6774, name: 'Nashville International Airport', city: 'Nashville' },
  'BUR': { lat: 34.1975, lng: -118.3524, name: 'Hollywood Burbank Airport', city: 'Burbank' },
  'BZN': { lat: 45.7776, lng: -111.1601, name: 'Bozeman Yellowstone International Airport', city: 'Bozeman' },
  'CLE': { lat: 41.4117, lng: -81.8498, name: 'Cleveland Hopkins International Airport', city: 'Cleveland' },
  'DFW': { lat: 42.8968, lng: -97.0380, name: 'Dallas/Fort Worth International Airport', city: 'Dallas' },
  'DTW': { lat: 42.2162, lng: -83.3554, name: 'Detroit Metropolitan Airport', city: 'Detroit' },
  'IAH': { lat: 29.9902, lng: -95.3368, name: 'George Bush Intercontinental Airport', city: 'Houston' },
  'ILM': { lat: 34.2706, lng: -77.9026, name: 'Wilmington International Airport', city: 'Wilmington' },
  'MKE': { lat: 42.9476, lng: -87.8966, name: 'Milwaukee Mitchell International Airport', city: 'Milwaukee' },
  'ONT': { lat: 34.0559, lng: -117.6011, name: 'Ontario International Airport', city: 'Ontario' },
  'ORF': { lat: 36.8945, lng: -76.2012, name: 'Norfolk International Airport', city: 'Norfolk' },
  'PDX': { lat: 45.5898, lng: -122.5951, name: 'Portland International Airport', city: 'Portland' },
  'PHX': { lat: 33.4342, lng: -112.0116, name: 'Phoenix Sky Harbor International Airport', city: 'Phoenix' },
  'RIC': { lat: 36.5052, lng: -77.3197, name: 'Richmond International Airport', city: 'Richmond' },
  'RNO': { lat: 39.4993, lng: -119.7681, name: 'Reno-Tahoe International Airport', city: 'Reno' },
  'ROC': { lat: 43.1190, lng: -77.6724, name: 'Greater Rochester International Airport', city: 'Rochester' },
  'SLC': { lat: 40.7899, lng: -111.9791, name: 'Salt Lake City International Airport', city: 'Salt Lake City' },
  'SMF': { lat: 40.6955, lng: -121.5908, name: 'Sacramento International Airport', city: 'Sacramento' },
  'EYW': { lat: 24.5561, lng: -81.7596, name: 'Key West International Airport', city: 'Key West' },
  'ISP': { lat: 40.7952, lng: -73.1002, name: 'Long Island MacArthur Airport', city: 'Islip' },
  
  // Additional missing JetBlue destinations
  'AUA': { lat: 12.5014, lng: -70.0152, name: 'Queen Beatrix International Airport', city: 'Oranjestad' },
  'BDA': { lat: 32.3640, lng: -64.6786, name: 'L.F. Wade International Airport', city: 'Bermuda' },
  'TQO': { lat: 18.1158, lng: -65.4224, name: 'Antonio Rivera Rodríguez Airport', city: 'Vieques' },
  'SVD': { lat: 13.1443, lng: -61.2109, name: 'Argyle International Airport', city: 'Kingstown' },
  'SXM': { lat: 18.0409, lng: -63.1089, name: 'Princess Juliana International Airport', city: 'Philipsburg' },
  'STT': { lat: 18.3373, lng: -64.9734, name: 'Cyril E. King Airport', city: 'Charlotte Amalie' },
  'STX': { lat: 17.7019, lng: -64.7986, name: 'Henry E. Rohlsen Airport', city: 'Christiansted' },
  'TVC': { lat: 44.7414, lng: -85.5822, name: 'Cherry Capital Airport', city: 'Traverse City' },
  'UVF': { lat: 13.7333, lng: -60.9526, name: 'Hewanorra International Airport', city: 'Castries' },
  'YVR': { lat: 49.1967, lng: -123.1815, name: 'Vancouver International Airport', city: 'Vancouver' },
  'MHT': { lat: 42.9326, lng: -71.4357, name: 'Manchester-Boston Regional Airport', city: 'Manchester' },
};

interface RouteMapProps {
  flights: Flight[];
  className?: string;
  height?: string;
}

// Convert lat/lng to SVG coordinates using Mercator-like projection
const projectCoordinates = (lat: number, lng: number, width: number, height: number, bounds: any) => {
  const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * width;
  const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * height;
  return { x, y };
};

// Detailed world coastline paths (simplified but accurate)
const getWorldCoastlines = (mapWidth: number, mapHeight: number, bounds: any) => {
  // North America East Coast
  const eastCoastUS = [
    { lat: 44.8, lng: -67.0 }, // Maine
    { lat: 42.4, lng: -70.6 }, // Boston area
    { lat: 40.7, lng: -74.0 }, // New York
    { lat: 39.1, lng: -75.5 }, // Philadelphia
    { lat: 36.8, lng: -76.3 }, // Virginia
    { lat: 35.2, lng: -75.5 }, // Outer Banks
    { lat: 32.8, lng: -79.9 }, // Charleston
    { lat: 30.3, lng: -81.4 }, // Jacksonville
    { lat: 28.5, lng: -80.6 }, // Cape Canaveral
    { lat: 25.8, lng: -80.1 }, // Miami
    { lat: 24.6, lng: -81.8 }, // Key Largo
  ];

  // Florida
  const florida = [
    { lat: 25.8, lng: -80.1 }, // Miami
    { lat: 26.1, lng: -80.1 }, // Fort Lauderdale
    { lat: 27.8, lng: -82.6 }, // Tampa Bay
    { lat: 30.4, lng: -84.3 }, // Tallahassee area
    { lat: 30.4, lng: -81.5 }, // Jacksonville
    { lat: 28.5, lng: -80.6 }, // Cape Canaveral
  ];

  // Caribbean Major Islands
  const cuba = [
    { lat: 23.1, lng: -82.4 },
    { lat: 23.2, lng: -77.8 },
    { lat: 20.0, lng: -74.1 },
    { lat: 19.8, lng: -74.1 },
    { lat: 19.8, lng: -82.4 },
  ];

  const hispaniola = [
    { lat: 19.9, lng: -72.3 },
    { lat: 19.9, lng: -68.3 },
    { lat: 17.6, lng: -68.3 },
    { lat: 17.6, lng: -72.3 },
  ];

  const puertoRico = [
    { lat: 18.5, lng: -67.3 },
    { lat: 18.5, lng: -65.6 },
    { lat: 17.9, lng: -65.6 },
    { lat: 17.9, lng: -67.3 },
  ];

  // Convert coordinates to SVG paths
  const createPath = (coords: { lat: number; lng: number }[]) => {
    const points = coords.map(coord => projectCoordinates(coord.lat, coord.lng, mapWidth, mapHeight, bounds));
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ') + ' Z';
  };

  return {
    eastCoast: createPath(eastCoastUS),
    florida: createPath(florida),
    cuba: createPath(cuba),
    hispaniola: createPath(hispaniola),
    puertoRico: createPath(puertoRico),
  };
};

// Create great circle path between two points (simplified arc)
const createFlightPath = (x1: number, y1: number, x2: number, y2: number) => {
  const distance = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
  const arcHeight = Math.min(distance * 0.3, 80); // Dynamic arc height
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2 - arcHeight;
  return `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
};

export const RouteMap: React.FC<RouteMapProps> = ({ flights, className = '', height = '500px' }) => {
  const [isClient, setIsClient] = useState(false);

  // All hooks must be called before any conditional returns
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get unique airports and calculate bounds
  const { uniqueAirports, bounds } = React.useMemo(() => {
    if (flights.length === 0) return { uniqueAirports: [], bounds: null };
    
    const airportSet = new Set<string>();
    const coords: { lat: number; lng: number }[] = [];
    
    flights.forEach(flight => {
      airportSet.add(flight.Origin);
      airportSet.add(flight.Destination);
      
      const origin = airportCoordinates[flight.Origin];
      const destination = airportCoordinates[flight.Destination];
      if (origin) coords.push(origin);
      if (destination) coords.push(destination);
    });
    
    if (coords.length === 0) return { uniqueAirports: [], bounds: null };
    
    const lats = coords.map(c => c.lat);
    const lngs = coords.map(c => c.lng);
    
    const bounds = {
      minLat: Math.min(...lats) - 5,
      maxLat: Math.max(...lats) + 5,
      minLng: Math.min(...lngs) - 10,
      maxLng: Math.max(...lngs) + 10
    };
    
    return { uniqueAirports: Array.from(airportSet), bounds };
  }, [flights]);

  if (!isClient) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`} style={{ height }}>
        <div className="flex items-center text-gray-600">
          <Plane className="h-6 w-6 mr-2 animate-pulse" />
          Loading map...
        </div>
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className={`${className} bg-gray-100 rounded-lg flex items-center justify-center`} style={{ height }}>
        <div className="text-center text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No route to display</p>
          <p className="text-xs">Run an optimization to see the flight path</p>
        </div>
      </div>
    );
  }

  const mapWidth = 800;
  const mapHeight = 500;

  return (
    <div className={`${className} bg-white rounded-lg border border-gray-200 overflow-hidden`} style={{ height }}>
      <div className="h-full flex flex-col">
        <div className="p-4 bg-gray-50 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Flight Route Map</h3>
          <p className="text-sm text-gray-600">Geographic visualization of your optimized flight route</p>
        </div>
        
        <div className="flex-1 relative" style={{ background: 'linear-gradient(135deg, #1a237e 0%, #1565c0 25%, #039be5 50%, #0288d1 75%, #0277bd 100%)' }}>
          <svg 
            width="100%" 
            height="100%" 
            viewBox={`0 0 ${mapWidth} ${mapHeight}`}
            className="absolute inset-0"
          >
            {/* Advanced ocean and styling definitions */}
            <defs>
              {/* Ocean pattern with subtle waves */}
              <pattern id="oceanWaves" width="60" height="30" patternUnits="userSpaceOnUse">
                <path d="M0,15 Q15,5 30,15 T60,15" stroke="#0d47a1" strokeWidth="0.5" fill="none" opacity="0.3"/>
                <path d="M0,20 Q15,10 30,20 T60,20" stroke="#1565c0" strokeWidth="0.3" fill="none" opacity="0.2"/>
              </pattern>
              
              {/* Professional land gradient */}
              <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e8f5e8"/>
                <stop offset="30%" stopColor="#c8e6c9"/>
                <stop offset="70%" stopColor="#a5d6a7"/>
                <stop offset="100%" stopColor="#81c784"/>
              </linearGradient>
              
              {/* Land border gradient */}
              <linearGradient id="landBorder" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#689f38"/>
                <stop offset="100%" stopColor="#558b2f"/>
              </linearGradient>
              
              {/* Enhanced shadow filter */}
              <filter id="landShadow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
                <feOffset dx="2" dy="3" result="offset"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.4"/>
                </feComponentTransfer>
                <feMerge> 
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/> 
                </feMerge>
              </filter>
              
              {/* Flight path glow effect */}
              <filter id="flightGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Ocean background with wave pattern */}
            <rect width="100%" height="100%" fill="#0288d1"/>
            <rect width="100%" height="100%" fill="url(#oceanWaves)" opacity="0.6"/>
            
            {/* Detailed geographic coastlines */}
            {bounds && (() => {
              const coastlines = getWorldCoastlines(mapWidth, mapHeight, bounds);
              return (
                <>
                  {/* North American East Coast */}
                  <path 
                    d={coastlines.eastCoast}
                    fill="url(#landGradient)" 
                    stroke="url(#landBorder)" 
                    strokeWidth="1.5" 
                    filter="url(#landShadow)"
                  />
                  
                  {/* Florida Peninsula */}
                  <path 
                    d={coastlines.florida}
                    fill="url(#landGradient)" 
                    stroke="url(#landBorder)" 
                    strokeWidth="1.5" 
                    filter="url(#landShadow)"
                  />
                  
                  {/* Cuba */}
                  <path 
                    d={coastlines.cuba}
                    fill="url(#landGradient)" 
                    stroke="url(#landBorder)" 
                    strokeWidth="1.2" 
                    filter="url(#landShadow)"
                  />
                  
                  {/* Hispaniola (Dominican Republic/Haiti) */}
                  <path 
                    d={coastlines.hispaniola}
                    fill="url(#landGradient)" 
                    stroke="url(#landBorder)" 
                    strokeWidth="1.2" 
                    filter="url(#landShadow)"
                  />
                  
                  {/* Puerto Rico */}
                  <path 
                    d={coastlines.puertoRico}
                    fill="url(#landGradient)" 
                    stroke="url(#landBorder)" 
                    strokeWidth="1" 
                    filter="url(#landShadow)"
                  />
                  
                  {/* Bahamas (simplified) */}
                  <circle 
                    cx={projectCoordinates(25.0, -77.4, mapWidth, mapHeight, bounds).x} 
                    cy={projectCoordinates(25.0, -77.4, mapWidth, mapHeight, bounds).y} 
                    r="8" 
                    fill="url(#landGradient)" 
                    stroke="url(#landBorder)" 
                    strokeWidth="1"
                    filter="url(#landShadow)"
                  />
                  
                  {/* Jamaica */}
                  <ellipse 
                    cx={projectCoordinates(18.1, -77.3, mapWidth, mapHeight, bounds).x} 
                    cy={projectCoordinates(18.1, -77.3, mapWidth, mapHeight, bounds).y} 
                    rx="12" 
                    ry="6" 
                    fill="url(#landGradient)" 
                    stroke="url(#landBorder)" 
                    strokeWidth="1"
                    filter="url(#landShadow)"
                  />
                </>
              );
            })()}
            
            {/* Enhanced flight paths with professional styling */}
            {bounds && flights.map((flight, index) => {
              const origin = airportCoordinates[flight.Origin];
              const destination = airportCoordinates[flight.Destination];
              
              if (!origin || !destination) return null;
              
              const startPoint = projectCoordinates(origin.lat, origin.lng, mapWidth, mapHeight, bounds);
              const endPoint = projectCoordinates(destination.lat, destination.lng, mapWidth, mapHeight, bounds);
              const pathD = createFlightPath(startPoint.x, startPoint.y, endPoint.x, endPoint.y);
              
              // Calculate midpoint for direction indicator
              const distance = Math.sqrt((endPoint.x-startPoint.x)**2 + (endPoint.y-startPoint.y)**2);
              const arcHeight = Math.min(distance * 0.3, 80);
              const midX = (startPoint.x + endPoint.x) / 2;
              const midY = (startPoint.y + endPoint.y) / 2 - arcHeight;
              
              return (
                <g key={`flight-${index}`}>
                  {/* Flight path glow background */}
                  <path
                    d={pathD}
                    stroke="#ff6b35"
                    strokeWidth="8"
                    fill="none"
                    opacity="0.3"
                    filter="url(#flightGlow)"
                  />
                  
                  {/* Flight path main line */}
                  <path
                    d={pathD}
                    stroke="#ff6b35"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                  
                  {/* Flight path animated overlay */}
                  <path
                    d={pathD}
                    stroke="#ffffff"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="10,15"
                    strokeLinecap="round"
                    opacity="0.8"
                  >
                    <animate attributeName="stroke-dashoffset" values="0;25" dur="3s" repeatCount="indefinite"/>
                  </path>
                  
                  {/* Flight number label background */}
                  <ellipse
                    cx={midX}
                    cy={midY - 12}
                    rx="25"
                    ry="10"
                    fill="rgba(255, 255, 255, 0.95)"
                    stroke="#ff6b35"
                    strokeWidth="1.5"
                    filter="url(#landShadow)"
                  />
                  
                  {/* Flight number label */}
                  <text
                    x={midX}
                    y={midY - 8}
                    textAnchor="middle"
                    className="text-xs font-semibold"
                    fill="#ff6b35"
                    style={{ fontSize: '10px', fontWeight: '600' }}
                  >
                    {flight['Flight Number'] || `B${index + 1}`}
                  </text>
                  
                  {/* Direction arrow */}
                  <g transform={`translate(${midX}, ${midY})`}>
                    <circle r="8" fill="#ff6b35" stroke="white" strokeWidth="2">
                      <animate attributeName="r" values="8;10;8" dur="2s" repeatCount="indefinite"/>
                    </circle>
                    <polygon 
                      points="-3,-2 3,0 -3,2" 
                      fill="white" 
                      transform={`rotate(${Math.atan2(endPoint.y - startPoint.y, endPoint.x - startPoint.x) * 180 / Math.PI})`}
                    />
                  </g>
                </g>
              );
            })}
            
            {/* Professional airport markers */}
            {bounds && uniqueAirports.map((airportCode) => {
              const airport = airportCoordinates[airportCode];
              if (!airport) return null;
              
              const point = projectCoordinates(airport.lat, airport.lng, mapWidth, mapHeight, bounds);
              const isStart = flights[0]?.Origin === airportCode;
              const isEnd = flights[flights.length - 1]?.Destination === airportCode;
              
              // Professional color scheme
              const colors = isStart 
                ? { primary: '#2e7d32', secondary: '#4caf50', accent: '#66bb6a' }
                : isEnd 
                ? { primary: '#d32f2f', secondary: '#f44336', accent: '#ef5350' }
                : { primary: '#1565c0', secondary: '#2196f3', accent: '#42a5f5' };
              
              return (
                <g key={`airport-${airportCode}`}>
                  {/* Airport marker glow */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="20"
                    fill={colors.secondary}
                    opacity="0.2"
                    filter="url(#flightGlow)"
                  />
                  
                  {/* Airport marker shadow */}
                  <circle
                    cx={point.x + 3}
                    cy={point.y + 3}
                    r="14"
                    fill="rgba(0,0,0,0.3)"
                  />
                  
                  {/* Airport marker outer ring */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="14"
                    fill="white"
                    stroke={colors.primary}
                    strokeWidth="3"
                    filter="url(#landShadow)"
                  />
                  
                  {/* Airport marker inner circle */}
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="10"
                    fill={colors.secondary}
                  />
                  
                  {/* Airport icon (simplified plane) */}
                  <g transform={`translate(${point.x}, ${point.y}) scale(0.6)`}>
                    <path
                      d="M0,-8 L-6,4 L-2,6 L-2,8 L2,8 L2,6 L6,4 Z"
                      fill="white"
                      stroke={colors.primary}
                      strokeWidth="0.5"
                    />
                  </g>
                  
                  {/* Airport code background with gradient */}
                  <rect
                    x={point.x - 20}
                    y={point.y - 40}
                    width="40"
                    height="18"
                    rx="9"
                    fill="rgba(255, 255, 255, 0.98)"
                    stroke={colors.primary}
                    strokeWidth="1.5"
                    filter="url(#landShadow)"
                  />
                  
                  {/* Airport code text */}
                  <text
                    x={point.x}
                    y={point.y - 28}
                    textAnchor="middle"
                    className="text-xs font-bold"
                    fill={colors.primary}
                    style={{ fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}
                  >
                    {airportCode}
                  </text>
                  
                  {/* City name with background */}
                  <rect
                    x={point.x - (airport.city.length * 4)}
                    y={point.y + 18}
                    width={airport.city.length * 8}
                    height="14"
                    rx="7"
                    fill="rgba(255, 255, 255, 0.9)"
                    stroke="rgba(0, 0, 0, 0.1)"
                    strokeWidth="0.5"
                  />
                  
                  <text
                    x={point.x}
                    y={point.y + 28}
                    textAnchor="middle"
                    className="text-xs"
                    fill="#333"
                    style={{ fontSize: '10px', fontWeight: '500' }}
                  >
                    {airport.city}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        
        {/* Enhanced Legend */}
        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t">
          <div className="flex justify-center space-x-8 text-sm">
            <div className="flex items-center">
              <div className="relative">
                <div className="w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-md mr-3"></div>
                <div className="absolute inset-0 w-5 h-5 bg-green-400 rounded-full animate-ping opacity-25"></div>
              </div>
              <span className="font-medium text-gray-700">Start Airport</span>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <div className="w-5 h-5 bg-blue-500 rounded-full border-2 border-white shadow-md mr-3"></div>
              </div>
              <span className="font-medium text-gray-700">Intermediate Stop</span>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <div className="w-5 h-5 bg-red-500 rounded-full border-2 border-white shadow-md mr-3"></div>
                <div className="absolute inset-0 w-5 h-5 bg-red-400 rounded-full animate-ping opacity-25"></div>
              </div>
              <span className="font-medium text-gray-700">End Airport</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-0 border-2 border-orange-500 mr-3 rounded"></div>
              <span className="font-medium text-gray-700">Flight Route</span>
            </div>
            <div className="flex items-center">
              <div className="w-5 h-5 bg-gradient-to-br from-green-400 to-green-600 rounded mr-3 shadow-md"></div>
              <span className="font-medium text-gray-700">Land Masses</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMap;
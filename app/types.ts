export type TransportMode = 'walking' | 'bicycling' | 'driving' | 'transit';

export interface WeatherData {
  temperature: number;       // Fahrenheit
  precipitationMm: number;   // mm/hour
  windSpeedMph: number;
  weatherCode: number;       // WMO code
  isRaining: boolean;
  isSnowing: boolean;
  description: string;
  icon: string;
}

export interface RouteResult {
  mode: TransportMode;
  durationSeconds: number;
  distanceMeters: number;
  durationText: string;
  distanceText: string;
  distanceMiles: number;
  polyline: string;
  steps?: google.maps.DirectionsStep[];
}

export interface TransportScore {
  mode: TransportMode;
  score: number;                             // 0–100
  reasons: string[];
  route: RouteResult | null;
  weatherSuitability: 'green' | 'yellow' | 'red';
}

export interface LatLng {
  lat: number;
  lng: number;
}

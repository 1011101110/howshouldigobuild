'use client';

import { WeatherData } from '../types';

interface WeatherDisplayProps {
  weather: WeatherData | null;
  loading: boolean;
  locationName?: string;
}

export default function WeatherDisplay({ weather, loading, locationName }: WeatherDisplayProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-400 animate-pulse">
        <div className="w-6 h-6 rounded-full bg-gray-200" />
        <div className="w-32 h-4 bg-gray-200 rounded" />
        <div className="w-20 h-4 bg-gray-200 rounded" />
        <div className="w-24 h-4 bg-gray-200 rounded" />
      </div>
    );
  }

  if (!weather) return null;

  const getTempColor = (t: number) => {
    if (t < 35) return 'text-blue-600';
    if (t > 90) return 'text-red-500';
    if (t >= 55 && t <= 80) return 'text-green-600';
    return 'text-amber-500';
  };

  const precipLabel = weather.isSnowing
    ? `${weather.precipitationMm.toFixed(1)} mm snow`
    : weather.isRaining
    ? `${weather.precipitationMm.toFixed(1)} mm rain`
    : 'No precipitation';

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
      <span className="text-xl" title={weather.description}>{weather.icon}</span>
      <span className="text-gray-600 font-medium">{weather.description}</span>
      {locationName && <span className="text-gray-400">near {locationName}</span>}
      <span className="text-gray-300">·</span>
      <span className={`font-bold text-base ${getTempColor(weather.temperature)}`}>
        {weather.temperature}°F
      </span>
      <span className="text-gray-300">·</span>
      <span className={weather.isRaining || weather.isSnowing ? 'text-blue-600 font-medium' : 'text-gray-500'}>
        {precipLabel}
      </span>
      <span className="text-gray-300">·</span>
      <span className={weather.windSpeedMph > 20 ? 'text-orange-500 font-medium' : 'text-gray-500'}>
        💨 {weather.windSpeedMph} mph wind
      </span>
    </div>
  );
}

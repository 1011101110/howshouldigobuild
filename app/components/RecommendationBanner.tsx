'use client';

import { TransportScore, WeatherData } from '../types';
import { WalkIcon, BikeIcon, TransitIcon, DriveIcon } from './icons';

interface RecommendationBannerProps {
  winner: TransportScore | null;
  weather: WeatherData | null;
  originName: string;
  destName: string;
}

const MODE_META = {
  walking: {
    label: 'Walk',
    Icon: WalkIcon,
    bg: 'bg-emerald-500',
    text: 'text-white',
    subtext: 'text-emerald-100',
    border: 'border-emerald-400',
    softBg: 'bg-emerald-50',
    softText: 'text-emerald-700',
    softBorder: 'border-emerald-200',
  },
  bicycling: {
    label: 'Bike',
    Icon: BikeIcon,
    bg: 'bg-blue-500',
    text: 'text-white',
    subtext: 'text-blue-100',
    border: 'border-blue-400',
    softBg: 'bg-blue-50',
    softText: 'text-blue-700',
    softBorder: 'border-blue-200',
  },
  transit: {
    label: 'Take Transit',
    Icon: TransitIcon,
    bg: 'bg-yellow-400',
    text: 'text-yellow-900',
    subtext: 'text-yellow-700',
    border: 'border-yellow-300',
    softBg: 'bg-yellow-50',
    softText: 'text-yellow-700',
    softBorder: 'border-yellow-200',
  },
  driving: {
    label: 'Drive',
    Icon: DriveIcon,
    bg: 'bg-gray-600',
    text: 'text-white',
    subtext: 'text-gray-300',
    border: 'border-gray-500',
    softBg: 'bg-gray-100',
    softText: 'text-gray-700',
    softBorder: 'border-gray-300',
  },
};

function buildExplanation(winner: TransportScore, weather: WeatherData | null): string {
  if (!winner.route) return '';

  const { durationText, distanceMiles } = winner.route;
  const dist = `${distanceMiles.toFixed(1)} mile${distanceMiles === 1 ? '' : 's'}`;

  let weatherClause = '';
  if (weather) {
    if (weather.isSnowing) weatherClause = `snowing and ${weather.temperature}°F`;
    else if (weather.isRaining) weatherClause = `rainy and ${weather.temperature}°F`;
    else if (weather.temperature >= 60 && weather.temperature <= 78 && !weather.isRaining)
      weatherClause = `${weather.temperature}°F and ${weather.description.toLowerCase()}`;
    else weatherClause = `${weather.temperature}°F`;
  }

  const parts: string[] = [];
  parts.push(`It is ${dist}`);
  if (weatherClause) parts.push(weatherClause);
  parts.push(`and you'll get there in ${durationText}`);

  return parts.join(', ') + '.';
}

export default function RecommendationBanner({
  winner,
  weather,
  originName,
  destName,
}: RecommendationBannerProps) {
  if (!winner || !winner.route) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-6 py-8 text-center">
        <div className="text-4xl mb-2">🚦</div>
        <p className="text-gray-500 font-medium">Enter a destination to get your recommendation</p>
        <p className="text-gray-400 text-sm mt-1">We'll weigh weather, distance, and your preferences</p>
      </div>
    );
  }

  const meta = MODE_META[winner.mode];
  const { Icon } = meta;
  const explanation = buildExplanation(winner, weather);

  return (
    <div className={`rounded-2xl ${meta.bg} px-6 py-5 banner-in flex items-center gap-5`}>
      {/* Big icon */}
      <div className={`shrink-0 rounded-xl bg-white/20 p-3`}>
        <Icon size={40} className={meta.text} />
      </div>

      {/* Text */}
      <div className="min-w-0">
        <div className={`text-xs font-semibold uppercase tracking-widest ${meta.subtext} mb-0.5`}>
          Best option
        </div>
        <h2 className={`text-2xl sm:text-3xl font-black leading-tight ${meta.text}`}>
          {meta.label}.
        </h2>
        {explanation && (
          <p className={`mt-1 text-sm sm:text-base ${meta.subtext} leading-snug max-w-xl`}>
            {explanation}
          </p>
        )}
      </div>

      {/* Score badge */}
      <div className={`ml-auto shrink-0 hidden sm:flex flex-col items-center bg-white/20 rounded-xl px-4 py-2`}>
        <span className={`text-3xl font-black ${meta.text}`}>{winner.score}</span>
        <span className={`text-xs ${meta.subtext} -mt-1`}>score</span>
      </div>
    </div>
  );
}

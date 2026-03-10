'use client';

import { TransportScore } from '../types';
import { WalkIcon, BikeIcon, TransitIcon, DriveIcon } from './icons';

interface TransportCardProps {
  result: TransportScore;
  isWinner: boolean;
  isSelected: boolean;
  onClick: () => void;
}

const MODE_META = {
  walking: {
    label: 'Walk',
    Icon: WalkIcon,
    borderColor: 'border-emerald-400',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    scoreColor: 'text-emerald-600',
    barColor: 'bg-emerald-500',
    winnerBg: 'bg-emerald-50',
  },
  bicycling: {
    label: 'Bike',
    Icon: BikeIcon,
    borderColor: 'border-blue-400',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    scoreColor: 'text-blue-600',
    barColor: 'bg-blue-500',
    winnerBg: 'bg-blue-50',
  },
  transit: {
    label: 'Transit',
    Icon: TransitIcon,
    borderColor: 'border-yellow-400',
    iconBg: 'bg-yellow-50',
    iconColor: 'text-yellow-600',
    scoreColor: 'text-yellow-600',
    barColor: 'bg-yellow-400',
    winnerBg: 'bg-yellow-50',
  },
  driving: {
    label: 'Drive',
    Icon: DriveIcon,
    borderColor: 'border-gray-400',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    scoreColor: 'text-gray-600',
    barColor: 'bg-gray-500',
    winnerBg: 'bg-gray-50',
  },
};

const SUITABILITY_DOT = {
  green: { bg: 'bg-emerald-400', label: 'Great' },
  yellow: { bg: 'bg-amber-400', label: 'OK' },
  red: { bg: 'bg-red-400', label: 'Poor' },
};

export default function TransportCard({ result, isWinner, isSelected, onClick }: TransportCardProps) {
  const meta = MODE_META[result.mode];
  const { Icon } = meta;
  const available = result.route !== null;
  const dot = SUITABILITY_DOT[result.weatherSuitability];

  return (
    <button
      onClick={onClick}
      disabled={!available}
      className={`
        relative flex flex-col gap-3 p-4 rounded-2xl border-2 text-left transition-all duration-150 w-full
        ${isSelected
          ? `${meta.borderColor} ${meta.winnerBg} shadow-md`
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
        }
        ${!available ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
      aria-pressed={isSelected}
    >
      {/* Winner badge */}
      {isWinner && available && (
        <span className="absolute -top-2.5 left-3 bg-amber-400 text-amber-900 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
          ★ Best
        </span>
      )}

      {/* Top row: icon + weather dot */}
      <div className="flex items-start justify-between">
        <div className={`rounded-xl p-2.5 ${meta.iconBg}`}>
          <Icon size={28} className={meta.iconColor} />
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${dot.bg}`} title={`Weather suitability: ${dot.label}`} />
            <span className="text-xs text-gray-400">{dot.label}</span>
          </div>
        </div>
      </div>

      {/* Mode label */}
      <div>
        <div className="font-bold text-gray-900 text-base">{meta.label}</div>
        {result.route && (
          <div className="text-sm text-gray-500 leading-tight">
            <span className="font-semibold text-gray-700">{result.route.durationText}</span>
            {' · '}
            {result.route.distanceText}
          </div>
        )}
        {!available && (
          <div className="text-xs text-gray-400 italic">No route</div>
        )}
      </div>

      {/* Score bar */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400 font-medium">Score</span>
          <span className={`text-sm font-black ${meta.scoreColor}`}>{result.score}<span className="text-gray-300 font-normal">/100</span></span>
        </div>
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-full ${meta.barColor} score-bar`}
            style={{ '--bar-width': `${result.score}%`, width: `${result.score}%` } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Top 2 reasons */}
      {result.reasons.length > 0 && available && (
        <div className="flex flex-col gap-0.5">
          {result.reasons.slice(0, 2).map((r, i) => (
            <span key={i} className="text-xs text-gray-400 leading-tight truncate">
              · {r}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}

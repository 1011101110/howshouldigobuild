'use client';

interface PreferenceSliderProps {
  value: number; // 0=Walk, 1=Bike, 2=Transit, 3=Drive
  onChange: (val: number) => void;
}

const STOPS = [
  { label: 'Walk', emoji: '🚶', value: 0 },
  { label: 'Bike', emoji: '🚲', value: 1 },
  { label: 'Transit', emoji: '🚌', value: 2 },
  { label: 'Drive', emoji: '🚗', value: 3 },
];

export default function PreferenceSlider({ value, onChange }: PreferenceSliderProps) {
  const pct = (value / 3) * 100;
  const activeStop = STOPS.reduce((prev, curr) =>
    Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
  );

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-gray-500 whitespace-nowrap shrink-0">I prefer:</span>

      <div className="relative flex-1">
        {/* Track */}
        <div className="h-1.5 rounded-full bg-gray-200 relative overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-400 via-blue-400 to-orange-400 transition-all duration-100"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Invisible range input on top */}
        <input
          type="range"
          min={0}
          max={3}
          step={0.01}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-1.5 opacity-0 cursor-pointer"
          aria-label="Transport preference slider"
        />

        {/* Snap dots */}
        <div className="absolute top-0 left-0 right-0 flex justify-between -mt-0.5 pointer-events-none">
          {STOPS.map((stop) => {
            const isActive = Math.abs(value - stop.value) < 0.2;
            return (
              <div
                key={stop.value}
                className={`w-2.5 h-2.5 rounded-full border-2 transition-all duration-150 ${
                  isActive
                    ? 'bg-blue-500 border-blue-500 scale-110'
                    : 'bg-white border-gray-300'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Labels below */}
      <div className="flex gap-3">
        {STOPS.map((stop) => {
          const isActive = Math.abs(value - stop.value) < 0.3;
          return (
            <button
              key={stop.value}
              onClick={() => onChange(stop.value)}
              className={`text-sm transition-all duration-150 ${
                isActive
                  ? 'font-semibold text-gray-800'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="hidden sm:inline">{stop.emoji} </span>{stop.label}
            </button>
          );
        })}
      </div>

      {/* Active label pill */}
      <span className="hidden md:inline-flex shrink-0 items-center bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-blue-100">
        {activeStop.emoji} {activeStop.label}
      </span>
    </div>
  );
}

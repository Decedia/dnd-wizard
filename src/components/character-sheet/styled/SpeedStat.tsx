"use client";

interface SpeedStatProps {
  value: number;
}

export function SpeedStat({ value }: SpeedStatProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="h-16 w-16 drop-shadow-md">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="#0a0a0a"
            stroke="#ef4444"
            strokeWidth="3"
          />
          <circle
            cx="50"
            cy="50"
            r="36"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            opacity="0.5"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-parchment">{value}ft</span>
        </div>
      </div>
      <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider mt-1">Speed</span>
    </div>
  );
}

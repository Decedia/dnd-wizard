"use client";

interface SpeedStatProps {
  value: number;
}

export function SpeedStat({ value }: SpeedStatProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 100 120" className="h-16 w-14">
          <rect
            x="10"
            y="10"
            width="80"
            height="100"
            rx="12"
            fill="#ffffff"
            stroke="#e5e5e5"
            strokeWidth="1"
          />
          <rect
            x="18"
            y="18"
            width="64"
            height="84"
            rx="8"
            fill="none"
            stroke="#f0f0f0"
            strokeWidth="1"
            opacity="0.8"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[9px] font-semibold text-ink-muted uppercase tracking-wider">Speed</span>
          <span className="text-xl font-bold text-ink">{value}</span>
        </div>
      </div>
    </div>
  );
}

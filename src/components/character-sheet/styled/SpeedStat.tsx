"use client";

interface SpeedStatProps {
  value: number;
}

export function SpeedStat({ value }: SpeedStatProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 100 120" className="h-20 w-16 drop-shadow-md">
          <rect
            x="10"
            y="10"
            width="80"
            height="100"
            rx="16"
            fill="#0a0a0a"
            stroke="#ef4444"
            strokeWidth="3"
          />
          <rect
            x="20"
            y="20"
            width="60"
            height="80"
            rx="10"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.5"
            opacity="0.5"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-medium text-text-muted uppercase tracking-wider">Speed</span>
          <span className="text-2xl font-bold text-parchment">{value}</span>
        </div>
      </div>
    </div>
  );
}

"use client";

interface ShieldStatProps {
  value: number;
  label?: string;
}

export function ShieldStat({ value, label = "AC" }: ShieldStatProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 100 120" className="h-20 w-16 drop-shadow-md">
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c73e48" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#c73e48" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          <path
            d="M50 5 L90 20 L90 55 C90 80 50 115 50 115 C50 115 10 80 10 55 L10 20 Z"
            fill="url(#shieldGrad)"
            stroke="#c73e48"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M50 15 L80 27 L80 55 C80 75 50 103 50 103 C50 103 20 75 20 55 L20 27 Z"
            fill="none"
            stroke="#c73e48"
            strokeWidth="1.5"
            opacity="0.5"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-medium text-parchment/60 uppercase tracking-wider">{label}</span>
          <span className="text-2xl font-bold text-gold">{value}</span>
        </div>
      </div>
    </div>
  );
}

"use client";

interface ShieldStatProps {
  value: number;
  label?: string;
}

export function ShieldStat({ value, label = "AC" }: ShieldStatProps) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg viewBox="0 0 100 120" className="h-20 w-16">
          <path
            d="M50 5 L90 20 L90 55 C90 80 50 115 50 115 C50 115 10 80 10 55 L10 20 Z"
            fill="#ffffff"
            stroke="#000000"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M50 15 L80 27 L80 55 C80 75 50 103 50 103 C50 103 20 75 20 55 L20 27 Z"
            fill="none"
            stroke="#000000"
            strokeWidth="1.5"
            opacity="0.3"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] font-bold text-paper-muted uppercase tracking-wider">{label}</span>
          <span className="text-2xl font-bold text-paper">{value}</span>
        </div>
      </div>
    </div>
  );
}

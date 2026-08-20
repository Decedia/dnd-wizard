"use client";

interface HitDicePipsProps {
  total: number;
  remaining: number;
  onChange: (remaining: number) => void;
}

export function HitDicePips({ total, remaining, onChange }: HitDicePipsProps) {
  const used = Math.max(0, total - remaining);

  const handleClick = (index: number) => {
    if (index < used) {
      onChange(index);
    } else {
      onChange(index + 1);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => {
        const isUsed = i < used;
        return (
          <button
            key={i}
            type="button"
            onClick={() => handleClick(i)}
            className="h-5 w-5 transition-all duration-150"
            aria-label={`Hit die ${i + 1}${isUsed ? " used" : " available"}`}
            title={`Die ${i + 1}`}
          >
            <svg viewBox="0 0 20 20" className="h-full w-full">
              <polygon
                points="10,1 18,5 18,15 10,19 2,15 2,5"
                fill={isUsed ? "transparent" : "#ef4444"}
                stroke={isUsed ? "#ef4444" : "#ef4444"}
                strokeWidth="1.5"
                opacity={isUsed ? 0.4 : 0.8}
              />
              <circle cx="10" cy="10" r="2" fill={isUsed ? "#ef4444" : "#ffffff"} opacity={isUsed ? 0.3 : 0.6} />
            </svg>
          </button>
        );
      })}
    </div>
  );
}

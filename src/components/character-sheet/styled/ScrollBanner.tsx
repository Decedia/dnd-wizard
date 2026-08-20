"use client";

interface ScrollBannerProps {
  children: React.ReactNode;
}

export function ScrollBanner({ children }: ScrollBannerProps) {
  return (
    <div className="relative mx-auto max-w-lg">
      <svg
        viewBox="0 0 400 60"
        className="absolute -inset-x-4 -top-3 h-14 w-[calc(100%+2rem)] max-w-none"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M20 10 Q200 -5 380 10 L370 45 Q200 55 30 45 Z"
          fill="#ef4444"
          opacity="0.1"
        />
        <path
          d="M30 15 Q200 3 370 15 L362 40 Q200 48 38 40 Z"
          fill="none"
          stroke="#ef4444"
          strokeWidth="1"
          opacity="0.3"
        />
      </svg>
      <div className="relative z-10 px-2">{children}</div>
    </div>
  );
}

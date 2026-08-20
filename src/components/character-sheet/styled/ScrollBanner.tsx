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
        <defs>
          <linearGradient id="scrollGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#c5a059" stopOpacity="0.25" />
            <stop offset="50%" stopColor="#c5a059" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#c5a059" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        <path
          d="M20 10 Q200 -5 380 10 L370 45 Q200 55 30 45 Z"
          fill="url(#scrollGrad)"
          stroke="#c5a059"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <path
          d="M30 15 Q200 3 370 15 L362 40 Q200 48 38 40 Z"
          fill="none"
          stroke="#c5a059"
          strokeWidth="0.75"
          opacity="0.35"
        />
      </svg>
      <div className="relative z-10 px-2">{children}</div>
    </div>
  );
}

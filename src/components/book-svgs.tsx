"use client";

export const BookPatterns = {
  PHB: (
    <svg width="100%" height="100%" viewBox="0 0 200 72" preserveAspectRatio="xMidYMid slice">
      <circle cx="100" cy="36" r="50" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.12" />
      <circle cx="100" cy="36" r="30" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.12" />
    </svg>
  ),
  XGE: (
    <svg width="100%" height="100%" viewBox="0 0 200 72" preserveAspectRatio="xMidYMid slice">
      <polygon points="100,4 196,68 4,68" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.12" />
      <polygon points="100,24 164,60 36,60" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.12" />
    </svg>
  ),
  TCE: (
    <svg width="100%" height="100%" viewBox="0 0 200 72" preserveAspectRatio="xMidYMid slice">
      <path d="M50,18 Q100,66 150,18" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.12" />
      <path d="M50,54 Q100,6 150,54" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.12" />
      <circle cx="100" cy="36" r="6" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.12" />
    </svg>
  ),
  MTF: (
    <svg width="100%" height="100%" viewBox="0 0 200 72" preserveAspectRatio="xMidYMid slice">
      <rect x="10" y="6" width="70" height="60" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.12" />
      <rect x="50" y="14" width="70" height="48" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.12" />
    </svg>
  ),
  VGTM: (
    <svg width="100%" height="100%" viewBox="0 0 200 72" preserveAspectRatio="xMidYMid slice">
      <circle cx="100" cy="36" r="40" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.12" />
      <circle cx="100" cy="36" r="22" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.12" />
      <circle cx="100" cy="36" r="8" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.12" />
    </svg>
  ),
  SCAG: (
    <svg width="100%" height="100%" viewBox="0 0 200 72" preserveAspectRatio="xMidYMid slice">
      <line x1="100" y1="4" x2="100" y2="68" stroke="#fff" strokeWidth="1.2" opacity="0.12" />
      <line x1="4" y1="36" x2="196" y2="36" stroke="#fff" strokeWidth="1.2" opacity="0.12" />
      <circle cx="100" cy="36" r="10" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.12" />
    </svg>
  ),
  EGW: (
    <svg width="100%" height="100%" viewBox="0 0 200 72" preserveAspectRatio="xMidYMid slice">
      <path d="M0,36 Q50,4 100,36 T200,36" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.12" />
      <path d="M0,48 Q50,16 100,48 T200,48" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.12" />
    </svg>
  ),
  FTD: (
    <svg width="100%" height="100%" viewBox="0 0 200 72" preserveAspectRatio="xMidYMid slice">
      <polygon points="100,4 118,28 148,28 124,44 134,68 100,52 66,68 76,44 52,28 82,28" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.12" />
      <polygon points="100,20 112,36 132,36 116,46 122,60 100,50 78,60 84,46 68,36 88,36" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.12" />
    </svg>
  ),
  VRGR: (
    <svg width="100%" height="100%" viewBox="0 0 200 72" preserveAspectRatio="xMidYMid slice">
      <path d="M60,12 L100,36 L60,60 L40,36 Z" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.12" />
      <path d="M140,12 L100,36 L140,60 L160,36 Z" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.12" />
      <line x1="100" y1="12" x2="100" y2="60" stroke="#fff" strokeWidth="0.8" opacity="0.12" />
    </svg>
  ),
  MPMM: (
    <svg width="100%" height="100%" viewBox="0 0 200 72" preserveAspectRatio="xMidYMid slice">
      <circle cx="100" cy="36" r="32" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.12" />
      <circle cx="100" cy="36" r="18" fill="none" stroke="#fff" strokeWidth="0.8" opacity="0.12" />
      <circle cx="100" cy="36" r="5" fill="none" stroke="#fff" strokeWidth="0.6" opacity="0.12" />
    </svg>
  ),
};

export const BookEmojis: Record<string, string> = {
  PHB: "📖",
  XGE: "👁️",
  TCE: "🪄",
  MTF: "💀",
  VGTM: "🐉",
  SCAG: "⚔️",
  EGW: "🗺️",
  FTD: "🔥",
  VRGR: "🧛",
  MPMM: "👾",
};

export type BookId = keyof typeof BookPatterns;

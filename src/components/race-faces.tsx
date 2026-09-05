"use client";

const SKIN = {
  dragonborn: "#cd853f",
  dwarf: "#c68642",
  elf: "#f5deb3",
  eladrin: "#f0e0d0",
  gnome: "#f4a460",
  deepGnome: "#a0a0a0",
  halfElf: "#deb887",
  halfling: "#ffe4c4",
  ghostwise: "#e8dcc8",
  halfOrc: "#8b9a7b",
  human: "#d2b48c",
  tiefling: "#c97e7e",
  bugbear: "#9caa8b",
  changeling: "#e8dcc8",
  dhampir: "#e8dcd0",
  firbolg: "#c9a898",
  githyanki: "#d4c878",
  githzerai: "#a890a8",
  goblin: "#8fbc8f",
  hobgoblin: "#a0a070",
  kenku: "#b0a090",
  lizardfolk: "#6b8e5a",
  orc: "#7d8a6e",
  reborn: "#dcd0c0",
  shifter: "#c4a87c",
  tabaxi: "#d4a06a",
  triton: "#6fa8dc",
};

function facePath(skin: string, d: string) {
  return <path d={d} fill={skin} />;
}

const RaceFaces: Record<string, (skin: string, accent: string) => React.ReactNode> = {
  Dragonborn: (skin, accent) => (
    <g>
      <path d="M20 55 Q40 20 80 25 Q80 55 75 65 Q60 75 40 70 Q20 65 20 55Z" fill={skin} />
      <path d="M25 50 L30 35 L35 45 L40 30 L45 45 L50 32 L55 45 L60 30 L65 45 L70 35 L75 50" fill={accent} />
      <path d="M35 62 L38 55 L42 62 L45 55 L48 62" fill={skin} stroke={accent} strokeWidth="1" />
      <circle cx="35" cy="58" r="2" fill="#fff" />
      <circle cx="55" cy="58" r="2" fill="#fff" />
    </g>
  ),
  Dwarf: (skin, accent) => (
    <g>
      <rect x="22" y="28" width="36" height="38" rx="10" fill={skin} />
      <rect x="18" y="48" width="44" height="14" rx="4" fill={accent} />
      <rect x="28" y="38" width="8" height="3" rx="1" fill="#444" />
      <rect x="44" y="38" width="8" height="3" rx="1" fill="#444" />
      <path d="M32 52 Q40 56 48 52" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  Elf: (skin, accent) => (
    <g>
      <path d="M20 55 Q40 18 80 28 Q78 58 70 65 Q55 72 40 68 Q22 62 20 55Z" fill={skin} />
      <path d="M18 50 L10 20 L28 42 Z" fill={skin} />
      <path d="M62 50 L70 20 L52 42 Z" fill={skin} />
      <path d="M20 50 L28 42" fill={accent} />
      <path d="M60 50 L52 42" fill={accent} />
      <rect x="30" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <rect x="43" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <path d="M34 55 Q40 58 46 55" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  ),
  "Eladrin (Elf)": (skin, accent) => (
    <g>
      <path d="M20 55 Q40 18 80 28 Q78 58 70 65 Q55 72 40 68 Q22 62 20 55Z" fill={skin} />
      <path d="M18 48 L8 22 L26 40 Z" fill={skin} />
      <path d="M62 48 L72 22 L54 40 Z" fill={skin} />
      <path d="M18 48 L26 40" fill={accent} />
      <path d="M62 48 L54 40" fill={accent} />
      <circle cx="32" cy="42" r="2.5" fill="#444" />
      <circle cx="48" cy="42" r="2.5" fill="#444" />
      <path d="M36 54 Q42 57 48 54" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="40" cy="62" r="2" fill={accent} />
    </g>
  ),
  Gnome: (skin, accent) => (
    <g>
      <rect x="24" y="30" width="32" height="30" rx="8" fill={skin} />
      <path d="M24 35 L16 10 L40 25 Z" fill={accent} />
      <path d="M56 35 L64 10 L40 25 Z" fill={accent} />
      <circle cx="32" cy="44" r="4" fill="#fff" />
      <circle cx="48" cy="44" r="4" fill="#fff" />
      <circle cx="33" cy="44" r="1.5" fill="#444" />
      <circle cx="49" cy="44" r="1.5" fill="#444" />
      <path d="M36 52 Q40 55 44 52" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  ),
  "Deep Gnome (Svirfneblin)": (skin, accent) => (
    <g>
      <rect x="24" y="30" width="32" height="30" rx="8" fill={skin} />
      <path d="M24 35 L16 12 L40 25 Z" fill={accent} />
      <path d="M56 35 L64 12 L40 25 Z" fill={accent} />
      <ellipse cx="32" cy="44" rx="5" ry="4" fill="#fff" />
      <ellipse cx="48" cy="44" rx="5" ry="4" fill="#fff" />
      <circle cx="32" cy="44" r="1.5" fill="#444" />
      <circle cx="48" cy="44" r="1.5" fill="#444" />
      <path d="M36 52 Q40 55 44 52" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  ),
  "Half-Elf": (skin, accent) => (
    <g>
      <path d="M22 55 Q42 22 78 30 Q76 58 68 65 Q52 72 38 68 Q22 62 22 55Z" fill={skin} />
      <path d="M20 48 L14 28 L28 42 Z" fill={skin} />
      <rect x="30" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <rect x="43" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <path d="M34 54 Q40 57 46 54" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 48 L28 42" fill={accent} opacity="0.6" />
    </g>
  ),
  Halfling: (skin, accent) => (
    <g>
      <rect x="26" y="34" width="28" height="26" rx="8" fill={skin} />
      <rect x="24" y="52" width="32" height="8" rx="3" fill={accent} />
      <circle cx="34" cy="44" r="3.5" fill="#fff" />
      <circle cx="46" cy="44" r="3.5" fill="#fff" />
      <circle cx="35" cy="44" r="1.2" fill="#444" />
      <circle cx="47" cy="44" r="1.2" fill="#444" />
      <path d="M36 51 Q40 54 44 51" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  ),
  "Ghostwise Halfling": (skin, accent) => (
    <g>
      <rect x="26" y="34" width="28" height="26" rx="8" fill={skin} />
      <rect x="24" y="52" width="32" height="8" rx="3" fill={accent} />
      <ellipse cx="34" cy="44" rx="3.5" ry="3" fill="#fff" />
      <ellipse cx="46" cy="44" rx="3.5" ry="3" fill="#fff" />
      <circle cx="34" cy="44" r="1" fill="#444" />
      <circle cx="46" cy="44" r="1" fill="#444" />
      <path d="M36 51 Q40 54 44 51" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  ),
  "Half-Orc": (skin, accent) => (
    <g>
      <rect x="20" y="26" width="40" height="40" rx="10" fill={skin} />
      <path d="M30 54 L28 58 L34 56" fill="#fff" />
      <path d="M50 54 L52 58 L46 56" fill="#fff" />
      <rect x="28" y="38" width="8" height="4" rx="1" fill="#444" />
      <rect x="44" y="38" width="8" height="4" rx="1" fill="#444" />
      <path d="M32 52 Q40 56 48 52" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  Human: (skin, accent) => (
    <g>
      <path d="M22 55 Q42 20 78 30 Q76 58 68 65 Q52 72 38 68 Q22 62 22 55Z" fill={skin} />
      <path d="M20 48 Q22 38 28 36 Q36 34 40 40 Q44 34 52 36 Q58 38 60 48" fill={accent} />
      <rect x="30" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <rect x="43" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <path d="M34 54 Q40 57 46 54" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  ),
  Tiefling: (skin, accent) => (
    <g>
      <path d="M22 55 Q42 20 78 30 Q76 58 68 65 Q52 72 38 68 Q22 62 22 55Z" fill={skin} />
      <path d="M28 32 L22 14 L32 26 Z" fill={skin} />
      <path d="M52 32 L58 14 L48 26 Z" fill={skin} />
      <rect x="30" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <rect x="43" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <path d="M34 54 Q40 57 46 54" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="30" cy="32" r="2" fill={accent} />
      <circle cx="50" cy="32" r="2" fill={accent} />
    </g>
  ),
  Bugbear: (skin, accent) => (
    <g>
      <rect x="18" y="28" width="44" height="38" rx="12" fill={skin} />
      <ellipse cx="22" cy="45" rx="6" ry="10" fill={skin} />
      <ellipse cx="58" cy="45" rx="6" ry="10" fill={skin} />
      <ellipse cx="22" cy="45" rx="3" ry="6" fill="#444" />
      <ellipse cx="58" cy="45" rx="3" ry="6" fill="#444" />
      <ellipse cx="32" cy="44" rx="3" ry="2" fill="#fff" />
      <ellipse cx="48" cy="44" rx="3" ry="2" fill="#fff" />
      <path d="M36 52 Q40 55 44 52" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M26 60 L24 68" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <path d="M54 60 L56 68" stroke={accent} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  Changeling: (skin, accent) => (
    <g>
      <path d="M22 55 Q40 18 78 28 Q76 58 68 65 Q52 72 38 68 Q22 62 22 55Z" fill={skin} />
      <path d="M20 45 L14 22 L30 38 Z" fill={skin} />
      <path d="M60 45 L66 22 L50 38 Z" fill={skin} />
      <path d="M28 40 L32 38 L36 40 L32 42 Z" fill="#fff" opacity="0.3" />
      <path d="M44 40 L48 38 L52 40 L48 42 Z" fill="#fff" opacity="0.3" />
      <path d="M34 54 Q40 57 46 54" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  ),
  Dhampir: (skin, accent) => (
    <g>
      <path d="M22 55 Q42 20 78 30 Q76 58 68 65 Q52 72 38 68 Q22 62 22 55Z" fill={skin} />
      <path d="M28 32 L22 12 L34 26 Z" fill="#444" />
      <path d="M52 32 L58 12 L46 26 Z" fill="#444" />
      <rect x="30" y="40" width="7" height="2.5" rx="1" fill="#fff" opacity="0.9" />
      <rect x="43" y="40" width="7" height="2.5" rx="1" fill="#fff" opacity="0.9" />
      <path d="M34 54 Q40 57 46 54" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M35 56 L33 60 L37 58" fill={accent} />
      <path d="M45 56 L47 60 L43 58" fill={accent} />
    </g>
  ),
  Firbolg: (skin, accent) => (
    <g>
      <rect x="16" y="22" width="48" height="48" rx="16" fill={skin} />
      <rect x="12" y="38" width="56" height="12" rx="4" fill={accent} />
      <circle cx="28" cy="38" r="3" fill="#fff" />
      <circle cx="52" cy="38" r="3" fill="#fff" />
      <circle cx="29" cy="38" r="1.2" fill="#444" />
      <circle cx="53" cy="38" r="1.2" fill="#444" />
      <ellipse cx="40" cy="48" rx="6" ry="4" fill="#a08070" />
      <path d="M32 56 Q40 60 48 56" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  ),
  Githyanki: (skin, accent) => (
    <g>
      <path d="M20 55 Q42 16 80 26 Q78 56 70 64 Q54 72 38 68 Q20 62 20 55Z" fill={skin} />
      <path d="M18 48 L8 18 L28 38 Z" fill={skin} />
      <path d="M62 48 L72 18 L52 38 Z" fill={skin} />
      <path d="M18 48 L28 38" fill={accent} />
      <path d="M62 48 L52 38" fill={accent} />
      <rect x="30" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <rect x="43" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <path d="M34 54 Q40 57 46 54" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="18" cy="55" r="3" fill={accent} opacity="0.7" />
      <circle cx="62" cy="55" r="3" fill={accent} opacity="0.7" />
    </g>
  ),
  Githzerai: (skin, accent) => (
    <g>
      <rect x="22" y="28" width="36" height="38" rx="10" fill={skin} />
      <rect x="28" y="22" width="24" height="6" rx="2" fill={accent} />
      <circle cx="40" cy="36" r="3" fill={accent} />
      <rect x="30" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <rect x="43" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <path d="M34 52 Q40 55 46 52" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  ),
  Goblin: (skin, accent) => (
    <g>
      <rect x="22" y="30" width="36" height="30" rx="10" fill={skin} />
      <ellipse cx="18" cy="42" rx="6" ry="10" fill={skin} />
      <ellipse cx="62" cy="42" rx="6" ry="10" fill={skin} />
      <ellipse cx="18" cy="42" rx="3" ry="6" fill="#c44" />
      <ellipse cx="62" cy="42" rx="3" ry="6" fill="#c44" />
      <circle cx="32" cy="44" r="3" fill="#fff" />
      <circle cx="48" cy="44" r="3" fill="#fff" />
      <circle cx="33" cy="44" r="1.2" fill="#444" />
      <circle cx="49" cy="44" r="1.2" fill="#444" />
      <path d="M36 52 Q40 54 44 52" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="40" cy="50" rx="4" ry="2" fill="#888" />
    </g>
  ),
  Hobgoblin: (skin, accent) => (
    <g>
      <rect x="18" y="26" width="44" height="40" rx="12" fill={skin} />
      <rect x="14" y="44" width="52" height="12" rx="4" fill={accent} />
      <ellipse cx="20" cy="42" rx="5" ry="8" fill={skin} />
      <ellipse cx="60" cy="42" rx="5" ry="8" fill={skin} />
      <ellipse cx="20" cy="42" rx="2.5" ry="5" fill="#444" />
      <ellipse cx="60" cy="42" rx="2.5" ry="5" fill="#444" />
      <rect x="28" y="38" width="8" height="3" rx="1" fill="#444" />
      <rect x="44" y="38" width="8" height="3" rx="1" fill="#444" />
      <path d="M32 50 Q40 54 48 50" fill="none" stroke="#444" strokeWidth="2" strokeLinecap="round" />
    </g>
  ),
  Kenku: (skin, accent) => (
    <g>
      <path d="M20 55 Q40 20 80 28 Q78 55 70 64 Q55 72 38 68 Q20 62 20 55Z" fill={skin} />
      <path d="M18 45 L8 16 L28 38 Z" fill={skin} />
      <path d="M62 45 L72 16 L52 38 Z" fill={skin} />
      <path d="M18 45 L28 38" fill={accent} />
      <path d="M62 45 L52 38" fill={accent} />
      <path d="M30 50 L26 48 L34 48 Z" fill="#444" />
      <path d="M46 50 L42 48 L50 48 Z" fill="#444" />
      <path d="M34 56 L38 53 L42 56" fill="#444" />
      <path d="M28 38 L22 34" stroke={accent} strokeWidth="1.5" />
      <path d="M52 38 L58 34" stroke={accent} strokeWidth="1.5" />
    </g>
  ),
  Lizardfolk: (skin, accent) => (
    <g>
      <path d="M20 55 Q42 18 80 28 Q78 56 70 64 Q54 72 38 68 Q20 62 20 55Z" fill={skin} />
      <path d="M18 52 L10 28 L28 44 Z" fill={accent} />
      <path d="M62 52 L70 28 L52 44 Z" fill={accent} />
      <circle cx="32" cy="44" r="2.5" fill="#ffeb3b" />
      <circle cx="48" cy="44" r="2.5" fill="#ffeb3b" />
      <path d="M36 54 Q40 56 44 54" fill="none" stroke="#3e5c2e" strokeWidth="2" strokeLinecap="round" />
      <path d="M22 60 L20 66 M26 60 L26 66 M30 60 L32 66" stroke={accent} strokeWidth="1.5" />
      <path d="M50 60 L48 66 M54 60 L54 66 M58 60 L60 66" stroke={accent} strokeWidth="1.5" />
    </g>
  ),
  Orc: (skin, accent) => (
    <g>
      <rect x="16" y="24" width="48" height="44" rx="14" fill={skin} />
      <path d="M30 54 L26 60 L36 56" fill="#fff" />
      <path d="M50 54 L54 60 L44 56" fill="#fff" />
      <rect x="26" y="36" width="9" height="4" rx="1" fill="#444" />
      <rect x="45" y="36" width="9" height="4" rx="1" fill="#444" />
      <path d="M30 50 Q40 55 50 50" fill="none" stroke="#444" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 40 L10 32" stroke={accent} strokeWidth="3" strokeLinecap="round" />
      <path d="M64 40 L70 32" stroke={accent} strokeWidth="3" strokeLinecap="round" />
    </g>
  ),
  Reborn: (skin, accent) => (
    <g>
      <path d="M22 55 Q42 20 78 30 Q76 58 68 65 Q52 72 38 68 Q22 62 22 55Z" fill={skin} />
      <rect x="30" y="40" width="7" height="2.5" rx="1" fill="#444" opacity="0.5" />
      <rect x="43" y="40" width="7" height="2.5" rx="1" fill="#444" opacity="0.5" />
      <path d="M34 54 Q40 57 46 54" fill="none" stroke="#888" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <path d="M28 48 L28 62 M36 48 L36 62 M44 48 L44 62 M52 48 L52 62" stroke={accent} strokeWidth="1" opacity="0.4" />
    </g>
  ),
  Shifter: (skin, accent) => (
    <g>
      <path d="M22 55 Q42 20 78 30 Q76 58 68 65 Q52 72 38 68 Q22 62 22 55Z" fill={skin} />
      <path d="M18 50 L10 22 L28 40 Z" fill={skin} />
      <path d="M62 50 L70 22 L52 40 Z" fill={skin} />
      <path d="M18 50 L28 40" fill={accent} />
      <path d="M62 50 L52 40" fill={accent} />
      <rect x="30" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <rect x="43" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <path d="M34 54 Q40 57 46 54" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 55 Q10 65 15 75" fill="none" stroke={accent} strokeWidth="2" />
      <path d="M60 55 Q70 65 65 75" fill="none" stroke={accent} strokeWidth="2" />
    </g>
  ),
  Tabaxi: (skin, accent) => (
    <g>
      <path d="M22 55 Q42 20 78 30 Q76 58 68 65 Q52 72 38 68 Q22 62 22 55Z" fill={skin} />
      <path d="M18 48 L10 22 L28 40 Z" fill={skin} />
      <path d="M62 48 L70 22 L52 40 Z" fill={skin} />
      <path d="M18 48 L28 40" fill={accent} />
      <path d="M62 48 L52 40" fill={accent} />
      <rect x="30" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <rect x="43" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <path d="M34 54 Q40 57 46 54" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M24 50 L18 48" stroke="#fff" strokeWidth="1" />
      <path d="M22 52 L16 52" stroke="#fff" strokeWidth="1" />
      <path d="M56 50 L62 48" stroke="#fff" strokeWidth="1" />
      <path d="M58 52 L64 52" stroke="#fff" strokeWidth="1" />
    </g>
  ),
  Triton: (skin, accent) => (
    <g>
      <path d="M22 55 Q42 20 78 30 Q76 58 68 65 Q52 72 38 68 Q22 62 22 55Z" fill={skin} />
      <path d="M20 48 L14 28 L28 42 Z" fill={skin} />
      <rect x="30" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <rect x="43" y="40" width="7" height="2.5" rx="1" fill="#444" />
      <path d="M34 54 Q40 57 46 54" fill="none" stroke="#444" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 48 L28 42" fill={accent} />
      <path d="M24 62 Q40 72 56 62" fill="none" stroke={accent} strokeWidth="2" />
    </g>
  ),
};

export function getRaceFace(raceName: string): (skin: string, accent: string) => React.ReactNode {
  const normalized = raceName.replace(/ \(.*\)$/, "");
  const map: Record<string, (skin: string, accent: string) => React.ReactNode> = {
    ...RaceFaces,
    "Elf": RaceFaces.Elf,
    "Half-Elf": RaceFaces["Half-Elf"],
    "Halfling": RaceFaces.Halfling,
    "Tiefling": RaceFaces.Tiefling,
    "Dragonborn": RaceFaces.Dragonborn,
  };
  return map[normalized] || RaceFaces.Human;
}

export function RaceFace({ raceName, size = 56 }: { raceName: string; size?: number }) {
  const normalized = raceName.replace(/ \(.*\)$/, "");
  const skinKey = normalized.toLowerCase().replace(/[^a-z]/g, "") as keyof typeof SKIN;
  const skin = SKIN[skinKey] || "#d2b48c";
  const accent =
    normalized === "Dragonborn"
      ? "#8b4513"
      : normalized === "Tiefling"
        ? "#9c27b0"
        : normalized === "Lizardfolk"
          ? "#3e5c2e"
          : normalized === "Triton"
            ? "#4a7c9b"
            : normalized === "Githyanki"
              ? "#b8a040"
              : normalized === "Githzerai"
                ? "#7a6a8a"
                : "#6d4c41";

  const renderer = getRaceFace(raceName);
  const content = renderer(skin, accent);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      style={{ display: "block" }}
    >
      <rect x="0" y="0" width="80" height="80" rx="12" fill="#111111" />
      {content}
    </svg>
  );
}

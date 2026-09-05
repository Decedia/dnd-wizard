"use client";

export function HumanIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 Q20 2 20 10 Q20 18 12 22 Q4 18 4 10 Q4 2 12 2Z" />
      <path d="M8 8 Q12 12 16 8" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M12 14 L11 18 L13 18 Z" />
      <line x1="4" y1="10 L12 16 L20 10" />
    </svg>
  );
}

export function ElfIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 Q20 2 20 10 Q20 18 12 22 Q4 18 4 10 Q4 2 12 2Z" />
      <path d="M6 8 L2 2 L10 6 Z" />
      <path d="M18 8 L22 2 L14 6 Z" />
      <path d="M6 8 L10 6" opacity="0.6" />
      <path d="M18 8 L14 6" opacity="0.6" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M11 14 L10 18 L14 18 L13 14 Z" />
    </svg>
  );
}

export function DwarfIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="14" rx="3" />
      <rect x="4" y="12" width="16" height="4" rx="2" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <path d="M10 14 Q12 16 14 14" />
    </svg>
  );
}

export function HalflingIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <clipPath id="halfling-clip">
          <rect x="4" y="4" width="16" height="16" />
        </clipPath>
      </defs>
      <g clipPath="url(#halfling-clip)">
        <circle cx="12" cy="12" r="8" />
        <path d="M4 4 L20 20" strokeWidth="2.5" opacity="0.4" />
      </g>
      <circle cx="12" cy="12" r="6" />
      <circle cx="9" cy="11" r="1" fill="currentColor" />
      <circle cx="15" cy="11" r="1" fill="currentColor" />
      <path d="M10 15 Q12 16 14 15" />
      <line x1="4" y1="4" x2="20" y2="20" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

export function DragonbornIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12 L8 4 L16 4 L20 12 L16 20 L8 20 Z" />
      <path d="M4 12 L20 12" />
      <path d="M8 4 L12 12 L8 20" opacity="0.6" />
      <path d="M16 4 L12 12 L16 20" opacity="0.6" />
      <circle cx="10" cy="10" r="1" fill="currentColor" />
      <circle cx="14" cy="10" r="1" fill="currentColor" />
      <path d="M10 14 L11 17 L13 17 L12 14 Z" />
    </svg>
  );
}

export function GnomeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 Q18 2 18 8 Q18 14 12 16 Q6 14 6 8 Q6 2 12 2Z" />
      <path d="M4 6 L2 2 L10 4 Z" />
      <path d="M20 6 L22 2 L14 4 Z" />
      <path d="M4 6 L10 4" opacity="0.6" />
      <path d="M20 6 L14 4" opacity="0.6" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" />
      <path d="M10 14 Q12 15 14 14" />
    </svg>
  );
}

export function HalfElfIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 Q20 2 20 10 Q20 18 12 22 Q4 18 4 10 Q4 2 12 2Z" />
      <path d="M6 8 L2 2 L10 6 Z" opacity="0.7" />
      <path d="M6 8 L10 6" opacity="0.4" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M11 14 L10 18 L14 18 L13 14 Z" />
    </svg>
  );
}

export function HalfOrcIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12 L8 2 L16 2 L20 12 L16 22 L8 22 Z" />
      <path d="M4 12 L20 12" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" />
      <path d="M10 14 L9 18 L15 18 L14 14 Z" />
      <path d="M4 12 L2 8" opacity="0.6" />
      <path d="M20 12 L22 8" opacity="0.6" />
    </svg>
  );
}

export function TieflingIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 Q20 2 20 10 Q20 18 12 22 Q4 18 4 10 Q4 2 12 2Z" />
      <path d="M8 8 L4 2 L12 6 Z" fill="currentColor" opacity="0.3" />
      <path d="M16 8 L20 2 L12 6 Z" fill="currentColor" opacity="0.3" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M11 14 L10 18 L14 18 L13 14 Z" />
      <circle cx="8" cy="8" r="1" fill="currentColor" opacity="0.8" />
      <circle cx="16" cy="8" r="1" fill="currentColor" opacity="0.8" />
    </svg>
  );
}

export function VariantHumanIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <clipPath id="variant-clip">
          <rect x="4" y="4" width="16" height="16" />
        </clipPath>
      </defs>
      <g clipPath="url(#variant-clip)">
        <path d="M4 4 L20 20" strokeWidth="3" opacity="0.25" />
        <path d="M20 4 L4 20" strokeWidth="3" opacity="0.25" />
      </g>
      <circle cx="12" cy="12" r="7" />
      <circle cx="9" cy="11" r="1" fill="currentColor" />
      <circle cx="15" cy="11" r="1" fill="currentColor" />
      <path d="M10 15 Q12 16 14 15" />
      <line x1="4" y1="4" x2="20" y2="20" strokeWidth="0.5" opacity="0.3" />
      <line x1="20" y1="4" x2="4" y2="20" strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

export function BugbearIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10 L6 4 L10 6 L14 6 L18 4 L20 10 Q20 18 12 20 Q4 18 4 10Z" />
      <path d="M4 10 L6 4" opacity="0.4" />
      <path d="M20 10 L18 4" opacity="0.4" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" />
      <path d="M10 14 Q12 15 14 14" />
      <path d="M8 18 L6 22" opacity="0.7" />
      <path d="M16 18 L18 22" opacity="0.7" />
    </svg>
  );
}

export function ChangelingIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 Q20 2 20 10 Q20 18 12 22 Q4 18 4 10 Q4 2 12 2Z" />
      <path d="M6 8 L2 4 L10 6 Z" opacity="0.6" />
      <path d="M18 8 L22 4 L14 6 Z" opacity="0.6" />
      <path d="M8 10 L10 9 L12 10 L10 11 Z" fill="currentColor" opacity="0.3" />
      <path d="M12 10 L14 9 L16 10 L14 11 Z" fill="currentColor" opacity="0.3" />
      <circle cx="9" cy="11" r="1" fill="currentColor" />
      <circle cx="15" cy="11" r="1" fill="currentColor" />
      <path d="M10 15 Q12 16 14 15" strokeDasharray="2 2" />
    </svg>
  );
}

export function DhampirIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 Q20 2 20 10 Q20 18 12 22 Q4 18 4 10 Q4 2 12 2Z" />
      <path d="M8 8 L4 2 L12 6 Z" fill="currentColor" opacity="0.4" />
      <path d="M16 8 L20 2 L12 6 Z" fill="currentColor" opacity="0.4" />
      <circle cx="9" cy="10" r="1" fill="#fff" opacity="0.9" />
      <circle cx="15" cy="10" r="1" fill="#fff" opacity="0.9" />
      <path d="M11 14 L10 18 L14 18 L13 14 Z" />
      <path d="M10 16 L9 19" opacity="0.7" />
      <path d="M14 16 L15 19" opacity="0.7" />
    </svg>
  );
}

export function FirbolgIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10 Q4 4 12 4 Q20 4 20 10 Q20 18 12 20 Q4 18 4 10Z" />
      <rect x="2" y="10" width="20" height="4" rx="2" />
      <circle cx="8" cy="10" r="1.5" fill="currentColor" />
      <circle cx="16" cy="10" r="1.5" fill="currentColor" />
      <ellipse cx="12" cy="14" rx="3" ry="2" fill="currentColor" opacity="0.3" />
      <path d="M9 17 Q12 18 15 17" />
    </svg>
  );
}

export function GithyankiIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 Q20 2 20 10 Q20 18 12 22 Q4 18 4 10 Q4 2 12 2Z" />
      <path d="M4 10 L2 4 L10 7 Z" opacity="0.7" />
      <path d="M20 10 L22 4 L14 7 Z" opacity="0.7" />
      <path d="M4 10 L10 7" opacity="0.4" />
      <path d="M20 10 L14 7" opacity="0.4" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M11 14 L10 18 L14 18 L13 14 Z" />
      <circle cx="4" cy="12" r="1.5" fill="currentColor" opacity="0.6" />
      <circle cx="20" cy="12" r="1.5" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

export function GithzeraiIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="14" rx="3" />
      <rect x="8" y="3" width="8" height="3" rx="1" />
      <circle cx="12" cy="10" r="1.5" fill="currentColor" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <path d="M10 16 Q12 17 14 16" />
    </svg>
  );
}

export function GoblinIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 10 Q6 4 12 4 Q18 4 18 10 Q18 16 12 18 Q6 16 6 10Z" />
      <ellipse cx="3" cy="10" rx="3" ry="5" />
      <ellipse cx="21" cy="10" rx="3" ry="5" />
      <ellipse cx="3" cy="10" rx="1.5" ry="3" fill="currentColor" opacity="0.6" />
      <ellipse cx="21" cy="10" rx="1.5" ry="3" fill="currentColor" opacity="0.6" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" />
      <path d="M10 14 Q12 15 14 14" />
      <ellipse cx="12" cy="13" rx="2" ry="1" fill="currentColor" opacity="0.3" />
    </svg>
  );
}

export function HobgoblinIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10 L6 3 L18 3 L20 10 Q20 18 12 20 Q4 18 4 10Z" />
      <rect x="2" y="10" width="20" height="4" rx="2" />
      <ellipse cx="4" cy="10" rx="2" ry="4" />
      <ellipse cx="20" cy="10" rx="2" ry="4" />
      <ellipse cx="4" cy="10" rx="1" ry="2" fill="currentColor" opacity="0.5" />
      <ellipse cx="20" cy="10" rx="1" ry="2" fill="currentColor" opacity="0.5" />
      <line x1="9" y1="10" x2="15" y2="10" />
      <path d="M10 14 Q12 15 14 14" />
    </svg>
  );
}

export function KenkuIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 Q20 2 20 10 Q20 18 12 22 Q4 18 4 10 Q4 2 12 2Z" />
      <path d="M4 10 L2 4 L10 7 Z" opacity="0.8" />
      <path d="M20 10 L22 4 L14 7 Z" opacity="0.8" />
      <path d="M4 10 L10 7" opacity="0.4" />
      <path d="M20 10 L14 7" opacity="0.4" />
      <path d="M9 10 L8 8 L12 9 Z" fill="currentColor" opacity="0.4" />
      <path d="M15 10 L16 8 L12 9 Z" fill="currentColor" opacity="0.4" />
      <path d="M11 14 L10 17 L13 16 Z" fill="currentColor" opacity="0.5" />
      <line x1="8" y1="12" x2="6" y2="10" opacity="0.6" />
      <line x1="16" y1="12" x2="18" y2="10" opacity="0.6" />
    </svg>
  );
}

export function LizardfolkIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 Q20 2 20 10 Q20 18 12 22 Q4 18 4 10 Q4 2 12 2Z" />
      <path d="M4 10 L2 4 L10 7 Z" fill="currentColor" opacity="0.4" />
      <path d="M20 10 L22 4 L14 7 Z" fill="currentColor" opacity="0.4" />
      <circle cx="9" cy="10" r="1.5" fill="#ffeb3b" />
      <circle cx="15" cy="10" r="1.5" fill="#ffeb3b" />
      <path d="M10 14 Q12 15 14 14" strokeWidth="2.5" />
      <line x1="6" y1="16" x2="6" y2="20" opacity="0.7" />
      <line x1="10" y1="16" x2="10" y2="20" opacity="0.7" />
      <line x1="14" y1="16" x2="14" y2="20" opacity="0.7" />
      <line x1="18" y1="16" x2="18" y2="20" opacity="0.7" />
    </svg>
  );
}

export function OrcIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10 L6 2 L18 2 L20 10 Q20 20 12 22 Q4 20 4 10Z" />
      <path d="M4 10 L20 10" />
      <circle cx="9" cy="10" r="1.5" fill="currentColor" />
      <circle cx="15" cy="10" r="1.5" fill="currentColor" />
      <path d="M10 14 L9 19 L15 19 L14 14 Z" />
      <path d="M4 10 L2 6" opacity="0.7" />
      <path d="M20 10 L22 6" opacity="0.7" />
    </svg>
  );
}

export function RebornIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 Q20 2 20 10 Q20 18 12 22 Q4 18 4 10 Q4 2 12 2Z" opacity="0.5" />
      <line x1="9" y1="10" x2="15" y2="10" opacity="0.5" />
      <path d="M11 14 Q12 15 13 14" opacity="0.5" />
      <line x1="9" y1="12" x2="9" y2="18" opacity="0.4" />
      <line x1="12" y1="12" x2="12" y2="18" opacity="0.4" />
      <line x1="15" y1="12" x2="15" y2="18" opacity="0.4" />
    </svg>
  );
}

export function ShifterIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 Q20 2 20 10 Q20 18 12 22 Q4 18 4 10 Q4 2 12 2Z" />
      <path d="M4 10 L2 4 L10 7 Z" opacity="0.8" />
      <path d="M20 10 L22 4 L14 7 Z" opacity="0.8" />
      <path d="M4 10 L10 7" opacity="0.5" />
      <path d="M20 10 L14 7" opacity="0.5" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M11 14 L10 18 L14 18 L13 14 Z" />
      <path d="M4 14 Q2 18 4 22" opacity="0.6" />
      <path d="M20 14 Q22 18 20 22" opacity="0.6" />
    </svg>
  );
}

export function TabaxiIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 Q20 2 20 10 Q20 18 12 22 Q4 18 4 10 Q4 2 12 2Z" />
      <path d="M4 10 L2 4 L10 7 Z" opacity="0.8" />
      <path d="M20 10 L22 4 L14 7 Z" opacity="0.8" />
      <path d="M4 10 L10 7" opacity="0.5" />
      <path d="M20 10 L14 7" opacity="0.5" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M11 14 L10 18 L14 18 L13 14 Z" />
      <line x1="7" y1="12" x2="4" y2="10" opacity="0.7" />
      <line x1="5" y1="14" x2="2" y2="14" opacity="0.7" />
      <line x1="17" y1="12" x2="20" y2="10" opacity="0.7" />
      <line x1="19" y1="14" x2="22" y2="14" opacity="0.7" />
    </svg>
  );
}

export function TritonIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 Q20 2 20 10 Q20 18 12 22 Q4 18 4 10 Q4 2 12 2Z" />
      <path d="M4 10 L2 5 L10 8 Z" opacity="0.7" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M11 14 L10 18 L14 18 L13 14 Z" />
      <path d="M4 10 L10 8" opacity="0.5" />
      <path d="M8 17 Q12 20 16 17" opacity="0.6" />
    </svg>
  );
}

export const RACE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Dragonborn: DragonbornIcon,
  Dwarf: DwarfIcon,
  Elf: ElfIcon,
  "Eladrin (Elf)": ElfIcon,
  Gnome: GnomeIcon,
  "Deep Gnome (Svirfneblin)": GnomeIcon,
  "Half-Elf": HalfElfIcon,
  Halfling: HalflingIcon,
  "Lightfoot Halfling": HalflingIcon,
  "Stout Halfling": HalflingIcon,
  "Ghostwise Halfling": HalflingIcon,
  "Half-Orc": HalfOrcIcon,
  Human: HumanIcon,
  VariantHuman: VariantHumanIcon,
  Tiefling: TieflingIcon,
  Bugbear: BugbearIcon,
  Changeling: ChangelingIcon,
  Dhampir: DhampirIcon,
  Firbolg: FirbolgIcon,
  Githyanki: GithyankiIcon,
  Githzerai: GithzeraiIcon,
  Goblin: GoblinIcon,
  Hobgoblin: HobgoblinIcon,
  Kenku: KenkuIcon,
  Lizardfolk: LizardfolkIcon,
  Orc: OrcIcon,
  Reborn: RebornIcon,
  Shifter: ShifterIcon,
  Tabaxi: TabaxiIcon,
  Triton: TritonIcon,
};

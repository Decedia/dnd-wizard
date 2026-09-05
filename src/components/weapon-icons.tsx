"use client";

export function GreataxeIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 L14 14 L12 22 L10 14 Z" />
      <path d="M6 10 L18 10" />
      <path d="M8 6 L16 6" />
    </svg>
  );
}

export function RapierIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 L12 16" />
      <path d="M8 16 L16 16 L14 20 L10 20 Z" />
      <path d="M9 20 L15 20" />
    </svg>
  );
}

export function MaceIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2 L14 2 L13 12 L11 12 Z" />
      <circle cx="12" cy="16" r="4" />
      <line x1="12" y1="12" x2="12" y2="16" />
    </svg>
  );
}

export function StaffIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="2" x2="12" y2="22" />
      <circle cx="12" cy="4" r="2" />
      <path d="M8 18 Q12 22 16 18" />
    </svg>
  );
}

export function LongswordIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2 L16 2 L15 14 L9 14 Z" />
      <line x1="12" y1="14" x2="12" y2="22" />
      <path d="M8 22 L16 22" />
    </svg>
  );
}

export function LongbowIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 Q18 12 6 22" />
      <line x1="9" y1="6" x2="9" y2="18" />
      <path d="M6 6 L9 6" />
      <path d="M6 18 L9 18" />
    </svg>
  );
}

export function DaggerIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2 L14 2 L13 12 L11 12 Z" />
      <line x1="12" y1="12" x2="12" y2="18" />
      <path d="M8 18 L16 18" />
    </svg>
  );
}

export function WandIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="22" x2="18" y2="2" />
      <circle cx="18" cy="2" r="1.5" fill="currentColor" />
      <path d="M14 6 L18 2 L22 6" />
    </svg>
  );
}

export function ArtisanToolIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2 L16 2 L15 10 L9 10 Z" />
      <line x1="12" y1="10" x2="12" y2="22" />
      <path d="M10 22 L14 22" />
    </svg>
  );
}

export const WEAPON_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Barbarian: GreataxeIcon,
  Bard: RapierIcon,
  Cleric: MaceIcon,
  Druid: StaffIcon,
  Fighter: LongswordIcon,
  Monk: StaffIcon,
  Paladin: LongswordIcon,
  Ranger: LongbowIcon,
  Rogue: DaggerIcon,
  Sorcerer: WandIcon,
  Warlock: WandIcon,
  Wizard: StaffIcon,
  Artificer: ArtisanToolIcon,
};

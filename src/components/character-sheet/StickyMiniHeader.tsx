"use client";

import { useEffect, useState } from "react";
import type { Character } from "@/lib/storage";

interface StickyMiniHeaderProps {
  character: Character;
}

export function StickyMiniHeader({ character }: StickyMiniHeaderProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 160);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  const title = character.name || "Unnamed Adventurer";
  const subtitle = `${character.class || "Adventurer"} • Level ${character.level || 1}`;

  return (
    <div className="fixed top-0 left-0 right-0 z-30 bg-charcoal/90 backdrop-blur-xl border-b border-gold/10">
      <div className="mx-auto max-w-lg px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-display text-sm font-bold text-gold truncate">{title}</span>
          <span className="text-parchment/30">•</span>
          <span className="text-xs text-parchment/50 truncate">{subtitle}</span>
        </div>
      </div>
    </div>
  );
}

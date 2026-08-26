"use client";

import { useEffect, useRef, useState } from "react";
import {
  User,
  ChartBar,
  Sword,
  Skull,
  DiceFive,
  ListChecks,
  Star,
  Backpack,
  Lightning,
  Scroll,
  GraduationCap,
  Sparkle,
  Sun,
} from "phosphor-react";

const sections = [
  { id: "identity", label: "Identity", Icon: User },
  { id: "stats", label: "Stats", Icon: ChartBar },
  { id: "combat", label: "Combat", Icon: Sword },
  { id: "death-saves", label: "Death Saves", Icon: Skull },
   { id: "hit-dice", label: "Hit Dice", Icon: DiceFive },
  { id: "skills", label: "Skills", Icon: ListChecks },
  { id: "features", label: "Features", Icon: Star },
  { id: "attacks", label: "Attacks", Icon: Sword },
  { id: "inventory", label: "Inventory", Icon: Backpack },
  { id: "proficiencies", label: "Proficiencies", Icon: Scroll },
  { id: "spells", label: "Spells", Icon: Lightning },
  { id: "spellcasting", label: "Spellcasting", Icon: Sparkle },
  { id: "appearance", label: "Appearance", Icon: Sun },
];

export function SectionNav() {
  const [active, setActive] = useState(sections[0].id);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className="fixed right-1 md:right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-1 md:gap-1.5 rounded-full border border-border-strong bg-paper/90 backdrop-blur-sm p-1 md:p-2"
      aria-label="Section navigation"
    >
      {sections.map(({ id, label, Icon }) => (
        <button
          key={id}
          onClick={() => scrollTo(id)}
          aria-label={label}
          title={label}
          className={`flex items-center justify-center rounded-md transition-all ${
            active === id
              ? "h-7 w-7 md:h-8 md:w-8 text-white bg-ink border border-ink"
              : "h-7 w-7 md:h-8 md:w-8 text-ink-muted hover:text-ink border border-transparent"
          }`}
        >
          <Icon className="h-4 w-4 md:h-5 md:w-5" weight={active === id ? "fill" : "regular"} />
        </button>
      ))}
    </nav>
  );
}

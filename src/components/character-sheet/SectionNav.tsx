"use client";

import { useEffect, useRef, useState } from "react";
import {
  UserIcon as User,
  ChartBarIcon as ChartBar,
  SwordIcon as Sword,
  SkullIcon as Skull,
  DiceIcon as DiceFive,
  ListChecksIcon as ListChecks,
  StarIcon as Star,
  BackpackIcon as Backpack,
  LightningIcon as Lightning,
  ScrollIcon as Scroll,
  GraduationCapIcon as GraduationCap,
  SparklesIcon as Sparkle,
  SunIcon as Sun,
} from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";

const sections = [
  { id: "identity", label: "character.identity", Icon: User },
  { id: "stats", label: "section.stats", Icon: ChartBar },
  { id: "combat", label: "section.combatStats", Icon: Sword },
  { id: "death-saves", label: "section.deathSaves", Icon: Skull },
   { id: "hit-dice", label: "section.hitDice", Icon: DiceFive },
  { id: "skills", label: "section.skills", Icon: ListChecks },
  { id: "features", label: "section.featuresTraits", Icon: Star },
  { id: "attacks", label: "section.attacks", Icon: Sword },
  { id: "inventory", label: "section.inventory", Icon: Backpack },
  { id: "proficiencies", label: "section.otherProficiencies", Icon: Scroll },
  { id: "spells", label: "section.spells", Icon: Lightning },
  { id: "spellcasting", label: "character.spellcasting", Icon: Sparkle },
  { id: "appearance", label: "section.appearanceBio", Icon: Sun },
];

export function SectionNav() {
  const { t } = useLanguage();
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
          aria-label={t(label)}
          title={t(label)}
           className={`flex items-center justify-center rounded-md transition-all ${
            active === id
              ? "h-7 w-7 md:h-8 md:w-8 text-[var(--color-nav-icon)] bg-[var(--color-nav-bg)] border border-[var(--color-nav-bg)]"
              : "h-7 w-7 md:h-8 md:w-8 text-ink-muted hover:text-ink border border-transparent"
          }`}
        >
          <Icon className="h-4 w-4 md:h-5 md:w-5" />
        </button>
      ))}
    </nav>
  );
}

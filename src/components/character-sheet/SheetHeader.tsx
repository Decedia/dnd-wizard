"use client";

import { createElement, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { Eye, EyeSlash, House } from "@phosphor-icons/react";
import { GiCampfire } from "react-icons/gi";
import { HeartBottleIcon as Heart, DropIcon as Drop } from "@/components/icons";
import { useLanguage } from "@/contexts/LanguageContext";
import { getClassIcon } from "@/lib/class-icon";
import type { Character } from "@/lib/storage";
import { Overridable } from "./Overridable";

interface SheetHeaderProps {
  character: Character;
  editMode: boolean;
  onHp: (mode: "heal" | "damage") => void;
  onRest: () => void;
  /** Edit toggle and the more-actions menu. */
  actions: ReactNode;
}

/** The hero at a glance, on every tab: who, AC, HP, and the three things you do to HP. */
export function SheetHeader({ character, editMode, onHp, onRest, actions }: SheetHeaderProps) {
  const { t } = useLanguage();
  const maxHp = character.effectiveMaxHp ?? character.maxHp;
  const hpPercent = maxHp > 0 ? Math.min(100, Math.max(0, (character.currentHp / maxHp) * 100)) : 0;
  const level = t("home.lvl", { level: character.level || 1 } as any, "Lvl {level}");
  const nameKey = `dnd-hide-name:${character.id}`;
  const [nameHidden, setNameHidden] = useState(false);
  useEffect(() => {
    try { setNameHidden(localStorage.getItem(nameKey) === "1"); } catch { /* storage blocked: name stays shown */ }
  }, [nameKey]);
  const toggleName = () => {
    const next = !nameHidden;
    setNameHidden(next);
    try { localStorage.setItem(nameKey, next ? "1" : "0"); } catch { /* storage blocked: keep it for this visit */ }
  };
  const line = `${level} ${character.class || ""}${character.subclass ? ` · ${character.subclass}` : ""}`;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-paper-muted)]">
      <div className="mx-auto max-w-lg space-y-3 px-4 pb-3 pt-3">
        <div className="flex items-center gap-2.5">
          <Link
            href="/"
            aria-label={t("nav.home", "Home")}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-control-border)] text-[var(--color-text-primary)]"
          >
            <House size={20} weight="bold" />
          </Link>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-gold)] bg-[var(--color-surface)] text-[var(--color-gold)]">
            {createElement(getClassIcon(character.class), { size: 22, weight: "duotone" })}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-1">
              <h1 className={`truncate font-heading text-lg font-semibold leading-tight ${nameHidden ? "italic text-[var(--color-text-muted)]" : "text-[var(--color-text-primary)]"}`}>
                {nameHidden ? t("sheet.nameHidden", "Hidden") : character.name || t("home.unnamedHero")}
              </h1>
              <button
                type="button"
                onClick={toggleName}
                aria-label={nameHidden ? t("sheet.showName", "Show name") : t("sheet.hideName", "Hide name")}
                aria-pressed={nameHidden}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg)]"
              >
                {nameHidden ? <EyeSlash size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <p className="line-clamp-2 text-xs leading-snug text-[var(--color-text-muted)]">{line}</p>
          </div>
          <Overridable id="ac" label={t("sheet.armorClass", "Armor Class")} editMode={editMode} className="no-underline">
            <div className="relative flex h-[52px] w-[46px] shrink-0 items-center justify-center">
              <svg viewBox="0 0 52 58" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <path d="M26 2 L49 10 V28 C49 42 39 52 26 56 C13 52 3 42 3 28 V10 Z" fill="var(--color-surface)" stroke="var(--color-gold)" strokeWidth="2" />
              </svg>
              <div className="relative text-center leading-none">
                <span className="block text-lg font-extrabold text-[var(--color-text-primary)]">{character.ac}</span>
                <span className="block text-[9px] font-bold text-[var(--color-text-muted)]">AC</span>
              </div>
            </div>
          </Overridable>
          {actions}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between text-[13px]">
            <span className="font-bold text-[var(--color-text-primary)]">
              HP {character.currentHp} / <Overridable id="maxHp" label={t("override.maxHp", "Max HP")} editMode={editMode}>{maxHp}</Overridable>
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">{t("sheet.tempHp", "Temp HP")} {character.temporaryHp || 0}</span>
          </div>
          <div className="progress-track" style={{ height: "10px" }}>
            <div className="progress-fill hp-fill" style={{ width: `${hpPercent}%` }} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onHp("damage")}
            className="flex items-center justify-center gap-1.5 rounded-full border border-[var(--color-error-200)] py-2 text-[var(--color-error-700)] transition-all hover:bg-[var(--color-error-50)]"
          >
            <Drop className="h-4 w-4" />
            <span className="text-xs font-semibold">{t("character.damage")}</span>
          </button>
          <button
            type="button"
            onClick={() => onHp("heal")}
            className="flex items-center justify-center gap-1.5 rounded-full border border-[var(--color-success-200)] py-2 text-[var(--color-success-700)] transition-all hover:bg-[var(--color-success-50)]"
          >
            <Heart className="h-4 w-4" />
            <span className="text-xs font-semibold">{t("character.heal")}</span>
          </button>
          <button
            type="button"
            onClick={onRest}
            className="flex items-center justify-center gap-1.5 rounded-full border border-[var(--color-control-border)] py-2 text-[var(--color-text-primary)] transition-all hover:bg-[var(--color-bg)]"
          >
            <GiCampfire className="h-4 w-4" aria-hidden="true" />
            <span className="text-xs font-semibold">{t("sheet.rest", "Rest")}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

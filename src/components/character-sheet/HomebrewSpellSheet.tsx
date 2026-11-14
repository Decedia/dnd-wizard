"use client";

import { useState, type ReactNode } from "react";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { RichInline } from "@/components/RichText";
import { useLanguage } from "@/contexts/LanguageContext";
import { newRowId } from "@/lib/inventory";
import { spellNumbersFor } from "@/lib/roll-parts";
import type { Character } from "@/lib/storage";
import {
  HOMEBREW_CASTS, HOMEBREW_DICE, HOMEBREW_DURATIONS, HOMEBREW_HITS, HOMEBREW_RANGES, HOMEBREW_TYPES, SAVE_ABILITIES,
  homebrewRow, newHomebrew, type HomebrewSpell,
} from "@/lib/homebrew-spells";

type SpellRow = Character["spells"][number];

interface HomebrewSpellSheetProps {
  character: Character;
  /** The spell being changed; left out for a new one. */
  spell?: SpellRow & { homebrew: HomebrewSpell };
  onSave: (row: SpellRow) => void;
  onDelete?: () => void;
  onClose: () => void;
}

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

/** Make or change a spell the player invented: the numbers the app needs, plus free text. */
export function HomebrewSpellSheet({ character, spell, onSave, onDelete, onClose }: HomebrewSpellSheetProps) {
  const { t } = useLanguage();
  const [name, setName] = useState(spell?.name || "");
  const [level, setLevel] = useState(spell?.level ?? 1);
  const [effect, setEffect] = useState(spell?.description || "");
  const [h, setH] = useState<HomebrewSpell>(spell?.homebrew || newHomebrew(character));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (patch: Partial<HomebrewSpell>) => setH((old) => ({ ...old, ...patch }));
  const presetRange = HOMEBREW_RANGES.includes(h.range);
  const [otherRange, setOtherRange] = useState(!presetRange);
  const numbers = spellNumbersFor(character);
  const caster = !!character.spellcastingAbility;
  const heals = h.damageType === "healing";

  const chip = (active: boolean, label: string, onClick: () => void, key: string) => (
    <button key={key} type="button" aria-pressed={active} onClick={onClick} className={`btn !px-3 !py-1.5 text-xs ${active ? "btn-primary" : "btn-secondary"}`}>
      {label}
    </button>
  );
  const stepper = (value: number, setValue: (n: number) => void, min: number, max: number, label: string, show = String(value)) => (
    <div className="flex items-center gap-2">
      <button type="button" aria-label={t("homebrew.less", { what: label }, "Less {what}")} onClick={() => setValue(Math.max(min, value - 1))} disabled={value <= min} className="btn btn-secondary h-9 w-10 !px-0 disabled:opacity-40">−</button>
      <span className="w-9 text-center text-base font-bold tabular-nums text-[var(--color-text-primary)]">{show}</span>
      <button type="button" aria-label={t("homebrew.more", { what: label }, "More {what}")} onClick={() => setValue(Math.min(max, value + 1))} disabled={value >= max} className="btn btn-secondary h-9 w-10 !px-0 disabled:opacity-40">+</button>
    </div>
  );
  const toggle = (on: boolean, setOn: (v: boolean) => void, title: string, hint: string) => (
    <label className="flex cursor-pointer items-center justify-between gap-3">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[var(--color-text-primary)]">{title}</span>
        <span className="block text-xs text-[var(--color-text-muted)]">{hint}</span>
      </span>
      <input type="checkbox" role="switch" checked={on} onChange={(e) => setOn(e.target.checked)} className="peer sr-only" />
      <span aria-hidden="true" className={`relative h-6 w-11 shrink-0 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--color-gold)] ${on ? "bg-[var(--color-ink)]" : "bg-[var(--color-border)]"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-[var(--color-surface)] transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </span>
    </label>
  );
  const section = (label: string, children: ReactNode, hint?: string) => (
    <div className="space-y-2">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{label}</div>
      {children}
      {hint && <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  );

  const toHit = h.useSpellAttack ? numbers.attack + h.attackBonus : h.attackBonus;
  const dmg = h.diceCount > 0 ? `${h.diceCount}d${h.die}${h.addMod ? " + MOD" : ""} ${heals ? t("homebrew.healing", "healing") : h.damageType}` : "";
  const preview = [
    h.hit === "attack" ? t("turn.toHit", { bonus: signed(toHit) }, "{bonus} to hit") : h.hit === "save" ? t("turn.saveAbilityDc", { ability: h.saveAbility, dc: numbers.dc || "?" }, "{ability} save DC {dc}") : t("turn.alwaysHits", "Always hits"),
    dmg,
    h.range,
    t(`homebrew.duration.${h.duration}`, h.duration),
  ].filter(Boolean).join(" · ");

  const save = () => onSave(homebrewRow(spell?.id || newRowId(), name, level, effect, h));

  const footer = (
    <div className="flex items-center gap-2 px-4 py-3">
      <button type="button" onClick={onClose} className="btn btn-secondary flex-1">{t("common.cancel", "Cancel")}</button>
      <button type="button" onClick={save} disabled={!name.trim()} className="btn btn-primary flex-1 disabled:opacity-40">{t("homebrew.save", "Save spell")}</button>
    </div>
  );

  return (
    <BottomSheet isOpen onClose={onClose} title={spell ? t("homebrew.editTitle", "Change your spell") : t("homebrew.title", "Make your own spell")} footer={footer} className="!mb-4 !max-h-[90vh]">
      <div className="space-y-5 px-4 py-4">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-bold text-[var(--color-text-primary)]">{name.trim() || t("homebrew.unnamed", "Unnamed spell")}</span>
            <span className="rounded-full border border-[var(--color-gold)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-gold)]">{t("homebrew.tag", "Homebrew")}</span>
          </div>
          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{preview}</p>
        </div>

        {section(t("homebrew.name", "Name"), (
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("homebrew.namePlaceholder", "Ember Lance")} className="input w-full" aria-label={t("homebrew.name", "Name")} />
        ))}

        {section(t("homebrew.level", "Level"), (
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 10 }, (_, l) => chip(level === l, l === 0 ? t("homebrew.cantrip", "Cantrip") : String(l), () => setLevel(l), `l${l}`))}
          </div>
        ), level === 0 ? t("homebrew.levelCantrip", "Cantrip: no spell slot.") : t("homebrew.levelSlot", { level }, "Uses a level {level} spell slot or higher."))}

        {toggle(h.counts, (counts) => set({ counts }), t("homebrew.counts", "Counts toward my spell limit"), t("homebrew.countsHint", "Off: always ready, never takes a known or prepared spot."))}

        {section(t("homebrew.castingTime", "Casting time"), (
          <div className="flex flex-wrap gap-1.5">{HOMEBREW_CASTS.map((c) => chip(h.castingTime === c, t(`turn.slot.${c}`), () => set({ castingTime: c }), c))}</div>
        ))}

        {section(t("homebrew.range", "Range"), (
          <>
            <div className="flex flex-wrap gap-1.5">
              {HOMEBREW_RANGES.map((r) => chip(!otherRange && h.range === r, t(`homebrew.range.${r}`, r), () => { setOtherRange(false); set({ range: r }); }, r))}
              {chip(otherRange, t("homebrew.range.other", "Other"), () => { setOtherRange(true); if (presetRange) set({ range: "" }); }, "other")}
            </div>
            {otherRange && <input type="text" value={h.range} onChange={(e) => set({ range: e.target.value })} placeholder="90 ft" className="input w-full" aria-label={t("homebrew.range", "Range")} />}
          </>
        ))}

        {section(t("homebrew.how", "How does it hit?"), (
          <>
            <div className="grid grid-cols-3 gap-2">
              {HOMEBREW_HITS.map((k) => (
                <button key={k} type="button" aria-pressed={h.hit === k} onClick={() => set({ hit: k })} className={`rounded-[var(--radius-md)] border px-2 py-2 text-left ${h.hit === k ? "border-2 border-[var(--color-ink)]" : "border-[var(--color-border)]"}`}>
                  <span className="block text-xs font-bold text-[var(--color-text-primary)]">{t(`homebrew.hit.${k}`)}</span>
                  <span className="block text-[11px] leading-snug text-[var(--color-text-muted)]">{t(`homebrew.hit.${k}.hint`)}</span>
                </button>
              ))}
            </div>
            {h.hit === "attack" && (
              <div className="space-y-2">
                {caster && toggle(h.useSpellAttack, (useSpellAttack) => set({ useSpellAttack, attackBonus: 0 }), t("homebrew.useSpellAttack", "Use my spell attack"), t("homebrew.useSpellAttackHint", "Off: type the spell's own to-hit bonus."))}
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm text-[var(--color-text-secondary)]">{h.useSpellAttack ? t("homebrew.extraToHit", "Extra to-hit bonus") : t("homebrew.ownToHit", "Spell's to-hit bonus")}</span>
                  {stepper(h.attackBonus, (attackBonus) => set({ attackBonus }), -5, 20, t("homebrew.toHitWord", "to hit"), signed(h.attackBonus))}
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">{t("homebrew.rollsToHit", { bonus: signed(toHit) }, "Rolls d20 {bonus} to hit.")}</p>
              </div>
            )}
            {h.hit === "save" && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">{SAVE_ABILITIES.map((a) => chip(h.saveAbility === a, a, () => set({ saveAbility: a }), a))}</div>
                {toggle(h.halfOnSave, (halfOnSave) => set({ halfOnSave }), t("homebrew.half", "Half damage on a success"), t("homebrew.halfHint", "The target still takes some damage."))}
                <p className="text-xs text-[var(--color-text-muted)]">{numbers.dc ? t("homebrew.usesDc", { dc: numbers.dc }, "Uses your spell save DC {dc}.") : t("homebrew.noDc", "Your hero has no spell save DC; ask your DM for the number.")}</p>
              </div>
            )}
            {h.hit === "auto" && <p className="text-xs text-[var(--color-text-muted)]">{t("homebrew.autoHint", "Damage goes straight on. Nothing to roll for the hit.")}</p>}
          </>
        ))}

        {section(t("homebrew.damage", "Damage or healing"), (
          <>
            <div className="flex flex-wrap items-center gap-3">
              {stepper(h.diceCount, (diceCount) => set({ diceCount }), 0, 40, t("homebrew.diceWord", "dice"))}
              <div className="flex flex-wrap gap-1.5">{HOMEBREW_DICE.map((d) => chip(h.die === d, `d${d}`, () => set({ die: d }), `d${d}`))}</div>
            </div>
            <select value={h.damageType} onChange={(e) => set({ damageType: e.target.value })} className="input w-full" aria-label={t("homebrew.damageType", "Damage type")}>
              {HOMEBREW_TYPES.map((d) => <option key={d} value={d}>{d === "healing" ? t("homebrew.healingOption", "Healing (gives HP back)") : d}</option>)}
            </select>
            {toggle(h.addMod, (addMod) => set({ addMod }), t("homebrew.addMod", "Add my spell ability"), t("homebrew.addModHint", "Your INT, WIS or CHA bonus on top."))}
            {toggle(h.scales, (scales) => set({ scales }), t("homebrew.scales", "Stronger later"), level === 0 ? t("homebrew.scalesCantrip", "More dice at hero levels 5, 11 and 17, like book cantrips.") : t("homebrew.scalesSlot", "More dice when cast with a higher spell slot."))}
            {h.scales && level > 0 && (
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[var(--color-text-secondary)]">{t("homebrew.scaleDice", { die: `d${h.die}` }, "Extra {die} per slot level above")}</span>
                {stepper(h.scaleDice, (scaleDice) => set({ scaleDice }), 0, 10, t("homebrew.diceWord", "dice"))}
              </div>
            )}
          </>
        ), t("homebrew.noDamage", "Set dice to 0 for a spell that does no damage."))}

        {section(t("homebrew.duration", "Duration"), (
          <>
            <div className="flex flex-wrap gap-1.5">{HOMEBREW_DURATIONS.map((d) => chip(h.duration === d, t(`homebrew.duration.${d}`, d), () => set({ duration: d }), d))}</div>
            {toggle(h.concentration, (concentration) => set({ concentration }), t("turn.concentration", "Concentration"), t("homebrew.concHint", "Ends if you cast another concentration spell."))}
          </>
        ), h.duration === "instant" ? undefined : t("homebrew.timerHint", "A timer starts when you cast it and counts down on End turn."))}

        {section(t("homebrew.effect", "What else it does"), (
          <>
            <textarea value={effect} onChange={(e) => setEffect(e.target.value)} rows={4} placeholder={t("homebrew.effectPlaceholder", "On a hit, the target is frightened of you until the end of its next turn.")} className="input w-full" aria-label={t("homebrew.effect", "What else it does")} />
            {effect.trim() && <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]"><RichInline text={effect} /></p>}
          </>
        ), t("homebrew.effectHint", "Dice, damage types and conditions turn into badges, like book spells."))}

        {spell && onDelete && (
          <div className="border-t border-[var(--color-border)] pt-4">
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <span className="flex-1 text-sm text-[var(--color-text-secondary)]">{t("homebrew.deleteAsk", "Delete this spell for good?")}</span>
                <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-secondary !px-3 !py-1.5 text-xs">{t("common.cancel", "Cancel")}</button>
                <button type="button" onClick={onDelete} className="btn btn-primary !px-3 !py-1.5 text-xs">{t("homebrew.delete", "Delete")}</button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="btn btn-secondary w-full">{t("homebrew.delete", "Delete")}</button>
            )}
          </div>
        )}
      </div>
    </BottomSheet>
  );
}

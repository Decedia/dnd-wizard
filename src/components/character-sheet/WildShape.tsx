"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { useLanguage } from "@/contexts/LanguageContext";
import { beastsFor, crText, shapeUses, type Beast } from "@/data/wild-shapes";
import type { Character } from "@/lib/storage";
import { beastRunPatch, currentBeast, leaveShapePatch, letGoPatch, wildDamagePatch } from "@/lib/turn";

const speeds = (b: Beast, t: (k: string, v?: any, f?: string) => string) =>
  [b.speed ? t("wild.speed", { ft: b.speed }, "{ft} ft") : null, b.climb ? t("wild.climb", { ft: b.climb }, "climb {ft} ft") : null, b.swim ? t("wild.swim", { ft: b.swim }, "swim {ft} ft") : null, b.fly ? t("wild.fly", { ft: b.fly }, "fly {ft} ft") : null, b.burrow ? t("wild.burrow", { ft: b.burrow }, "burrow {ft} ft") : null].filter(Boolean).join(", ");

/** The beast form the druid is in: its HP, damage taken, and changing back. */
export function WildShapeCard({ character, onChange }: { character: Character; onChange: (patch: Partial<Character>) => void }) {
  const { t } = useLanguage();
  const [note, setNote] = useState<string | null>(null);
  const beast = currentBeast(character);
  if (!beast || !character.wildShape) {
    return note ? <p className="rounded-[var(--radius-md)] bg-[var(--color-bg)] px-3 py-2 text-xs font-semibold text-[var(--color-text-primary)]">{note}</p> : null;
  }
  const hp = character.wildShape.hp;
  const hit = (amount: number) => {
    const r = wildDamagePatch(character, amount);
    if (r.reverted) setNote(t("wild.dropped", { form: t(`wild.name.${beast.name}`, beast.name), carried: r.carried }, "Your {form} form dropped to 0 HP and you changed back. {carried} damage carried over to your own HP."));
    onChange(r.patch);
  };
  const beastSpells = (character.features || []).some((f) => /^Beast Spells/.test(f.name || ""));
  return (
    <section className="rounded-[var(--radius-md)] border-2 border-[var(--color-ink)] px-3 py-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{t("wild.form", { form: t(`wild.name.${beast.name}`, beast.name) }, "Beast form: {form}")}</h3>
        <span className="text-[11px] font-semibold text-[var(--color-text-secondary)]">{t("wild.stats", { ac: beast.ac }, "AC {ac}")} · {speeds(beast, t)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between text-xs font-semibold text-[var(--color-text-secondary)]">
        <span>{t("wild.hp", "Form HP")}</span>
        <span>{hp} / {beast.hp}</span>
      </div>
      <div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--color-bg)]">
        <div className="h-full rounded-full bg-[var(--color-ink)]" style={{ width: `${Math.max(0, Math.min(100, (hp / beast.hp) * 100))}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">{t("wild.hpHint", "Damage comes off the form first. At 0 you change back and the rest hits your own HP.")}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[1, 5, 10].map((n) => (
          <button key={n} type="button" onClick={() => hit(n)} className="btn btn-secondary !px-3 !py-1.5 text-xs">−{n}</button>
        ))}
        <button type="button" onClick={() => hit(-1)} disabled={hp >= beast.hp} className="btn btn-secondary !px-3 !py-1.5 text-xs">+1</button>
        <button type="button" onClick={() => { setNote(null); onChange(leaveShapePatch(character)); }} disabled={!!character.turnActive && !!character.bonusActionUsed} className="btn btn-secondary ml-auto !px-3 !py-1.5 text-xs">
          {t("wild.leave", "Change back")}
        </button>
      </div>
      {beast.run && character.turnActive && (
        <div className="mt-3 border-t border-[var(--color-border)] pt-2">
          <button
            type="button"
            aria-pressed={!!character.wildShape.run}
            onClick={() => onChange(beastRunPatch(character, !character.wildShape!.run))}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${character.wildShape.run ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-surface)]" : "border-[var(--color-border)] text-[var(--color-text-secondary)]"}`}
          >
            {t("wild.run.tap", "I ran 20 ft straight at the target")}
          </button>
          <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{t(`wild.run.hint.${beast.run}`)}</p>
        </div>
      )}
      {(character.wildShape.holding || []).map((name) => {
        const a = beast.attacks.find((x) => x.name === name);
        return (
          <div key={name} className="mt-2 flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] px-3 py-1.5">
            <span className="min-w-0 text-xs font-semibold text-[var(--color-text-primary)]">
              {t(a?.grapple?.restrained ? "wild.holdingRestrained" : "wild.holding", { attack: name, dc: a?.grapple?.escape ?? 10 }, "{attack} holds a target (escape DC {dc}).")}
            </span>
            <button type="button" onClick={() => onChange(letGoPatch(character, name))} className="btn btn-secondary shrink-0 !px-3 !py-1 text-xs">{t("wild.letGo", "It got free")}</button>
          </div>
        );
      })}
      {character.wildShape.swallowed && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] px-3 py-1.5">
          <span className="min-w-0 text-xs font-semibold text-[var(--color-text-primary)]">{t("wild.inside", "A target is inside you: it takes 3d6 acid at the start of each of your turns.")}</span>
          <button type="button" onClick={() => onChange(letGoPatch(character, "swallowed"))} className="btn btn-secondary shrink-0 !px-3 !py-1 text-xs">{t("wild.gotOut", "It got out")}</button>
        </div>
      )}
      <p className="mt-2 text-[11px] text-[var(--color-text-muted)]">
        {beastSpells ? t("wild.spellsOk", "You can cast spells in beast form.") : t("wild.noSpells", "You cannot cast spells in beast form. Changing back early takes a bonus action.")}
      </p>
    </section>
  );
}

/** Pick the beast to turn into. */
export function WildShapePicker({ character, onPick, onClose }: { character: Character; onPick: (beast: Beast) => void; onClose: () => void }) {
  const { t } = useLanguage();
  const beasts = beastsFor(character);
  return (
    <BottomSheet isOpen onClose={onClose} title={t("wild.pick", "Turn into a beast")} className="!mb-4 !max-h-[86vh]">
      <div className="space-y-2 px-4 py-4">
        <p className="text-xs text-[var(--color-text-secondary)]">{t("wild.pickHint", "Beasts you can become at your level. You keep your mind; you get the beast's body, HP and attacks.")}</p>
        {beasts.map((b) => {
          // An elemental takes two uses: the one the Wild Shape tap pays and one more.
          const short = shapeUses(b) > 1 && (character.wildShapeUses || 0) < shapeUses(b);
          return (
          <button key={b.name} type="button" disabled={short} onClick={() => onPick(b)} className="block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-left hover:border-[var(--color-border-active)] disabled:opacity-45">
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-bold text-[var(--color-text-primary)]">{t(`wild.name.${b.name}`, b.name)}</span>
              <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
                {b.elemental ? (short ? t("wild.elementalShort", "Needs 2 uses left") : t("wild.elementalCost", "Takes 2 uses")) : `CR ${crText(b.cr)}`}
              </span>
            </span>
            <span className="mt-0.5 block text-[11px] font-semibold text-[var(--color-text-secondary)]">
              {t("wild.line", { ac: b.ac, hp: b.hp }, "AC {ac} · {hp} HP")} · {speeds(b, t)}
            </span>
            <span className="mt-0.5 block text-xs text-[var(--color-text-secondary)]">{b.attacks.map((a) => `${a.name} +${a.toHit} (${a.damage})`).join(" · ")}{b.multiattack > 1 ? ` · ${t("wild.multi", { count: b.multiattack }, "{count} attacks a turn")}` : ""}</span>
            <span className="mt-1 block text-xs font-semibold text-[var(--color-text-primary)]">{t(`wild.why.${b.name}`, b.why)}</span>
          </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}

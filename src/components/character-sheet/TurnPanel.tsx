"use client";

import { useMemo, useState } from "react";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { RichInline } from "@/components/RichText";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStaticClass, getStaticSubclassDetails } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { buildTurnMenu, endEncounterPatch, isSlotUsed, optionPatch, type TurnGroup, type TurnOption, type TurnSlot } from "@/lib/turn";
import { CheckIcon as Check, LightningBoltIcon as LightningBolt, ClockIcon as Clock, ShieldCheckIcon as ShieldCheck, CaretDownIcon as ChevronDown } from "@/components/icons";
import { GiRun } from "react-icons/gi";

interface TurnPanelProps {
  character: Character;
  srdSpells: any[];
  onChange: (patch: Partial<Character>) => void;
  onEndTurn: () => void;
  onClose: () => void;
}

const SLOTS: TurnSlot[] = ["action", "bonus", "reaction"];
const GROUPS: TurnGroup[] = ["attack", "spell", "basic"];
const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

export function TurnPanel({ character, srdSpells, onChange, onEndTurn, onClose }: TurnPanelProps) {
  const { t, language } = useLanguage();
  const menu = useMemo(() => buildTurnMenu(character, srdSpells), [character, srdSpells]);
  const [openBasics, setOpenBasics] = useState<Partial<Record<TurnSlot, boolean>>>({});
  const [showFeatures, setShowFeatures] = useState(true);
  const [last, setLast] = useState<{ name: string; undo: Partial<Character> } | null>(null);

  // Feature summaries in the reader's language; the rules data itself is English only.
  const localSummary = useMemo(() => {
    const map = new Map<string, string>();
    const add = (f: any) => typeof f?.summary === "string" && f.summary && map.set(f.name, f.summary);
    const cls: any = getStaticClass(character.class, undefined, character.ruleset, language);
    for (const level of cls?.levels || []) for (const f of level.features || []) add(f);
    if (character.subclass) for (const f of getStaticSubclassDetails(character.class, character.subclass, language)?.features || []) add(f);
    return map;
  }, [character.class, character.subclass, character.ruleset, language]);

  const nameOf = (o: TurnOption) => (o.nameKey ? t(o.nameKey) : o.name);
  const textOf = (o: TurnOption) => {
    if (o.summaryKey) return t(o.summaryKey);
    const parts: string[] = [];
    if (o.toHit !== undefined) parts.push(t("turn.toHit", { bonus: signed(o.toHit) }, "{bonus} to hit"));
    if (o.damage) parts.push(o.damage);
    if (o.saveDc) parts.push(t("turn.saveDc", { dc: o.saveDc }, "Save DC {dc}"));
    return [parts.join(" · "), o.summary].filter(Boolean).join(parts.length && o.summary ? ". " : "");
  };
  const costOf = (o: TurnOption) => {
    if (!o.cost) return null;
    return t(o.cost.key, o.cost.values);
  };
  const reasonOf = (o: TurnOption, slotUsed: boolean) => {
    if (o.blocked === "noSlot") return t("turn.block.noSlot", "No spell slot left");
    if (slotUsed) return t(`turn.block.used.${o.slot}`);
    return null;
  };

  const use = (o: TurnOption) => {
    const patch = optionPatch(o);
    const undo: Record<string, unknown> = {};
    for (const key of Object.keys(patch)) undo[key] = (character as any)[key] ?? (key.endsWith("Used") ? false : undefined);
    setLast({ name: nameOf(o), undo: undo as Partial<Character> });
    onChange(patch);
  };

  const chip = (label: string, used: boolean, toggle: () => void, Icon: React.ComponentType<{ className?: string }>) => (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={used}
      className={`flex flex-1 flex-col items-center gap-0.5 rounded-[var(--radius-md)] border px-1 py-1.5 text-[10px] font-bold transition-colors ${
        used ? "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)] line-through" : "border-[var(--color-ink)] text-[var(--color-text-primary)]"
      }`}
    >
      {used ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
      <span className="leading-tight">{label}</span>
    </button>
  );

  const row = (o: TurnOption, slotUsed: boolean) => {
    const reason = reasonOf(o, slotUsed);
    const cost = costOf(o);
    const text = textOf(o);
    return (
      <button
        key={o.key}
        type="button"
        disabled={!!reason}
        onClick={() => use(o)}
        className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-left transition-colors hover:border-[var(--color-border-active)] disabled:opacity-45 disabled:hover:border-[var(--color-border)]"
      >
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-sm font-bold text-[var(--color-text-primary)]">{nameOf(o)}</span>
          {cost && <span className="rounded-full bg-[var(--color-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">{cost}</span>}
          {o.concentration && <span className="rounded-full border border-dashed border-[var(--color-border-active)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">{t("turn.concentration", "Concentration")}</span>}
        </span>
        {text && (
          <span className="mt-0.5 block text-xs leading-relaxed text-[var(--color-text-secondary)] line-clamp-3">
            <RichInline text={text} />
          </span>
        )}
        {reason && <span className="mt-0.5 block text-[11px] font-semibold text-[var(--color-text-muted)]">{reason}</span>}
      </button>
    );
  };

  const footer = (
    <div className="flex items-center gap-2 px-4 py-3">
      <button
        type="button"
        onClick={() => { onChange(endEncounterPatch()); onClose(); }}
        className="rounded-full border border-[var(--color-border)] px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)]"
      >
        {t("turn.endFight", "End fight")}
      </button>
      <button type="button" onClick={onEndTurn} className="flex-1 rounded-full bg-[var(--color-ink)] py-2.5 text-sm font-bold text-[var(--color-surface)]">
        {t("character.endTurn", "End Turn")}
      </button>
    </div>
  );

  return (
    <BottomSheet isOpen onClose={onClose} title={t("turn.title", { round: character.turnRound || 1 }, "Your turn · Round {round}")} footer={footer} className="!mb-4 !max-h-[86vh]">
      <div className="sticky top-0 z-10 space-y-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <div className="flex gap-2">
          {chip(t("spell.action"), !!character.actionUsed, () => onChange({ actionUsed: !character.actionUsed }), LightningBolt)}
          {chip(t("spell.bonusAction"), !!character.bonusActionUsed, () => onChange({ bonusActionUsed: !character.bonusActionUsed }), Clock)}
          {chip(t("turn.move", { speed: menu.speed }, "Move {speed} ft"), !!character.moveUsed, () => onChange({ moveUsed: !character.moveUsed }), GiRun)}
          {chip(t("spell.reaction"), !!character.reactionUsed, () => onChange({ reactionUsed: !character.reactionUsed }), ShieldCheck)}
        </div>
        {last ? (
          <div className="flex items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-[var(--color-bg)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)]">
            <span className="min-w-0 truncate">{t("turn.used", { name: last.name }, "Used: {name}")}</span>
            <button type="button" onClick={() => { onChange(last.undo); setLast(null); }} className="shrink-0 font-bold text-[var(--color-text-primary)] underline">
              {t("turn.undo", "Undo")}
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-[var(--color-text-muted)]">{t("turn.hint", "Each turn you get one action, one bonus action and your movement. Tap what you do.")}</p>
        )}
      </div>

      <div className="space-y-5 px-4 py-4">
        {SLOTS.map((slot) => {
          const options = menu.options.filter((o) => o.slot === slot);
          if (options.length === 0) return null;
          const used = isSlotUsed(character, slot);
          const basics = options.filter((o) => o.group === "basic");
          return (
            <section key={slot}>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{t(`turn.slot.${slot}`)}</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{used ? t("turn.state.used", "Used") : t("turn.state.ready", "Ready")}</span>
              </div>
              <p className="mb-2 text-[11px] text-[var(--color-text-muted)]">{t(`turn.slot.${slot}.hint`)}</p>
              <div className="space-y-3">
                {GROUPS.filter((g) => g !== "basic").map((group) => {
                  const rows = options.filter((o) => o.group === group);
                  if (rows.length === 0) return null;
                  return (
                    <div key={group} className="space-y-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                        {t(`turn.group.${group}`)}
                        {group === "attack" && menu.attacksPerAction > 1 && <span className="ml-1 normal-case tracking-normal">· {t("turn.extraAttack", { count: menu.attacksPerAction }, "{count} attacks with one action")}</span>}
                      </div>
                      {rows.map((o) => row(o, used))}
                    </div>
                  );
                })}
                {basics.length > 0 && (
                  <div className="space-y-1.5">
                    <button type="button" onClick={() => setOpenBasics((s) => ({ ...s, [slot]: !s[slot] }))} className="flex w-full items-center justify-between text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                      <span>{t("turn.group.basic")} ({basics.length})</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${openBasics[slot] ? "rotate-180" : ""}`} />
                    </button>
                    {openBasics[slot] && basics.map((o) => row(o, used))}
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {menu.features.length > 0 && (
          <section>
            <button type="button" onClick={() => setShowFeatures((v) => !v)} className="flex w-full items-center justify-between text-sm font-bold text-[var(--color-text-primary)]">
              <span>{t("turn.features", "Your features")} ({menu.features.length})</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFeatures ? "rotate-180" : ""}`} />
            </button>
            <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{t("turn.features.hint", "Not tracked here yet. Read when each one applies, and spend uses on the Features tab.")}</p>
            {showFeatures && (
              <div className="mt-2 space-y-1.5">
                {menu.features.map((f) => {
                  const text = localSummary.get(f.name) || f.description;
                  return (
                    <div key={f.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2">
                      <div className="text-sm font-bold text-[var(--color-text-primary)]">{f.name}</div>
                      {text && <div className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)] line-clamp-3"><RichInline text={text} /></div>}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
    </BottomSheet>
  );
}

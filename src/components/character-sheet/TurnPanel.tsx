"use client";

import { useMemo, useState } from "react";
import { BottomSheet } from "@/components/modals/BottomSheet";
import { RichInline, RichText } from "@/components/RichText";
import { TurnHands } from "./TurnHands";
import { SwingTracker } from "./SwingTracker";
import { WildShapeCard, WildShapePicker } from "./WildShape";
import { moveTip, suggestPicks, type Pick, type Situation } from "@/lib/turn-suggest";
import { useLanguage } from "@/contexts/LanguageContext";
import { getStaticClass, getStaticSubclassDetails } from "@/lib/srd-client";
import { getMaxPreparedSpells, type Character } from "@/lib/storage";
import type { Beast } from "@/data/wild-shapes";
import { needsPrepare, preparableSpells } from "@/lib/prepared-spells";
import { PrepareSpellsSheet } from "@/components/PrepareSpellsSheet";
import { amountPatch, isSwingOption, swingPatch, wildShapePatch, buildTurnMenu, endEncounterPatch, isSlotUsed, optionPatch, type TurnGroup, type TurnOption, type TurnSlot } from "@/lib/turn";
import { CheckIcon as Check, LightningBoltIcon as LightningBolt, ClockIcon as Clock, ShieldCheckIcon as ShieldCheck, CaretDownIcon as ChevronDown } from "@/components/icons";
import { GiRun } from "react-icons/gi";

interface TurnPanelProps {
  character: Character;
  srdSpells: any[];
  onChange: (patch: Partial<Character>) => void;
  onEndTurn: () => void;
  onClose: () => void;
}

const SLOTS: TurnSlot[] = ["action", "bonus", "reaction", "free"];
const GROUPS: TurnGroup[] = ["attack", "spell", "feature"];
const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

export function TurnPanel({ character, srdSpells, onChange, onEndTurn, onClose }: TurnPanelProps) {
  const { t, language } = useLanguage();
  const menu = useMemo(() => buildTurnMenu(character, srdSpells), [character, srdSpells]);
  const [openBasics, setOpenBasics] = useState<Partial<Record<TurnSlot, boolean>>>({});
  const [showFeatures, setShowFeatures] = useState(true);
  const [preparing, setPreparing] = useState(false);
  // The row whose full text is open.
  const [info, setInfo] = useState<{ title: string; meta?: string; text: string } | null>(null);
  // The feature whose amount is being chosen (Lay on Hands).
  const [amountFor, setAmountFor] = useState<{ option: TurnOption; value: number } | null>(null);
  // Suggest (best pick per slot) or every option. Remembered per character on this device.
  const modeKey = `dnd-turn-mode:${character.id}`;
  const [mode, setModeState] = useState<"suggest" | "all">(() => {
    try { return localStorage.getItem(modeKey) === "all" ? "all" : "suggest"; } catch { return "suggest"; }
  });
  const setMode = (m: "suggest" | "all") => {
    setModeState(m);
    try { localStorage.setItem(modeKey, m); } catch { /* storage blocked: keep it for this visit */ }
  };
  const [seeAll, setSeeAll] = useState<Partial<Record<TurnSlot, boolean>>>({});
  const sit: Situation = character.turnSituation || {};
  const toggleSit = (k: keyof Situation) => onChange({ turnSituation: { ...sit, [k]: !sit[k] } });
  const picks = mode === "suggest" ? suggestPicks(character, menu, srdSpells, sit) : null;
  // The Wild Shape option waiting for a beast to be picked.
  const [shaping, setShaping] = useState<TurnOption | null>(null);
  const mustPrepare = needsPrepare(character);
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
    const parts: string[] = [];
    if (o.toHit !== undefined) parts.push(t("turn.toHit", { bonus: signed(o.toHit) }, "{bonus} to hit"));
    if (o.damage) parts.push(o.damage);
    if (o.saveDc) parts.push(t("turn.saveDc", { dc: o.saveDc }, "Save DC {dc}"));
    const summary = o.summaryKey ? t(o.summaryKey) : (o.group === "feature" && localSummary.get(o.name)) || o.summary;
    return [parts.join(" · "), summary].filter(Boolean).join(parts.length && summary ? ". " : "");
  };
  const costOf = (o: TurnOption) => {
    if (!o.cost) return null;
    return t(o.cost.key, o.cost.values);
  };
  const reasonOf = (o: TurnOption, slotUsed: boolean) => {
    if (o.blocked === "noSlot") return t("turn.block.noSlot", "No spell slot left");
    if (o.blocked === "empty") return t("turn.block.empty", "None left. It comes back after a rest.");
    if (o.blocked === "shaped") return t("turn.block.shaped", "You are already in beast form.");
    if (o.blocked === "raging") return t("turn.block.raging", "You are already raging.");
    if (o.blocked === "notRaging") return t("turn.block.notRaging", "Only while you rage. Use Rage first.");
    if (slotUsed) return t(`turn.block.used.${o.slot}`);
    if (o.blocked === "actionFirst") return t("turn.block.actionFirst", "Use your action first, then tap this to get it back.");
    return null;
  };

  const use = (o: TurnOption, amount?: number, form?: Beast) => {
    if (o.amount && amount === undefined) return setAmountFor({ option: o, value: 1 });
    if (o.group === "feature" && /^Wild Shape/.test(o.name) && !form) return setShaping(o);
    const patch = form ? wildShapePatch(o, form) : amount !== undefined ? amountPatch(character, o, amount) : isSwingOption(o) ? swingPatch(character, o) : optionPatch(o);
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

  const infoButton = (title: string, text: string, meta?: string) => (
    <button
      type="button"
      aria-label={t("turn.info", { name: title }, "Full text: {name}")}
      onClick={() => setInfo({ title, text, meta })}
      className="flex w-10 shrink-0 items-center justify-center border-l border-[var(--color-border)] text-sm font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)]"
    >
      i
    </button>
  );

  const row = (o: TurnOption, slotUsed: boolean, pick?: Pick, best = false) => {
    const reason = reasonOf(o, slotUsed);
    const cost = costOf(o);
    const text = textOf(o);
    const full = o.detail || (o.summaryKey ? t(o.summaryKey) : o.summary);
    return (
      <div key={o.key} className={`flex overflow-hidden rounded-[var(--radius-md)] border bg-[var(--color-surface)] transition-colors hover:border-[var(--color-border-active)] ${best ? "border-2 border-[var(--color-ink)]" : "border-[var(--color-border)]"}`}>
        <button
          type="button"
          disabled={!!reason}
          onClick={() => use(o)}
          className="min-w-0 flex-1 px-3 py-2 text-left disabled:opacity-45"
        >
          {best && <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("turn.best", "Best pick")}</span>}
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-bold text-[var(--color-text-primary)]">{nameOf(o)}</span>
            {cost && <span className="rounded-full bg-[var(--color-bg)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">{cost}</span>}
            {o.when && <span className="rounded-full border border-[var(--color-border)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">{t(`turn.when.${o.when}`)}</span>}
            {o.concentration && <span className="rounded-full border border-dashed border-[var(--color-border-active)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">{t("turn.concentration", "Concentration")}</span>}
          </span>
          {text && (
            <span className="mt-0.5 block text-xs leading-relaxed text-[var(--color-text-secondary)] line-clamp-3">
              <RichInline text={text} />
            </span>
          )}
          {pick && <span className="mt-1 block text-xs font-semibold leading-snug text-[var(--color-text-primary)]">{t(`turn.why.${pick.why}`, pick.values || {})}</span>}
          {reason && <span className="mt-0.5 block text-[11px] font-semibold text-[var(--color-text-muted)]">{reason}</span>}
        </button>
        {full && infoButton(nameOf(o), full, [cost, o.when ? t(`turn.when.${o.when}`) : null, text && o.detail && o.group !== "feature" ? text : null].filter(Boolean).join(" · ") || undefined)}
      </div>
    );
  };

  const footer = (
    <div className="flex items-center gap-2 px-4 py-3">
      <button
        type="button"
        onClick={() => { onChange(endEncounterPatch(character)); onClose(); }}
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
        <WildShapeCard character={character} onChange={onChange} />
        <SwingTracker character={character} menu={menu} nameOf={nameOf} onUse={(o) => use(o)} onChange={onChange} />
        {mustPrepare && (
          <div className="rounded-[var(--radius-md)] border border-amber-500/60 bg-amber-500/10 px-3 py-3">
            <div className="text-sm font-bold text-[var(--color-text-primary)]">{t("turn.prepare.title", "No spells ready")}</div>
            <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)]">{t("turn.prepare.hint", "Your class chooses which spells are ready each day. Until you do, only cantrips show here.")}</p>
            <button type="button" onClick={() => setPreparing(true)} className="mt-2 rounded-full bg-[var(--color-ink)] px-4 py-2 text-xs font-bold text-[var(--color-surface)]">
              {t("prepare.title", "Prepare spells")}
            </button>
          </div>
        )}
        <div className="space-y-2">
          <div className="flex rounded-full border border-[var(--color-border)] p-0.5 text-xs font-bold">
            {(["suggest", "all"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={`flex-1 rounded-full py-1.5 ${mode === m ? "bg-[var(--color-ink)] text-[var(--color-surface)]" : "text-[var(--color-text-secondary)]"}`}>
                {t(`turn.mode.${m}`)}
              </button>
            ))}
          </div>
          {mode === "suggest" && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {(["near", "many", "low"] as const).map((k) => (
                  <button key={k} type="button" aria-pressed={!!sit[k]} onClick={() => toggleSit(k)} className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold ${sit[k] ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-surface)]" : "border-[var(--color-border)] text-[var(--color-text-secondary)]"}`}>
                    {t(`turn.sit.${k}`)}
                  </button>
                ))}
              </div>
              <p className="text-xs leading-relaxed text-[var(--color-text-secondary)]">{t(moveTip(menu, character, sit), { speed: menu.speed })}</p>
            </>
          )}
        </div>
        {!character.wildShape && <TurnHands character={character} onChange={onChange} />}
        {SLOTS.map((slot) => {
          const options = menu.options.filter((o) => o.slot === slot);
          if (options.length === 0) {
            if (slot === "free") return null;
            return (
              <section key={slot}>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{t(`turn.slot.${slot}`)}</h3>
                <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{t(`turn.slot.${slot}.none`)}</p>
              </section>
            );
          }
          const used = isSlotUsed(character, slot);
          const basics = options.filter((o) => o.group === "basic");
          const fullList = () => (
              <div className="space-y-3">
              {GROUPS.map((group) => {
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
          );
          return (
            <section key={slot}>
              <div className="mb-2 flex items-baseline justify-between">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{t(`turn.slot.${slot}`)}</h3>
                {slot !== "free" && <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{used ? t("turn.state.used", "Used") : t("turn.state.ready", "Ready")}</span>}
              </div>
              <p className="mb-2 text-[11px] text-[var(--color-text-muted)]">{t(`turn.slot.${slot}.hint`)}</p>
              {picks && slot !== "free" ? (
                <div className="space-y-1.5">
                  {used ? <p className="text-[11px] font-semibold text-[var(--color-text-muted)]">{t(`turn.block.used.${slot}`)}</p> : picks[slot as "action" | "bonus" | "reaction"].length === 0 ? (
                    <p className="text-[11px] text-[var(--color-text-muted)]">{t("turn.suggest.none", "Nothing stands out right now. See all options below.")}</p>
                  ) : (
                    picks[slot as "action" | "bonus" | "reaction"].slice(0, 3).filter((pk, i) => i === 0 || pk.score >= 30).map((pk, i) => (
                      <div key={pk.option.key}>
                        {i === 1 && <div className="mb-1.5 mt-2 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("turn.alsoGood", "Also good")}</div>}
                        {row(pk.option, used, pk, i === 0)}
                      </div>
                    ))
                  )}
                  <button type="button" onClick={() => setSeeAll((s) => ({ ...s, [slot]: !s[slot] }))} className="flex w-full items-center justify-between pt-1 text-[11px] font-bold text-[var(--color-text-secondary)]">
                    <span>{t("turn.seeAll", { count: options.length }, "See all options ({count})")}</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${seeAll[slot] ? "rotate-180" : ""}`} />
                  </button>
                  {seeAll[slot] && fullList()}
                </div>
              ) : (
                fullList()
              )}
            </section>
          );
        })}

        {menu.features.length > 0 && (
          <section>
            <button type="button" onClick={() => setShowFeatures((v) => !v)} className="flex w-full items-center justify-between text-sm font-bold text-[var(--color-text-primary)]">
              <span>{t("turn.features", "Always on")} ({menu.features.length})</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showFeatures ? "rotate-180" : ""}`} />
            </button>
            <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{t("turn.features.hint", "Nothing to tap. These work on their own, or outside a fight.")}</p>
            {showFeatures && (
              <div className="mt-2 space-y-1.5">
                {menu.features.map((f) => {
                  const text = localSummary.get(f.name) || f.description;
                  return (
                    <div key={f.id} className="flex overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
                      <div className="min-w-0 flex-1 px-3 py-2">
                        <div className="text-sm font-bold text-[var(--color-text-primary)]">{f.name}</div>
                        {text && <div className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-secondary)] line-clamp-3"><RichInline text={text} /></div>}
                      </div>
                      {(f.description || text) && infoButton(f.name, f.description || text)}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </div>
      {info && (
        <BottomSheet isOpen onClose={() => setInfo(null)} title={info.title} className="!mb-4 !max-h-[86vh]">
          <div className="space-y-2 px-4 py-4">
            {info.meta && <div className="text-xs font-semibold text-[var(--color-text-secondary)]"><RichInline text={info.meta} /></div>}
            <div className="text-sm leading-relaxed text-[var(--color-text-primary)]"><RichText text={info.text} /></div>
          </div>
        </BottomSheet>
      )}
      {amountFor && (
        <BottomSheet isOpen onClose={() => setAmountFor(null)} title={amountFor.option.name} className="!mb-4">
          <div className="space-y-4 px-4 py-4">
            <p className="text-xs text-[var(--color-text-secondary)]">{t("turn.amount.hint", { max: amountFor.option.amount!.max }, "How much do you spend? You have {max} left.")}</p>
            <div className="flex items-center justify-center gap-4">
              <button type="button" aria-label="-1" onClick={() => setAmountFor((a) => a && { ...a, value: Math.max(1, a.value - 1) })} className="btn btn-secondary h-9 w-11 !px-0">−</button>
              <span className="min-w-[3ch] text-center text-2xl font-bold text-[var(--color-text-primary)]">{amountFor.value}</span>
              <button type="button" aria-label="+1" onClick={() => setAmountFor((a) => a && { ...a, value: Math.min(a.option.amount!.max, a.value + 1) })} className="btn btn-secondary h-9 w-11 !px-0">+</button>
              <button type="button" onClick={() => setAmountFor((a) => a && { ...a, value: Math.min(a.option.amount!.max, a.value + 5) })} className="btn btn-secondary h-9">+5</button>
            </div>
            <button type="button" onClick={() => { use(amountFor.option, amountFor.value); setAmountFor(null); }} className="btn btn-primary w-full">
              {t("turn.amount.use", { amount: amountFor.value }, "Spend {amount}")}
            </button>
          </div>
        </BottomSheet>
      )}
      {shaping && (
        <WildShapePicker
          character={character}
          onPick={(beast) => { use(shaping, undefined, beast); setShaping(null); }}
          onClose={() => setShaping(null)}
        />
      )}
      {preparing && (
        <PrepareSpellsSheet
          spells={preparableSpells(character)}
          prepared={character.preparedSpells || []}
          limit={getMaxPreparedSpells(character)}
          onChange={(preparedSpells) => onChange({ preparedSpells })}
          onClose={() => setPreparing(false)}
        />
      )}
    </BottomSheet>
  );
}

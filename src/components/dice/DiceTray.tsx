"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { XIcon as X } from "@/components/icons";
import { DIE_KINDS, dieValue, droppedIndex, groupText, groupTotal, type D20Mode, type DieKind, type RollGroup } from "@/lib/dice-roll";
import type { DiceEngine } from "./engine";

/** One die in a roll: a d100 is two physical dice (tens and ones). */
interface Slot {
  kind: DieKind;
  ids: number[];
}
interface Entry {
  group: RollGroup;
  mode: D20Mode;
  slots: Slot[];
}
/** Each group's total and die values, once the dice land. */
export type RollResult = { total: number; values: number[] }[];

/** A button shown once the dice land (Hit / Crit / Miss). */
export interface RollChoice {
  label: string;
  primary?: boolean;
  onPick: () => void;
}

export interface RollRequest {
  seq: number;
  title: string;
  groups: RollGroup[];
  choices?: RollChoice[];
  /** Called each time this roll lands (again after "Roll again"). */
  onDone?: (result: RollResult) => void;
}

const GLYPH: Record<DieKind, string> = {
  d4: "M12 3 21 19H3z",
  d6: "M4.5 4.5h15v15h-15z",
  d8: "M12 2.5 20 12l-8 9.5L4 12zM4 12h16",
  d10: "M12 2.5 20.5 10 12 21.5 3.5 10zM3.5 10 12 13l8.5-3M12 13v8.5",
  d12: "M12 2.5 21 9l-3.4 10.5H6.4L3 9zM12 7l4.3 3.1-1.6 5H9.3l-1.6-5z",
  d20: "M12 2.5 20.5 7.5v9L12 21.5 3.5 16.5v-9zM12 2.5 7 15h10z",
  d100: "M8 4 13 9 8 20 3 9zM16 4 21 9l-5 11-5-11",
};

const slotValue = (engine: DiceEngine, slot: Slot): number | null => {
  const faces = slot.ids.map((id) => engine.valueOf(id));
  return faces.some((f) => f === null) ? null : dieValue(slot.kind, faces as number[]);
};

export function DiceTray({ open, onClose, request }: { open: boolean; onClose: () => void; request: RollRequest | null }) {
  const { t } = useLanguage();
  const stageRef = useRef<HTMLDivElement>(null);
  const chipsRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<DiceEngine | null>(null);
  const ready = !!engine;
  const [title, setTitle] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [mode, setMode] = useState<D20Mode>("normal");
  const [tick, setTick] = useState(0);
  const [history, setHistory] = useState<{ key: number; title: string; text: string }[]>([]);
  const rollSeq = useRef(0);
  const logged = useRef(0);
  const handled = useRef(0);
  const pending = useRef<RollRequest | null>(null);
  const onDone = useRef<RollRequest["onDone"]>(undefined);
  const [choices, setChoices] = useState<RollChoice[]>([]);

  // "+ 3 DEX", "+ 3 proficiency", "+ 2 Rage".
  const sourceName = useCallback(
    (source: string) => {
      if (!source.startsWith("@")) return source;
      const key = source.slice(1);
      if (["str", "dex", "con", "int", "wis", "cha"].includes(key)) return key.toUpperCase();
      return t(`dice.src.${key}`, key);
    },
    [t],
  );

  // Load three.js and the physics only when the tray first opens.
  useEffect(() => {
    if (!open || engine) return;
    let cancelled = false;
    import("./engine").then(({ DiceEngine }) => {
      if (cancelled || !stageRef.current || !chipsRef.current) return;
      setEngine(new DiceEngine(stageRef.current, chipsRef.current, () => setTick((n) => n + 1)));
    });
    return () => {
      cancelled = true;
    };
  }, [open, engine]);
  useEffect(() => () => engine?.dispose(), [engine]);
  useEffect(() => {
    engine?.setActive(open);
  }, [open, engine]);

  // Dice colours follow the light/dark theme.
  useEffect(() => {
    if (!engine) return;
    const recolor = () => {
      const css = getComputedStyle(document.documentElement);
      engine.setColors(css.getPropertyValue("--color-surface").trim() || "#fff", css.getPropertyValue("--color-text-primary").trim() || "#111");
    };
    recolor();
    const mo = new MutationObserver(recolor);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => mo.disconnect();
  }, [engine]);

  const allIds = (list: Entry[]) => list.flatMap((e) => e.slots.flatMap((s) => s.ids));

  const makeEntry = useCallback((dice: DiceEngine, group: RollGroup, trayMode: D20Mode): Entry => {
    const d20Mode = group.mode && group.mode !== "normal" ? group.mode : trayMode;
    const twoD20 = group.d20Test && d20Mode !== "normal" && group.dice.length === 1 && group.dice[0] === "d20";
    const kinds: DieKind[] = twoD20 ? ["d20", "d20"] : group.dice;
    return {
      group,
      mode: twoD20 ? d20Mode : "normal",
      slots: kinds.map((kind) => ({ kind, ids: kind === "d100" ? [dice.add("pct"), dice.add("d10")] : [dice.add(kind)] })),
    };
  }, []);

  const start = useCallback(
    (newTitle: string, groups: RollGroup[], done?: RollRequest["onDone"], picks: RollChoice[] = []) => {
      if (!engine) return;
      onDone.current = done;
      setChoices(picks);
      engine.remove(allIds(entries));
      const list = groups.map((g) => makeEntry(engine, g, mode));
      rollSeq.current++;
      setTitle(newTitle);
      setEntries(list);
      engine.throw(allIds(list));
    },
    [engine, entries, makeEntry, mode],
  );

  // A roll asked for from the sheet.
  useEffect(() => {
    if (request && request.seq !== handled.current) pending.current = request;
    const next = pending.current;
    if (!ready || !next) return;
    handled.current = next.seq;
    pending.current = null;
    start(next.title, next.groups, next.onDone, next.choices);
  }, [request, ready, start]);

  const throwOne = (kind: DieKind) => {
    if (!engine) return;
    // A free throw starts its own roll unless the tray already holds free dice.
    const free = t("dice.free", "Dice");
    const keep = title === free ? entries : [];
    onDone.current = undefined;
    setChoices([]);
    if (title !== free) engine.remove(allIds(entries));
    const entry = makeEntry(engine, { label: kind, dice: [kind], mod: 0, d20Test: kind === "d20" }, mode);
    rollSeq.current++;
    setTitle(free);
    setEntries([...keep, entry]);
    engine.throw(allIds([entry]));
  };

  const rollAgain = () => {
    if (!entries.length) return;
    rollSeq.current++;
    engine?.throw(allIds(entries));
  };

  const clear = () => {
    onDone.current = undefined;
    setChoices([]);
    engine?.remove(allIds(entries));
    setEntries([]);
    setTitle("");
  };

  const onStageTap = (e: React.PointerEvent) => {
    if (!engine) return;
    const id = engine.pick(e.clientX, e.clientY);
    if (!id) return;
    const entry = entries.find((en) => en.slots.some((s) => s.ids.includes(id)));
    if (!entry) return;
    // Advantage pairs and d100 pairs are thrown together.
    const ids = entry.mode !== "normal" ? allIds([entry]) : entry.slots.find((s) => s.ids.includes(id))!.ids;
    rollSeq.current++;
    engine.throw(ids);
  };

  // Results, once every die has landed.
  // tick changes when a die lands, so the values are read again then.
  const results = useMemo(
    () =>
      engine && tick >= 0
        ? entries.map((e) => {
            const values = e.slots.map((s) => slotValue(engine, s));
            const done = values.every((v) => v !== null);
            return { entry: e, values: values as number[], done, total: done ? groupTotal(e.group, values as number[], e.mode) : null };
          })
        : [],
    [engine, entries, tick],
  );
  const allDone = results.length > 0 && results.every((r) => r.done);

  // Chips over the dice, and the history line.
  useEffect(() => {
    if (!engine) return;
    for (const r of results) {
      if (!r.done) continue;
      const drop = droppedIndex(r.entry.group, r.values, r.entry.mode);
      r.entry.slots.forEach((s, i) => {
        if (s.kind === "d100") {
          const tens = engine.valueOf(s.ids[0]) ?? 0;
          engine.label(s.ids[0], tens === 0 ? "00" : String(tens * 10));
          engine.label(s.ids[1], String(engine.valueOf(s.ids[1]) ?? ""));
        } else {
          engine.label(s.ids[0], String(r.values[i]), i === drop);
        }
      });
    }
    if (allDone && logged.current !== rollSeq.current) {
      logged.current = rollSeq.current;
      const text = results.map((r) => (results.length > 1 ? `${r.entry.group.label} ${r.total}` : String(r.total))).join(" · ");
      setHistory((h) => [{ key: rollSeq.current, title: title || results.map((r) => r.entry.group.label).join(", "), text }, ...h].slice(0, 8));
      onDone.current?.(results.map((r) => ({ total: r.total ?? 0, values: r.values })));
    }
  }, [engine, results, allDone, title]);

  const d20Note = (r: (typeof results)[number]) => {
    if (!r.done || !r.entry.group.d20Test) return null;
    const drop = droppedIndex(r.entry.group, r.values, r.entry.mode);
    const kept = r.values.filter((_, i) => i !== drop)[0];
    return kept === 20 ? t("dice.nat20", "Natural 20") : kept === 1 ? t("dice.nat1", "Natural 1") : null;
  };
  const single = results.length === 1 ? results[0] : null;

  // Before the dice land: "1d20 + 3 DEX + 3 proficiency". After: "14 + 3 DEX + 3 proficiency",
  // with the d20 that does not count (advantage, disadvantage) struck through.
  const breakdown = (r: (typeof results)[number]) => {
    if (!r.done) return <>{groupText(r.entry.group, sourceName)}</>;
    const drop = droppedIndex(r.entry.group, r.values, r.entry.mode);
    const signed = (n: number) => `${n > 0 ? "+" : "−"} ${Math.abs(n)}`;
    const parts = r.entry.group.parts?.length ? r.entry.group.parts : r.entry.group.mod ? [{ source: "@other", value: r.entry.group.mod }] : [];
    return (
      <>
        {r.values.map((v, i) => (
          <span key={i}>
            {i > 0 && (r.entry.mode !== "normal" ? " / " : " + ")}
            <span className={i === drop ? "line-through opacity-60" : "font-semibold text-[var(--color-text-primary)]"}>{v}</span>
          </span>
        ))}
        <span> ({groupText({ ...r.entry.group, mod: 0, parts: [] })})</span>
        {parts.filter((p) => p.value).map((p, i) => (
          <span key={`p${i}`}>
            {" "}
            {signed(p.value)} <span className="font-semibold text-[var(--color-text-primary)]">{sourceName(p.source)}</span>
          </span>
        ))}
      </>
    );
  };

  return (
    <>
      {open && <button type="button" aria-label={t("common.close", "Close")} className="fixed inset-0 z-[1000001] bg-black/20 md:hidden" onClick={onClose} />}
      <aside
        aria-label={t("dice.tray", "Dice tray")}
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[1000002] flex w-[min(420px,92vw)] flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl transition-transform duration-200 motion-reduce:transition-none ${open ? "translate-x-0" : "pointer-events-none translate-x-[104%]"}`}
        style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)", paddingRight: "env(safe-area-inset-right, 0px)" }}
      >
        <div className="flex items-center gap-2 px-4 pb-2 pt-3">
          <h2 className="flex-1 text-base font-bold text-[var(--color-text-primary)]">{t("dice.tray", "Dice tray")}</h2>
          <button type="button" onClick={onClose} aria-label={t("common.close", "Close")} className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-primary)]">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={stageRef}
          onPointerDown={onStageTap}
          className="relative mx-4 min-h-[200px] flex-1 cursor-pointer touch-manipulation overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)]"
        >
          {!entries.length && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-[var(--color-text-muted)]">
              {ready ? t("dice.empty", "Tap a die below to throw it. Tap a die in the tray to roll it again.") : t("dice.loading", "Getting the dice…")}
            </p>
          )}
          <div ref={chipsRef} className="pointer-events-none absolute inset-0" />
        </div>

        <div className="min-h-[64px] px-4 pt-3" aria-live="polite">
          {!results.length ? (
            <p className="text-sm text-[var(--color-text-muted)]">{t("dice.noRoll", "No roll yet")}</p>
          ) : single ? (
            <div className="flex items-end gap-3">
              <span className={`text-4xl font-extrabold leading-none tabular-nums ${single.done ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>{single.done ? single.total : "…"}</span>
              <span className="min-w-0 flex-1 pb-0.5 text-xs leading-snug text-[var(--color-text-muted)]">
                <b className="font-bold text-[var(--color-text-primary)]">{title || single.entry.group.label}</b>
                {d20Note(single) && <span className="font-bold text-[var(--color-text-primary)]"> · {d20Note(single)}</span>}
                <br />
                {breakdown(single)}
              </span>
            </div>
          ) : (
            <div className="space-y-1">
              {title && <p className="text-xs font-bold text-[var(--color-text-primary)]">{title}</p>}
              {results.map((r, i) => (
                <div key={i} className="flex items-baseline gap-3">
                  <span className={`w-12 text-2xl font-extrabold tabular-nums ${r.done ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}>{r.done ? r.total : "…"}</span>
                  <span className="min-w-0 flex-1 text-xs leading-snug text-[var(--color-text-muted)]">
                    <b className="font-bold text-[var(--color-text-primary)]">{r.entry.group.label}</b>
                    {d20Note(r) && <span className="font-bold text-[var(--color-text-primary)]"> · {d20Note(r)}</span>}
                    <br />
                    {breakdown(r)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {allDone && choices.length > 0 && (
          <div className="flex gap-2 px-4 pt-2">
            {choices.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => {
                  setChoices([]);
                  c.onPick();
                }}
                className={`btn flex-1 !py-2 text-sm ${c.primary ? "btn-primary" : "btn-secondary"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 px-4 pt-2" role="group" aria-label={t("dice.d20Mode", "d20 rolls")}>
          <span className="mr-1 text-[11px] font-bold text-[var(--color-text-muted)]">d20</span>
          {(["normal", "adv", "dis"] as const).map((m) => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)} className={`btn flex-1 !px-2 !py-1.5 text-xs ${mode === m ? "btn-primary" : "btn-secondary"}`}>
              {t(`dice.mode.${m}`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 px-4 pt-2">
          {DIE_KINDS.map((k) => (
            <button
              key={k}
              type="button"
              disabled={!ready}
              onClick={() => throwOne(k)}
              aria-label={t("dice.throw", { die: k }, "Throw a {die}")}
              className="flex flex-col items-center gap-0.5 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] py-2 text-xs font-bold text-[var(--color-text-primary)] hover:border-[var(--color-border-active)] disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" aria-hidden="true">
                <path d={GLYPH[k]} />
              </svg>
              {k}
            </button>
          ))}
        </div>

        <div className="flex gap-2 px-4 pb-3 pt-2">
          <button type="button" onClick={clear} disabled={!entries.length} className="btn btn-secondary flex-1 disabled:opacity-40">
            {t("dice.clear", "Clear")}
          </button>
          <button type="button" onClick={rollAgain} disabled={!entries.length} className="btn btn-primary flex-1 disabled:opacity-40">
            {t("dice.again", "Roll again")}
          </button>
        </div>

        {history.length > 0 && (
          <div className="max-h-[22vh] overflow-auto border-t border-[var(--color-border)] px-4 pb-3 pt-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">{t("dice.history", "Last rolls")}</p>
            <ol>
              {history.map((h) => (
                <li key={h.key} className="flex gap-2 py-1 text-[13px] tabular-nums">
                  <span className="min-w-0 flex-1 truncate text-[var(--color-text-muted)]">{h.title}</span>
                  <b className="font-extrabold text-[var(--color-text-primary)]">{h.text}</b>
                </li>
              ))}
            </ol>
          </div>
        )}
      </aside>
    </>
  );
}

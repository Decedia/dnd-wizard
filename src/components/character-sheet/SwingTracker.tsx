"use client";

import { RichInline } from "@/components/RichText";
import { useEffect, useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { rollAndClose, rollAttack, rollSummary } from "@/components/dice/roll-flow";
import { useDice } from "@/contexts/DiceContext";
import { critGroup, d20Group, damageGroup, groupFrom, type RollGroup } from "@/lib/dice-roll";
import type { Character } from "@/lib/storage";
import { critDamage, critExtraDice, isSwingOption, ON_HIT_WHEN, smiteChoices, smitePatch, swingPatch, swingResultPatch, swingsLeft, type SwingResult, type TurnMenu, type TurnOption } from "@/lib/turn";

interface SwingTrackerProps {
  character: Character;
  menu: TurnMenu;
  nameOf: (o: TurnOption) => string;
  /** Uses an option through the panel, so Undo works. */
  onUse: (o: TurnOption) => void;
  onChange: (patch: Partial<Character>) => void;
  /** A roll the tracker made and took, for the line under the turn chips. */
  onRolled?: (name: string, text: string) => void;
}

const RESULTS: SwingResult[] = ["hit", "crit", "miss"];
type Extra = NonNullable<NonNullable<Character["swings"]>[number]["extras"]>[number];

/** The Attack action swing by swing: Hit / Crit / Miss, damage, a smite after a hit, and the swings left. */
export function SwingTracker({ character, menu, nameOf, onUse, onChange, onRolled }: SwingTrackerProps) {
  const { t } = useLanguage();
  const dice = useDice();
  // Rolls land seconds after the tap; they patch the newest character, not the one at the tap.
  const latest = useRef(character);
  useEffect(() => {
    latest.current = character;
  }, [character]);
  const swings = character.swings || [];
  if (swings.length === 0) return null;
  const byKey = new Map(menu.options.map((o) => [o.key, o]));
  const left = swingsLeft(character, menu.attacksPerAction);
  const pending = swings.some((s) => s.result === "pending");
  const lastHit = [...swings].reverse().find((s) => s.result === "hit" || s.result === "crit");
  const onHit = lastHit ? menu.options.filter((o) => o.slot === "free" && o.when && ON_HIT_WHEN.has(o.when) && !o.blocked && !/^Divine Smite/.test(o.name)) : [];
  const weapons = menu.options.filter((o) => isSwingOption(o) && !o.blocked);

  const setSwing = (i: number, patch: Partial<NonNullable<Character["swings"]>[number]>) =>
    onChange({ swings: (latest.current.swings || []).map((x, j) => (j === i ? { ...x, ...patch } : x)) });

  /** Damage for swing `i` after a hit or crit: the weapon with its bonus sources, crit dice doubled, smite dice. */
  const damageGroups = (o: TurnOption | undefined, result: string, smite?: number, extras: Extra[] = []): RollGroup[] => {
    const label = result === "crit" ? t("dice.critDamage", "Crit damage") : t("dice.damage", "Damage");
    const base = o?.damageRoll ? damageGroup(label, o.damageRoll.dice, o.damageRoll.parts) : o?.damage ? groupFrom(label, result === "crit" ? critDamage(o.damage) : o.damage) : null;
    const extra = result === "crit" && o?.damage && o.tags?.includes("melee") ? critExtraDice(character, o.damage) : null;
    return [
      base && o?.damageRoll && result === "crit" ? critGroup(base) : base,
      extra ? groupFrom(extra.sources.join(", "), extra.dice) : null,
      smite ? groupFrom(t("dice.smite", "Smite"), `${Math.min(5, 1 + smite) * (result === "crit" ? 2 : 1)}d8`) : null,
      ...extras.map((x) => groupFrom(x.name, result === "crit" ? critDamage(x.dice) : x.dice)),
    ].filter((g): g is RollGroup => !!g);
  };

  /** Rolls damage, keeps the total on the swing and closes the tray. */
  const rollDamage = (i: number, name: string, groups: RollGroup[], add = false) => {
    if (!dice || !groups.length) return;
    rollAndClose(dice, name, groups, (res) => {
      const total = res.reduce((a, r) => a + r.total, 0);
      setSwing(i, { damage: (add ? latest.current.swings?.[i]?.damage || 0 : 0) + total });
      onRolled?.(name, rollSummary(groups, res));
    });
  };

  return (
    <section className="rounded-[var(--radius-md)] border-2 border-[var(--color-ink)] px-3 py-3">
      <div className="flex items-baseline justify-between">
        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">{t("swing.title", "Your attacks")}</h3>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
          {t("swing.count", { done: swings.length, total: menu.attacksPerAction }, "{done} of {total}")}
        </span>
      </div>
      <ol className="mt-2 space-y-2">
        {swings.map((s, i) => {
          const o = byKey.get(s.key);
          const name = o ? nameOf(o) : s.name;
          const hit = s.result === "hit" || s.result === "crit";
          const damage = o?.damage ? (s.result === "crit" ? critDamage(o.damage) : o.damage) : null;
          const extra = s.result === "crit" && o?.damage && o.tags?.includes("melee") ? critExtraDice(character, o.damage) : null;
          const smites = hit && s.smite === undefined && o?.tags?.includes("melee") ? smiteChoices(character, s.result === "crit") : [];
          return (
            <li key={i} className="rounded-[var(--radius-sm)] bg-[var(--color-bg)] px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-bold text-[var(--color-text-primary)]">{t("swing.n", { n: i + 1, name }, "{n}. {name}")}</span>
                {s.result !== "pending" && <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)]">{t(`swing.result.${s.result}`)}</span>}
              </div>
              {s.result === "pending" ? (
                <>
                  <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{t("swing.roll", "Roll to hit, then tap what happened.")}</p>
                  {dice && o?.toHit !== undefined && (
                    <button
                      type="button"
                      onClick={() =>
                        rollAttack(dice, { hit: t("swing.result.hit", "Hit"), crit: t("swing.result.crit", "Crit"), miss: t("swing.result.miss", "Miss") }, {
                          name,
                          toHit: d20Group(t("dice.toHit", "To hit"), o.toHit!, o.toHitParts),
                          damage: damageGroups(o, "hit"),
                          critExtra: damageGroups(o, "crit").slice(1),
                          onResult: (r) => onChange(swingResultPatch(latest.current, i, r)),
                          onDamage: (gs, res) => {
                            setSwing(i, { damage: res.reduce((a, x) => a + x.total, 0) });
                            onRolled?.(name, rollSummary(gs, res));
                          },
                        })
                      }
                      className="btn btn-primary mt-1.5 w-full !py-1.5 text-xs"
                    >
                      {t("dice.rollToHit", { bonus: `${o.toHit >= 0 ? "+" : ""}${o.toHit}` }, "Roll to hit (d20 {bonus})")}
                    </button>
                  )}
                  <div className="mt-1.5 flex gap-2">
                    {RESULTS.map((r) => (
                      <button key={r} type="button" onClick={() => onChange(swingResultPatch(character, i, r))} className="btn btn-secondary flex-1">
                        {t(`swing.result.${r}`)}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  {hit && s.damage !== undefined && (
                    <p className="mt-0.5 flex items-center justify-between gap-2 text-xs font-semibold text-[var(--color-text-primary)]">
                      <span>{t("swing.damageDone", { n: s.damage }, "{n} damage")}</span>
                      {dice && (
                        <button type="button" onClick={() => rollDamage(i, name, damageGroups(o, s.result, s.smite, s.extras))} className="font-bold underline">
                          {t("dice.again", "Roll again")}
                        </button>
                      )}
                    </p>
                  )}
                  {hit && s.damage === undefined && damage && (
                    <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                      <RichInline text={t("swing.damage", { damage }, "Roll {damage}.")} />
                      {s.result === "crit" && <span> {t("swing.critHint", "A crit doubles the dice, not the bonus.")}</span>}
                    </p>
                  )}
                  {hit && s.damage === undefined && extra && (
                    <p className="mt-0.5 text-xs font-semibold text-[var(--color-text-primary)]">
                      <RichInline text={t("swing.critExtra", { dice: extra.dice, names: extra.sources.join(", ") }, "{names}: roll {dice} more.")} />
                    </p>
                  )}
                  {dice && hit && s.damage === undefined && damageGroups(o, s.result, s.smite, s.extras).length > 0 && (
                    <button type="button" onClick={() => rollDamage(i, name, damageGroups(o, s.result, s.smite, s.extras))} className="btn btn-primary mt-1.5 w-full !py-1.5 text-xs">
                      {t("dice.rollDamage", "Roll damage")}
                    </button>
                  )}
                  {hit && s.damage === undefined && (s.extras || []).map((x, k) => (
                    <p key={k} className="mt-0.5 text-xs font-semibold text-[var(--color-text-primary)]">
                      <RichInline text={t("swing.extra", { name: x.name, dice: s.result === "crit" ? critDamage(x.dice) : x.dice }, "{name}: add {dice}.")} />
                    </p>
                  ))}
                  {s.result === "miss" && <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">{t("swing.missHint", "No damage. On to the next one.")}</p>}
                  {!!s.smite && <p className="mt-0.5 text-xs font-semibold text-[var(--color-text-primary)]"><RichInline text={t("swing.smited", { level: s.smite, dice: `${Math.min(5, 1 + s.smite) * (s.result === "crit" ? 2 : 1)}d8` }, "Smite with a level {level} slot: add {dice} radiant damage.")} /></p>}
                  {smites.length > 0 && (
                    <div className="mt-2">
                      <p className="text-[11px] font-semibold text-[var(--color-text-primary)]">{t("swing.smiteAsk", "Smite? Spend a spell slot for extra radiant damage.")}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {smites.map((c) => (
                          <button
                            key={c.level}
                            type="button"
                            onClick={() => {
                              onChange(smitePatch(character, i, c.level));
                              // Damage already rolled: roll the smite dice on top of it.
                              if (s.damage !== undefined) rollDamage(i, name, [groupFrom(t("dice.smite", "Smite"), c.dice)].filter((g): g is RollGroup => !!g), true);
                            }}
                            className="btn btn-secondary !px-3 !py-1.5 text-xs"
                          >
                            {t("swing.smiteLevel", { level: c.level, dice: c.dice }, "Level {level} · {dice}")}
                          </button>
                        ))}
                        <button type="button" onClick={() => onChange({ swings: swings.map((x, j) => (j === i ? { ...x, smite: 0 } : x)) })} className="btn btn-secondary !px-3 !py-1.5 text-xs">
                          {t("swing.noSmite", "No smite")}
                        </button>
                      </div>
                      <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">{t("swing.smiteUndead", "+1d8 more against undead or a fiend.")}</p>
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ol>

      {onHit.length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] font-semibold text-[var(--color-text-muted)]">{t("swing.onHit", "Also when you hit:")}</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {onHit.map((o) => (
              <button key={o.key} type="button" onClick={() => onUse(o)} className="btn btn-secondary !px-3 !py-1.5 text-xs">
                {nameOf(o)}{o.featureDice ? ` +${o.featureDice}` : ""}{o.cost ? ` · ${t(o.cost.key, o.cost.values)}` : ""}
              </button>
            ))}
          </div>
          {onHit.some((o) => o.condition) && (
            <ul className="mt-1 space-y-0.5">
              {onHit.filter((o) => o.condition).map((o) => (
                <li key={o.key} className="text-[11px] text-[var(--color-text-secondary)]"><span className="font-semibold text-[var(--color-text-primary)]">{nameOf(o)}:</span> {t(`turn.cond.${o.condition}`)}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!pending && (
        left > 0 ? (
          <div className="mt-3">
            <p className="text-xs font-semibold text-[var(--color-text-primary)]">{t("swing.next", { count: left }, "Next swing ({count} left). Attack with:")}</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {weapons.map((o) => (
                <button key={o.key} type="button" onClick={() => onChange(swingPatch(character, o))} className="btn btn-secondary !px-3 !py-1.5 text-xs">
                  {nameOf(o)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-xs font-semibold text-[var(--color-text-secondary)]">{t("swing.done", "All your attacks are done. You can still move, and use a bonus action if you have one.")}</p>
        )
      )}
    </section>
  );
}

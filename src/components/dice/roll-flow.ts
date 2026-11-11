import { critGroup, type RollGroup } from "@/lib/dice-roll";
import type { RollOptions } from "@/contexts/DiceContext";
import type { RollResult } from "./DiceTray";

/** The parts of the dice tray the flows need (see DiceContext). */
interface Tray {
  roll: (title: string, groups: RollGroup[], onDone?: (result: RollResult) => void, options?: RollOptions) => void;
  close: () => void;
}

export type HitResult = "hit" | "crit" | "miss";

/** "Damage fire 23 · Healing 9": each group's label and total. */
export const rollSummary = (groups: RollGroup[], result: RollResult) => groups.map((g, i) => `${g.label} ${result[i]?.total ?? 0}`).join(" · ");

/**
 * A roll nobody has to rule on (damage from a save spell, healing on yourself,
 * a feature die): the tray shows the result, then closes by itself.
 */
export function rollAndClose(tray: Tray, name: string, groups: RollGroup[], onDone: (result: RollResult) => void) {
  let done = false;
  tray.roll(
    name,
    groups,
    (result) => {
      // "Roll again" in the tray lands again; the result is only taken once.
      if (done) return;
      done = true;
      onDone(result);
    },
    { autoClose: true },
  );
}

/**
 * An attack: the d20 first, then the DM says hit or miss. The tray offers
 * Hit / Crit / Miss; on a hit the damage rolls (a crit doubles the dice) and the
 * tray closes by itself, on a miss it closes at once.
 */
export function rollAttack(
  tray: Tray,
  labels: Record<HitResult, string>,
  { name, toHit, damage, critExtra = [], onResult, onDamage }: {
    name: string;
    toHit: RollGroup;
    damage: RollGroup[];
    critExtra?: RollGroup[];
    onResult: (result: HitResult) => void;
    onDamage?: (groups: RollGroup[], result: RollResult) => void;
  },
) {
  const pick = (result: HitResult) => () => {
    onResult(result);
    const groups = result === "crit" ? [...damage.map((g) => critGroup(g)), ...critExtra] : result === "hit" ? damage : [];
    if (!groups.length) {
      tray.close();
      return;
    }
    rollAndClose(tray, name, groups, (res) => onDamage?.(groups, res));
  };
  tray.roll(name, [toHit], undefined, {
    choices: [
      { label: labels.hit, primary: true, onPick: pick("hit") },
      { label: labels.crit, onPick: pick("crit") },
      { label: labels.miss, onPick: pick("miss") },
    ],
  });
}

/**
 * Healing that could go to someone else: the dice land first, then the tray asks
 * who gets it. Healing only you can get (Second Wind) is applied straight away.
 */
export function rollHealing(
  tray: Tray,
  labels: { me: string; other: string },
  { name, group, selfOnly, onMe, onOther }: { name: string; group: RollGroup; selfOnly?: boolean; onMe: (total: number) => void; onOther: (total: number) => void },
) {
  if (selfOnly) {
    rollAndClose(tray, name, [group], (res) => onMe(Math.max(0, res[0]?.total ?? 0)));
    return;
  }
  let total = 0;
  tray.roll(
    name,
    [group],
    (res) => {
      total = Math.max(0, res[0]?.total ?? 0);
    },
    {
      choices: [
        { label: labels.me, primary: true, onPick: () => { onMe(total); tray.close(); } },
        { label: labels.other, onPick: () => { onOther(total); tray.close(); } },
      ],
    },
  );
}

/**
 * Rolls a set of groups the way the table would: a to-hit roll waits for Hit / Crit / Miss
 * and then rolls the damage; healing asks who gets it; anything else rolls and closes.
 */
export function rollGroups(
  tray: Tray,
  labels: Record<HitResult, string> & { me: string; other: string; heal: string },
  name: string,
  groups: RollGroup[],
  onHealMe?: (total: number) => void,
) {
  const toHit = groups.find((g) => g.d20Test);
  if (toHit) {
    rollAttack(tray, labels, { name, toHit, damage: groups.filter((g) => !g.d20Test), onResult: () => {} });
    return;
  }
  const heal = groups.find((g) => g.label === labels.heal);
  if (heal && onHealMe) {
    rollHealing(tray, labels, { name, group: heal, onMe: onHealMe, onOther: () => {} });
    return;
  }
  rollAndClose(tray, name, groups, () => {});
}

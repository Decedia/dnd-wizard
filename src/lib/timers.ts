import type { Character } from "@/lib/storage";
import { BUFF_DEFINITIONS, parseDurationToTurns, type ActiveBuff } from "@/lib/spellEffects";

/**
 * Everything with a duration (spells, Rage, Wild Shape, Channel Divinity...)
 * is one row in `character.activeBuffs`, counted in rounds. End turn ticks
 * every row down by one (`advanceTurn`); a row at 0 ends.
 * A row whose id is a BUFF_DEFINITIONS id also applies that buff's effects (AC, speed...).
 */

const MINUTE = 10;
const HOUR = 600;

type Rounds = number | ((c: Character) => number);

/** How long a feature lasts, from the class and subclass text. Features not listed have no timer. */
const FEATURE_DURATIONS: [RegExp, Rounds][] = [
  [/^Rage$/, MINUTE],
  [/^Bladesong/, MINUTE],
  [/^Wild Shape/, (c) => Math.max(1, Math.floor((c.level || 2) / 2)) * HOUR],
  [/^Starry Form/, 10 * MINUTE],
  [/^Symbiotic Entity/, 10 * MINUTE],
  [/^Summon Wildfire Spirit/, HOUR],
  [/^Spirit Totem/, MINUTE],
  [/^Channel Divinity: (Vow of Enmity|Sacred Weapon|Twilight Sanctuary|Conquering Presence|Abjure Enemy|Invoke Duplicity)/, MINUTE],
  [/^Channel Divinity: (Emissary of Peace|Peerless Athlete)/, 10 * MINUTE],
  [/^Arms of the Astral Self/, 10 * MINUTE],
  [/^(Holy Nimbus|Elder Champion)/, MINUTE],
  [/^Avenging Angel/, (c) => (c.ruleset === "2024" ? 10 * MINUTE : HOUR)],
  [/^Giant's Might/, MINUTE],
  [/^Form of Dread/, MINUTE],
  [/^Hexblade's Curse/, MINUTE],
  [/^Draconic Presence/, MINUTE],
  [/^Dark Delirium/, MINUTE],
  [/^Steps of Night/, MINUTE],
  [/^Emboldening Bond/, 10 * MINUTE],
  [/^Empty Body/, MINUTE],
  [/^Eldritch Cannon/, HOUR],
  // 2024 Player's Handbook subclasses.
  [/^(Vow of Enmity|Invoke Duplicity|Mantle of Majesty|Unbreakable Majesty|Trance of Order)/, MINUTE],
  [/^Peerless Athlete/, HOUR],
  [/^(Living Legend|Wrath of the Sea|Revelation in Flesh)/, 10 * MINUTE],
];

export const RAGE_TIMER = "feature:rage";
export const WILD_SHAPE_TIMER = "feature:wild-shape";

/** Rounds a feature lasts for this character, or null when it has no timer. */
export function featureRounds(character: Character, featureName: string): number | null {
  const hit = FEATURE_DURATIONS.find(([re]) => re.test(featureName));
  if (!hit) return null;
  return typeof hit[1] === "function" ? hit[1](character) : hit[1];
}

/** The timer id of a feature. Rage and Wild Shape have fixed ids because ending them changes other state. */
export function featureTimerId(featureName: string): string {
  if (/^Rage$/.test(featureName)) return RAGE_TIMER;
  if (/^Wild Shape/.test(featureName)) return WILD_SHAPE_TIMER;
  return `feature:${featureName.toLowerCase()}`;
}

/**
 * Rounds a spell lasts, from its duration text. Instant spells, "1 round"
 * spells (they end before the next turn matters) and "until dispelled" get none.
 */
export function spellRounds(duration: string | undefined, concentration: boolean): number | null {
  const rounds = duration ? parseDurationToTurns(duration) : null;
  if (rounds === null) return null;
  if (rounds <= 1 && !concentration) return null;
  return rounds;
}

/** The timer id of a spell: its buff id when it has one (so its effects apply), else its name. */
export function spellTimerId(spellName: string): string {
  const name = spellName.toLowerCase();
  const buff = Object.values(BUFF_DEFINITIONS).find((b) => b.id === name || b.name.toLowerCase() === name);
  return buff ? buff.id : `spell:${name}`;
}

/**
 * Starts a timer (or restarts it). Starting a concentration spell ends the
 * one the character was concentrating on, as the rules say.
 */
export function startTimer(buffs: ActiveBuff[], timer: ActiveBuff): ActiveBuff[] {
  return [
    ...buffs.filter((b) => b.spellId !== timer.spellId && !(timer.concentration && b.concentration)),
    timer,
  ];
}

/** The spell the character is concentrating on, from the timers. */
export function concentrationTimer(character: Pick<Character, "activeBuffs">): ActiveBuff | null {
  return (character.activeBuffs || []).find((b) => b.concentration) || null;
}

/** State tied to a timer that just ran out: rage stops, the beast form ends. */
export function expiredTimerPatch(character: Character, before: ActiveBuff[], after: ActiveBuff[]): Partial<Character> {
  const gone = (id: string) => before.some((b) => b.spellId === id) && !after.some((b) => b.spellId === id);
  const patch: Partial<Character> = {};
  if (gone(RAGE_TIMER)) patch.activeStates = (character.activeStates || []).filter((s) => s !== "raging");
  if (gone(WILD_SHAPE_TIMER) && character.wildShape) patch.wildShape = undefined;
  return patch;
}

/** Removes a timer by hand ("End"), with the state tied to it. */
export function endTimerPatch(character: Character, spellId: string): Partial<Character> {
  const before = character.activeBuffs || [];
  const after = before.filter((b) => b.spellId !== spellId);
  return { activeBuffs: after, ...expiredTimerPatch(character, before, after) };
}

/** Rounds as a unit to show: up to 10 rounds, then minutes, then hours (1 round = 6 seconds). Locale keys `timer.left.*` and `timer.span.*`. */
export function roundsText(rounds: number): { unit: "rounds" | "minutes" | "hours"; n: number } {
  if (rounds <= MINUTE) return { unit: "rounds", n: rounds };
  if (rounds < HOUR) return { unit: "minutes", n: Math.ceil(rounds / MINUTE) };
  return { unit: "hours", n: Math.ceil(rounds / HOUR) };
}

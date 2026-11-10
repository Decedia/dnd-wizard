// The turn panel's data: what a character can do with its action, bonus action
// and reaction right now, and the patches that start a turn, use an option and
// end a turn. Pure functions, so the panel only renders.
import type { Character } from "@/lib/storage";
import { getModifier, getProficiencyBonus, isPreparationCaster } from "@/lib/storage";
import { getWeaponAttackDetails } from "@/lib/weapon-attacks";
import { equipRow, heldInHands, unequipRow, type Hand, type InventoryRow } from "@/lib/inventory";
import { getFreeCastSpells, getGrantedSpellNames } from "@/lib/granted-spells";
import { advanceTurn, parseDurationToTurns } from "@/lib/spellEffects";

export type TurnSlot = "action" | "bonus" | "reaction";
export type TurnGroup = "attack" | "spell" | "basic";
/** Why an option cannot be used; the panel turns it into a sentence. */
export type TurnBlock = "noSlot";

export interface TurnOption {
  key: string;
  slot: TurnSlot;
  group: TurnGroup;
  /** Display name, or a locale key when `nameKey` is set (basic actions). */
  name: string;
  nameKey?: string;
  /** One line of rules text; a locale key for basic actions. */
  summary: string;
  summaryKey?: string;
  /** The full rules text for the info sheet, when there is more than the one line. */
  detail?: string;
  /** Numbers for an attack or a spell, e.g. "+5 to hit" and "1d8 + 3 slashing damage". */
  toHit?: number;
  damage?: string;
  saveDc?: number;
  /** What using it spends, as locale key + values. */
  cost?: { key: string; values: Record<string, string | number> };
  concentration?: boolean;
  blocked?: TurnBlock;
  /** Fields to write when the option is used (the slot flag is added by `optionPatch`). */
  spend: Partial<Character>;
}

export interface TurnMenu {
  options: TurnOption[];
  /** The character's features, to read; see `featureList`. */
  features: { id: string; name: string; description: string }[];
  attacksPerAction: number;
  speed: number;
}

type SrdSpell = { name: string; description?: string | string[]; level?: number; castingTime?: string; casting_time?: string; duration?: string; concentration?: boolean; effectSummary?: string; summary?: string; damage?: any; saveType?: string | null };

const SLOT_FLAG: Record<TurnSlot, "actionUsed" | "bonusActionUsed" | "reactionUsed"> = {
  action: "actionUsed",
  bonus: "bonusActionUsed",
  reaction: "reactionUsed",
};

// Things every character can do. Names and one-line rules live in the locale files.
const BASIC_ACTIONS: { id: string; slot: TurnSlot }[] = [
  { id: "dash", slot: "action" },
  { id: "disengage", slot: "action" },
  { id: "dodge", slot: "action" },
  { id: "help", slot: "action" },
  { id: "hide", slot: "action" },
  { id: "grapple", slot: "action" },
  { id: "shove", slot: "action" },
  { id: "ready", slot: "action" },
  { id: "useObject", slot: "action" },
  { id: "opportunityAttack", slot: "reaction" },
];

const signed = (n: number) => (n >= 0 ? `+ ${n}` : `- ${Math.abs(n)}`);

export function slotOfCastingTime(castingTime: string | undefined): TurnSlot | null {
  const text = (castingTime || "").toLowerCase();
  if (/^1 bonus action/.test(text)) return "bonus";
  if (/^1 reaction/.test(text)) return "reaction";
  if (/^1 action/.test(text)) return "action";
  return null; // a minute or longer: not something to start mid-fight
}

export function attacksPerAction(character: Pick<Character, "class" | "level" | "features">): number {
  const hasExtra = (character.features || []).some((f) => /^Extra Attack/i.test(f.name));
  if (!hasExtra) return 1;
  if (character.class === "Fighter") return character.level >= 20 ? 4 : character.level >= 11 ? 3 : 2;
  return 2;
}

/** The lowest spell slot of at least `level` that still has a use left. */
export function lowestOpenSlot(character: Pick<Character, "spellSlots" | "spellSlotsExpended">, level: number): number | null {
  for (let l = level; l <= 9; l++) {
    const total = character.spellSlots?.[l] ?? 0;
    if (total - (character.spellSlotsExpended?.[l] ?? 0) > 0) return l;
  }
  return null;
}

const hasProp = (row: InventoryRow, prop: string) => (row.properties || []).some((p) => p.toLowerCase() === prop);

function weaponDetail(weapon: InventoryRow): string {
  const text = weapon.description && !weapon.description.trimStart().startsWith("{") ? weapon.description : "";
  const props = (weapon.properties || []).join(", ");
  return [text, props].filter(Boolean).join("\n\n");
}

/**
 * Two-weapon fighting: with a light melee weapon in each hand, the off-hand
 * weapon attacks once as a bonus action, after an attack with the other one.
 * Its damage gets no ability bonus (a penalty still counts) unless the
 * character has the Two-Weapon Fighting style. Dual Wielder drops "light".
 */
function offHandAttack(character: Character): TurnOption | null {
  const { main, off } = heldInHands(character.inventory || []);
  if (!main || !off || off.itemType !== "weapon" || main.category === "ranged" || off.category === "ranged") return null;
  const names = (character.features || []).map((f) => f.name.toLowerCase());
  const dualWielder = names.some((n) => n === "dual wielder");
  if (!dualWielder && !(hasProp(main, "light") && hasProp(off, "light"))) return null;
  const attack = (character.attacks || []).find((a) => a.id === off.id);
  const details = attack && getWeaponAttackDetails(character, attack, character.rageDamage || 0);
  if (!details) return null;
  const style = names.some((n) => n.includes("two-weapon fighting")) || JSON.stringify(character.featureSelections || {}).includes("Two-Weapon Fighting");
  const bonus = style ? details.damageBonus : Math.min(0, details.damageBonus);
  return {
    key: `offhand:${off.id}`,
    slot: "bonus",
    group: "attack",
    name: off.name,
    summary: "",
    summaryKey: "turn.offhand.hint",
    toHit: details.attackBonus,
    damage: `${details.damageDice} ${signed(bonus)} ${details.damageType} damage`.replace(" + 0 ", " "),
    detail: weaponDetail(off),
    spend: {},
  };
}

function attackOptions(character: Character): TurnOption[] {
  const out: TurnOption[] = [];
  const prof = getProficiencyBonus(character.level);
  for (const attack of character.attacks || []) {
    if (attack.source === "grapple" || attack.source === "shove") continue;
    const details = attack.source === "weapon" ? getWeaponAttackDetails(character, attack, character.rageDamage || 0) : null;
    if (attack.source === "weapon" && !details) continue;
    out.push({
      key: `attack:${attack.id}`,
      slot: "action",
      group: "attack",
      name: attack.name,
      summary: details ? "" : attack.description || "",
      toHit: details ? details.attackBonus : attack.attackBonus,
      damage: details && details.damageDice ? `${details.damageDice} ${signed(details.damageBonus)} ${details.damageType} damage`.replace(" + 0 ", " ") : attack.damageType ? `${attack.damageType} damage` : undefined,
      detail: details ? weaponDetail(details.weapon) : attack.description || undefined,
      spend: {},
    });
  }
  const offHand = offHandAttack(character);
  if (offHand) out.push(offHand);
  const str = getModifier(character.str);
  out.push({
    key: "attack:unarmed",
    slot: "action",
    group: "attack",
    name: "",
    nameKey: "turn.unarmed",
    summary: "",
    toHit: str + prof,
    damage: `${Math.max(0, 1 + str)} bludgeoning damage`,
    spend: {},
  });
  return out;
}

function spellOptions(character: Character, srdSpells: SrdSpell[]): TurnOption[] {
  const out: TurnOption[] = [];
  const byName = new Map(srdSpells.map((s) => [s.name.toLowerCase(), s]));
  const granted = new Set(getGrantedSpellNames(character).map((n) => n.toLowerCase()));
  const prepares = isPreparationCaster(character);
  const prepared = new Set(character.preparedSpells || []);
  const freeUsed = new Set(character.freeCastsUsed || []);
  const freeCasts = new Set(getFreeCastSpells(character).map((c) => c.name.toLowerCase()));
  const seen = new Set<string>();
  const known = [
    ...(character.spells || []),
    ...(character.cantrips || []).map((c) => ({ id: c.id, name: c.name, level: 0, srdSpellName: c.name })),
  ];
  for (const spell of known) {
    const lookup = (spell.srdSpellName || spell.name).toLowerCase();
    if (seen.has(lookup)) continue;
    seen.add(lookup);
    const srd = byName.get(lookup);
    const slot = slotOfCastingTime(srd?.castingTime || srd?.casting_time);
    if (!slot) continue;
    const level = spell.level ?? srd?.level ?? 0;
    const free = freeCasts.has(lookup);
    if (level > 0 && prepares && !prepared.has(spell.id) && !granted.has(lookup) && !free) continue;

    const option: TurnOption = {
      key: `spell:${spell.id}`,
      slot,
      group: "spell",
      name: spell.name,
      summary: srd?.effectSummary || srd?.summary || "",
      detail: ("description" in spell && typeof spell.description === "string" && spell.description) || (Array.isArray(srd?.description) ? srd!.description.join("\n\n") : srd?.description) || undefined,
      concentration: !!srd?.concentration,
      saveDc: srd?.saveType ? character.spellSaveDc || undefined : undefined,
      spend: { spellsUsedThisTurn: [...(character.spellsUsedThisTurn || []).filter((id) => id !== spell.id), spell.id] },
    };
    if (level > 0) {
      if (free && !freeUsed.has(lookup)) {
        option.cost = { key: "turn.cost.freeCast", values: {} };
        option.spend.freeCastsUsed = [...freeUsed, lookup];
      } else {
        const open = lowestOpenSlot(character, level);
        if (open === null) {
          option.blocked = "noSlot";
        } else {
          option.cost = { key: "turn.cost.slot", values: { level: open } };
          option.spend.spellSlotsExpended = { ...(character.spellSlotsExpended || {}), [open]: (character.spellSlotsExpended?.[open] ?? 0) + 1 };
        }
      }
    }
    out.push(option);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// Rows that only say "you get a subclass feature here" or are handled elsewhere on the sheet.
const NOT_A_TURN_FEATURE = /feature$|^Ability Score Improvement|^Spellcasting|^Pact Magic|^Extra Attack|^Proficienc|^Languages?$|^Hit Points/i;

/**
 * Class, subclass and race features, as a reading list. They are not given a
 * slot or a cost here: the combat rules data (src/data/engine) has wrong
 * entries (Divine Sense as a reaction, Rage that needs you to be raging), so
 * showing its slots would teach wrong rules. A checked table replaces this.
 */
function featureList(character: Character): TurnMenu["features"] {
  const seen = new Set<string>();
  return (character.features || [])
    .filter((f) => !!f.name?.trim() && !NOT_A_TURN_FEATURE.test(f.name) && !seen.has(f.name) && !!seen.add(f.name))
    .map((f) => ({ id: f.id, name: f.name, description: f.description || "" }));
}

export function buildTurnMenu(character: Character, srdSpells: SrdSpell[]): TurnMenu {
  const basics: TurnOption[] = BASIC_ACTIONS.map((b) => ({
    key: `basic:${b.id}`,
    slot: b.slot,
    group: "basic",
    name: "",
    nameKey: `turn.basic.${b.id}`,
    summary: "",
    summaryKey: `turn.basic.${b.id}.hint`,
    spend: {},
  }));
  return {
    options: [...attackOptions(character), ...spellOptions(character, srdSpells), ...basics],
    features: featureList(character),
    attacksPerAction: attacksPerAction(character),
    speed: character.speed || 30,
  };
}

export function isSlotUsed(character: Pick<Character, "actionUsed" | "bonusActionUsed" | "reactionUsed">, slot: TurnSlot): boolean {
  return !!character[SLOT_FLAG[slot]];
}

/** Using an option spends its slot and whatever it costs. */
export function optionPatch(option: TurnOption): Partial<Character> {
  return { ...option.spend, [SLOT_FLAG[option.slot]]: true };
}

/** A new turn: action, bonus action, movement and reaction all come back. */
export function startTurnPatch(character: Pick<Character, "turnRound">): Partial<Character> {
  return { turnActive: true, turnRound: (character.turnRound || 0) + 1, actionUsed: false, bonusActionUsed: false, reactionUsed: false, moveUsed: false, objectInteractionUsed: false };
}

/**
 * End of turn: one-turn marks clear and timed buffs tick down. The reaction
 * stays as it is, because it is used between turns and only returns when the
 * next turn starts.
 */
export function endTurnPatch(character: Character, srdSpells: SrdSpell[]): Partial<Character> {
  const kept: string[] = [];
  for (const spellId of character.spellsUsedThisTurn || []) {
    const spell = (character.spells || []).find((s) => s.id === spellId);
    if (!spell) continue;
    const srd = spell.srdSpellName ? srdSpells.find((s) => s.name === spell.srdSpellName) : undefined;
    const turns = srd?.duration ? parseDurationToTurns(srd.duration) : null;
    if (turns !== null && turns > 1) kept.push(spellId);
  }
  return { turnActive: false, actionUsed: false, bonusActionUsed: false, moveUsed: false, objectInteractionUsed: false, spellsUsedThisTurn: kept, featuresUsedThisTurn: [], activeBuffs: advanceTurn(character.activeBuffs || []) };
}

/** The fight is over: the round counter starts again. */
export function endEncounterPatch(): Partial<Character> {
  return { turnActive: false, turnRound: 0, actionUsed: false, bonusActionUsed: false, reactionUsed: false, moveUsed: false, objectInteractionUsed: false };
}

// ---------------------------------------------------------------------------
// Changing what is in the hands, at the rulebook's cost

export interface HandChangeCost {
  /** The one free object interaction of the turn is spent on this. */
  interaction: boolean;
  /** It also takes the action (a second draw or stow, or a shield). */
  action: boolean;
  /** Not possible this turn: it would need an action that is gone, or two of them. */
  blocked: boolean;
}

const FREE: HandChangeCost = { interaction: false, action: false, blocked: false };
const isWeapon = (r: InventoryRow) => r.itemType === "weapon";
const isShieldRow = (r: InventoryRow) => r.itemType === "armor" && r.armorType === "shield";

/**
 * What a change of held items costs during the character's turn.
 * - Drawing or stowing one weapon is the turn's free object interaction.
 * - Each further draw or stow takes the action (Use an Object).
 * - Putting on or taking off a shield takes the action.
 * - Dropping a weapon is free, and so is changing grip on one already held.
 * Outside a turn nothing is charged.
 */
export function handChangeCost(
  character: Pick<Character, "turnActive" | "actionUsed" | "objectInteractionUsed">,
  before: InventoryRow[],
  after: InventoryRow[],
  droppedIds: string[] = [],
): HandChangeCost {
  if (!character.turnActive) return FREE;
  const was = new Map(before.map((r) => [r.id, !!r.equipped]));
  const now = new Map(after.map((r) => [r.id, !!r.equipped]));
  let interactions = 0;
  let shields = 0;
  for (const row of after) {
    const changed = was.get(row.id) !== now.get(row.id);
    if (!changed) continue;
    if (isShieldRow(row)) shields++;
    else if (isWeapon(row) && !(was.get(row.id) && droppedIds.includes(row.id))) interactions++;
  }
  if (interactions === 0 && shields === 0) return FREE;
  const free = interactions > 0 && !character.objectInteractionUsed;
  const actions = interactions - (free ? 1 : 0) + shields;
  return { interaction: free, action: actions > 0, blocked: actions > 1 || (actions === 1 && !!character.actionUsed) };
}

/**
 * Puts `id` in a hand (or empties the hand when `id` is null) and charges the
 * turn for it. `drop` lets go of the weapon being replaced instead of stowing
 * it. Returns null patch when the turn cannot pay.
 */
export function changeHands(
  character: Character,
  id: string | null,
  hand: Hand,
  drop = false,
): { patch: Partial<Character> | null; cost: HandChangeCost; removed: string[] } {
  const before = character.inventory || [];
  let after = before;
  if (id) {
    after = equipRow(before, id, hand).inventory;
  } else {
    const held = heldInHands(before);
    const target = hand === "off" ? held.off : held.main;
    if (target) after = unequipRow(before, target.id);
  }
  const removedRows = before.filter((r) => r.equipped && !after.find((a) => a.id === r.id)?.equipped);
  const cost = handChangeCost(character, before, after, drop ? removedRows.filter(isWeapon).map((r) => r.id) : []);
  const removed = removedRows.map((r) => r.name);
  if (cost.blocked) return { patch: null, cost, removed };
  const patch: Partial<Character> = { inventory: after };
  if (cost.interaction) patch.objectInteractionUsed = true;
  if (cost.action) patch.actionUsed = true;
  return { patch, cost, removed };
}

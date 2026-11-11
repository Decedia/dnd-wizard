// The turn panel's data: what a character can do with its action, bonus action
// and reaction right now, and the patches that start a turn, use an option and
// end a turn. Pure functions, so the panel only renders.
import type { Character } from "@/lib/storage";
import { getModifier, getProficiencyBonus, isPreparationCaster } from "@/lib/storage";
import { getWeaponAttackDetails, isRaging } from "@/lib/weapon-attacks";
import { equipRow, heldInHands, unequipRow, type Hand, type InventoryRow } from "@/lib/inventory";
import { getFreeCastSpells, getGrantedSpellNames } from "@/lib/granted-spells";
import { advanceTurn, parseDurationToTurns } from "@/lib/spellEffects";
import { ruleFor, ruleKey, SUB_OPTIONS, subOptionsFor, usesMax, type FeatureRule, type FeatureWhen, type PoolField, type SubOption } from "@/data/turn-features";
import { getFeaturePicks } from "@/lib/feature-groups";
import { beastByName, type Beast } from "@/data/wild-shapes";
import { spellDamageBonuses, type SpellDamageBonus } from "@/lib/spell-damage-bonus";
import { featureHealing, healingBonusLines, spellHealing, type Healing } from "@/lib/healing";
import { concentrationTimer, expiredTimerPatch, featureRounds, featureTimerId, RAGE_TIMER, spellRounds, spellTimerId, startTimer, WILD_SHAPE_TIMER } from "@/lib/timers";

/** "free" takes none of the three: it rides on something else (a hit, a failed save). */
export type TurnSlot = "action" | "bonus" | "reaction" | "free";
export type TurnGroup = "attack" | "spell" | "feature" | "basic";
/** Why an option cannot be used; the panel turns it into a sentence. */
export type TurnBlock = "noSlot" | "empty" | "actionFirst" | "attackFirst" | "raging" | "notRaging" | "shaped" | "full" | "slotsFull" | "usedThisTurn";

export interface TurnOption {
  key: string;
  slot: TurnSlot;
  group: TurnGroup;
  /** Display name, or a locale key when `nameKey` is set (basic actions). */
  name: string;
  nameKey?: string;
  nameValues?: Record<string, string | number>;
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
  /** What the option does, for suggestions: melee, ranged, area, heal, damage, control, escape, ... */
  tags?: string[];
  /** Spell level (0 for a cantrip). */
  spellLevel?: number;
  /** Spell school as in the spell data ("Evocation"). */
  school?: string;
  /** What it heals, when it heals (the panel asks who and adds the HP). */
  heal?: Healing;
  /** Casting this ends the concentration spell named here. */
  endsConcentration?: string;
  /** Rounds the spell or feature lasts once used (a timer starts). */
  lastsRounds?: number;
  /** Feature bonuses to the spell's damage (Empowered Evocation, Agonizing Blast). */
  damageBonuses?: SpellDamageBonus[];
  /** When a feature applies ("when you hit"); locale key `turn.when.*`. */
  when?: FeatureWhen;
  /** Once per turn: greyed out after a tap until End turn. */
  oncePerTurn?: boolean;
  /** A condition the player checks before using it; locale key `turn.cond.*`. */
  condition?: string;
  /** The player picks how much of this pool to spend (Lay on Hands). */
  amount?: { field: PoolField; max: number };
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

type SrdSpell = { name: string; description?: string | string[]; level?: number; castingTime?: string; casting_time?: string; duration?: string; concentration?: boolean; effectSummary?: string; summary?: string; damage?: any; saveType?: string | null; range?: string; area_of_effect?: unknown; heal_at_slot_level?: unknown; attackType?: string; attack_type?: string; onHit?: string | null; school?: string; classes?: string[] };

export { isRaging };

/** What a spell does, read from its rules data. */
export function spellTags(srd: SrdSpell | undefined, name: string): string[] {
  const tags: string[] = [];
  if (!srd) return tags;
  const text = Array.isArray(srd.description) ? srd.description.join(" ") : srd.description || "";
  const range = (srd.range || "").toLowerCase();
  const dice = srd.damage && typeof srd.damage === "object" ? srd.damage.damageDice || srd.damage.damageType || srd.damage.damage_type : srd.damage;
  if (srd.heal_at_slot_level || /regains? (a number of )?hit points/i.test(text)) tags.push("heal");
  else if (dice) tags.push("damage");
  if (srd.area_of_effect || /\d+-foot[- ](cube|cone|sphere|line|radius)/.test(range)) tags.push("area");
  if (srd.saveType && srd.saveType !== "None" && !dice) tags.push("control");
  if ((srd.attackType || srd.attack_type) === "melee" || range === "touch") tags.push("touch");
  if (/automatically hits/i.test(srd.onHit || "")) tags.push("autoHit");
  if (/^(Misty Step|Thunder Step|Dimension Door|Expeditious Retreat|Blink)$/.test(name)) tags.push("escape");
  if (/^(Hunter's Mark|Hex|Spiritual Weapon|Spirit Shroud)$/.test(name)) tags.push("mark");
  if (/Smite$/.test(name)) tags.push("smite");
  return tags;
}

const SLOT_FLAG: Partial<Record<TurnSlot, "actionUsed" | "bonusActionUsed" | "reactionUsed">> = {
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
  const details = attack && getWeaponAttackDetails(character, attack);
  if (!details) return null;
  const style = names.some((n) => n.includes("two-weapon fighting")) || JSON.stringify(character.featureSelections || {}).includes("Two-Weapon Fighting");
  const bonus = style ? details.damageBonus : Math.min(0, details.damageBonus);
  return {
    key: `offhand:${off.id}`,
    tags: ["melee", "offhand"],
    slot: "bonus",
    group: "attack",
    name: off.name,
    summary: "",
    summaryKey: "turn.offhand.hint",
    toHit: details.attackBonus,
    damage: `${details.damageDice} ${signed(bonus)} ${details.damageType} damage`.replace(" + 0 ", " "),
    detail: weaponDetail(off),
    // The bonus attack comes after taking the Attack action with the other hand.
    blocked: character.attackedThisTurn ? undefined : "attackFirst",
    spend: {},
  };
}

function attackOptions(character: Character): TurnOption[] {
  const out: TurnOption[] = [];
  const prof = getProficiencyBonus(character.level);
  for (const attack of character.attacks || []) {
    if (attack.source === "grapple" || attack.source === "shove") continue;
    const details = attack.source === "weapon" ? getWeaponAttackDetails(character, attack) : null;
    if (attack.source === "weapon" && !details) continue;
    const ranged = !!details && details.weapon.category === "ranged";
    out.push({
      key: `attack:${attack.id}`,
      tags: [ranged ? "ranged" : "melee"],
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
    tags: ["melee", "weak"],
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
      tags: spellTags(srd, spell.srdSpellName || spell.name),
      spellLevel: level,
      school: srd?.school || undefined,
      damageBonuses: srd ? spellDamageBonuses(character, { name: srd.name, level, school: srd.school, classes: srd.classes, damageType: srd.damage?.damageType, description: srd.description }) : undefined,
      saveDc: srd?.saveType ? character.spellSaveDc || undefined : undefined,
      spend: { spellsUsedThisTurn: [...(character.spellsUsedThisTurn || []).filter((id) => id !== spell.id), spell.id] },
    };
    let castLevel = level;
    const rounds = spellRounds(srd?.duration, !!srd?.concentration);
    if (rounds) {
      option.lastsRounds = rounds;
      option.spend.activeBuffs = startTimer(character.activeBuffs || [], { spellId: spellTimerId(spell.srdSpellName || spell.name), name: spell.name, concentration: !!srd?.concentration, turnsRemaining: rounds });
    }
    const current = concentrationTimer(character);
    if (srd?.concentration && current && current.spellId !== spellTimerId(spell.srdSpellName || spell.name)) option.endsConcentration = current.name;
    if (level > 0) {
      if (free && !freeUsed.has(lookup)) {
        option.cost = { key: "turn.cost.freeCast", values: {} };
        option.spend.freeCastsUsed = [...freeUsed, lookup];
      } else {
        const open = lowestOpenSlot(character, level);
        if (open === null) {
          option.blocked = "noSlot";
        } else {
          castLevel = open;
          option.cost = { key: "turn.cost.slot", values: { level: open } };
          option.spend.spellSlotsExpended = { ...(character.spellSlotsExpended || {}), [open]: (character.spellSlotsExpended?.[open] ?? 0) + 1 };
        }
      }
    }
    const heal = srd ? spellHealing(character, { name: srd.name, level, heal_at_slot_level: srd.heal_at_slot_level }, castLevel) : null;
    if (heal) {
      option.heal = heal;
      option.damageBonuses = [...(option.damageBonuses || []), ...healingBonusLines(heal)];
    }
    out.push(option);
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

// Rows that only say "you get a subclass feature here" or are handled elsewhere on the sheet.
const NOT_A_TURN_FEATURE = /feature$|^Ability Score Improvement|^Spellcasting|^Pact Magic|^Extra Attack|^Proficienc|^Languages?$|^Hit Points/i;

const turnFeatures = (character: Character) => {
  const seen = new Set<string>();
  return (character.features || []).filter((f) => !!f.name?.trim() && !NOT_A_TURN_FEATURE.test(f.name) && !seen.has(f.name) && !!seen.add(f.name));
};

/** Pools a feature can spend; the option shows what is left. */
const poolLeft = (character: Character, field: PoolField) => Number((character as any)[field]) || 0;

/** Features that apply when an attack hits. */
export const ON_HIT_WHEN = new Set<FeatureWhen>(["onHit", "oncePerTurn", "onCritOrKill"]);

/** One turn option from a hand-checked rule: the slot it takes and what it spends. */
function ruleOption(character: Character, rule: FeatureRule | SubOption, base: Pick<TurnOption, "key" | "name" | "summary" | "summaryKey" | "detail">, slot: TurnSlot): TurnOption {
  const option: TurnOption = { ...base, slot, group: "feature", when: rule.when, spend: {} };
  if (rule.pool) {
    const left = poolLeft(character, rule.pool.field);
    option.cost = { key: `turn.cost.${rule.pool.field}`, values: { amount: rule.pool.amount, left } };
    if (left < rule.pool.amount) option.blocked = "empty";
    else (option.spend as any)[rule.pool.field] = left - rule.pool.amount;
  } else if (rule.variablePool) {
    const left = poolLeft(character, rule.variablePool);
    const costKey = rule.variablePool === "sorceryPoints" ? "turn.cost.sorceryPointsByLevel" : rule.variablePool === "kiPoints" ? "turn.cost.kiChoose" : `turn.cost.${rule.variablePool}`;
    option.cost = { key: costKey, values: { amount: "", left } };
    if (left <= 0) option.blocked = "empty";
    else option.amount = { field: rule.variablePool, max: left };
  } else if (rule.uses) {
    const key = ruleKey(rule);
    const max = usesMax(rule, character);
    const used = character.featureUses?.[key] ?? 0;
    const orLeft = rule.orPool ? poolLeft(character, rule.orPool.field) : 0;
    if (used < max) {
      option.cost = { key: "turn.cost.uses", values: { left: Math.max(0, max - used), max } };
      option.spend.featureUses = { ...(character.featureUses || {}), [key]: used + 1 };
    } else if (rule.orPool && orLeft >= rule.orPool.amount) {
      // The free use is gone, so it costs a die from the pool instead.
      option.cost = { key: `turn.cost.${rule.orPool.field}`, values: { amount: rule.orPool.amount, left: orLeft } };
      (option.spend as any)[rule.orPool.field] = orLeft - rule.orPool.amount;
    } else {
      option.cost = { key: "turn.cost.uses", values: { left: 0, max } };
      option.blocked = "empty";
    }
  } else if (rule.spellSlot) {
    const open = lowestOpenSlot(character, 1);
    if (open === null) option.blocked = "noSlot";
    else {
      option.cost = { key: "turn.cost.slot", values: { level: open } };
      option.spend.spellSlotsExpended = { ...(character.spellSlotsExpended || {}), [open]: (character.spellSlotsExpended?.[open] ?? 0) + 1 };
    }
  }
  if (rule.oncePerTurn) {
    option.oncePerTurn = true;
    const mark = `turn:${ruleKey(rule)}`;
    const usedThisTurn = character.featuresUsedThisTurn || [];
    if (usedThisTurn.includes(mark)) option.blocked = "usedThisTurn";
    else option.spend.featuresUsedThisTurn = [...usedThisTurn, mark];
  }
  if (rule.condition) option.condition = rule.condition;
  if (rule.gain && !option.blocked) {
    const max = Number((character as any)[`max${rule.gain[0].toUpperCase()}${rule.gain.slice(1)}`]) || 0;
    const left = poolLeft(character, rule.gain);
    if (left >= max) option.blocked = "full";
    else (option.spend as any)[rule.gain] = left + 1;
  }
  return option;
}

/** Sub-options (Metamagic, maneuvers, runes, Psionic Power) for the features that have them. */
function subOptions(character: Character, feature: { id: string; name: string }): TurnOption[] | null {
  const group = SUB_OPTIONS.find((g) => g.feature === feature.name);
  if (!group) return null;
  const subs = subOptionsFor(character, group, getFeaturePicks(character, feature.name));
  if (subs.length === 0) return null;
  return subs.map((o) => ruleOption(character, o, { key: `sub:${feature.id}:${o.key}`, name: o.name, summary: o.summary, summaryKey: `turn.sub.${o.key}` }, o.slot));
}

/** Sorcery points for spell slots: the slot costs on the Creating Spell Slots table (1st-5th level). */
const SLOT_COST: Record<number, number> = { 1: 2, 2: 3, 3: 5, 4: 6, 5: 7 };

/** Flexible Casting (Sorcerer): a spent slot back for sorcery points, or a slot turned into points. Both a bonus action. */
function flexibleCastingOptions(character: Character, featureName: string): TurnOption[] {
  const points = character.sorceryPoints || 0;
  const maxPoints = character.maxSorceryPoints || 0;
  const out: TurnOption[] = [];
  const levels = Object.keys(character.spellSlots || {}).map(Number).filter((l) => (character.spellSlots?.[l] ?? 0) > 0).sort((a, b) => a - b);
  if (/Creating/i.test(featureName)) {
    for (const level of levels.filter((l) => SLOT_COST[l])) {
      const spent = character.spellSlotsExpended?.[level] ?? 0;
      const cost = SLOT_COST[level];
      const option: TurnOption = {
        key: `flex:create:${level}`, slot: "bonus", group: "feature", name: featureName,
        nameKey: "turn.flex.createName", nameValues: { level },
        summary: "Get a spent spell slot back by paying sorcery points (up to level 5).", summaryKey: "turn.flex.create",
        cost: { key: "turn.cost.flexCreate", values: { level, amount: cost, left: points } },
        spend: { sorceryPoints: points - cost, spellSlotsExpended: { ...(character.spellSlotsExpended || {}), [level]: spent - 1 } },
      };
      if (points < cost) option.blocked = "empty";
      else if (spent <= 0) option.blocked = "slotsFull";
      out.push(option);
    }
  } else {
    for (const level of levels) {
      const spent = character.spellSlotsExpended?.[level] ?? 0;
      const option: TurnOption = {
        key: `flex:convert:${level}`, slot: "bonus", group: "feature", name: featureName,
        nameKey: "turn.flex.convertName", nameValues: { level },
        summary: "Turn an unspent spell slot into sorcery points equal to its level.", summaryKey: "turn.flex.convert",
        cost: { key: "turn.cost.flexConvert", values: { level, amount: level, left: points } },
        spend: { sorceryPoints: Math.min(maxPoints, points + level), spellSlotsExpended: { ...(character.spellSlotsExpended || {}), [level]: spent + 1 } },
      };
      if ((character.spellSlots?.[level] ?? 0) - spent <= 0) option.blocked = "noSlot";
      else if (points >= maxPoints) option.blocked = "full";
      out.push(option);
    }
  }
  // Only the levels that work right now; when none does, one row says why.
  const open = out.filter((o) => !o.blocked);
  return open.length > 0 ? open : out.slice(0, 1);
}

/**
 * Features the player uses on a turn, from the hand-checked table in
 * src/data/turn-features.ts: the slot each takes and what it spends.
 */
function featureOptions(character: Character): TurnOption[] {
  const out: TurnOption[] = [];
  const names = (character.features || []).map((f) => f.name || "");
  for (const feature of turnFeatures(character)) {
    if (/^Flexible Casting/.test(feature.name)) {
      out.push(...flexibleCastingOptions(character, feature.name));
      continue;
    }
    const subs = subOptions(character, feature);
    if (subs) {
      out.push(...subs);
      continue;
    }
    const rule = ruleFor(character, feature.name);
    if (!rule) continue;
    const slot = rule.bonusWith && names.some((n) => rule.bonusWith!.test(n)) ? "bonus" : rule.slot;
    const option = ruleOption(character, rule, { key: `feature:${feature.id}`, name: feature.name, summary: feature.description || "", detail: feature.description || undefined }, slot);
    if (/^\^Rage\$$/.test(rule.name.source)) {
      if (isRaging(character)) option.blocked = "raging";
      option.spend.activeStates = [...(character.activeStates || []), "raging"];
    }
    if (rule.when === "whileRaging" && !isRaging(character) && !option.blocked) option.blocked = "notRaging";
    if (/^\^Wild Shape/.test(rule.name.source) && character.wildShape && !option.blocked) option.blocked = "shaped";
    if (rule.restoresAction) {
      // A new Attack action starts its own count of swings.
      option.spend.swings = [];
      // The helper tracks one action at a time, so the extra one is taken after the first.
      if (!character.actionUsed && !option.blocked) option.blocked = "actionFirst";
      option.spend.actionUsed = false;
    }
    const heal = featureHealing(character, feature.name);
    if (heal) option.heal = heal;
    const rounds = featureRounds(character, feature.name);
    if (rounds && !option.blocked) {
      option.lastsRounds = rounds;
      option.spend.activeBuffs = startTimer(character.activeBuffs || [], { spellId: featureTimerId(feature.name), name: feature.name, concentration: false, turnsRemaining: rounds });
    }
    out.push(option);
  }
  // Ready on-hit features first, so after a hit the unused ones are at the top; spent ones last.
  const rank = (o: TurnOption) => (o.blocked ? 2 : o.when && ON_HIT_WHEN.has(o.when) ? 0 : 1);
  return out.map((o, i) => ({ o, i })).sort((a, b) => rank(a.o) - rank(b.o) || a.i - b.i).map((x) => x.o);
}

/** Features with no entry in the table: always on, or not something done on a turn. A reading list. */
function featureList(character: Character): TurnMenu["features"] {
  return turnFeatures(character)
    .filter((f) => !ruleFor(character, f.name) && !/^Flexible Casting/.test(f.name) && !subOptions(character, f))
    .map((f) => ({ id: f.id, name: f.name, description: f.description || "" }));
}

/** Spending a chosen amount of a pool (Lay on Hands). */
export function amountPatch(character: Character, option: TurnOption, amount: number): Partial<Character> {
  if (!option.amount) return optionPatch(option);
  const spent = Math.max(1, Math.min(option.amount.max, Math.floor(amount)));
  return { ...optionPatch(option), [option.amount.field]: option.amount.max - spent } as Partial<Character>;
}

/** The beast form the character is in, if any. */
export const currentBeast = (character: Pick<Character, "wildShape">): Beast | undefined => (character.wildShape ? beastByName(character.wildShape.form) : undefined);

function beastAttackOptions(beast: Beast): TurnOption[] {
  return beast.attacks.map((a, i) => ({
    key: `beast:${i}`,
    slot: "action" as const,
    group: "attack" as const,
    name: a.name,
    summary: a.note || "",
    toHit: a.toHit,
    damage: `${a.damage} damage`,
    tags: ["melee"],
    spend: {},
  }));
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
  const beast = currentBeast(character);
  // In beast form the beast's attacks replace the character's, and spells cannot be cast (until Beast Spells at 18).
  const beastSpells = (character.features || []).some((f) => /^Beast Spells/.test(f.name || ""));
  return {
    options: [
      ...(beast ? beastAttackOptions(beast) : attackOptions(character)),
      ...(beast && !beastSpells ? [] : spellOptions(character, srdSpells)),
      ...featureOptions(character),
      ...basics,
    ],
    features: featureList(character),
    attacksPerAction: beast ? beast.multiattack : attacksPerAction(character),
    speed: beast ? beast.speed || beast.swim || beast.fly || 30 : character.speed || 30,
  };
}

export function isSlotUsed(character: Pick<Character, "actionUsed" | "bonusActionUsed" | "reactionUsed">, slot: TurnSlot): boolean {
  const flag = SLOT_FLAG[slot];
  return !!flag && !!character[flag];
}

/** Using an option spends its slot and whatever it costs. */
export function optionPatch(option: TurnOption): Partial<Character> {
  const flag = SLOT_FLAG[option.slot];
  return flag ? { ...option.spend, [flag]: true } : { ...option.spend };
}

/** A new turn: action, bonus action, movement and reaction all come back. */
export function startTurnPatch(character: Pick<Character, "turnRound">): Partial<Character> {
  return { turnActive: true, turnRound: (character.turnRound || 0) + 1, actionUsed: false, bonusActionUsed: false, reactionUsed: false, moveUsed: false, objectInteractionUsed: false, swings: [], attackedThisTurn: false };
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
  const before = character.activeBuffs || [];
  const after = advanceTurn(before);
  return { turnActive: false, actionUsed: false, bonusActionUsed: false, moveUsed: false, objectInteractionUsed: false, swings: [], attackedThisTurn: false, spellsUsedThisTurn: kept, featuresUsedThisTurn: [], activeBuffs: after, ...expiredTimerPatch(character, before, after) };
}

/** The fight is over: the round counter starts again, rage and the quick taps end. */
export function endEncounterPatch(character?: Pick<Character, "activeStates" | "activeBuffs">): Partial<Character> {
  const patch: Partial<Character> = { turnActive: false, turnRound: 0, actionUsed: false, bonusActionUsed: false, reactionUsed: false, moveUsed: false, objectInteractionUsed: false, turnSituation: undefined, swings: [], attackedThisTurn: false };
  if (character && isRaging(character)) patch.activeStates = (character.activeStates || []).filter((s) => s !== "raging");
  if (character?.activeBuffs?.some((b) => b.spellId === RAGE_TIMER)) patch.activeBuffs = character.activeBuffs.filter((b) => b.spellId !== RAGE_TIMER);
  return patch;
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
  // A dropped weapon lies on the ground until picked up (it isn't carried any more).
  const dropped = new Set(drop ? removedRows.filter(isWeapon).map((r) => r.id) : []);
  const patch: Partial<Character> = { inventory: dropped.size ? after.map((r) => (dropped.has(r.id) ? { ...r, onGround: true } : r)) : after };
  if (cost.interaction) patch.objectInteractionUsed = true;
  if (cost.action) patch.actionUsed = true;
  return { patch, cost, removed };
}

// ---------------------------------------------------------------------------
// The Attack action, one swing at a time

export type SwingResult = "hit" | "crit" | "miss";

/** A weapon attack option (not a spell, not the off-hand bonus attack). */
export const isSwingOption = (o: TurnOption) => o.group === "attack" && o.slot === "action";

/** Swings left in this Attack action; 0 when no Attack action is going on. */
export function swingsLeft(character: Pick<Character, "swings">, perAction: number): number {
  const swings = character.swings || [];
  if (swings.length === 0) return 0;
  return Math.max(0, perAction - swings.length);
}

/**
 * Starts the Attack action with a swing, or adds the next swing to it.
 * The first swing takes the action; the rest of the Extra Attack swings are part of it.
 */
export function swingPatch(character: Character, option: TurnOption): Partial<Character> {
  const swings = character.swings || [];
  const next = [...swings.filter((s) => s.result !== "pending"), { key: option.key, name: option.nameKey ? "" : option.name, result: "pending" as const }];
  return swings.length === 0 ? { ...optionPatch(option), swings: next, attackedThisTurn: true } : { swings: next, attackedThisTurn: true };
}

export function swingResultPatch(character: Character, index: number, result: SwingResult): Partial<Character> {
  return { swings: (character.swings || []).map((s, i) => (i === index ? { ...s, result } : s)) };
}

/** Doubles every die in a damage line, for a critical hit: "1d8 + 3" becomes "2d8 + 3". */
export function critDamage(damage: string): string {
  return damage.replace(/(\d+)d(\d+)/g, (_, n, d) => `${Number(n) * 2}d${d}`);
}

/**
 * Extra weapon dice on a melee crit: Brutal Critical (1, 2 or 3 dice) and
 * the half-orc's Savage Attacks (1 die). Returns the dice to add and who gives them.
 */
export function critExtraDice(character: Pick<Character, "features">, damage: string): { dice: string; sources: string[] } | null {
  const die = damage.match(/\d+d(\d+)/)?.[1];
  if (!die) return null;
  let count = 0;
  const sources: string[] = [];
  const names = (character.features || []).map((f) => f.name || "");
  const brutal = Math.max(0, ...names.map((n) => Number(n.match(/^Brutal Critical \((\d)/)?.[1] || 0)));
  if (brutal > 0) { count += brutal; sources.push("Brutal Critical"); }
  if (names.some((n) => /^Savage Attacks$/.test(n))) { count += 1; sources.push("Savage Attacks"); }
  return count > 0 ? { dice: `${count}d${die}`, sources } : null;
}

export interface SmiteChoice {
  level: number;
  /** Radiant dice, already doubled on a crit. */
  dice: string;
}

/**
 * Divine Smite after a melee weapon hit: 2d8 radiant for a 1st-level slot,
 * +1d8 per slot level above 1st, at most 5d8 (6d8 against undead or a
 * fiend); every die doubles on a critical hit. One choice per open slot level.
 */
export function smiteChoices(character: Character, crit: boolean): SmiteChoice[] {
  if (!(character.features || []).some((f) => /^Divine Smite/.test(f.name || ""))) return [];
  const out: SmiteChoice[] = [];
  for (let level = 1; level <= 9; level++) {
    const total = character.spellSlots?.[level] ?? 0;
    if (total - (character.spellSlotsExpended?.[level] ?? 0) <= 0) continue;
    const count = Math.min(5, 1 + level) * (crit ? 2 : 1);
    out.push({ level, dice: `${count}d8` });
  }
  return out;
}

export function smitePatch(character: Character, index: number, level: number): Partial<Character> {
  return {
    spellSlotsExpended: { ...(character.spellSlotsExpended || {}), [level]: (character.spellSlotsExpended?.[level] ?? 0) + 1 },
    swings: (character.swings || []).map((s, i) => (i === index ? { ...s, smite: level } : s)),
  };
}

// ---------------------------------------------------------------------------
// Wild Shape

/** Turning into a beast: the Wild Shape option's cost plus the form at full HP. */
export function wildShapePatch(option: TurnOption, beast: Beast): Partial<Character> {
  return { ...optionPatch(option), wildShape: { form: beast.name, hp: beast.hp }, swings: [] };
}

/**
 * Damage to the beast form. At 0 HP the druid changes back, and damage
 * left over carries to the druid's own HP. Negative damage heals the form.
 */
export function wildDamagePatch(character: Character, amount: number): { patch: Partial<Character>; reverted: boolean; carried: number } {
  const shape = character.wildShape;
  const beast = currentBeast(character);
  if (!shape || !beast) return { patch: {}, reverted: false, carried: 0 };
  const hp = shape.hp - amount;
  if (hp > 0) return { patch: { wildShape: { ...shape, hp: Math.min(beast.hp, hp) } }, reverted: false, carried: 0 };
  const carried = -hp;
  return { patch: { wildShape: undefined, currentHp: Math.max(0, (character.currentHp || 0) - carried), swings: [], activeBuffs: withoutTimer(character, WILD_SHAPE_TIMER) }, reverted: true, carried };
}

/** Changing back early takes a bonus action during the druid's turn. */
export function leaveShapePatch(character: Pick<Character, "turnActive"> & Partial<Pick<Character, "activeBuffs">>): Partial<Character> {
  const base = { wildShape: undefined, swings: [], activeBuffs: withoutTimer(character, WILD_SHAPE_TIMER) };
  return character.turnActive ? { ...base, bonusActionUsed: true } : base;
}

const withoutTimer = (character: Partial<Pick<Character, "activeBuffs">>, id: string) => (character.activeBuffs || []).filter((b) => b.spellId !== id);

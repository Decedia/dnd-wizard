// "Suggest" mode of the turn helper: scores every option on the turn menu
// from the character's state (HP, raging, concentration) and three quick
// taps the player sets (an enemy next to you, a group of enemies, an enemy
// almost down). Plain rules of thumb for new players, no AI. Each pick
// carries a one-line reason, a locale key under `turn.why.*`.
import { concentrationTimer } from "@/lib/timers";
import { withHomebrew } from "@/lib/homebrew-spells";
import type { Character } from "@/lib/storage";
import type { TurnMenu, TurnOption } from "@/lib/turn";
import { isMoon } from "@/data/wild-shapes";

export type Situation = NonNullable<Character["turnSituation"]>;

export interface Pick {
  option: TurnOption;
  score: number;
  why: string;
  values?: Record<string, string | number>;
}

type SrdSpell = { name: string; concentration?: boolean };

const HEAL_FEATURE = /^(Second Wind|Lay on Hands|Wholeness of Body|Healing Hands|Hand of Healing|Healing Light)/;
const ESCAPE_FEATURE = /^(Cunning Action|Step of the Wind|Fey Step|Shadow Step|Misty Escape|Vanish)/;
const DEFENSE_FEATURE = /^(Patient Defense|Uncanny Dodge|Deflect Missiles|Warding Flare|Arcane Deflection|Defensive Duelist|Shield Master|Cutting Words|Bend Luck|Entropic Ward|Illusory Self|Glorious Defense)/;

const hurt = (c: Character) => (c.currentHp || 0) < Math.max(1, c.effectiveMaxHp || c.maxHp || 1) / 2;

/** The concentration spell the character cast in an earlier turn of this fight and still holds. */
export function concentratingOn(character: Character, srdSpells: SrdSpell[]): string | null {
  const timer = concentrationTimer(character);
  if (timer) return timer.name;
  for (const id of character.spellsUsedThisTurn || []) {
    const spell = (character.spells || []).find((s) => s.id === id);
    const srd = spell && withHomebrew(character, srdSpells).find((s) => s.name === (spell.srdSpellName || spell.name));
    if (spell && srd?.concentration) return spell.name;
  }
  return null;
}

type Ctx = { conc: string | null; attacks: number; round: number; cantrip: boolean };

function score(o: TurnOption, c: Character, sit: Situation, ctx: Ctx): Pick | null {
  const tags = new Set(o.tags || []);
  const near = !!sit.near;
  const p = (score: number, why: string, values?: Pick["values"]): Pick => ({ option: o, score, why, values });
  let pick: Pick | null = null;

  if (o.group === "attack") {
    if (tags.has("offhand")) pick = near ? p(70, "offhand") : null;
    else if (o.key.startsWith("beast:bonus:")) pick = p(95, "proneBonus");
    else if (tags.has("vsProne")) pick = c.wildShape?.prone ? p(96, "stompProne") : p(10, "needsProne");
    else if (tags.has("weak")) pick = p(5, "unarmed");
    else if (tags.has("ranged")) pick = near ? p(35, "rangedNear") : p(85, "rangedFar");
    else pick = near ? (ctx.attacks > 1 ? p(90, "meleeExtra", { count: ctx.attacks }) : p(90, "meleeNear")) : p(25, "meleeFar");
  } else if (o.group === "spell") {
    const level = o.spellLevel ?? 0;
    if (o.slot === "reaction") pick = o.name === "Shield" ? p(90, "shield") : o.name === "Counterspell" ? p(70, "counterspell") : p(50, "reactionSpell");
    else if (tags.has("heal")) pick = hurt(c) ? p(o.slot === "bonus" ? 90 : 86, "healSelf") : p(15, "healLater");
    else if (tags.has("escape")) pick = near && hurt(c) ? p(85, "escape") : p(10, "escapeLater");
    else if (tags.has("mark")) pick = ctx.conc ? p(15, "markHeld") : p(80, "mark");
    else if (tags.has("smite")) pick = near ? p(65, "smiteSpell") : p(10, "smiteFar");
    else if (level === 0 && tags.has("damage")) {
      if (tags.has("touch")) pick = near ? p(80, "cantripTouch") : p(20, "cantripTouchFar");
      else if (tags.has("area")) pick = near && sit.many ? p(70, "cantripArea") : p(30, "cantripAreaOne");
      else pick = near ? p(40, "cantripNear") : p(75, "cantripFar");
    } else if (tags.has("damage")) {
      if (tags.has("autoHit") && sit.low) pick = p(92, "autoHitLow");
      else if (tags.has("area")) pick = sit.many ? p(88, "areaMany") : p(30, "areaOne");
      else pick = sit.low ? p(35, "bigHitLow") : p(55, "bigHit");
    } else if (tags.has("control")) pick = sit.many ? p(72, "controlMany") : p(50, "control");
    else pick = o.concentration && ctx.round <= 1 ? p(45, "buffEarly") : p(10, "utility");
    if (pick && o.concentration && ctx.conc) pick = p(Math.max(1, pick.score - 45), "breaksConc", { name: ctx.conc });
  } else if (o.group === "feature") {
    if (/^Rage$/.test(o.name)) pick = p(95, "rage");
    else if (HEAL_FEATURE.test(o.name)) pick = hurt(c) ? p(88, "healSelf") : p(10, "healLater");
    else if (/^Flurry of Blows/.test(o.name)) pick = near ? p(80, "flurry") : null;
    else if (/^Wild Shape/.test(o.name)) pick = near ? p(65, "wildShape") : p(30, "wildShapeLater");
    else if (ESCAPE_FEATURE.test(o.name)) pick = near && hurt(c) ? p(78, "escape") : near ? p(25, "escapeLater") : p(45, "dashBonus");
    else if (DEFENSE_FEATURE.test(o.name)) pick = o.slot === "reaction" ? p(80, "defenseReaction") : near && hurt(c) ? p(70, "defense") : p(20, "defenseLater");
    else if (o.when === "afterAttack" || o.when === "whileRaging") pick = near ? p(65, "afterAttack") : p(15, "afterAttackFar");
    else if (o.cost?.key === "turn.cost.channelDivinityUses") pick = ctx.round <= 2 ? p(55, "channel") : p(35, "channelLater");
    else if (o.slot === "reaction") pick = p(60, "reactionFeature");
    else if (o.slot === "bonus") pick = p(40, "bonusFeature");
    else pick = p(30, "actionFeature");
  } else if (o.group === "basic") {
    const id = o.key.replace("basic:", "");
    if (id === "dodge") pick = near && hurt(c) ? p(sit.many ? 88 : 68, "dodge") : null;
    else if (id === "disengage") pick = near && hurt(c) ? p(62, "disengage") : null;
    else if (id === "dash") pick = near ? null : p(40, "dash");
    else if (id === "opportunityAttack") pick = near ? p(60, "opportunity") : p(20, "opportunityFar");
  }
  if (pick) pick = tuneForClass(pick, o, c, sit, ctx);
  return pick && pick.score > 0 ? pick : null;
}

const has = (c: Character, name: RegExp) => (c.features || []).some((f) => name.test(f.name || ""));
/** Built to fight with a weapon: Bladesinger, Hexblade, Pact of the Blade. */
const weaponCaster = (c: Character) => has(c, /^(Bladesong|Pact of the Blade|Hex Warrior|Thirsting Blade)/) || JSON.stringify(c.featureSelections || {}).includes("Pact of the Blade");

/**
 * Class habits on top of the general rules of thumb, for what the general
 * rules get wrong for one class. Each changes the score and the reason.
 */
function tuneForClass(pick: Pick, o: TurnOption, c: Character, sit: Situation, ctx: Ctx): Pick {
  const near = !!sit.near;
  const p = (score: number, why: string, values?: Pick["values"]): Pick => ({ option: o, score, why, values });
  const cls = c.class || "";
  // Wizards, sorcerers and warlocks hit harder with a cantrip than with a dagger, unless they are built for weapons.
  if (/^(Wizard|Sorcerer|Warlock)$/.test(cls) && o.group === "attack" && !o.tags?.includes("weak") && !c.wildShape && ctx.cantrip && !weaponCaster(c)) {
    return p(Math.min(pick.score, 40), "casterWeapon");
  }
  if (cls === "Warlock" && o.name === "Eldritch Blast" && !near) return p(88, "eldritchBlast");
  // Rogues hit, then step away with Cunning Action so the enemy cannot hit back.
  if (cls === "Rogue" && /^Cunning Action/.test(o.name) && near && c.attackedThisTurn) return p(82, "hitAndRun");
  if (cls === "Druid" && /^Wild Shape/.test(o.name)) {
    if (isMoon(c)) return near ? p(90, "wildShapeMoon") : p(70, "wildShapeMoon");
    // Other 2014 circles are weaker as a beast than with their spells.
    if (c.ruleset !== "2024") return p(30, "wildShapeSupport");
  }
  if (cls === "Bard" && /^Bardic Inspiration/.test(o.name) && ctx.round <= 2) return p(60, "inspire");
  if (cls === "Monk" && /^Martial Arts/.test(o.name) && near && c.attackedThisTurn) return p(82, "martialArts");
  return pick;
}

/**
 * The best picks for each slot, highest first. Blocked options are left out;
 * free options (no action needed) are not ranked, they ride on a hit.
 */
export function suggestPicks(character: Character, menu: TurnMenu, srdSpells: SrdSpell[], quickTaps: Situation): Record<"action" | "bonus" | "reaction", Pick[]> {
  const sit = situationOf(character, quickTaps);
  const cantrip = menu.options.some((o) => o.group === "spell" && o.spellLevel === 0 && !o.blocked && o.tags?.includes("damage"));
  const ctx: Ctx = { conc: concentratingOn(character, srdSpells), attacks: menu.attacksPerAction, round: character.turnRound || 1, cantrip };
  const out = { action: [] as Pick[], bonus: [] as Pick[], reaction: [] as Pick[] };
  for (const o of menu.options) {
    if (o.slot === "free" || o.blocked) continue;
    const pick = score(o, character, sit, ctx);
    if (pick) out[o.slot as "action" | "bonus" | "reaction"].push(pick);
  }
  for (const list of Object.values(out)) list.sort((a, b) => b.score - a.score || a.option.name.localeCompare(b.option.name));
  return out;
}

/** The quick taps plus what the sheet already knows: a beast that holds a target, or just knocked one down, is next to it. */
function situationOf(character: Character, quickTaps: Situation): Situation {
  const shape = character.wildShape;
  return { ...quickTaps, near: !!quickTaps.near || !!shape?.holding?.length || !!shape?.prone };
}

/** One line on where to move, from the quick taps. Locale key under `turn.move.*`. */
export function moveTip(menu: TurnMenu, character: Character, quickTaps: Situation): string {
  const sit = situationOf(character, quickTaps);
  const ranged = menu.options.some((o) => !o.blocked && o.slot === "action" && (o.tags?.includes("ranged") || (o.group === "spell" && o.tags?.includes("damage") && !o.tags.includes("touch"))));
  if (sit.near) return hurt(character) ? "turn.move.nearHurt" : "turn.move.near";
  return ranged ? "turn.move.farRanged" : "turn.move.farMelee";
}


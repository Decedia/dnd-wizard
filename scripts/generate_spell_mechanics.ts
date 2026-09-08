import { readFileSync, writeFileSync } from "node:fs";
import { SpellMechanics, Effect, Scaling, SpecialRule } from "../src/data/spell-mechanics";

interface RawSpell {
  index: string;
  name: string;
  desc?: string[];
  description?: string;
  higher_level?: string[];
  higherLevel?: string;
  level: number;
  school?: { index: string; name?: string } | string;
  casting_time?: string;
  castingTime?: string;
  range: string;
  duration: string;
  concentration: boolean;
  components?: string[];
  material?: string;
  damage?: {
    damage_type?: { index: string; name?: string };
    damage_at_slot_level?: Record<string, string>;
    damage_at_character_level?: Record<string, string>;
  };
  dc?: {
    dc_type?: { index: string; name?: string };
    dc_success?: string;
  };
  area_of_effect?: { type?: string; size?: number };
  classes?: string[];
  subclasses?: string[];
  url?: string;
  updated_at?: string;
  source?: string;
  ritual?: boolean;
}

function getDesc(raw: RawSpell): string {
  if (Array.isArray(raw.desc) && raw.desc.length > 0) return raw.desc[0];
  if (typeof raw.description === "string") return raw.description;
  return "";
}

function getHigher(raw: RawSpell): string {
  if (raw.higher_level && raw.higher_level.length > 0) return raw.higher_level[0];
  if (typeof raw.higherLevel === "string") return raw.higherLevel;
  return "";
}

function getSchool(raw: RawSpell): string {
  if (typeof raw.school === "string") return raw.school.toLowerCase();
  return (raw.school?.index || "").toLowerCase();
}

function parseTime(raw: RawSpell): string {
  return raw.casting_time || raw.castingTime || "1 action";
}

function parseRange(raw: RawSpell): { value: number | null; unit: "feet" | "self" | "touch" | "special" } {
  const r = raw.range || "";
  const lower = r.toLowerCase();
  if (lower === "self" || lower.startsWith("self")) return { value: null, unit: "self" };
  if (lower === "touch") return { value: null, unit: "touch" };
  const match = lower.match(/(\d+)\s*(feet|foot|mile|miles)/);
  if (match) return { value: parseInt(match[1]), unit: "feet" };
  return { value: null, unit: "special" };
}

function parseComponents(raw: RawSpell): string[] {
  const comps: string[] = [];
  if (raw.components) {
    if (raw.components.includes("V")) comps.push("V");
    if (raw.components.includes("S")) comps.push("S");
    if (raw.components.includes("M")) comps.push("M");
  }
  return comps;
}

function parseDuration(raw: RawSpell): { rounds?: number; text: string } {
  const d = raw.duration || "";
  const lower = d.toLowerCase();
  if (lower === "instantaneous") return { text: "Instantaneous" };
  const minuteMatch = lower.match(/(\d+)\s*minute/);
  if (minuteMatch) {
    const mins = parseInt(minuteMatch[1]);
    return { rounds: mins * 10, text: `Up to ${mins} minute${mins > 1 ? "s" : ""}` };
  }
  const roundMatch = lower.match(/(\d+)\s*round/);
  if (roundMatch) return { rounds: parseInt(roundMatch[1]), text: d };
  const hourMatch = lower.match(/(\d+)\s*hour/);
  if (hourMatch) {
    const hrs = parseInt(hourMatch[1]);
    return { rounds: hrs * 600, text: `Up to ${hrs} hour${hrs > 1 ? "s" : ""}` };
  }
  const dayMatch = lower.match(/(\d+)\s*day/);
  if (dayMatch) {
    const days = parseInt(dayMatch[1]);
    return { rounds: days * 600 * 24, text: `${days} day${days > 1 ? "s" : ""}` };
  }
  return { text: d };
}

function parseTargeting(raw: RawSpell, desc: string): {
  type: "self" | "creature" | "point" | "area" | "multiple";
  shape?: "sphere" | "cube" | "cone" | "line" | "cylinder" | "hemisphere";
  size?: number;
  maxTargets?: number;
  maxRange: number | null;
  selfAllowed: boolean;
} {
  const lower = desc.toLowerCase();
  const rangeInfo = parseRange(raw);
  const range = raw.range || "";
  const rangeLower = range.toLowerCase();

  // Point-targeting with area of effect (check before self-range)
  if (raw.area_of_effect?.type) {
    const shapeMap: Record<string, "sphere" | "cube" | "cone" | "line" | "cylinder" | "hemisphere"> = {
      sphere: "sphere",
      cube: "cube",
      cone: "cone",
      line: "line",
      cylinder: "cylinder",
      hemisphere: "hemisphere",
    };
    return {
      type: "area",
      shape: shapeMap[raw.area_of_effect.type] || undefined,
      size: raw.area_of_effect.size,
      maxRange: rangeLower === "self" ? null : rangeInfo.value,
      selfAllowed: rangeLower.includes("self") || desc.toLowerCase().includes("centered on you"),
    };
  }

  // Area keywords in description (fallback if no area_of_effect in metadata)
  const areaKeywords = [
    { regex: /(\d+)-foot-radius sphere centered on that point/, shape: "sphere" as const },
    { regex: /(\d+)-foot-radius sphere/, shape: "sphere" as const },
    { regex: /(\d+)-foot cube/, shape: "cube" as const },
    { regex: /(\d+)-foot cone/, shape: "cone" as const },
    { regex: /(\d+)-foot line/, shape: "line" as const },
    { regex: /(\d+)-foot cylinder/, shape: "cylinder" as const },
  ];
  for (const kw of areaKeywords) {
    const m = desc.match(kw.regex);
    if (m) {
      return {
        type: "area",
        shape: kw.shape,
        size: parseInt(m[1]),
        maxRange: rangeInfo.value,
        selfAllowed: rangeLower.includes("self") || lower.includes("centered on you"),
      };
    }
  }

  // Self-targeting (after area checks)
  if (rangeLower === "self" || rangeLower.startsWith("self")) {
    return { type: "self", maxRange: null, selfAllowed: true };
  }

  // Multiple creatures
  if (lower.includes("up to three") || lower.includes("up to four") || lower.includes("up to five") || lower.includes("up to six")) {
    const match = lower.match(/up to (\d+)/);
    return {
      type: "multiple",
      maxTargets: match ? parseInt(match[1]) : undefined,
      maxRange: rangeInfo.value,
      selfAllowed: rangeLower.includes("self"),
    };
  }

  // Point targeting (fireball, etc.)
  if (lower.includes("point you choose") || lower.includes("point within range")) {
    return { type: "point", maxRange: rangeInfo.value, selfAllowed: false };
  }

  // Single creature
  if (
    lower.includes("one creature") ||
    lower.includes("a creature") ||
    lower.includes("one target") ||
    lower.includes("a target")
  ) {
    return { type: "creature", maxRange: rangeInfo.value, selfAllowed: rangeLower.includes("self") || lower.includes("you") };
  }

  // Touch
  if (rangeLower === "touch") {
    return { type: "creature", maxRange: null, selfAllowed: true };
  }

  // Default
  return { type: "creature", maxRange: rangeInfo.value, selfAllowed: rangeLower.includes("self") };
}

function parseResolution(desc: string): {
  type: "attack" | "save" | "check" | "none";
  ability?: string;
  onSuccess?: "none" | "half" | "full" | "negates";
  onFailure?: "full" | "disintegrate" | "instantKill";
} | undefined {
  const lower = desc.toLowerCase();

  // Attack roll
  if (
    lower.includes("make a melee spell attack") ||
    lower.includes("make a ranged spell attack") ||
    lower.includes("make a spell attack")
  ) {
    const isMelee = lower.includes("melee spell attack");
    const isRanged = lower.includes("ranged spell attack");
    return { type: "attack" };
  }

  // Saving throw
  const saveMatch = lower.match(/(?:must succeed on a|must make a)\s+(\w+)\s+saving throw/);
  if (saveMatch) {
    const ability = saveMatch[1];
    let onSuccess: "none" | "half" | "full" | "negates" = "none";
    let onFailure: "full" | "disintegrate" | "instantKill" = "full";

    if (lower.includes("half as much damage on a successful one") || lower.includes("half as much damage on a successful save")) {
      onSuccess = "half";
    } else     if (lower.includes("negates") || (lower.includes("no effect") && !lower.includes("this spell has no effect") && !lower.includes("the spell has no effect"))) {
      onSuccess = "negates";
    } else if (lower.includes("take no damage") || lower.includes("takes no damage")) {
      onSuccess = "none";
    }

    if (lower.includes("disintegrates") || lower.includes("disintegrated")) {
      onFailure = "disintegrate";
    }
    if (lower.includes("dies instantly") || lower.includes("instantly die") || lower.includes("die instantly")) {
      onFailure = "instantKill";
    }

    return { type: "save", ability, onSuccess, onFailure };
  }

  // Ability check
  if (lower.includes("make an ability check") || lower.includes("make a check")) {
    return { type: "check" };
  }

  return undefined;
}

function parseEffects(desc: string, raw: RawSpell): Effect[] {
  const effects: Effect[] = [];
  const lower = desc.toLowerCase();

  // Damage
  const damageMatch = desc.match(/(\d+d\d+(?:\s*[+\-]\s*\d+)?)\s+(\w+)\s+damage/i);
  if (damageMatch) {
    const amount = damageMatch[1];
    const damageType = damageMatch[2].toLowerCase();
    const resolution = parseResolution(desc);
    
    effects.push({
      type: "damage",
      trigger: resolution?.type === "save" ? "onSave" : resolution?.type === "attack" ? "onHit" : "immediate",
      condition: resolution?.type === "save" && lower.includes("failed save") ? "failed save" : undefined,
      amount,
      damageType,
    });
  }

  // Healing
  const healMatch = desc.match(/regains?\s+(?:a\s+)?(?:number\s+of\s+)?hit\s+points?\s+(?:equal\s+to\s+)?(\d+d\d+(?:\s*[+\-]\s*\d+)?)/i);
  if (healMatch && !effects.find(e => e.type === "damage")) {
    effects.push({
      type: "healing",
      trigger: "immediate",
      amount: healMatch[1],
      description: desc.match(/regains?\s+(?:a\s+)?(?:number\s+of\s+)?hit\s+points[^.]*/i)?.[0],
    });
  }

  // Buff: bonus to AC, attack, damage, etc.
  const acBonus = desc.match(/(\+?\d+)\s+bonus\s+to\s+ac/i);
  if (acBonus) {
    effects.push({
      type: "buff",
      trigger: "immediate",
      bonus: parseInt(acBonus[1]),
      bonusTo: "AC",
      duration: raw.duration,
    });
  }

  const attackBonus = desc.match(/(\+?\d+)\s+bonus\s+to\s+attack\s+rolls?\s+and\s+damage\s+rolls?/i);
  if (attackBonus) {
    effects.push({
      type: "buff",
      trigger: "immediate",
      bonus: parseInt(attackBonus[1]),
      bonusTo: "attack rolls and damage rolls",
      duration: raw.duration,
    });
  }

  // Specific d4/d6/d8/d10/d12 bonus (Bless, etc.)
  const diceBonus = desc.match(/roll\s+a\s+(d4|d6|d8|d10|d12)\s+and\s+add\s+the\s+number\s+rolled\s+to\s+(?:the\s+)?([\w\s]+?)(?:\s*[,.])/i);
  if (diceBonus) {
    effects.push({
      type: "buff",
      trigger: "immediate",
      effectType: `${diceBonus[1]} bonus`,
      bonusTo: diceBonus[2].trim(),
      duration: raw.duration,
    });
  }

  // Advantage/disadvantage
  if (lower.includes("advantage on") && !lower.includes("disadvantage on")) {
    const advMatch = desc.match(/advantage\s+on\s+([\w\s]+?)(?:\s*[,.])/i);
    effects.push({
      type: "buff",
      trigger: "immediate",
      effectType: "advantage",
      bonusTo: advMatch ? advMatch[1].trim() : undefined,
      duration: raw.duration,
    });
  }

  if (lower.includes("disadvantage on") && !lower.includes("advantage on")) {
    const disMatch = desc.match(/disadvantage\s+on\s+([\w\s]+?)(?:\s*[,.])/i);
    effects.push({
      type: "debuff",
      trigger: "immediate",
      effectType: "disadvantage",
      bonusTo: disMatch ? disMatch[1].trim() : undefined,
      duration: raw.duration,
    });
  }

  // Condition: restrained, frightened, invisible, etc.
  const conditionMatch = desc.match(/(?:become\s+|is\s+|are\s+)(\w+)(?:\s+for\s+the\s+duration)?/i);
  const conditions = ["restrained", "frightened", "invisible", "paralyzed", "stunned", "poisoned", "blinded", "deafened", "charmed", "incapacitated"];
  if (conditionMatch && conditions.includes(conditionMatch[1].toLowerCase())) {
    // Skip "invisible" if it's part of "invisible barrier" or "invisible to"
    if (conditionMatch[1].toLowerCase() === "invisible" && lower.includes("invisible barrier")) {
      // skip
    } else {
      effects.push({
        type: "condition",
        trigger: "immediate",
        effectType: conditionMatch[1].toLowerCase(),
        duration: raw.duration,
      });
    }
  }

  // Specific condition checks
  if (lower.includes("restrained by")) {
    effects.push({
      type: "condition",
      trigger: "onSave",
      condition: "failed save",
      effectType: "restrained",
      duration: raw.duration,
    });
  }
  if (lower.includes("unconscious") && !lower.includes("isn't knocked unconscious") && !lower.includes("is not knocked unconscious")) {
    effects.push({
      type: "condition",
      trigger: "immediate",
      effectType: "unconscious",
      duration: raw.duration,
    });
  }
  if (lower.includes("invisible") && !lower.includes("see invisible") && !lower.includes("invisible barrier")) {
    effects.push({
      type: "condition",
      trigger: "immediate",
      effectType: "invisible",
      duration: raw.duration,
    });
  }

  // Difficult terrain
  if (lower.includes("difficult terrain")) {
    effects.push({
      type: "control",
      trigger: "immediate",
      effectType: "difficultTerrain",
      description: "The area becomes difficult terrain",
    });
  }

  // Heavily obscured
  if (lower.includes("heavily obscured")) {
    effects.push({
      type: "control",
      trigger: "immediate",
      effectType: "heavilyObscured",
      description: "The area is heavily obscured",
    });
  }

  // Ignites flammable objects
  if (lower.includes("ignites flammable objects")) {
    effects.push({
      type: "utility",
      trigger: "immediate",
      special: "igniteFlammableObjects",
      description: "It ignites flammable objects in the area that aren't being worn or carried",
    });
  }

  // Spreads around corners
  if (lower.includes("spreads around corners")) {
    effects.push({
      type: "utility",
      trigger: "immediate",
      special: "spreadAroundCorners",
      description: "The fire spreads around corners",
    });
  }

  // Summon - must be actual summoning, not just "conjured plants wilt away"
  if ((lower.includes("summon") || lower.includes("conjure")) && !lower.includes("conjured plants wilt away") && !lower.includes("conjured animals") && !lower.includes("conjure woodland beings") && !lower.includes("conjure minor elementals") && !lower.includes("conjure elemental") && !lower.includes("conjure fey")) {
    effects.push({
      type: "summon",
      trigger: "immediate",
      description: desc.match(/summon[^.]+/i)?.[0] || desc.match(/conjure[^.]+/i)?.[0],
    });
  }
  // Handle specific conjure spells
  if (lower.includes("conjure animals") || lower.includes("conjure woodland beings") || lower.includes("conjure minor elementals") || lower.includes("conjure elemental") || lower.includes("conjure fey")) {
    effects.push({
      type: "summon",
      trigger: "immediate",
      description: desc.match(/you summon[^.]+/i)?.[0] || desc.match(/you conjure[^.]+/i)?.[0],
    });
  }

  // Teleport
  if (lower.includes("teleport")) {
    const distMatch = desc.match(/teleport\s+(?:up\s+to\s+)?(\d+)\s+feet/i);
    effects.push({
      type: "teleport",
      trigger: "immediate",
      amount: distMatch ? `${distMatch[1]} feet` : undefined,
      description: desc.match(/teleport[^.]+/i)?.[0],
    });
  }

  // Shield / AC bonus reaction
  if ((lower.includes("+5 bonus to ac") || lower.includes("+5 bonus to your ac")) && !lower.includes("invisible barrier")) {
    effects.push({
      type: "buff",
      trigger: "onCast",
      bonus: 5,
      bonusTo: "AC",
      duration: raw.duration,
      description: "You have a +5 bonus to AC, including against the triggering attack",
    });
  }

  // Counterspell / spell negation
  if ((lower.includes("counterspell") || lower.includes("interrupt a creature in the process of casting")) && !lower.includes("power word kill")) {
    effects.push({
      type: "utility",
      trigger: "onCast",
      special: "counterspell",
      description: "You attempt to interrupt a creature in the process of casting a spell",
    });
  }

  // Spell fails / has no effect - only for actual counterspell-like effects
  if ((lower.includes("spell fails") || (lower.includes("has no effect") && !lower.includes("this spell has no effect") && !lower.includes("the spell has no effect"))) && !lower.includes("counterspell")) {
    effects.push({
      type: "utility",
      trigger: "onCast",
      special: "negateSpell",
      description: "The target spell fails and has no effect",
    });
  }

  // Disintegrate
  if (lower.includes("disintegrate") || lower.includes("reduced to 0 hit points, it is disintegrated")) {
    effects.push({
      type: "damage",
      trigger: "immediate",
      special: "disintegrateIfZeroHP",
      description: "If this damage reduces the target to 0 hit points, it is disintegrated",
    });
  }

  // Power Word Kill
  if (lower.includes("power word kill") || lower.includes("dies instantly") || lower.includes("die instantly")) {
    const hpMatch = desc.match(/(\d+)\s+hit\s+points?\s+or\s+fewer/i);
    effects.push({
      type: "utility",
      trigger: "immediate",
      special: "instantKill",
      description: hpMatch ? `If the creature has ${hpMatch[1]} hit points or fewer, it dies instantly` : "The creature dies instantly if it has 100 hit points or fewer",
    });
  }

  // Extra action (Haste)
  if (lower.includes("additional action") || lower.includes("extra action")) {
    effects.push({
      type: "buff",
      trigger: "immediate",
      special: "extraAction",
      description: "The target gains an additional action on each of its turns",
      duration: raw.duration,
    });
  }

  // Double speed
  if (lower.includes("speed is doubled")) {
    effects.push({
      type: "buff",
      trigger: "immediate",
      special: "doubleSpeed",
      description: "The target's speed is doubled",
      duration: raw.duration,
    });
  }

  // Lethargy / exhaustion after spell ends
  if (lower.includes("wave of lethargy") || lower.includes("can't move or take actions until after its next turn")) {
    effects.push({
      type: "debuff",
      trigger: "onEnd",
      effectType: "lethargy",
      description: "When the spell ends, the target can't move or take actions until after its next turn",
    });
  }

  // Spell ends if target attacks or casts
  if (lower.includes("spell ends for a target that attacks") || lower.includes("spell ends for the target that attacks or casts")) {
    effects.push({
      type: "utility",
      trigger: "onAction",
      special: "endsOnAttackOrCast",
      description: "The spell ends if the target attacks or casts a spell",
    });
  }

  // Damage resistance
  if (lower.includes("resistance to") && !lower.includes("damage resistance")) {
    const resistMatch = desc.match(/resistance\s+to\s+([\w\s]+?)\s+damage/i);
    if (resistMatch) {
      effects.push({
        type: "buff",
        trigger: "immediate",
        effectType: "resistance",
        bonusTo: resistMatch[1].trim() + " damage",
        duration: raw.duration,
      });
    }
  }

  // Transform (Polymorph, etc.)
  if (lower.includes("transforms a creature") || lower.includes("transform into a new form") || lower.includes("polymorph")) {
    effects.push({
      type: "utility",
      trigger: "immediate",
      special: "transform",
      description: "The target creature is transformed into a new form",
      duration: raw.duration,
    });
  }

  // Wish - free-form, mark as special
  if (raw.index === "wish") {
    effects.length = 0;
    effects.push({
      type: "utility",
      trigger: "immediate",
      special: "freeForm",
      description: "Wish can duplicate any spell of 8th level or lower, or produce one of several powerful effects (create object, restore all HP, grant resistance/immunity, undo recent event). See spell description for details.",
    });
  }

  // If no effects were found, add a generic one
  if (effects.length === 0) {
    effects.push({
      type: "utility",
      trigger: "immediate",
      description: getDesc(raw),
    });
  }

  return effects;
}

function parseScaling(raw: RawSpell): Scaling | undefined {
  const higher = getHigher(raw);
  if (!higher) return undefined;

  const lower = higher.toLowerCase();

  // Slot level scaling
  if (lower.includes("spell slot of") || lower.includes("using a spell slot")) {
    const levelMatch = higher.match(/(\d+)(?:st|nd|rd|th)\s+level\s+or\s+higher/i);
    if (levelMatch) {
      const baseLevel = parseInt(levelMatch[1]);
      let appliesTo = "damage";
      let increment: string | undefined;

      if (lower.includes("damage increases by")) {
        const dmgMatch = higher.match(/damage increases by\s+(\d+d\d+)/i);
        increment = dmgMatch ? dmgMatch[1] : undefined;
        appliesTo = "damage";
      } else if (lower.includes("healing increases by")) {
        const healMatch = higher.match(/healing increases by\s+(\d+d\d+)/i);
        increment = healMatch ? healMatch[1] : undefined;
        appliesTo = "healing";
      } else if (lower.includes("target one additional creature")) {
        appliesTo = "targets";
      } else if (lower.includes("duration")) {
        appliesTo = "duration";
      }

      return {
        type: "slotLevel",
        description: higher,
        appliesTo,
        increment,
        startsAtLevel: baseLevel + 1,
      };
    }
  }

  // Cantrip scaling
  if (lower.includes("at 5th level") || lower.includes("at 11th level") || lower.includes("at 17th level")) {
    return {
      type: "cantrip",
      description: higher,
      appliesTo: "damage",
    };
  }

  return undefined;
}

function parseSpecial(desc: string, raw: RawSpell): SpecialRule[] {
  const specials: SpecialRule[] = [];
  const lower = desc.toLowerCase();

  // Disintegrate auto-destroy
  if (lower.includes("automatically disintegrates a large or smaller nonmagical object")) {
    specials.push({
      rule: "autoDisintegrate",
      description: "This spell automatically disintegrates a Large or smaller nonmagical object or a creation of magical force",
    });
  }

  // Shapechanger auto-succeed
  if (lower.includes("shapechanger automatically succeeds")) {
    specials.push({
      rule: "shapechangerImmune",
      description: "A shapechanger automatically succeeds on the saving throw",
    });
  }

  // Undead/construct immunity
  if (lower.includes("no effect on undead or constructs")) {
    specials.push({
      rule: "undeadConstructImmune",
      description: "This spell has no effect on undead or constructs",
    });
  }

  // Excess damage carries over (Polymorph)
  if (lower.includes("excess damage carries over")) {
    specials.push({
      rule: "excessDamageCarriesOver",
      description: "If the target reverts as a result of dropping to 0 hit points, any excess damage carries over to its normal form",
    });
  }

  // Objects can't be targetted (invisibility on objects?)
  if (lower.includes("doesn't affect objects")) {
    specials.push({
      rule: "objectsUnaffected",
      description: "The spell doesn't affect objects",
    });
  }

  // Concentration break on damage
  if (lower.includes("concentration") && lower.includes("taking damage")) {
    specials.push({
      rule: "concentrationBreakOnDamage",
      description: "The spell ends if you lose concentration (e.g., when taking damage)",
    });
  }

  // Magic weapon
  if (lower.includes("becomes a magic weapon")) {
    specials.push({
      rule: "magicWeapon",
      description: "The target weapon becomes a magic weapon",
    });
  }

  // Wish stress
  if (raw.index === "wish" && lower.includes("stress of casting this spell")) {
    specials.push({
      rule: "wishStress",
      description: "Casting wish for effects other than duplicating a spell causes stress: 1d10 necrotic damage per spell level, Strength drops to 3 for 2d4 days, 33% chance of never casting wish again",
    });
  }

  return specials;
}

function applySpecialOverrides(raw: RawSpell, mechanics: SpellMechanics): SpellMechanics {
  const desc = getDesc(raw).toLowerCase();
  const index = raw.index;

  if (index === "web") {
    mechanics.effects = [
      {
        type: "condition",
        trigger: "onSave",
        condition: "failed save",
        effectType: "restrained",
        duration: raw.duration,
      },
      {
        type: "control",
        trigger: "immediate",
        effectType: "difficultTerrain",
        description: "The webs are difficult terrain and lightly obscure their area",
      },
      {
        type: "utility",
        trigger: "immediate",
        special: "flammable",
        description: "The webs are flammable. Any 5-foot cube of webs exposed to fire burns away in 1 round, dealing 2d4 fire damage to any creature that starts its turn in the fire",
      },
    ];
    mechanics.resolution = { type: "save", ability: "dexterity", onSuccess: "none", onFailure: "full" };
  }

  if (index === "blur") {
    mechanics.effects = [
      {
        type: "debuff",
        trigger: "immediate",
        effectType: "disadvantage",
        bonusTo: "attack rolls against you",
        duration: raw.duration,
        description: "Any creature has disadvantage on attack rolls against you. An attacker is immune if it doesn't rely on sight or can see through illusions.",
      },
    ];
  }

  if (index === "stoneskin") {
    mechanics.effects = [
      {
        type: "buff",
        trigger: "immediate",
        effectType: "resistance",
        bonusTo: "nonmagical bludgeoning, piercing, and slashing damage",
        duration: raw.duration,
        description: "The target has resistance to nonmagical bludgeoning, piercing, and slashing damage",
      },
    ];
  }

  if (index === "suggestion") {
    mechanics.effects = [
      {
        type: "condition",
        trigger: "onSave",
        condition: "failed save",
        effectType: "charmed",
        duration: raw.duration,
        description: "On a failed save, the target pursues the course of action you described to the best of its ability",
      },
    ];
    mechanics.resolution = { type: "save", ability: "wisdom", onSuccess: "none", onFailure: "full" };
  }

  if (index === "bless") {
    mechanics.targeting = { type: "multiple", maxTargets: 3, maxRange: 30, selfAllowed: false };
    mechanics.effects = [
      {
        type: "buff",
        trigger: "immediate",
        effectType: "d4 bonus",
        bonusTo: "attack roll or saving throw",
        duration: raw.duration,
        description: "Whenever a target makes an attack roll or a saving throw before the spell ends, the target can roll a d4 and add the number rolled to the attack roll or saving throw",
      },
    ];
  }

  if (index === "shield") {
    mechanics.effects = [
      {
        type: "buff",
        trigger: "onCast",
        bonus: 5,
        bonusTo: "AC",
        duration: raw.duration,
        description: "Until the start of your next turn, you have a +5 bonus to AC, including against the triggering attack",
      },
      {
        type: "utility",
        trigger: "onCast",
        special: "negateMagicMissile",
        description: "You take no damage from magic missile",
      },
    ];
  }

  if (index === "magic-missile") {
    mechanics.effects = [
      {
        type: "damage",
        trigger: "immediate",
        amount: "1d4 + 1",
        damageType: "force",
        description: "You create three glowing darts of magical force. Each dart automatically hits a creature of your choice within range.",
        special: "autoHit",
      },
    ];
    mechanics.resolution = undefined;
  }

  if (index === "counterspell") {
    mechanics.effects = [
      {
        type: "utility",
        trigger: "onCast",
        special: "counterspell",
        description: "You attempt to interrupt a creature in the process of casting a spell",
      },
    ];
    mechanics.resolution = { type: "check" };
  }

  if (index === "disintegrate") {
    mechanics.targeting = { type: "creature", maxRange: 60, selfAllowed: false };
  }

  if (index === "conjure-animals") {
    mechanics.effects = [
      {
        type: "summon",
        trigger: "immediate",
        description: "You summon fey spirits that take the form of beasts. Choose one: one beast of CR 2 or lower, two beasts of CR 1 or lower, four beasts of CR 1/2 or lower, or eight beasts of CR 1/4 or lower.",
      },
    ];
  }

  if (index === "haste") {
    mechanics.effects = [
      {
        type: "buff",
        trigger: "immediate",
        special: "doubleSpeed",
        description: "The target's speed is doubled",
        duration: raw.duration,
      },
      {
        type: "buff",
        trigger: "immediate",
        bonus: 2,
        bonusTo: "AC",
        duration: raw.duration,
      },
      {
        type: "buff",
        trigger: "immediate",
        effectType: "advantage",
        bonusTo: "dexterity saving throws",
        duration: raw.duration,
      },
      {
        type: "buff",
        trigger: "immediate",
        special: "extraAction",
        description: "The target gains an additional action on each of its turns. That action can be used only to take the Attack (one weapon attack only), Dash, Disengage, Hide, or Use an Object action.",
        duration: raw.duration,
      },
      {
        type: "debuff",
        trigger: "onEnd",
        effectType: "lethargy",
        description: "When the spell ends, the target can't move or take actions until after its next turn, as a wave of lethargy sweeps over it",
      },
    ];
  }

  if (index === "invisibility") {
    mechanics.effects = [
      {
        type: "condition",
        trigger: "immediate",
        effectType: "invisible",
        duration: raw.duration,
      },
      {
        type: "utility",
        trigger: "onAction",
        special: "endsOnAttackOrCast",
        description: "The spell ends for a target that attacks or casts a spell",
      },
    ];
  }

  if (index === "power-word-kill") {
    mechanics.effects = [
      {
        type: "utility",
        trigger: "immediate",
        special: "instantKill",
        description: "If the creature you choose has 100 hit points or fewer, it dies instantly. Otherwise, the spell has no effect.",
      },
    ];
  }

  if (index === "polymorph") {
    mechanics.effects = [
      {
        type: "utility",
        trigger: "onSave",
        condition: "failed save",
        special: "transform",
        description: "The target creature is transformed into a new form. An unwilling creature must make a wisdom saving throw to avoid the effect.",
        duration: raw.duration,
      },
    ];
    mechanics.resolution = { type: "save", ability: "wisdom", onSuccess: "negates", onFailure: "full" };
  }

  if (index === "wish") {
    mechanics.effects = [
      {
        type: "utility",
        trigger: "immediate",
        special: "freeForm",
        description: "Wish can duplicate any spell of 8th level or lower, or produce one of several powerful effects. See spell description for full details.",
      },
    ];
    mechanics.scaling = undefined;
  }

  if (index === "burning-hands") {
    mechanics.targeting = { type: "area", shape: "cone", size: 15, maxRange: null, selfAllowed: true };
  }

  if (index === "lightning-bolt") {
    mechanics.targeting = { type: "area", shape: "line", size: 100, maxRange: null, selfAllowed: true };
  }

  if (index === "cone-of-cold") {
    mechanics.targeting = { type: "area", shape: "cone", size: 60, maxRange: null, selfAllowed: true };
  }

  if (index === "fear") {
    mechanics.targeting = { type: "area", shape: "cone", size: 30, maxRange: null, selfAllowed: true };
    mechanics.effects = [
      {
        type: "condition",
        trigger: "onSave",
        condition: "failed save",
        effectType: "frightened",
        duration: raw.duration,
        description: "A target must succeed on a wisdom saving throw or drop whatever it is holding and become frightened for the duration. While frightened by this spell, a creature must take the Dash action and move away from you by the safest available route on each of its turns.",
      },
    ];
    mechanics.resolution = { type: "save", ability: "wisdom", onSuccess: "none", onFailure: "full" };
  }

  if (index === "wall-of-force") {
    mechanics.effects = [
      {
        type: "control",
        trigger: "immediate",
        effectType: "createBarrier",
        description: "An invisible wall of force springs into existence at a point you choose within range. Nothing can physically pass through the wall. It is immune to all damage and can't be dispelled by dispel magic. A disintegrate spell destroys the wall instantly.",
        duration: raw.duration,
      },
    ];
    mechanics.resolution = undefined;
  }

  if (index === "dimension-door") {
    mechanics.effects = [
      {
        type: "teleport",
        trigger: "immediate",
        amount: "500 feet",
        description: "You teleport yourself from your current location to any other spot within range. You can bring one willing creature of your size or smaller.",
      },
    ];
    mechanics.resolution = undefined;
  }

  if (index === "mage-armor") {
    mechanics.effects = [
      {
        type: "buff",
        trigger: "immediate",
        special: "baseAC13PlusDex",
        description: "The target's base AC becomes 13 + its Dexterity modifier. The spell ends if the target dons armor or if you dismiss the spell as an action.",
        duration: raw.duration,
      },
    ];
  }

  return mechanics;
}

function extractSpellMechanics(raw: RawSpell): SpellMechanics {
  const desc = getDesc(raw);
  const higher = getHigher(raw);
  const school = getSchool(raw);
  const rangeInfo = parseRange(raw);
  const durationInfo = parseDuration(raw);
  const targeting = parseTargeting(raw, desc);
  const resolution = parseResolution(desc);
  const effects = parseEffects(desc, raw);
  const scaling = parseScaling(raw);
  const special = parseSpecial(desc, raw);

  const mechanics: SpellMechanics = {
    spell: raw.name,
    index: raw.index,
    level: raw.level,
    school,
    casting: {
      time: parseTime(raw),
      range: rangeInfo.value,
      rangeUnit: rangeInfo.unit,
      components: parseComponents(raw),
      material: raw.material,
      concentration: raw.concentration,
      duration: durationInfo.text,
    },
    targeting,
    resolution,
    effects,
    scaling,
    special: special.length > 0 ? special : undefined,
    source: raw.source || "PHB",
    classes: raw.classes || [],
    subclasses: raw.subclasses || [],
  };

  return applySpecialOverrides(raw, mechanics);
}

function main() {
  const raw = readFileSync("src/data/2014_spells.json", "utf-8");
  const data = JSON.parse(raw) as { spells: RawSpell[] };
  const mechanics: SpellMechanics[] = data.spells.map(extractSpellMechanics);

  writeFileSync("src/data/2014_spell_mechanics.json", JSON.stringify({ spells: mechanics }, null, 2));
  console.log(`Generated ${mechanics.length} spell mechanics entries.`);
}

main();

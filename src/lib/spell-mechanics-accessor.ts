import spellMechanicsData from "@/data/2014_spell_mechanics.json";
import type { SpellMechanics } from "@/data/spell-mechanics";

export interface SpellMechanicSummary {
  spell: string;
  index: string;
  level: number;
  school: string;
  casting: {
    time: string;
    range: string;
    components: string[];
    material?: string;
    concentration: boolean;
    duration: string;
  };
  targeting: {
    type: "self" | "creature" | "point" | "area" | "multiple";
    shape?: "sphere" | "cube" | "cone" | "line" | "cylinder" | "hemisphere";
    size?: number;
    maxTargets?: number;
    maxRange: number | null;
    selfAllowed: boolean;
  };
  resolution?: {
    type: "attack" | "save" | "check" | "none";
    ability?: string;
    dcType?: string;
    onSuccess?: "none" | "half" | "full" | "negates";
    onFailure?: "full" | "disintegrate" | "instantKill";
  };
  effects: {
    type: string;
    trigger: string;
    amount?: string;
    damageType?: string;
    bonus?: number;
    bonusTo?: string;
    effectType?: string;
    special?: string;
  }[];
  scaling?: {
    type: "cantrip" | "slotLevel";
    description: string;
    appliesTo: string;
    increment?: string;
    startsAtLevel?: number;
  };
  special?: { rule: string; description: string }[];
  source: string;
  classes: string[];
  subclasses: string[];
}

const RAW = (spellMechanicsData as any).spells as SpellMechanics[];

const byIndex = new Map<string, SpellMechanics>();
const byName = new Map<string, SpellMechanics[]>();
for (const s of RAW) {
  byIndex.set(s.index, s);
  const key = s.spell.toLowerCase();
  if (!byName.has(key)) byName.set(key, []);
  byName.get(key)!.push(s);
}

function pickBest(entries: SpellMechanics[], source?: string): SpellMechanics | undefined {
  if (entries.length === 0) return undefined;
  if (entries.length === 1) return entries[0];
  if (source) {
    const src = source.toLowerCase();
    const match = entries.find((e) => (e.source || "PHB").toLowerCase() === src);
    if (match) return match;
  }
  const phb = entries.find((e) => (e.source || "PHB").toLowerCase() === "phb");
  return phb ?? entries[0];
}

function toSummary(s: SpellMechanics): SpellMechanicSummary {
  return {
    spell: s.spell,
    index: s.index,
    level: s.level,
    school: s.school,
    casting: {
      time: s.casting.time,
      range: formatRange(s.casting.range, s.casting.rangeUnit),
      components: s.casting.components,
      material: s.casting.material,
      concentration: s.casting.concentration,
      duration: s.casting.duration,
    },
    targeting: {
      type: s.targeting.type,
      shape: s.targeting.shape,
      size: s.targeting.size,
      maxTargets: s.targeting.maxTargets,
      maxRange: s.targeting.maxRange,
      selfAllowed: s.targeting.selfAllowed,
    },
    resolution: s.resolution
      ? {
          type: s.resolution.type,
          ability: s.resolution.ability,
          dcType: s.resolution.dcType,
          onSuccess: s.resolution.onSuccess,
          onFailure: s.resolution.onFailure,
        }
      : undefined,
    effects: s.effects.map((e) => ({
      type: e.type,
      trigger: e.trigger,
      amount: e.amount,
      damageType: e.damageType,
      bonus: e.bonus,
      bonusTo: e.bonusTo,
      effectType: e.effectType,
      special: e.special,
    })),
    scaling: s.scaling
      ? {
          type: s.scaling.type,
          description: s.scaling.description,
          appliesTo: s.scaling.appliesTo,
          increment: s.scaling.increment,
          startsAtLevel: s.scaling.startsAtLevel,
        }
      : undefined,
    special: s.special,
    source: s.source || "PHB",
    classes: s.classes || [],
    subclasses: s.subclasses || [],
  };
}

function formatRange(value: number | null, unit: string): string {
  if (unit === "self") return "Self";
  if (unit === "touch") return "Touch";
  if (unit === "special") return "Special";
  if (value === null) return unit === "feet" ? "0 ft" : unit;
  return `${value} ft`;
}

export function getSpellMechanic(indexOrName: string, source?: string): SpellMechanicSummary | undefined {
  const direct = byIndex.get(indexOrName);
  if (direct) return toSummary(direct);
  const entries = byName.get(indexOrName.toLowerCase());
  if (entries) {
    const best = pickBest(entries, source);
    if (best) return toSummary(best);
  }
  return undefined;
}

export function getSpellMechanicByName(name: string, source?: string): SpellMechanicSummary | undefined {
  return getSpellMechanic(name, source);
}

export function hasSpellMechanic(name: string): boolean {
  return byName.has(name.toLowerCase()) || byIndex.has(name);
}

export function getSpellMechanicNames(): string[] {
  return Array.from(byName.keys()).map((k) => k.charAt(0).toUpperCase() + k.slice(1));
}
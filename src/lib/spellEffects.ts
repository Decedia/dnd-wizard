"use client";

export type EffectType =
  | "ac_bonus"
  | "temp_hp"
  | "speed_bonus"
  | "fly_speed"
  | "swim_speed"
  | "burrow_speed"
  | "darkvision"
  | "advantage_save"
  | "advantage_check"
  | "resistance"
  | "immunity"
  | "damage_bonus"
  | "attack_bonus"
  | "disadvantage_attacks";

export interface SpellEffect {
  type: EffectType;
  value?: number;
  ability?: string;
  damageType?: string;
  description: string;
}

export interface BuffDefinition {
  id: string;
  name: string;
  level: number;
  classes: string[];
  concentration: boolean;
  effects: SpellEffect[];
}

export const BUFF_DEFINITIONS: Record<string, BuffDefinition> = {
  "mage-armor": {
    id: "mage-armor",
    name: "Mage Armor",
    level: 1,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "ac_bonus", value: 13, description: "AC becomes 13 + Dex modifier" }],
  },
  "armor-of-agathys": {
    id: "armor-of-agathys",
    name: "Armor of Agathys",
    level: 1,
    classes: ["Warlock"],
    concentration: false,
    effects: [{ type: "temp_hp", value: 5, description: "5 temporary hit points" }],
  },
  "longstrider": {
    id: "longstrider",
    name: "Longstrider",
    level: 1,
    classes: ["Bard", "Druid", "Ranger", "Wizard"],
    concentration: false,
    effects: [{ type: "speed_bonus", value: 10, description: "Speed +10 ft" }],
  },
  "absorb-elements": {
    id: "absorb-elements",
    name: "Absorb Elements",
    level: 1,
    classes: ["Druid", "Ranger", "Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "resistance", description: "Resistance to triggering damage type" }],
  },
  "shield": {
    id: "shield",
    name: "Shield",
    level: 1,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "ac_bonus", value: 5, description: "+5 AC until start of next turn" }],
  },
  "darkvision": {
    id: "darkvision",
    name: "Darkvision",
    level: 2,
    classes: ["Druid", "Ranger", "Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "darkvision", value: 60, description: "60 ft darkvision" }],
  },
  "enhance-ability": {
    id: "enhance-ability",
    name: "Enhance Ability",
    level: 2,
    classes: ["Bard", "Cleric", "Druid", "Sorcerer"],
    concentration: true,
    effects: [{ type: "advantage_check", description: "Advantage on ability checks" }],
  },
  "enlarge-reduce": {
    id: "enlarge-reduce",
    name: "Enlarge/Reduce",
    level: 2,
    classes: ["Sorcerer", "Wizard"],
    concentration: true,
    effects: [
      { type: "advantage_check", ability: "str", description: "Advantage on Strength checks" },
      { type: "damage_bonus", value: 1, description: "+1d4 damage (Enlarge)" },
    ],
  },
  "alter-self": {
    id: "alter-self",
    name: "Alter Self",
    level: 2,
    classes: ["Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "swim_speed", description: "Swimming speed equals walking speed" }],
  },
  "blur": {
    id: "blur",
    name: "Blur",
    level: 2,
    classes: ["Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "disadvantage_attacks", description: "Attack rolls against you have disadvantage" }],
  },
  "protection-from-energy": {
    id: "protection-from-energy",
    name: "Protection from Energy",
    level: 3,
    classes: ["Cleric", "Druid", "Ranger", "Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "resistance", description: "Resistance to chosen damage type" }],
  },
  "haste": {
    id: "haste",
    name: "Haste",
    level: 3,
    classes: ["Sorcerer", "Wizard"],
    concentration: true,
    effects: [
      { type: "ac_bonus", value: 2, description: "+2 AC" },
      { type: "speed_bonus", description: "Speed doubled" },
      { type: "advantage_save", ability: "dex", description: "Advantage on Dexterity saves" },
    ],
  },
  "fly": {
    id: "fly",
    name: "Fly",
    level: 3,
    classes: ["Sorcerer", "Warlock", "Wizard"],
    concentration: true,
    effects: [{ type: "fly_speed", value: 60, description: "60 ft fly speed" }],
  },
  "gaseous-form": {
    id: "gaseous-form",
    name: "Gaseous Form",
    level: 3,
    classes: ["Sorcerer", "Warlock", "Wizard"],
    concentration: true,
    effects: [
      { type: "fly_speed", value: 10, description: "10 ft fly speed" },
      { type: "resistance", description: "Resistance to nonmagical damage" },
    ],
  },
  "fire-shield": {
    id: "fire-shield",
    name: "Fire Shield",
    level: 4,
    classes: ["Wizard"],
    concentration: false,
    effects: [{ type: "resistance", damageType: "fire", description: "Resistance to fire damage" }],
  },
  "stoneskin": {
    id: "stoneskin",
    name: "Stoneskin",
    level: 4,
    classes: ["Druid", "Ranger", "Sorcerer", "Wizard"],
    concentration: true,
    effects: [{ type: "resistance", description: "Resistance to nonmagical B/P/S" }],
  },
  "holy-aura": {
    id: "holy-aura",
    name: "Holy Aura",
    level: 8,
    classes: ["Cleric"],
    concentration: true,
    effects: [{ type: "advantage_save", description: "Advantage on all saving throws" }],
  },
  "wish": {
    id: "wish",
    name: "Wish",
    level: 9,
    classes: ["Sorcerer", "Wizard"],
    concentration: false,
    effects: [{ type: "resistance", description: "Resistance to one damage type for 8 hours" }],
  },
};

export interface ActiveBuff {
  spellId: string;
  name: string;
  concentration: boolean;
}

export interface BuffModifiers {
  acBonus: number;
  tempHpBonus: number;
  speedBonus: number;
  flySpeed: number | null;
  swimSpeed: number | null;
  burrowSpeed: number | null;
  darkvisionRange: number | null;
  resistances: string[];
  advantageSaves: string[];
  advantageChecks: string[];
  damageBonus: number;
  attackBonus: number;
  disadvantageAttacks: boolean;
}

export function computeBuffModifiers(activeBuffs: ActiveBuff[]): BuffModifiers {
  const mods: BuffModifiers = {
    acBonus: 0,
    tempHpBonus: 0,
    speedBonus: 0,
    flySpeed: null,
    swimSpeed: null,
    burrowSpeed: null,
    darkvisionRange: null,
    resistances: [],
    advantageSaves: [],
    advantageChecks: [],
    damageBonus: 0,
    attackBonus: 0,
    disadvantageAttacks: false,
  };

  for (const buff of activeBuffs) {
    const def = BUFF_DEFINITIONS[buff.spellId];
    if (!def) continue;
    for (const effect of def.effects) {
      switch (effect.type) {
        case "ac_bonus":
          mods.acBonus += effect.value || 0;
          break;
        case "temp_hp":
          mods.tempHpBonus += effect.value || 0;
          break;
        case "speed_bonus":
          if (effect.value) {
            mods.speedBonus += effect.value;
          } else {
            mods.speedBonus = -1;
          }
          break;
        case "fly_speed":
          mods.flySpeed = effect.value || 0;
          break;
        case "swim_speed":
          mods.swimSpeed = -1;
          break;
        case "burrow_speed":
          mods.burrowSpeed = effect.value || 0;
          break;
        case "darkvision":
          mods.darkvisionRange = effect.value || 0;
          break;
        case "resistance":
          if (effect.damageType) {
            mods.resistances.push(effect.damageType);
          } else {
            mods.resistances.push("chosen");
          }
          break;
        case "advantage_save":
          if (effect.ability) {
            mods.advantageSaves.push(effect.ability);
          } else {
            mods.advantageSaves.push("all");
          }
          break;
        case "advantage_check":
          if (effect.ability) {
            mods.advantageChecks.push(effect.ability);
          } else {
            mods.advantageChecks.push("all");
          }
          break;
        case "damage_bonus":
          mods.damageBonus += effect.value || 0;
          break;
        case "attack_bonus":
          mods.attackBonus += effect.value || 0;
          break;
        case "disadvantage_attacks":
          mods.disadvantageAttacks = true;
          break;
      }
    }
  }

  return mods;
}

export function getAvailableBuffs(className: string, level: number): BuffDefinition[] {
  return Object.values(BUFF_DEFINITIONS).filter(
    (buff) => buff.classes.includes(className) && buff.level <= Math.ceil(level / 2)
  );
}

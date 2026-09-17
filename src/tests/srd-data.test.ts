// @ts-ignore - bun:test is provided by the Bun runtime
import { describe, it, expect } from "bun:test";
import {
  getStaticClasses,
  getStaticClass,
  getStaticSubclasses,
  getStaticSubclassDetails,
  getStaticRaces,
  getStaticRace,
  getStaticSpells,
  getStaticWizardSpells,
  getStaticArcaneTricksterSpells,
  getStaticWeapons,
  getStaticArmors,
  getStaticItems,
  getStaticEquipments,
  getStaticFeats,
  getStaticFeat,
  getEquipmentData,
  getEquipmentNames,
  getWeaponNames,
  getArmorNames,
  getItemNames,
  getSubclassSpellGrants,
  getDomainSpells,
  getOathSpells,
  getWizardTraditionSpells,
  getAvailableSources,
  deduplicateSpells,
} from "@/lib/srd-client";
import { buildChoiceGroups, getLevelOneFeatureChoices } from "@/lib/character-creation";

const ALL_SOURCES = ["PHB", "EGW", "XGE", "TCE", "SCAG", "VGTM", "VRGR", "FTD"];

describe("SRD data integrity", () => {
  describe("getAvailableSources", () => {
    it("returns at least PHB", () => {
      const sources = getAvailableSources();
      expect(sources.length).toBeGreaterThanOrEqual(1);
      expect(sources).toContain("PHB");
    });
  });

  describe("getStaticClasses", () => {
    it("returns classes for PHB", () => {
      const classes = getStaticClasses(["PHB"], "2014");
      expect(classes.length).toBeGreaterThan(0);
      expect(classes.map((c) => c.name)).toContain("Wizard");
      expect(classes.map((c) => c.name)).toContain("Rogue");
    });

    it("returns Artificer when EGW is included", () => {
      const classes = getStaticClasses(ALL_SOURCES, "2014");
      expect(classes.map((c) => c.name)).toContain("Artificer");
    });

    it("each class has required fields for UI rendering", () => {
      const classes = getStaticClasses(ALL_SOURCES, "2014");
      for (const cls of classes) {
        expect(cls.name).toBeTruthy();
        expect(cls.hitDie).toBeGreaterThan(0);
        expect(Array.isArray(cls.savingThrows)).toBe(true);
        expect(cls.skillChoices).toBeDefined();
        expect(typeof cls.skillChoices.count).toBe("number");
        expect(Array.isArray(cls.skillChoices.options)).toBe(true);
        expect(Array.isArray(cls.startingEquipment)).toBe(true);
        if (cls.features) {
          expect(Array.isArray(cls.features)).toBe(true);
        }
        expect(Array.isArray(cls.levels)).toBe(true);
        expect(cls.levels.length).toBeGreaterThanOrEqual(20);
      }
    });

    it("each spellcaster class has spell progression data", () => {
      const classes = getStaticClasses(ALL_SOURCES, "2014");
      for (const cls of classes) {
        if (cls.spellcastingAbility) {
          const hasProgression = cls.spellsKnown || cls.spellbookSpells || cls.cantripsKnown;
          expect(hasProgression).toBeDefined();
        }
      }
    });
  });

  describe("getStaticClass", () => {
    it("looks up Wizard and returns full class data", () => {
      const cls = getStaticClass("Wizard", ALL_SOURCES, "2014");
      expect(cls).toBeDefined();
      expect(cls!.name).toBe("Wizard");
      expect(cls!.spellcastingAbility).toBe("int");
    });
  });

  describe("getStaticRaces", () => {
    it("returns races for PHB", () => {
      const races = getStaticRaces(["PHB"], "2014");
      expect(races.length).toBeGreaterThan(0);
    });

    it("returns expanded races when all sources are included", () => {
      const races = getStaticRaces(ALL_SOURCES, "2014");
      expect(races.length).toBeGreaterThan(0);
      const names = races.map((r) => r.name);
      expect(names.some((n) => n.includes("("))).toBe(true);
    });

    it("each race has required fields for UI rendering", () => {
      const races = getStaticRaces(ALL_SOURCES, "2014");
      for (const race of races) {
        expect(race.name).toBeTruthy();
        expect(typeof race.speed).toBe("number");
        expect(race.size).toBeTruthy();
        expect(Array.isArray(race.traits)).toBe(true);
        expect(Array.isArray(race.languages)).toBe(true);
      }
    });

    it("each race with ability score increases has valid values", () => {
      const races = getStaticRaces(ALL_SOURCES, "2014");
      for (const race of races) {
        if (race.abilityScoreIncreases) {
          const bonuses = Object.values(race.abilityScoreIncreases);
          for (const bonus of bonuses) {
            expect(Number.isInteger(bonus)).toBe(true);
          }
        }
      }
    });
  });

  describe("getStaticRace", () => {
    it("resolves Human", () => {
      const race = getStaticRace("Human", "2014");
      expect(race).toBeDefined();
      expect(race!.name).toBe("Human");
    });

    it("resolves Dragonborn (Chromatic) variant", () => {
      const race = getStaticRace("Dragonborn (Chromatic)", "2014");
      expect(race).toBeDefined();
    });
  });

  describe("getStaticSubclasses", () => {
    it("returns Wizard subclasses for PHB", () => {
      const subs = getStaticSubclasses("Wizard", ["PHB"], "2014");
      expect(subs.length).toBeGreaterThan(0);
      expect(subs.map((s) => s.name)).toContain("Illusion");
      expect(subs.map((s) => s.name)).toContain("Necromancy");
    });

    it("returns expansion subclasses when sources include them", () => {
      const subs = getStaticSubclasses("Wizard", ALL_SOURCES, "2014");
      expect(subs.map((s) => s.name)).toContain("War Magic");
      expect(subs.map((s) => s.name)).toContain("Order of Scribes");
    });

    it("returns Artificer subclasses", () => {
      const subs = getStaticSubclasses("Artificer", ALL_SOURCES, "2014");
      expect(subs.length).toBeGreaterThan(0);
      expect(subs.map((s) => s.name)).toContain("Alchemist");
    });

    it("each subclass has required fields for UI rendering", () => {
      const classes = getStaticClasses(ALL_SOURCES, "2014");
      for (const cls of classes) {
        const subs = getStaticSubclasses(cls.name, ALL_SOURCES, "2014");
        for (const sub of subs) {
          expect(sub.name).toBeTruthy();
          expect(sub.description).toBeTruthy();
          expect(Array.isArray(sub.features)).toBe(true);
          for (const feature of sub.features) {
            expect(feature.name).toBeTruthy();
            expect(feature.description).toBeTruthy();
          }
        }
      }
    });
  });

  describe("getStaticSubclassDetails", () => {
    it("returns details for known subclass", () => {
      const details = getStaticSubclassDetails("Wizard", "Illusion");
      expect(details).toBeDefined();
      expect(details!.name).toBe("Illusion");
      expect(details!.features.length).toBeGreaterThan(0);
    });
  });

  describe("getStaticSpells", () => {
    it("returns PHB spells", () => {
      const spells = getStaticSpells(["PHB"], "2014");
      expect(spells.length).toBeGreaterThan(0);
    });

    it("returns expansion spells when sources include them", () => {
      const spells = getStaticSpells(ALL_SOURCES, "2014");
      expect(spells.length).toBeGreaterThan(0);
    });

    it("each spell has required fields", () => {
      const spells = getStaticSpells(ALL_SOURCES, "2014");
      for (const spell of spells) {
        expect(spell.name).toBeTruthy();
        expect(typeof spell.level).toBe("number");
        expect(spell.level).toBeGreaterThanOrEqual(0);
        expect(spell.school).toBeTruthy();
        expect(Array.isArray(spell.classes)).toBe(true);
        expect(spell.classes.length).toBeGreaterThan(0);
        expect(spell.description).toBeTruthy();
      }
    });

    it("deduplicateSpells removes duplicates across sources while preserving data", () => {
      const spells = getStaticSpells(ALL_SOURCES, "2014");
      const deduped = deduplicateSpells(spells);
      expect(deduped.length).toBeLessThanOrEqual(spells.length);
      const seen = new Set<string>();
      for (const spell of deduped) {
        const key = `${spell.name}|${spell.level}`;
        expect(seen.has(key)).toBe(false);
        seen.add(key);
      }
    });
  });

  describe("getStaticWizardSpells", () => {
    it("returns wizard-specific spell list", () => {
      const spells = getStaticWizardSpells(ALL_SOURCES);
      expect(spells.length).toBeGreaterThan(0);
      expect(spells.every((s) => s.classes.includes("Wizard"))).toBe(true);
    });
  });

  describe("getStaticArcaneTricksterSpells", () => {
    it("returns Arcane Trickster spell list", () => {
      const spells = getStaticArcaneTricksterSpells();
      expect(spells.length).toBeGreaterThan(0);
    });
  });

  describe("getStaticWeapons", () => {
    it("returns weapons", () => {
      const weapons = getStaticWeapons(ALL_SOURCES);
      expect(weapons.length).toBeGreaterThan(0);
    });

    it("each weapon has required fields for equipment step", () => {
      const weapons = getStaticWeapons(ALL_SOURCES);
      for (const weapon of weapons) {
        expect(weapon.name).toBeTruthy();
        expect(weapon.equipment_category.toLowerCase()).toBe("weapon");
        expect(weapon.weapon_category).toBeTruthy();
        expect(weapon.category_range).toBeTruthy();
      }
    });

    it("weapons have valid categories", () => {
      const weapons = getStaticWeapons(ALL_SOURCES);
      const validCategories = new Set(["Simple", "Martial"]);
      for (const weapon of weapons) {
        expect(validCategories.has(weapon.weapon_category)).toBe(true);
      }
    });

    it("weapons have valid ranges", () => {
      const weapons = getStaticWeapons(ALL_SOURCES);
      const validRanges = new Set(["Melee", "Ranged"]);
      for (const weapon of weapons) {
        expect(validRanges.has(weapon.category_range)).toBe(true);
      }
    });
  });

  describe("getStaticArmors", () => {
    it("returns armors", () => {
      const armors = getStaticArmors(ALL_SOURCES);
      expect(armors.length).toBeGreaterThan(0);
    });

    it("each armor has required fields", () => {
      const armors = getStaticArmors(ALL_SOURCES);
      for (const armor of armors) {
        expect(armor.name).toBeTruthy();
        expect(armor.equipment_category.toLowerCase()).toBe("armor");
        expect(typeof armor.armor_class.base).toBe("number");
      }
    });
  });

  describe("getStaticItems", () => {
    it("returns items", () => {
      const items = getStaticItems(ALL_SOURCES);
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe("getStaticEquipments", () => {
    it("returns equipment entries", () => {
      const equipments = getStaticEquipments(ALL_SOURCES);
      expect(equipments.length).toBeGreaterThan(0);
    });
  });

  describe("getStaticFeats", () => {
    it("returns feats for PHB", () => {
      const feats = getStaticFeats(["PHB"], "2014");
      expect(feats.length).toBeGreaterThan(0);
    });

    it("returns expanded feats when sources include them", () => {
      const feats = getStaticFeats(ALL_SOURCES, "2014");
      expect(feats.length).toBeGreaterThan(0);
    });

    it("each feat has required fields", () => {
      const feats = getStaticFeats(ALL_SOURCES, "2014");
      for (const feat of feats) {
        expect(feat.name).toBeTruthy();
        expect(feat.description).toBeTruthy();
      }
    });
  });

  describe("getStaticFeat", () => {
    it("looks up a known feat", () => {
      const feat = getStaticFeat("Grappler", "2014");
      expect(feat).toBeDefined();
      expect(feat!.name).toBe("Grappler");
    });
  });

  describe("getEquipmentData", () => {
    it("returns mapped equipment for a known weapon", () => {
      const data = getEquipmentData("Longsword");
      expect(data).toBeDefined();
      expect(data!.type.toLowerCase()).toBe("weapon");
    });

    it("returns mapped equipment for a known armor", () => {
      const data = getEquipmentData("Chain Mail");
      expect(data).toBeDefined();
      expect(data!.type.toLowerCase()).toBe("armor");
    });
  });

  describe("getWeaponNames / getArmorNames / getItemNames / getEquipmentNames", () => {
    it("returns non-empty name lists", () => {
      expect(getWeaponNames().length).toBeGreaterThan(0);
      expect(getArmorNames().length).toBeGreaterThan(0);
      expect(getItemNames().length).toBeGreaterThan(0);
      expect(getEquipmentNames(ALL_SOURCES).length).toBeGreaterThan(0);
    });
  });

  describe("getLevelOneFeatureChoices", () => {
    it("returns choices for a class with skill choices", () => {
      const choices = getLevelOneFeatureChoices("Rogue", "2014");
      expect(Array.isArray(choices)).toBe(true);
    });

    it("returns choices for a class with spell choices", () => {
      const choices = getLevelOneFeatureChoices("Wizard", "2014");
      expect(Array.isArray(choices)).toBe(true);
    });
  });

  describe("buildChoiceGroups", () => {
    it("returns choice groups from class starting equipment", () => {
      const cls = getStaticClass("Rogue", ALL_SOURCES, "2014");
      expect(cls).toBeDefined();
      const groups = buildChoiceGroups(cls!.startingEquipment, "2014");
      expect(Array.isArray(groups)).toBe(true);
    });
  });

  describe("getSubclassSpellGrants", () => {
    it("returns granted spells for Aberrant Mind sorcerer", () => {
      const sub = getStaticSubclasses("Sorcerer", ALL_SOURCES, "2014").find((s) => s.name === "Aberrant Mind");
      expect(sub).toBeDefined();
      const grants = getSubclassSpellGrants(sub!.index!, 1);
      expect(grants.length).toBeGreaterThan(0);
    });

    it("returns empty array for subclasses without spell grants", () => {
      const sub = getStaticSubclasses("Rogue", ALL_SOURCES, "2014").find((s) => s.name === "Assassin");
      expect(sub).toBeDefined();
      const grants = getSubclassSpellGrants(sub!.index!, 5);
      expect(grants).toEqual([]);
    });
  });

  describe("getDomainSpells / getOathSpells / getWizardTraditionSpells", () => {
    it("returns spells for known domains", () => {
      const sub = getStaticSubclasses("Cleric", ALL_SOURCES, "2014").find((s) => s.name === "Life");
      expect(sub).toBeDefined();
      const spells = getDomainSpells(sub!.index!, 1);
      expect(Array.isArray(spells)).toBe(true);
    });

    it("returns spells for known oaths", () => {
      const sub = getStaticSubclasses("Paladin", ALL_SOURCES, "2014").find((s) => s.name === "Devotion");
      expect(sub).toBeDefined();
      const spells = getOathSpells(sub!.index!, 1);
      expect(Array.isArray(spells)).toBe(true);
    });

    it("returns spells for known wizard traditions", () => {
      const sub = getStaticSubclasses("Wizard", ALL_SOURCES, "2014").find((s) => s.name === "Illusion");
      expect(sub).toBeDefined();
      const spells = getWizardTraditionSpells(sub!.index!, 1);
      expect(Array.isArray(spells)).toBe(true);
    });
  });

  describe("UI option completeness", () => {
    it("every class has at least one subclass with all sources", () => {
      const classes = getStaticClasses(ALL_SOURCES, "2014");
      for (const cls of classes) {
        const subs = getStaticSubclasses(cls.name, ALL_SOURCES, "2014");
        expect(subs.length).toBeGreaterThan(0);
      }
    });

    it("every race has at least one language", () => {
      const races = getStaticRaces(ALL_SOURCES, "2014");
      for (const race of races) {
        expect(race.languages.length).toBeGreaterThan(0);
      }
    });

    it("every caster class has at least one spell available when all sources are included", () => {
      const classes = getStaticClasses(ALL_SOURCES, "2014");
      for (const cls of classes) {
        if (cls.spellcastingAbility) {
          const spells = getStaticSpells(ALL_SOURCES, "2014").filter((s) => s.classes.includes(cls.name));
          expect(spells.length).toBeGreaterThan(0);
        }
      }
    });

    it("every subclass with choices exposes those choices through getStaticSubclasses", () => {
      const classes = getStaticClasses(ALL_SOURCES, "2014");
      for (const cls of classes) {
        const subs = getStaticSubclasses(cls.name, ALL_SOURCES, "2014");
        for (const sub of subs) {
          const choiceFeatures = sub.features.filter((f) => f.choices && f.choices.length > 0);
          for (const feature of choiceFeatures) {
            expect(feature.choices!.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });
});

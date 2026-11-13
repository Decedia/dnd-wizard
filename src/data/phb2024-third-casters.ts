// 2024 Eldritch Knight and Arcane Trickster casting (2024 Player's Handbook,
// not in SRD 5.2). The slot table is the same third-caster table as 2014;
// both prepare Wizard spells from the full list, with no school limit.
const SLOTS: Record<string, Record<string, number>> = {
  "3": { "1": 2 }, "4": { "1": 3 }, "5": { "1": 3 }, "6": { "1": 3 },
  "7": { "1": 4, "2": 2 }, "8": { "1": 4, "2": 2 }, "9": { "1": 4, "2": 2 },
  "10": { "1": 4, "2": 3 }, "11": { "1": 4, "2": 3 }, "12": { "1": 4, "2": 3 },
  "13": { "1": 4, "2": 3, "3": 2 }, "14": { "1": 4, "2": 3, "3": 2 }, "15": { "1": 4, "2": 3, "3": 2 },
  "16": { "1": 4, "2": 3, "3": 3 }, "17": { "1": 4, "2": 3, "3": 3 }, "18": { "1": 4, "2": 3, "3": 3 },
  "19": { "1": 4, "2": 3, "3": 3, "4": 1 }, "20": { "1": 4, "2": 3, "3": 3, "4": 1 },
};
const byLevel = (from: number, steps: [number, number][]) => {
  const out: Record<string, number> = {};
  for (let lvl = from; lvl <= 20; lvl++) out[String(lvl)] = steps.filter(([at]) => at <= lvl).pop()![1];
  return out;
};
const PREPARED = byLevel(3, [[3, 3], [4, 4], [7, 5], [8, 6], [10, 7], [11, 8], [13, 9], [14, 10], [16, 11], [19, 12], [20, 13]]);

/** Fields added to the 2024 Fighter and Rogue class records. */
export const THIRD_CASTERS_2024: Record<string, Record<string, unknown>> = {
  Fighter: { spellcastingAbility: "int", cantripsKnown: byLevel(3, [[3, 2], [10, 3]]), preparedSpells: PREPARED, eldritchKnightSpellSlots: SLOTS },
  Rogue: { spellcastingAbility: "int", cantripsKnown: byLevel(3, [[3, 3], [10, 4]]), preparedSpells: PREPARED, arcaneTricksterSpellSlots: SLOTS },
};

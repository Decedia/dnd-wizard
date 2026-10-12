import categoriesDataEn from "./en/race-categories.json";
import categoriesDataId from "./id/race-categories.json";

export interface RaceCategory {
  name: string;
  flavor: string;
}

const CATEGORY_DATA: Record<string, RaceCategory[]> = {
  en: (categoriesDataEn as { categories: RaceCategory[] }).categories,
  id: (categoriesDataId as { categories: RaceCategory[] }).categories,
};

const categoryCache: Record<string, Map<string, RaceCategory>> = {};

function getMap(locale: string): Map<string, RaceCategory> {
  if (categoryCache[locale]) return categoryCache[locale];
  const map = new Map<string, RaceCategory>();
  for (const category of CATEGORY_DATA[locale] ?? CATEGORY_DATA.en) {
    map.set(category.name.toLowerCase(), category);
  }
  categoryCache[locale] = map;
  return map;
}

/**
 * Which category a race belongs to. Races are named either as a parent
 * ("Dwarf") or as a variant ("Hill Dwarf", "Dragonborn (Gem)"), so the
 * category is the longest known category name that the race name extends.
 */
export function getRaceCategoryName(raceName: string, allNames: string[]): string {
  let best: string | null = null;
  for (const candidate of allNames) {
    if (candidate === raceName) continue;
    const isVariantOf =
      raceName.startsWith(`${candidate} `) ||
      raceName.startsWith(`${candidate} (`) ||
      raceName.endsWith(` ${candidate}`) ||
      raceName.includes(` ${candidate} (`);
    if (isVariantOf && (best === null || candidate.length > best.length)) {
      best = candidate;
    }
  }
  return best ?? raceName;
}

export function getRaceCategory(
  raceName: string,
  locale: string = "en",
): RaceCategory | undefined {
  return getMap(locale).get(raceName.toLowerCase());
}

export function getRaceCategoryNames(locale: string = "en"): string[] {
  return [...getMap(locale).keys()];
}

export function buildRaceCategoryIndex(
  raceNames: string[],
  locale: string = "en",
): Map<string, RaceCategory | undefined> {
  const index = new Map<string, RaceCategory | undefined>();
  for (const name of raceNames) {
    index.set(name, getRaceCategory(getRaceCategoryName(name, raceNames), locale));
  }
  return index;
}

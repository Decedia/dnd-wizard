// Indonesian for the 2024 rules data (SRD 5.2). The data files stay English;
// src/data/id/2024_text.json maps each English rules text to its Indonesian.
// Names stay English everywhere: picks, rules and saves match on them.
import textId from "@/data/id/2024_text.json";

/** The fields that hold rules text a reader sees. */
export const TEXT_FIELDS_2024 = new Set(["description", "higherLevel", "materialDesc", "flavor", "summary"]);

/** A copy of the data with every text field swapped for its entry in `map` (left English when missing). */
export function translate2024<T>(data: T, map: Record<string, string>, key?: string): T {
  if (Array.isArray(data)) return data.map((v) => translate2024(v, map, key)) as T;
  if (data && typeof data === "object") {
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, translate2024(v, map, k)])) as T;
  }
  if (typeof data === "string" && key && TEXT_FIELDS_2024.has(key)) return (map[data] ?? data) as T;
  return data;
}

/** A locale map with English and a lazily built Indonesian copy. */
export function withIndonesian<T>(en: T): Record<string, T> {
  let id: T | undefined;
  return {
    en,
    get id() {
      return (id ??= translate2024(en, textId as Record<string, string>));
    },
  };
}

import { getStaticClasses, getStaticSubclasses, getStaticSubclassDetails, getStaticRaces, getStaticFeats } from "@/lib/srd-client";
export function allFeatureNames(): string[] {
  const names = new Set<string>();
  for (const cls of getStaticClasses() as any[]) {
    for (const level of cls.levels || []) for (const f of level.features || []) names.add(f.name);
    for (const f of cls.features || []) if (f?.name) names.add(f.name);
    for (const sub of getStaticSubclasses(cls.name) as any[]) {
      for (const f of getStaticSubclassDetails(cls.name, sub.name)?.features || []) names.add(f.name);
    }
  }
  for (const race of getStaticRaces() as any[]) {
    for (const tr of race.traits || []) names.add(typeof tr === "string" ? tr : tr.name);
    for (const sr of race.subraces || []) for (const tr of sr.traits || []) names.add(typeof tr === "string" ? tr : tr.name);
  }
  for (const feat of getStaticFeats() as any[]) names.add(feat.name);
  return [...names].filter(Boolean);
}

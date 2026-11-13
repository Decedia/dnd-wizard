import { getStaticSpells, getClassSpells, getSubclassFlags, deduplicateSpells } from "@/lib/srd-client";
import type { Character } from "@/lib/storage";
import { getWarlockExpandedSpellNames, isThirdCaster } from "@/lib/storage";
import { getGrantedSpellNames } from "@/lib/granted-spells";

/** 2014 Eldritch Knight and Arcane Trickster spells come from two schools (with a few free picks). */
export const THIRD_CASTER_SCHOOLS: Record<string, string[]> = {
  "eldritch-knight": ["abjuration", "evocation"],
  "arcane-trickster": ["enchantment", "illusion"],
};

/** The schools a third caster's spells must come from; none in 2024, which uses the whole Wizard list. */
export function thirdCasterSchools(ruleset: string | undefined, subclass: string | undefined): string[] | undefined {
  if (ruleset === "2024") return undefined;
  return THIRD_CASTER_SCHOOLS[(subclass || "").toLowerCase().replace(/\s+/g, "-")];
}

/**
 * The spells a class can pick from up to `maxLevel`: the class list (or the
 * Arcane Trickster's mage list), a warlock patron's expanded spells, minus
 * spells the character already gets free. A wizard can still copy a free
 * spell into the spellbook, so "book" keeps them.
 */
export function spellChoicePool(
  character: Character,
  opts: { subclass?: string; maxLevel: number; selectionType?: "known" | "book" | "prepare"; castingLevel?: number; language?: string }
) {
  const subclass = opts.subclass || character.subclass;
  const language = opts.language || "en";
  const flags = character.subclassIndex ? getSubclassFlags(character.subclassIndex) : {};
  const patronSpells = new Set(getWarlockExpandedSpellNames({ ...character, level: 20 }, subclass).map((n) => n.toLowerCase()));
  const classSpells = flags.usesMageSpellList ? getClassSpells("arcane-trickster", language) : [];
  const grantedNames = new Set(
    opts.selectionType === "book"
      ? []
      : getGrantedSpellNames({ ...character, subclass, level: opts.castingLevel ?? character.level }).map((n) => n.toLowerCase())
  );
  // A 2024 Eldritch Knight or Arcane Trickster picks from the Wizard list.
  const listClass = character.ruleset === "2024" && isThirdCaster(subclass) ? "Wizard" : character.class;
  const inRange = (s: any) => s.level === 0 || s.level <= opts.maxLevel;
  const all = classSpells.length > 0
    ? deduplicateSpells(classSpells.filter(inRange))
    : deduplicateSpells(getStaticSpells(character.sources, character.ruleset, language).filter((s) => (s.classes?.includes(listClass) || patronSpells.has(s.name.toLowerCase())) && inRange(s)));
  return all.filter((s: any) => !grantedNames.has(String(s.name).toLowerCase()));
}

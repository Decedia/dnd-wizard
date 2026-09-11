import { getModifier } from "./storage";
import { getStaticClass } from "./srd-client";
import type { Character } from "./storage";

export function resolveSpellMacros(text: string, character: Character | undefined): string {
  if (!text || !character) return text;

  const classData = getStaticClass(character.class, character.ruleset);
  const abilityKey = classData?.spellcastingAbility as keyof Character | undefined;
  const abilityScore = abilityKey ? (character[abilityKey] as number | undefined) : undefined;
  const modifier = abilityScore !== undefined ? getModifier(abilityScore) : null;

  return text.replace(/\{\{spellcastingmodifier\}\}/gi, () => {
    return modifier !== null ? `${modifier}` : "";
  });
}

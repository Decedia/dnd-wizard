// Which spells a preparing caster (Cleric, Druid, Paladin, Wizard, Artificer)
// has ready. One place for the sheet, the turn panel, level-up and creation.
import { getGrantedSpellNames } from "./granted-spells";
import { getMaxPreparedSpells, isPreparationCaster, type Character } from "./storage";

export interface PreparableSpell {
  id: string;
  name: string;
  level: number;
}

/** Leveled spells that take up a prepared pick. Granted spells are always ready and never count. */
export function preparableSpells(character: Character): PreparableSpell[] {
  const granted = new Set(getGrantedSpellNames(character).map((n) => n.toLowerCase()));
  const seen = new Set<string>();
  const out: PreparableSpell[] = [];
  for (const s of character.spells || []) {
    if (!(s.level > 0) || s.granted || granted.has((s.srdSpellName || s.name).toLowerCase()) || seen.has(s.id)) continue;
    seen.add(s.id);
    out.push({ id: s.id, name: s.name, level: s.level });
  }
  return out;
}

/**
 * A prepared list filled up to `limit`: the picks already made come first,
 * then spells are added one per spell level, highest level first, round and
 * round, so the list covers every level the character can cast.
 */
export function fillPrepared(spells: PreparableSpell[], current: string[], limit: number): string[] {
  const valid = new Set(spells.map((s) => s.id));
  const picked = [...new Set(current.filter((id) => valid.has(id)))].slice(0, Math.max(0, limit));
  const chosen = new Set(picked);
  const byLevel = new Map<number, PreparableSpell[]>();
  for (const s of spells) {
    if (chosen.has(s.id)) continue;
    byLevel.set(s.level, [...(byLevel.get(s.level) || []), s]);
  }
  const levels = [...byLevel.keys()].sort((a, b) => b - a);
  while (picked.length < limit && levels.some((l) => byLevel.get(l)!.length > 0)) {
    for (const level of levels) {
      const next = byLevel.get(level)!.shift();
      if (next && picked.length < limit) picked.push(next.id);
    }
  }
  return picked;
}

/** The suggested prepared list for a character, keeping what is already prepared. */
export function suggestPrepared(character: Character, current: string[] = character.preparedSpells || []): string[] {
  return fillPrepared(preparableSpells(character), current, getMaxPreparedSpells(character));
}

/** A preparing caster who owns leveled spells but has none of them ready. */
export function needsPrepare(character: Character): boolean {
  if (!isPreparationCaster(character)) return false;
  const spells = preparableSpells(character);
  if (spells.length === 0) return false;
  const prepared = new Set(character.preparedSpells || []);
  return !spells.some((s) => prepared.has(s.id));
}

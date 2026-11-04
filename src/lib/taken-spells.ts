import { getStaticSpells } from "./srd-client";
import { getGrantedSpellNames } from "./granted-spells";
import type { Character } from "./storage";

let spellNames: Map<string, string> | null = null;

/** Every spell name in the data, lowercased, to tell spell picks from other picks. */
function allSpellNames(): Map<string, string> {
  if (!spellNames) spellNames = new Map(getStaticSpells([]).map((s) => [s.name.toLowerCase(), s.name]));
  return spellNames;
}

/**
 * The spell names among stored pick values. Values can be lists ("A, B"),
 * spell keys ("Bless:1") or feat options ("spell=Bless"); anything that isn't
 * a spell name (a fighting style, a skill) is dropped.
 */
export function spellNamesIn(values: unknown[]): string[] {
  const names = allSpellNames();
  const out: string[] = [];
  for (const raw of values) {
    for (const part of String(raw ?? "").split(", ")) {
      const value = part.includes("=") ? part.slice(part.indexOf("=") + 1) : part;
      const name = value.replace(/:\d+$/, "").trim().toLowerCase();
      if (name && names.has(name)) out.push(name);
    }
  }
  return out;
}

/**
 * Every spell the character already has, from any source: the spell list,
 * cantrips, free spells (subclass, race, terrain), and spells picked through a
 * class, subclass or feat option (a race's cantrip pick counts as a free
 * spell). `pending` adds picks not saved yet, such as other levels in the
 * level-up wizard. Names are lowercased.
 */
export function getTakenSpellNames(character: Character, pending: unknown[] = []): Set<string> {
  const taken = new Set<string>();
  for (const s of [...(character.spells || []), ...(character.cantrips || [])]) if (s?.name) taken.add(s.name.toLowerCase());
  // A half-built character (creation) can lack the fields the free-spell lookup reads.
  try {
    for (const name of getGrantedSpellNames(character)) taken.add(name.toLowerCase());
  } catch {}
  for (const values of Object.values(character.featureSelections || {})) for (const name of spellNamesIn(values || [])) taken.add(name);
  for (const name of spellNamesIn(pending)) taken.add(name);
  return taken;
}

/** Whether a spell is taken by something other than the picker asking (`own`: its current picks). */
export function isSpellTakenElsewhere(taken: Set<string>, name: string, own: Iterable<string> = []): boolean {
  const lower = name.replace(/:\d+$/, "").toLowerCase();
  if (!taken.has(lower)) return false;
  for (const o of own) if (o.replace(/:\d+$/, "").toLowerCase() === lower) return false;
  return true;
}

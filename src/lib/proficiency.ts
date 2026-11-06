// Whether a character is proficient with a weapon, armor or tool. Proficiency
// comes from the class, from race and subclass features ("Elf Weapon Training",
// "Bonus Proficiency"), from feats (kept in otherProficiencies) and from tools.
import { findCatalogItem, type CatalogItem } from "@/data/item-catalog";
import { getStaticClass } from "./srd-client";
import type { Character } from "./storage";

export type ProficiencyKind = "weapon" | "armor" | "shield" | "tool";

export interface ItemProficiency {
  kind: ProficiencyKind;
  proficient: boolean;
}

type ProfSource = Pick<Character, "class" | "ruleset" | "features" | "otherProficiencies" | "toolProficiencies">;

function singular(word: string): string {
  return word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
}

/** "Crossbows, light", "light crossbows" and "the light crossbow" all become "light crossbow". */
function normalizeName(name: string): string {
  const lower = name.toLowerCase().replace(/[’‘]/g, "'").replace(/^(the|a|an)\s+/, "").trim();
  const [head, tail] = lower.split(/\s*,\s*/);
  const ordered = tail ? `${tail} ${head}` : head;
  return ordered.split(/\s+/).map(singular).join(" ");
}

/** Splits "light and medium armor, shields, and martial weapons" into single entries. */
function splitList(text: string): string[] {
  const parts = text
    .split(/,|\band\b|\bwith\b/i)
    .map((p) => p.trim())
    .filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    // "light and medium armor": "light" alone borrows the noun of the next part.
    if (/^(light|medium|heavy)$/i.test(p) && parts[i + 1] && /armor$/i.test(parts[i + 1])) out.push(`${p} armor`);
    else out.push(p);
  }
  return out;
}

const FEATURE_GRANT = /proficiency with ([^.]+?)\./gi;

function featureGrants(features: Character["features"] | undefined): string[] {
  const out: string[] = [];
  for (const f of features ?? []) {
    if (!/training|proficienc|hex warrior|tools of the trade|martial prodigy|kensei/i.test(f.name)) continue;
    for (const m of (f.description || "").matchAll(FEATURE_GRANT)) out.push(...splitList(m[1]));
  }
  return out;
}

interface ProficiencySet {
  armor: Set<string>; // light, medium, heavy, shield
  weaponTiers: Set<string>; // simple, martial
  weapons: Set<string>; // normalized weapon names
  tools: Set<string>; // normalized tool names
}

function addEntry(set: ProficiencySet, raw: string) {
  const v = normalizeName(raw);
  if (!v) return;
  if (/^all armor$/.test(v)) ["light", "medium", "heavy"].forEach((a) => set.armor.add(a));
  else if (/^(light|medium|heavy)( armor)?$/.test(v)) set.armor.add(v.split(" ")[0]);
  else if (/^shield$/.test(v)) set.armor.add("shield");
  else if (/^(simple|martial)( weapon)?$/.test(v)) set.weaponTiers.add(v.split(" ")[0]);
  else set.weapons.add(v);
  set.tools.add(v);
}

export function collectProficiencies(character: ProfSource): ProficiencySet {
  const set: ProficiencySet = { armor: new Set(), weaponTiers: new Set(), weapons: new Set(), tools: new Set() };
  const cls = character.class ? getStaticClass(character.class, character.ruleset) : undefined;
  const profs = (cls as any)?.proficiencies as { armor?: string[]; weapons?: string[]; tools?: string[] } | undefined;
  for (const a of profs?.armor ?? []) addEntry(set, a);
  for (const w of profs?.weapons ?? []) addEntry(set, w);
  for (const t of profs?.tools ?? []) addEntry(set, t);
  for (const t of character.toolProficiencies ?? []) addEntry(set, t);
  for (const p of String(character.otherProficiencies || "").split(",")) addEntry(set, p);
  for (const g of featureGrants(character.features)) addEntry(set, g);
  return set;
}

const GENERIC_TOOL_WORD: Record<string, string | undefined> = { instrument: "instrument", artisan: "artisan", gaming: "gaming" };

/**
 * Proficiency for one item, or null when proficiency means nothing for it
 * (gear, coins) or can't be told (a "one type of artisan's tools" choice).
 */
export function getItemProficiency(
  character: ProfSource,
  itemOrName: CatalogItem | string | undefined,
  set: ProficiencySet = collectProficiencies(character),
): ItemProficiency | null {
  const item = typeof itemOrName === "string" ? findCatalogItem(itemOrName) : itemOrName;
  if (!item) return null;
  if (item.weapon) {
    const proficient = set.weaponTiers.has(item.weapon.class) || set.weapons.has(normalizeName(item.name));
    return { kind: "weapon", proficient };
  }
  if (item.armor) {
    if (item.armor.class === "shield") return { kind: "shield", proficient: set.armor.has("shield") };
    return { kind: "armor", proficient: set.armor.has(item.armor.class) };
  }
  if (item.tool) {
    if (set.tools.has(normalizeName(item.name))) return { kind: "tool", proficient: true };
    // Only a "pick one" proficiency of this kind: we don't know which one was picked.
    const keyword = GENERIC_TOOL_WORD[item.tool.kind];
    const generic = !!keyword && [...set.tools].some((t) => t.startsWith("one type") && t.includes(keyword));
    return generic ? null : { kind: "tool", proficient: false };
  }
  return null;
}

/** Inventory row form: finds the catalog item by id or name. */
export function getRowProficiency(
  character: ProfSource,
  row: { itemId?: string; srdItemName?: string; name: string },
  set?: ProficiencySet,
): ItemProficiency | null {
  return getItemProficiency(character, findCatalogItem(row.itemId ?? row.srdItemName ?? row.name), set);
}

/** True unless the row is a weapon the character is known not to be proficient with. */
export function addsProficiencyToAttack(character: ProfSource, row: { itemId?: string; srdItemName?: string; name: string }): boolean {
  const p = getRowProficiency(character, row);
  return !p || p.kind !== "weapon" || p.proficient;
}

import raceNames from "@/data/raceNames.json";
import classNames from "@/data/classNames.json";

type Pool = { first: string[]; last: string[] };

/** The name pool for a race: subraces and variants use their parent's pool (Hill Dwarf, Half-Elf). */
function racePool(race?: string): Pool {
  const r = (race || "").toLowerCase();
  const pools = raceNames as Record<string, Pool>;
  if (pools[r]) return pools[r];
  if (r.includes("orc")) return pools.orc;
  if (r.includes("elf")) return pools.elf;
  if (r.includes("dwarf") || r.includes("duergar")) return pools.dwarf;
  if (r.includes("halfling")) return pools.halfling;
  return pools.human;
}

const pick = <T,>(list: T[], rand: () => number): T => list[Math.floor(rand() * list.length)];

/** A random character name from the race's names and the class's titles. */
export function randomName(race?: string, className?: string, rand: () => number = Math.random): string {
  const pool = racePool(race);
  const titles = (classNames as Record<string, { titles: string[] }>)[(className || "").toLowerCase()] || (classNames as any).fighter;
  const first = pick(pool.first, rand);
  const last = pick(pool.last, rand);
  const title = pick(titles.titles, rand);
  const roll = rand();
  if (roll > 0.6) return `${first} ${last}`;
  if (roll > 0.3) return `${first} ${title}`;
  return `${first} ${last} ${title}`;
}

// Beasts a druid can turn into with Wild Shape, from the SRD 5.1 stat
// blocks (CC BY 4.0). Only the numbers the turn helper needs: AC, HP,
// speeds, attacks and one plain line on what the beast is good at.
import type { Character } from "@/lib/storage";

export interface BeastAttack {
  name: string;
  toHit: number;
  damage: string;
  /** One line on a rider effect, e.g. a save to avoid being knocked prone. */
  note?: string;
}

export interface Beast {
  name: string;
  /** Challenge rating as a number (1/4 = 0.25). */
  cr: number;
  ac: number;
  hp: number;
  speed: number;
  swim?: number;
  fly?: number;
  climb?: number;
  /** Attacks per Attack action (Multiattack); 1 when it has none. */
  multiattack: number;
  attacks: BeastAttack[];
  /** Why pick it, in plain words. Locale key `wild.why.<name>` overrides it. */
  why: string;
}

export const BEASTS: Beast[] = [
  { name: "Wolf", cr: 0.25, ac: 13, hp: 11, speed: 40, multiattack: 1, attacks: [{ name: "Bite", toHit: 4, damage: "2d4 + 2 piercing", note: "DC 11 Strength save or the target falls prone." }], why: "Fast, and it knocks enemies down. Advantage when a friend is next to the target." },
  { name: "Panther", cr: 0.25, ac: 12, hp: 13, speed: 50, climb: 40, multiattack: 1, attacks: [{ name: "Bite", toHit: 4, damage: "1d6 + 2 piercing" }, { name: "Claw", toHit: 4, damage: "1d4 + 2 slashing" }], why: "Very fast and climbs. Pounce knocks a target prone after a 20 ft run." },
  { name: "Boar", cr: 0.25, ac: 11, hp: 11, speed: 40, multiattack: 1, attacks: [{ name: "Tusk", toHit: 3, damage: "1d6 + 1 slashing", note: "After a 20 ft charge: +1d6 damage and DC 11 Strength save or prone." }], why: "Once per rest it stays at 1 HP instead of dropping." },
  { name: "Giant Badger", cr: 0.25, ac: 10, hp: 13, speed: 30, multiattack: 2, attacks: [{ name: "Bite", toHit: 3, damage: "1d6 + 1 piercing" }, { name: "Claws", toHit: 3, damage: "2d4 + 1 slashing" }], why: "Two attacks a turn and it can dig." },
  { name: "Constrictor Snake", cr: 0.25, ac: 12, hp: 13, speed: 30, swim: 30, multiattack: 1, attacks: [{ name: "Bite", toHit: 4, damage: "1d6 + 2 piercing" }, { name: "Constrict", toHit: 4, damage: "1d8 + 2 bludgeoning", note: "The target is grappled (escape DC 14) and restrained." }], why: "Holds one enemy in place for your team." },
  { name: "Giant Wolf Spider", cr: 0.25, ac: 13, hp: 11, speed: 40, climb: 40, multiattack: 1, attacks: [{ name: "Bite", toHit: 3, damage: "1d6 + 1 piercing", note: "DC 11 Constitution save or 2d6 poison damage (half on a success)." }], why: "Walks on walls and adds poison to its bite." },
  { name: "Ape", cr: 0.5, ac: 12, hp: 19, speed: 30, climb: 30, multiattack: 2, attacks: [{ name: "Fist", toHit: 5, damage: "1d6 + 3 bludgeoning" }, { name: "Rock (25/50 ft)", toHit: 5, damage: "1d6 + 3 bludgeoning" }], why: "Two punches a turn, and it can throw rocks." },
  { name: "Black Bear", cr: 0.5, ac: 11, hp: 19, speed: 40, climb: 30, multiattack: 2, attacks: [{ name: "Bite", toHit: 3, damage: "1d6 + 2 piercing" }, { name: "Claws", toHit: 3, damage: "2d4 + 2 slashing" }], why: "Sturdy, two attacks a turn, and it climbs." },
  { name: "Crocodile", cr: 0.5, ac: 12, hp: 19, speed: 20, swim: 30, multiattack: 1, attacks: [{ name: "Bite", toHit: 4, damage: "1d10 + 2 piercing", note: "The target is grappled (escape DC 12)." }], why: "Best in water. Holds its breath for 15 minutes." },
  { name: "Warhorse", cr: 0.5, ac: 11, hp: 19, speed: 60, multiattack: 1, attacks: [{ name: "Hooves", toHit: 6, damage: "2d6 + 4 bludgeoning" }], why: "The fastest form, and hits hard." },
  { name: "Brown Bear", cr: 1, ac: 11, hp: 34, speed: 40, climb: 30, multiattack: 2, attacks: [{ name: "Bite", toHit: 6, damage: "1d8 + 4 piercing" }, { name: "Claws", toHit: 6, damage: "2d6 + 4 slashing" }], why: "Lots of HP and two strong attacks. A safe first pick." },
  { name: "Dire Wolf", cr: 1, ac: 14, hp: 37, speed: 50, multiattack: 1, attacks: [{ name: "Bite", toHit: 5, damage: "2d6 + 3 piercing", note: "DC 13 Strength save or the target falls prone." }], why: "Good AC, fast, knocks enemies down. Advantage when a friend is next to the target." },
  { name: "Giant Spider", cr: 1, ac: 14, hp: 26, speed: 30, climb: 30, multiattack: 1, attacks: [{ name: "Bite", toHit: 5, damage: "1d8 + 3 piercing", note: "DC 11 Constitution save or 2d8 poison damage (half on a success)." }], why: "Walks on walls and can web enemies in place." },
  { name: "Giant Hyena", cr: 1, ac: 12, hp: 45, speed: 50, multiattack: 1, attacks: [{ name: "Bite", toHit: 5, damage: "2d6 + 3 piercing" }], why: "The most HP at this level. When it drops a creature it can move and bite again." },
  { name: "Tiger", cr: 1, ac: 12, hp: 37, speed: 40, multiattack: 1, attacks: [{ name: "Bite", toHit: 5, damage: "1d10 + 3 piercing" }, { name: "Claw", toHit: 5, damage: "1d8 + 3 slashing" }], why: "Pounce after a 20 ft run: knock the target prone, then bite." },
  { name: "Giant Eagle", cr: 1, ac: 13, hp: 26, speed: 10, fly: 80, multiattack: 2, attacks: [{ name: "Beak", toHit: 5, damage: "1d6 + 3 piercing" }, { name: "Talons", toHit: 5, damage: "2d6 + 3 slashing" }], why: "Flies fast. Great for scouting or carrying a friend." },
  { name: "Giant Toad", cr: 1, ac: 11, hp: 39, speed: 20, swim: 40, multiattack: 1, attacks: [{ name: "Bite", toHit: 4, damage: "1d10 + 2 piercing plus 1d10 poison", note: "The target is grappled (escape DC 13). It can swallow a small target." }], why: "Swallows small enemies whole." },
  { name: "Polar Bear", cr: 2, ac: 12, hp: 42, speed: 40, swim: 30, multiattack: 2, attacks: [{ name: "Bite", toHit: 7, damage: "1d8 + 5 piercing" }, { name: "Claws", toHit: 7, damage: "2d6 + 5 slashing" }], why: "The hardest hitter at this level, with two attacks." },
  { name: "Giant Constrictor Snake", cr: 2, ac: 12, hp: 60, speed: 30, swim: 30, multiattack: 1, attacks: [{ name: "Bite", toHit: 6, damage: "2d6 + 4 piercing" }, { name: "Constrict", toHit: 6, damage: "2d8 + 4 bludgeoning", note: "The target is grappled (escape DC 16) and restrained." }], why: "Lots of HP, and it holds a big enemy in place." },
  { name: "Rhinoceros", cr: 2, ac: 11, hp: 45, speed: 40, multiattack: 1, attacks: [{ name: "Gore", toHit: 7, damage: "2d8 + 5 bludgeoning", note: "After a 20 ft charge: +2d8 damage and DC 15 Strength save or prone." }], why: "One huge hit after a charge." },
  { name: "Saber-Toothed Tiger", cr: 2, ac: 12, hp: 52, speed: 40, multiattack: 1, attacks: [{ name: "Bite", toHit: 6, damage: "1d10 + 5 piercing" }, { name: "Claw", toHit: 6, damage: "2d6 + 5 slashing" }], why: "Pounce after a 20 ft run: knock the target prone, then bite." },
  { name: "Giant Elk", cr: 2, ac: 14, hp: 42, speed: 60, multiattack: 1, attacks: [{ name: "Ram", toHit: 6, damage: "2d6 + 4 bludgeoning" }, { name: "Hooves (prone target)", toHit: 6, damage: "4d8 + 4 bludgeoning" }], why: "Fast with good AC. Charge knocks enemies down." },
  { name: "Giant Scorpion", cr: 3, ac: 15, hp: 52, speed: 40, multiattack: 3, attacks: [{ name: "Claw", toHit: 4, damage: "1d8 + 2 bludgeoning", note: "The target is grappled (escape DC 12)." }, { name: "Sting", toHit: 4, damage: "1d10 + 2 piercing", note: "DC 12 Constitution save or 4d10 poison damage (half on a success)." }], why: "Three attacks (two claws, one sting) and high AC." },
  { name: "Ankylosaurus", cr: 3, ac: 15, hp: 68, speed: 30, multiattack: 1, attacks: [{ name: "Tail", toHit: 7, damage: "4d6 + 4 bludgeoning", note: "DC 14 Strength save or the target falls prone." }], why: "A tank: high AC and lots of HP." },
  { name: "Killer Whale", cr: 3, ac: 12, hp: 90, speed: 0, swim: 60, multiattack: 1, attacks: [{ name: "Bite", toHit: 6, damage: "5d6 + 4 piercing" }], why: "Water only. Huge HP and a huge bite." },
  { name: "Elephant", cr: 4, ac: 12, hp: 76, speed: 40, multiattack: 1, attacks: [{ name: "Gore", toHit: 8, damage: "3d8 + 6 piercing" }, { name: "Stomp (prone target)", toHit: 8, damage: "3d10 + 6 bludgeoning" }], why: "Charge to knock a target prone, then stomp it." },
  { name: "Triceratops", cr: 5, ac: 13, hp: 95, speed: 50, multiattack: 1, attacks: [{ name: "Gore", toHit: 9, damage: "4d8 + 6 piercing" }, { name: "Stomp (prone target)", toHit: 9, damage: "3d10 + 6 bludgeoning" }], why: "Fast, tough and hits very hard." },
  { name: "Giant Crocodile", cr: 5, ac: 14, hp: 85, speed: 30, swim: 50, multiattack: 2, attacks: [{ name: "Bite", toHit: 8, damage: "3d10 + 5 piercing", note: "The target is grappled (escape DC 16)." }, { name: "Tail", toHit: 8, damage: "2d8 + 5 bludgeoning", note: "DC 16 Strength save or prone (not the grappled target)." }], why: "Two big attacks, and it holds one enemy." },
  { name: "Mammoth", cr: 6, ac: 13, hp: 126, speed: 40, multiattack: 1, attacks: [{ name: "Gore", toHit: 10, damage: "4d8 + 7 piercing" }, { name: "Stomp (prone target)", toHit: 10, damage: "4d10 + 7 bludgeoning" }], why: "The most HP of any form here." },
  { name: "Tyrannosaurus Rex", cr: 8, ac: 13, hp: 136, speed: 50, multiattack: 2, attacks: [{ name: "Bite", toHit: 10, damage: "4d12 + 7 piercing", note: "The target is grappled (escape DC 17)." }, { name: "Tail", toHit: 10, damage: "3d8 + 7 bludgeoning" }], why: "The biggest form there is. Two massive attacks." },
];

const isMoon = (c: Pick<Character, "subclass" | "features">) =>
  /moon/i.test(c.subclass || "") || (c.features || []).some((f) => /^Combat Wild Shape|^Circle Forms/.test(f.name || ""));

/**
 * The highest challenge rating a druid can turn into, and whether swimming
 * and flying forms are allowed. Circle of the Moon: CR 1 at level 2, then
 * level ÷ 3 from level 6. Others: 1/4 at 2, 1/2 at 4, 1 at 8. Swimming from
 * level 4, flying from level 8.
 */
export function wildShapeLimits(character: Pick<Character, "level" | "subclass" | "features">): { cr: number; swim: boolean; fly: boolean } {
  const level = character.level || 1;
  const cr = isMoon(character) ? (level >= 6 ? Math.floor(level / 3) : 1) : level >= 8 ? 1 : level >= 4 ? 0.5 : 0.25;
  return { cr, swim: level >= 4, fly: level >= 8 };
}

/** Beasts this druid can turn into now, toughest first. */
export function beastsFor(character: Pick<Character, "level" | "subclass" | "features">): Beast[] {
  const lim = wildShapeLimits(character);
  return BEASTS.filter((b) => b.cr <= lim.cr && (lim.swim || !b.swim) && (lim.fly || !b.fly)).sort((a, b) => b.cr - a.cr || b.hp - a.hp);
}

export const beastByName = (name: string) => BEASTS.find((b) => b.name === name);

export function crText(cr: number): string {
  return cr === 0.25 ? "1/4" : cr === 0.5 ? "1/2" : String(cr);
}

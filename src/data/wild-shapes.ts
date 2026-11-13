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
  /** On a hit the target makes a Strength save or falls prone. `run`: only after a 20 ft run straight at it (Pounce, Charge). */
  prone?: { dc: number; run?: boolean };
  /** Extra damage dice on a hit after a 20 ft run straight at the target (Charge). */
  runDamage?: string;
  /** On a hit the target is grappled. `one`: while it holds a target, this attack works only on that target. */
  grapple?: { escape: number; restrained?: boolean; one?: boolean };
  /** Only against a prone target (Hooves, Stomp). */
  vsProne?: boolean;
  /** Not against the creature this beast holds (a crocodile's tail). */
  notHeld?: boolean;
  /** Only against the target this attack holds (Swallow needs the bite's grab). */
  needsHold?: string;
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
  burrow?: number;
  /** The run trick: Pounce and Trampling Charge give a bonus action attack at a target the run knocked prone; Charge adds damage. */
  run?: "pounce" | "charge" | "trample";
  /** The attack Pounce or Trampling Charge makes as a bonus action at the prone target. */
  proneBonus?: string;
  /** Circle of the Moon at level 10: an elemental, which takes two uses of Wild Shape. */
  elemental?: boolean;
}

/** Wild Shape uses a form takes. */
export const shapeUses = (b: Beast) => (b.elemental ? 2 : 1);

export const BEASTS: Beast[] = [
  { name: "Wolf", cr: 0.25, ac: 13, hp: 11, speed: 40, multiattack: 1, attacks: [{ name: "Bite", toHit: 4, damage: "2d4 + 2 piercing", note: "DC 11 Strength save or the target falls prone.", prone: { dc: 11 } }], why: "Fast, and it knocks enemies down. Advantage when a friend is next to the target." },
  { name: "Panther", cr: 0.25, ac: 12, hp: 13, speed: 50, climb: 40, multiattack: 1, attacks: [{ name: "Bite", toHit: 4, damage: "1d6 + 2 piercing" }, { name: "Claw", toHit: 4, damage: "1d4 + 2 slashing", note: "After a 20 ft run straight at it: DC 12 Strength save or prone, then a bonus action bite.", prone: { dc: 12, run: true } }], run: "pounce", proneBonus: "Bite", why: "Very fast and climbs. Pounce knocks a target prone after a 20 ft run." },
  { name: "Boar", cr: 0.25, ac: 11, hp: 11, speed: 40, multiattack: 1, attacks: [{ name: "Tusk", toHit: 3, damage: "1d6 + 1 slashing", note: "After a 20 ft charge: +1d6 damage and DC 11 Strength save or prone.", runDamage: "1d6", prone: { dc: 11, run: true } }], run: "charge", why: "Once per rest it stays at 1 HP instead of dropping." },
  { name: "Giant Badger", cr: 0.25, ac: 10, hp: 13, speed: 30, multiattack: 2, attacks: [{ name: "Bite", toHit: 3, damage: "1d6 + 1 piercing" }, { name: "Claws", toHit: 3, damage: "2d4 + 1 slashing" }], why: "Two attacks a turn and it can dig." },
  { name: "Constrictor Snake", cr: 0.25, ac: 12, hp: 13, speed: 30, swim: 30, multiattack: 1, attacks: [{ name: "Bite", toHit: 4, damage: "1d6 + 2 piercing" }, { name: "Constrict", toHit: 4, damage: "1d8 + 2 bludgeoning", note: "The target is grappled (escape DC 14) and restrained.", grapple: { escape: 14, restrained: true, one: true } }], why: "Holds one enemy in place for your team." },
  { name: "Giant Wolf Spider", cr: 0.25, ac: 13, hp: 11, speed: 40, climb: 40, multiattack: 1, attacks: [{ name: "Bite", toHit: 3, damage: "1d6 + 1 piercing", note: "DC 11 Constitution save or 2d6 poison damage (half on a success)." }], why: "Walks on walls and adds poison to its bite." },
  { name: "Ape", cr: 0.5, ac: 12, hp: 19, speed: 30, climb: 30, multiattack: 2, attacks: [{ name: "Fist", toHit: 5, damage: "1d6 + 3 bludgeoning" }, { name: "Rock (25/50 ft)", toHit: 5, damage: "1d6 + 3 bludgeoning", note: "Instead of the two punches, not on top of them." }], why: "Two punches a turn, and it can throw rocks." },
  { name: "Black Bear", cr: 0.5, ac: 11, hp: 19, speed: 40, climb: 30, multiattack: 2, attacks: [{ name: "Bite", toHit: 3, damage: "1d6 + 2 piercing" }, { name: "Claws", toHit: 3, damage: "2d4 + 2 slashing" }], why: "Sturdy, two attacks a turn, and it climbs." },
  { name: "Crocodile", cr: 0.5, ac: 12, hp: 19, speed: 20, swim: 30, multiattack: 1, attacks: [{ name: "Bite", toHit: 4, damage: "1d10 + 2 piercing", note: "The target is grappled (escape DC 12) and restrained.", grapple: { escape: 12, restrained: true, one: true } }], why: "Best in water. Holds its breath for 15 minutes." },
  { name: "Warhorse", cr: 0.5, ac: 11, hp: 19, speed: 60, multiattack: 1, attacks: [{ name: "Hooves", toHit: 6, damage: "2d6 + 4 bludgeoning" }], why: "The fastest form, and hits hard." },
  { name: "Brown Bear", cr: 1, ac: 11, hp: 34, speed: 40, climb: 30, multiattack: 2, attacks: [{ name: "Bite", toHit: 6, damage: "1d8 + 4 piercing" }, { name: "Claws", toHit: 6, damage: "2d6 + 4 slashing" }], why: "Lots of HP and two strong attacks. A safe first pick." },
  { name: "Dire Wolf", cr: 1, ac: 14, hp: 37, speed: 50, multiattack: 1, attacks: [{ name: "Bite", toHit: 5, damage: "2d6 + 3 piercing", note: "DC 13 Strength save or the target falls prone.", prone: { dc: 13 } }], why: "Good AC, fast, knocks enemies down. Advantage when a friend is next to the target." },
  { name: "Giant Spider", cr: 1, ac: 14, hp: 26, speed: 30, climb: 30, multiattack: 1, attacks: [{ name: "Bite", toHit: 5, damage: "1d8 + 3 piercing", note: "DC 11 Constitution save or 2d8 poison damage (half on a success)." }], why: "Walks on walls and can web enemies in place." },
  { name: "Giant Hyena", cr: 1, ac: 12, hp: 45, speed: 50, multiattack: 1, attacks: [{ name: "Bite", toHit: 5, damage: "2d6 + 3 piercing" }], why: "The most HP at this level. When it drops a creature it can move and bite again." },
  { name: "Tiger", cr: 1, ac: 12, hp: 37, speed: 40, multiattack: 1, attacks: [{ name: "Bite", toHit: 5, damage: "1d10 + 3 piercing" }, { name: "Claw", toHit: 5, damage: "1d8 + 3 slashing", note: "After a 20 ft run straight at it: DC 13 Strength save or prone, then a bonus action bite.", prone: { dc: 13, run: true } }], run: "pounce", proneBonus: "Bite", why: "Pounce after a 20 ft run: knock the target prone, then bite." },
  { name: "Giant Eagle", cr: 1, ac: 13, hp: 26, speed: 10, fly: 80, multiattack: 2, attacks: [{ name: "Beak", toHit: 5, damage: "1d6 + 3 piercing" }, { name: "Talons", toHit: 5, damage: "2d6 + 3 slashing" }], why: "Flies fast. Great for scouting or carrying a friend." },
  { name: "Giant Toad", cr: 1, ac: 11, hp: 39, speed: 20, swim: 40, multiattack: 1, attacks: [{ name: "Bite", toHit: 4, damage: "1d10 + 2 piercing plus 1d10 poison", note: "The target is grappled (escape DC 13) and restrained.", grapple: { escape: 13, restrained: true, one: true } }, { name: "Swallow", toHit: 4, damage: "1d10 + 2 piercing plus 1d10 poison", note: "A bite at the Medium or smaller target you hold. On a hit you swallow it: the grab ends, it is blinded and restrained inside you and takes 3d6 acid at the start of each of your turns.", needsHold: "Bite" }], why: "Swallows small enemies whole." },
  { name: "Polar Bear", cr: 2, ac: 12, hp: 42, speed: 40, swim: 30, multiattack: 2, attacks: [{ name: "Bite", toHit: 7, damage: "1d8 + 5 piercing" }, { name: "Claws", toHit: 7, damage: "2d6 + 5 slashing" }], why: "The hardest hitter at this level, with two attacks." },
  { name: "Giant Constrictor Snake", cr: 2, ac: 12, hp: 60, speed: 30, swim: 30, multiattack: 1, attacks: [{ name: "Bite", toHit: 6, damage: "2d6 + 4 piercing" }, { name: "Constrict", toHit: 6, damage: "2d8 + 4 bludgeoning", note: "The target is grappled (escape DC 16) and restrained.", grapple: { escape: 16, restrained: true, one: true } }], why: "Lots of HP, and it holds a big enemy in place." },
  { name: "Rhinoceros", cr: 2, ac: 11, hp: 45, speed: 40, multiattack: 1, attacks: [{ name: "Gore", toHit: 7, damage: "2d8 + 5 bludgeoning", note: "After a 20 ft charge: +2d8 damage and DC 15 Strength save or prone.", runDamage: "2d8", prone: { dc: 15, run: true } }], run: "charge", why: "One huge hit after a charge." },
  { name: "Saber-Toothed Tiger", cr: 2, ac: 12, hp: 52, speed: 40, multiattack: 1, attacks: [{ name: "Bite", toHit: 6, damage: "1d10 + 5 piercing" }, { name: "Claw", toHit: 6, damage: "2d6 + 5 slashing", note: "After a 20 ft run straight at it: DC 14 Strength save or prone, then a bonus action bite.", prone: { dc: 14, run: true } }], run: "pounce", proneBonus: "Bite", why: "Pounce after a 20 ft run: knock the target prone, then bite." },
  { name: "Giant Elk", cr: 2, ac: 14, hp: 42, speed: 60, multiattack: 1, attacks: [{ name: "Ram", toHit: 6, damage: "2d6 + 4 bludgeoning", note: "After a 20 ft charge: +2d6 damage and DC 14 Strength save or prone.", runDamage: "2d6", prone: { dc: 14, run: true } }, { name: "Hooves (prone target)", toHit: 6, damage: "4d8 + 4 bludgeoning", vsProne: true }], run: "charge", why: "Fast with good AC. Charge knocks enemies down." },
  { name: "Giant Scorpion", cr: 3, ac: 15, hp: 52, speed: 40, multiattack: 3, attacks: [{ name: "Claw", toHit: 4, damage: "1d8 + 2 bludgeoning", note: "The target is grappled (escape DC 12). Each claw can hold one target.", grapple: { escape: 12 } }, { name: "Sting", toHit: 4, damage: "1d10 + 2 piercing", note: "DC 12 Constitution save or 4d10 poison damage (half on a success)." }], why: "Three attacks (two claws, one sting) and high AC." },
  { name: "Ankylosaurus", cr: 3, ac: 15, hp: 68, speed: 30, multiattack: 1, attacks: [{ name: "Tail", toHit: 7, damage: "4d6 + 4 bludgeoning", note: "DC 14 Strength save or the target falls prone.", prone: { dc: 14 } }], why: "A tank: high AC and lots of HP." },
  { name: "Killer Whale", cr: 3, ac: 12, hp: 90, speed: 0, swim: 60, multiattack: 1, attacks: [{ name: "Bite", toHit: 6, damage: "5d6 + 4 piercing" }], why: "Water only. Huge HP and a huge bite." },
  { name: "Elephant", cr: 4, ac: 12, hp: 76, speed: 40, multiattack: 1, attacks: [{ name: "Gore", toHit: 8, damage: "3d8 + 6 piercing", note: "After a 20 ft run straight at it: DC 12 Strength save or prone, then a bonus action stomp.", prone: { dc: 12, run: true } }, { name: "Stomp (prone target)", toHit: 8, damage: "3d10 + 6 bludgeoning", vsProne: true }], run: "trample", proneBonus: "Stomp (prone target)", why: "Charge to knock a target prone, then stomp it." },
  { name: "Triceratops", cr: 5, ac: 13, hp: 95, speed: 50, multiattack: 1, attacks: [{ name: "Gore", toHit: 9, damage: "4d8 + 6 piercing", note: "After a 20 ft run straight at it: DC 13 Strength save or prone, then a bonus action stomp.", prone: { dc: 13, run: true } }, { name: "Stomp (prone target)", toHit: 9, damage: "3d10 + 6 bludgeoning", vsProne: true }], run: "trample", proneBonus: "Stomp (prone target)", why: "Fast, tough and hits very hard." },
  { name: "Giant Crocodile", cr: 5, ac: 14, hp: 85, speed: 30, swim: 50, multiattack: 2, attacks: [{ name: "Bite", toHit: 8, damage: "3d10 + 5 piercing", note: "The target is grappled (escape DC 16) and restrained.", grapple: { escape: 16, restrained: true, one: true } }, { name: "Tail", toHit: 8, damage: "2d8 + 5 bludgeoning", note: "DC 16 Strength save or prone (not the grappled target).", prone: { dc: 16 }, notHeld: true }], why: "Two big attacks, and it holds one enemy." },
  { name: "Mammoth", cr: 6, ac: 13, hp: 126, speed: 40, multiattack: 1, attacks: [{ name: "Gore", toHit: 10, damage: "4d8 + 7 piercing", note: "After a 20 ft run straight at it: DC 18 Strength save or prone, then a bonus action stomp.", prone: { dc: 18, run: true } }, { name: "Stomp (prone target)", toHit: 10, damage: "4d10 + 7 bludgeoning", vsProne: true }], run: "trample", proneBonus: "Stomp (prone target)", why: "The most HP of any form here." },
  { name: "Tyrannosaurus Rex", cr: 8, ac: 13, hp: 136, speed: 50, multiattack: 2, attacks: [{ name: "Bite", toHit: 10, damage: "4d12 + 7 piercing", note: "The target is grappled (escape DC 17) and restrained.", grapple: { escape: 17, restrained: true, one: true } }, { name: "Tail", toHit: 10, damage: "3d8 + 7 bludgeoning", note: "Not against the target you hold.", notHeld: true }], why: "The biggest form there is. Two massive attacks." },
];

/** Elemental Wild Shape (Circle of the Moon, level 10), from the SRD 5.1 elementals. */
export const ELEMENTALS: Beast[] = [
  { name: "Air Elemental", cr: 5, ac: 15, hp: 90, speed: 0, fly: 90, multiattack: 2, elemental: true, attacks: [{ name: "Slam", toHit: 8, damage: "2d8 + 5 bludgeoning" }], why: "Flies fast and hovers. Whirlwind (recharge 4-6) flings enemies 20 ft." },
  { name: "Earth Elemental", cr: 5, ac: 17, hp: 126, speed: 30, burrow: 30, multiattack: 2, elemental: true, attacks: [{ name: "Slam", toHit: 8, damage: "2d8 + 5 bludgeoning" }], why: "The toughest: AC 17, lots of HP, and it moves through earth and stone." },
  { name: "Fire Elemental", cr: 5, ac: 13, hp: 102, speed: 50, multiattack: 2, elemental: true, attacks: [{ name: "Touch", toHit: 6, damage: "2d6 + 3 fire", note: "A flammable target catches fire: 1d10 fire at the start of each of its turns until it puts it out." }], why: "Fast, sets enemies on fire, and anyone who touches it gets burned." },
  { name: "Water Elemental", cr: 5, ac: 14, hp: 114, speed: 30, swim: 90, multiattack: 2, elemental: true, attacks: [{ name: "Slam", toHit: 7, damage: "2d8 + 4 bludgeoning" }], why: "Whelm (recharge 4-6) grabs and drowns enemies around it." },
];

export const isMoon = (c: Pick<Character, "subclass" | "features">) =>
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
  const beasts = BEASTS.filter((b) => b.cr <= lim.cr && (lim.swim || !b.swim) && (lim.fly || !b.fly)).sort((a, b) => b.cr - a.cr || b.hp - a.hp);
  return isMoon(character) && (character.level || 1) >= 10 ? [...ELEMENTALS, ...beasts] : beasts;
}

export const beastByName = (name: string) => BEASTS.find((b) => b.name === name) ?? ELEMENTALS.find((b) => b.name === name);

export function crText(cr: number): string {
  return cr === 0.25 ? "1/4" : cr === 0.5 ? "1/2" : String(cr);
}

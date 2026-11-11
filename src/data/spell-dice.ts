/**
 * Damage dice of every spell that deals damage, checked by hand against the books
 * (PHB, XGE, TCE, EGW, FTD, SCC). The spell data only has dice for some spells and
 * gets several wrong (Sleep counts hit points, Scorching Ray lists one ray, Eldritch
 * Blast lists one beam), so the app reads damage from here.
 */

/** When the part is dealt, if not on the cast itself. */
export type DiceWhen =
  | "hit" // added to your weapon hits while the spell lasts (smites, Hex, Hunter's Mark)
  | "later" // again on later turns (Witch Bolt, Acid Arrow, Immolation)
  | "move" // Booming Blade: if the target moves
  | "others" // to other creatures nearby (Lightning Arrow, Green-Flame Blade)
  | "hurt"; // Toll the Dead: instead, if the target is already hurt

export interface DicePart {
  /** Dice at the spell's own level (or at character level 1 for a cantrip). "20" is a flat number. */
  dice: string;
  /** Damage type, "a|b" for one of several, "choice" (the caster picks), "random", or "" (the weapon's). */
  type: string;
  /** Dice added for each slot level above the spell's level. */
  up?: string;
  /** `up` is added once per this many slot levels (Spiritual Weapon: every 2). */
  every?: number;
  /** Exact dice per slot level when the steps are uneven (Shadow Blade, Elemental Weapon). */
  at?: Record<number, string>;
  /** Cantrip dice grow at character levels 5, 11 and 17. "late": the part starts at 0 dice
   *  and grows from level 5 (Booming Blade's hit damage). */
  cantrip?: true | "late";
  /** Separate rolls, each with these dice (Scorching Ray rays, Magic Missile darts). */
  count?: number;
  /** More rolls for each slot level above the spell's level. */
  countUp?: number;
  /** Eldritch Blast: 1 beam, 2 at character level 5, 3 at 11, 4 at 17. */
  beams?: true;
  /** Adds the spellcasting ability modifier. */
  mod?: true;
  when?: DiceWhen;
}

const p = (dice: string, type: string, extra: Partial<DicePart> = {}): DicePart => ({ dice, type, ...extra });
const c = (dice: string, type: string, extra: Partial<DicePart> = {}): DicePart => ({ dice, type, cantrip: true, ...extra });

export const SPELL_DICE: Record<string, DicePart[]> = {
  // Cantrips
  "Acid Splash": [c("1d6", "acid")],
  "Booming Blade": [c("1d8", "thunder", { cantrip: "late", when: "hit" }), c("1d8", "thunder", { when: "move" })],
  "Chill Touch": [c("1d8", "necrotic")],
  "Create Bonfire": [c("1d8", "fire")],
  "Eldritch Blast": [p("1d10", "force", { beams: true })],
  "Fire Bolt": [c("1d10", "fire")],
  "Frostbite": [c("1d6", "cold")],
  "Green-Flame Blade": [c("1d8", "fire", { cantrip: "late", when: "hit" }), c("1d8", "fire", { cantrip: "late", mod: true, when: "others" })],
  "Infestation": [c("1d6", "poison")],
  "Lightning Lure": [c("1d8", "lightning")],
  "Magic Stone": [p("1d6", "bludgeoning", { mod: true })],
  "Mind Sliver": [c("1d6", "psychic")],
  "Poison Spray": [c("1d12", "poison")],
  "Primal Savagery": [c("1d10", "acid")],
  "Produce Flame": [c("1d8", "fire")],
  "Ray of Frost": [c("1d8", "cold")],
  "Sacred Flame": [c("1d8", "radiant")],
  "Sapping Sting": [c("1d4", "necrotic")],
  "Shocking Grasp": [c("1d8", "lightning")],
  "Sword Burst": [c("1d6", "force")],
  "Thorn Whip": [c("1d6", "piercing")],
  "Thunderclap": [c("1d6", "thunder")],
  "Toll the Dead": [c("1d8", "necrotic"), c("1d12", "necrotic", { when: "hurt" })],
  "Vicious Mockery": [c("1d4", "psychic")],
  "Word of Radiance": [c("1d6", "radiant")],

  // 1st level
  "Absorb Elements": [p("1d6", "choice", { up: "1d6", when: "hit" })],
  "Arms of Hadar": [p("2d6", "necrotic", { up: "1d6" })],
  "Burning Hands": [p("3d6", "fire", { up: "1d6" })],
  "Catapult": [p("3d8", "bludgeoning", { up: "1d8" })],
  "Chaos Bolt": [p("2d8+1d6", "random", { up: "1d6" })],
  "Chromatic Orb": [p("3d8", "choice", { up: "1d8" })],
  "Dissonant Whispers": [p("3d6", "psychic", { up: "1d6" })],
  "Divine Favor": [p("1d4", "radiant", { when: "hit" })],
  "Earth Tremor": [p("1d6", "bludgeoning", { up: "1d6" })],
  "Ensnaring Strike": [p("1d6", "piercing", { up: "1d6", when: "later" })],
  "Guiding Bolt": [p("4d6", "radiant", { up: "1d6" })],
  "Hail of Thorns": [p("1d10", "piercing", { up: "1d10" })],
  "Hellish Rebuke": [p("2d10", "fire", { up: "1d10" })],
  "Hex": [p("1d6", "necrotic", { when: "hit" })],
  "Hunter's Mark": [p("1d6", "", { when: "hit" })],
  "Ice Knife": [p("1d10", "piercing"), p("2d6", "cold", { up: "1d6", when: "others" })],
  "Inflict Wounds": [p("3d10", "necrotic", { up: "1d10" })],
  "Magic Missile": [p("1d4+1", "force", { count: 3, countUp: 1 })],
  "Magnify Gravity": [p("2d8", "force", { up: "1d8" })],
  "Ray of Sickness": [p("2d8", "poison", { up: "1d8" })],
  "Searing Smite": [p("1d6", "fire", { up: "1d6", when: "hit" }), p("1d6", "fire", { when: "later" })],
  "Tasha's Caustic Brew": [p("2d4", "acid", { up: "2d4", when: "later" })],
  "Thunderous Smite": [p("2d6", "thunder", { when: "hit" })],
  "Thunderwave": [p("2d8", "thunder", { up: "1d8" })],
  "Witch Bolt": [p("1d12", "lightning", { up: "1d12" }), p("1d12", "lightning", { when: "later" })],
  "Wrathful Smite": [p("1d6", "psychic", { when: "hit" })],
  "Zephyr Strike": [p("1d8", "force", { when: "hit" })],

  // 2nd level
  "Acid Arrow": [p("4d4", "acid", { up: "1d4" }), p("2d4", "acid", { up: "1d4", when: "later" })],
  "Aganazzar's Scorcher": [p("3d8", "fire", { up: "1d8" })],
  "Branding Smite": [p("2d6", "radiant", { up: "1d6", when: "hit" })],
  "Cloud of Daggers": [p("4d4", "slashing", { up: "2d4" })],
  "Cordon of Arrows": [p("1d6", "piercing")],
  "Dragon's Breath": [p("3d6", "choice", { up: "1d6" })],
  "Dust Devil": [p("1d8", "bludgeoning", { up: "1d8" })],
  "Flame Blade": [p("3d6", "fire", { up: "1d6", every: 2 })],
  "Flaming Sphere": [p("2d6", "fire", { up: "1d6" })],
  "Heat Metal": [p("2d8", "fire", { up: "1d8" })],
  "Maximilian's Earthen Grasp": [p("2d6", "bludgeoning")],
  "Mind Spike": [p("3d8", "psychic", { up: "1d8" })],
  "Moonbeam": [p("2d10", "radiant", { up: "1d10" })],
  "Phantasmal Force": [p("1d6", "psychic")],
  "Rime's Binding Ice": [p("3d8", "cold", { up: "1d8" })],
  "Scorching Ray": [p("2d6", "fire", { count: 3, countUp: 1 })],
  "Shadow Blade": [p("2d8", "psychic", { at: { 2: "2d8", 3: "3d8", 4: "3d8", 5: "4d8", 6: "4d8", 7: "5d8", 8: "5d8", 9: "5d8" } })],
  "Shatter": [p("3d8", "thunder", { up: "1d8" })],
  "Snilloc's Snowball Swarm": [p("3d6", "cold", { up: "1d6" })],
  "Spike Growth": [p("2d4", "piercing")],
  "Spiritual Weapon": [p("1d8", "force", { up: "1d8", every: 2, mod: true })],
  "Tasha's Mind Whip": [p("3d6", "psychic")],
  "Web": [p("2d4", "fire")],
  "Wither and Bloom": [p("2d6", "necrotic", { up: "1d6" })],

  // 3rd level
  "Ashardalon's Stride": [p("1d6", "fire", { up: "1d6" })],
  "Bestow Curse": [p("1d8", "necrotic", { when: "hit" })],
  "Blinding Smite": [p("3d8", "radiant", { when: "hit" })],
  "Call Lightning": [p("3d10", "lightning", { up: "1d10" })],
  "Conjure Barrage": [p("3d8", "")],
  "Crusader's Mantle": [p("1d4", "radiant", { when: "hit" })],
  "Elemental Weapon": [p("1d4", "choice", { when: "hit", at: { 3: "1d4", 4: "1d4", 5: "2d4", 6: "2d4", 7: "3d4", 8: "3d4", 9: "3d4" } })],
  "Erupting Earth": [p("3d12", "bludgeoning", { up: "1d12" })],
  "Fireball": [p("8d6", "fire", { up: "1d6" })],
  "Lightning Bolt": [p("8d6", "lightning", { up: "1d6" })],
  "Flame Arrows": [p("1d6", "fire", { when: "hit" })],
  "Glyph of Warding": [p("5d8", "choice", { up: "1d8" })],
  "Hunger of Hadar": [p("2d6", "cold"), p("2d6", "acid", { when: "later" })],
  "Life Transference": [p("4d8", "necrotic", { up: "1d8" })],
  "Lightning Arrow": [p("4d8", "lightning", { up: "1d8" }), p("2d8", "lightning", { up: "1d8", when: "others" })],
  "Melf's Minute Meteors": [p("2d6", "fire")],
  "Pulse Wave": [p("6d6", "force", { up: "1d6" })],
  "Spirit Guardians": [p("3d8", "radiant|necrotic", { up: "1d8" })],
  "Spirit Shroud": [p("1d8", "radiant|necrotic|cold", { up: "1d8", every: 2, when: "hit" })],
  "Thunder Step": [p("3d10", "thunder", { up: "1d10" })],
  "Tidal Wave": [p("4d8", "bludgeoning")],
  "Vampiric Touch": [p("3d6", "necrotic", { up: "1d6" })],
  "Wind Wall": [p("3d8", "bludgeoning")],

  // 4th level
  "Banishing Smite": [p("5d10", "force", { when: "hit" })],
  "Black Tentacles": [p("3d6", "bludgeoning")],
  "Blight": [p("8d8", "necrotic", { up: "1d8" })],
  "Faithful Hound": [p("4d8", "piercing")],
  "Fire Shield": [p("2d8", "fire|cold")],
  "Gravity Sinkhole": [p("5d10", "force", { up: "1d10" })],
  "Guardian of Faith": [p("20", "radiant")],
  "Guardian of Nature": [p("1d6", "force", { when: "hit" })],
  "Ice Storm": [p("2d8", "bludgeoning", { up: "1d8" }), p("4d6", "cold")],
  "Phantasmal Killer": [p("4d10", "psychic", { up: "1d10" })],
  "Raulothim's Psychic Lance": [p("7d6", "psychic", { up: "1d6" })],
  "Shadow of Moil": [p("2d8", "necrotic", { up: "1d8" })],
  "Sickening Radiance": [p("4d10", "radiant")],
  "Staggering Smite": [p("4d6", "psychic", { when: "hit" })],
  "Storm Sphere": [p("2d6", "bludgeoning", { up: "1d6" }), p("4d6", "lightning", { up: "1d6" })],
  "Vitriolic Sphere": [p("10d4", "acid", { up: "2d4" }), p("5d4", "acid", { when: "later" })],
  "Wall of Fire": [p("5d8", "fire", { up: "1d8" })],

  // 5th level
  "Arcane Hand": [p("4d8", "force", { up: "2d8" })],
  "Cloudkill": [p("5d8", "poison", { up: "1d8" })],
  "Cone of Cold": [p("8d8", "cold", { up: "1d8" })],
  "Conjure Volley": [p("8d8", "")],
  "Dawn": [p("4d10", "radiant")],
  "Destructive Wave": [p("5d6", "thunder"), p("5d6", "radiant|necrotic")],
  "Enervation": [p("4d8", "necrotic", { up: "1d8" })],
  "Flame Strike": [p("4d6", "fire", { up: "1d6" }), p("4d6", "radiant")],
  "Holy Weapon": [p("2d8", "radiant", { when: "hit" })],
  "Immolation": [p("8d6", "fire"), p("4d6", "fire", { when: "later" })],
  "Insect Plague": [p("4d10", "piercing", { up: "1d10" })],
  "Maelstrom": [p("6d6", "bludgeoning")],
  "Negative Energy Flood": [p("5d12", "necrotic")],
  "Steel Wind Strike": [p("6d10", "force")],
  "Synaptic Static": [p("8d6", "psychic")],
  "Wall of Light": [p("4d8", "radiant", { up: "1d8" })],

  // 6th level
  "Blade Barrier": [p("6d10", "slashing")],
  "Bones of the Earth": [p("6d6", "bludgeoning")],
  "Chain Lightning": [p("10d8", "lightning")],
  "Circle of Death": [p("8d6", "necrotic", { up: "2d6" })],
  "Disintegrate": [p("10d6+40", "force", { up: "3d6" })],
  "Forbiddance": [p("5d10", "radiant|necrotic")],
  "Freezing Sphere": [p("10d6", "cold", { up: "1d6" })],
  "Gravity Fissure": [p("8d8", "force", { up: "1d8" })],
  "Harm": [p("14d6", "necrotic")],
  "Investiture of Flame": [p("4d8", "fire")],
  "Investiture of Ice": [p("4d6", "cold")],
  "Investiture of Wind": [p("2d10", "bludgeoning")],
  "Mental Prison": [p("5d10", "psychic"), p("10d10", "psychic", { when: "later" })],
  "Sunbeam": [p("6d8", "radiant")],
  "Tenser's Transformation": [p("2d12", "force", { when: "hit" })],
  "Wall of Ice": [p("10d6", "cold", { up: "2d6" })],
  "Wall of Thorns": [p("7d8", "piercing", { up: "1d8" })],

  // 7th level
  "Arcane Sword": [p("3d10", "force")],
  "Crown of Stars": [p("4d12", "radiant")],
  "Delayed Blast Fireball": [p("12d6", "fire", { up: "1d6" })],
  "Draconic Transformation": [p("6d8", "force")],
  "Finger of Death": [p("7d8+30", "necrotic")],
  "Fire Storm": [p("7d10", "fire")],
  "Prismatic Spray": [p("10d6", "random")],
  "Whirlwind": [p("10d6", "bludgeoning")],

  // 8th level
  "Abi-Dalzim's Horrid Wilting": [p("12d8", "necrotic")],
  "Dark Star": [p("8d10", "force")],
  "Earthquake": [p("5d6", "bludgeoning")],
  "Feeblemind": [p("4d6", "psychic")],
  "Illusory Dragon": [p("7d6", "choice")],
  "Incendiary Cloud": [p("10d8", "fire")],
  "Maddening Darkness": [p("8d8", "psychic")],
  "Sunburst": [p("12d6", "radiant")],
  "Tsunami": [p("6d10", "bludgeoning")],

  // 9th level
  "Blade of Disaster": [p("4d12", "force")],
  "Meteor Swarm": [p("20d6", "fire"), p("20d6", "bludgeoning")],
  "Prismatic Wall": [p("10d6", "random")],
  "Psychic Scream": [p("14d6", "psychic")],
  "Ravenous Void": [p("5d10", "force")],
  "Time Ravage": [p("10d12", "necrotic")],
  "Weird": [p("4d10", "psychic")],
};

/**
 * Spells whose text mentions damage dice but where one damage line would mislead:
 * the damage is a side effect (Teleport mishaps, Sleep's hit point pool), comes from
 * summoned creatures (Animate Objects), or changes every round (Storm of Vengeance).
 */
export const NO_DAMAGE_LINE = new Set([
  "Alter Self",
  "Animate Objects",
  "Contact Other Plane",
  "Control Water",
  "Create Homunculus",
  "Dimension Door",
  "Dream",
  "Enlarge/Reduce",
  "Geas",
  "Meld Into Stone",
  "Reality Break",
  "Sleep",
  "Storm of Vengeance",
  "Teleport",
  "Wish",
]);

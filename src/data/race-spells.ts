/**
 * Spells a race trait gives for free, keyed by race name and then by the
 * character level they arrive at. Only fixed spells: a trait that lets the
 * player pick (High Elf cantrip) is a picker, not listed here. Racial spells
 * don't count against spells known or prepared.
 */
export const RACE_SPELLS: Record<string, Record<number, string[]>> = {
  Drow: { 1: ["Dancing Lights"], 3: ["Faerie Fire"], 5: ["Darkness"] },
  "Half-Elf (Drow)": { 1: ["Dancing Lights"], 3: ["Faerie Fire"], 5: ["Darkness"] },
  Duergar: { 3: ["Enlarge/Reduce"], 5: ["Invisibility"] },
  Firbolg: { 1: ["Detect Magic", "Disguise Self"] },
  "Forest Gnome": { 1: ["Minor Illusion"] },
  Githyanki: { 1: ["Mage Hand"], 3: ["Jump"], 5: ["Misty Step"] },
  Githzerai: { 1: ["Mage Hand"], 3: ["Shield"], 5: ["Detect Thoughts"] },
  Hexblood: { 1: ["Disguise Self", "Hex"] },
  Triton: { 1: ["Fog Cloud"], 3: ["Gust of Wind"], 5: ["Water Walk"] },
  "Yuan-ti Pureblood": { 1: ["Poison Spray", "Animal Friendship"], 3: ["Suggestion"] },
  "Air Genasi": { 1: ["Levitate"] },
  "Earth Genasi": { 1: ["Pass without Trace"] },
  "Fire Genasi": { 1: ["Produce Flame"], 3: ["Burning Hands"] },
  "Water Genasi": { 1: ["Shape Water"], 3: ["Create or Destroy Water"] },
  Aasimar: { 1: ["Light"] },
  "Protector Aasimar": { 1: ["Light"] },
  "Scourge Aasimar": { 1: ["Light"] },
  "Fallen Aasimar": { 1: ["Light"] },
  Tiefling: { 1: ["Thaumaturgy"], 3: ["Hellish Rebuke"], 5: ["Darkness"] },
  "Tiefling (Asmodeus)": { 1: ["Thaumaturgy"], 3: ["Hellish Rebuke"], 5: ["Darkness"] },
  "Tiefling (Baalzebul)": { 1: ["Thaumaturgy"], 3: ["Ray of Sickness"], 5: ["Crown of Madness"] },
  "Tiefling (Dispater)": { 1: ["Thaumaturgy"], 3: ["Disguise Self"], 5: ["Detect Thoughts"] },
  "Tiefling (Fierna)": { 1: ["Friends"], 3: ["Charm Person"], 5: ["Suggestion"] },
  "Tiefling (Glasya)": { 1: ["Minor Illusion"], 3: ["Disguise Self"], 5: ["Invisibility"] },
  "Tiefling (Levistus)": { 1: ["Ray of Frost"], 3: ["Armor of Agathys"], 5: ["Darkness"] },
  "Tiefling (Mammon)": { 1: ["Mage Hand"], 3: ["Floating Disk"], 5: ["Arcane Lock"] },
  "Tiefling (Mephistopheles)": { 1: ["Mage Hand"], 3: ["Burning Hands"], 5: ["Flame Blade"] },
  "Tiefling (Zariel)": { 1: ["Thaumaturgy"], 3: ["Searing Smite"], 5: ["Branding Smite"] },
};

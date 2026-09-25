import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CLASSES_EN = path.join(__dirname, "..", "src", "data", "en", "2014_classes.json");
const RACES_EN = path.join(__dirname, "..", "src", "data", "en", "2014_races.json");
const CLASSES_ID = path.join(__dirname, "..", "src", "data", "id", "2014_classes.json");
const RACES_ID = path.join(__dirname, "..", "src", "data", "id", "2014_races.json");

const recommendations = {
  classes: {
    Barbarian: { is_recommended: true, text: "A straightforward melee powerhouse with high durability and simple resource management through Rage. Great for players who want to be in the thick of combat without complex spellcasting." },
    Bard: { is_recommended: false, text: "A versatile support caster with extensive spell and skill options. High mechanical ceiling from managing Inspiration dice, spell slots, and cutting words, but can overwhelm new players." },
    Cleric: { is_recommended: true, text: "A durable divine caster with access to the entire spell list. Strong action economy through Channel Divinity and Turn Undead, plus domain choices offer clear tactical niches without bookkeeping." },
    Druid: { is_recommended: false, text: "A shapeshifting caster with one of the most complex spell lists in the game. Managing Wild Shape, spell preparation, and concentration checks creates a steep learning curve." },
    Fighter: { is_recommended: true, text: "The quintessential martial class with excellent durability and a simple core loop. Action Surge and Second Wind give huge tactical spikes without complex resource tracking." },
    Monk: { is_recommended: false, text: "A mobile martial artist reliant on short-rest resources like Ki points. High tactical ceiling from positioning and stun locks, but requires careful resource economy awareness." },
    Paladin: { is_recommended: true, text: "A heavy-armor divine warrior with burst damage via Smite and strong sustain. Easy to play at a basic level, but spell slot management and aura positioning add tactical depth." },
    Ranger: { is_recommended: false, text: "A martial nature warrior with spellcasting and companion management. Favored Foe and spell tracking add moderate complexity, and positioning is key." },
    Rogue: { is_recommended: true, text: "A skill-focused striker with Sneak Attack and Cunning Action. Low mechanical overhead with a clear core loop, but mastery of positioning and stealth tactics rewards advanced play." },
    Sorcerer: { is_recommended: false, text: "A raw spellcaster with limited spell knowledge but flexible Metamagic. High burst potential, but managing sorcery points and spell choices can be punishing for new casters." },
    Warlock: { is_recommended: false, text: "A pact-bound caster with short-rest spell slots and Eldritch Invocations. Managing invocations, spell slots, and pact magic mechanics creates a steep learning curve." },
    Wizard: { is_recommended: false, text: "The most mechanically complex caster with a vast spellbook. Spell preparation, ritual casting, and arcane recovery create heavy bookkeeping that punishes inexperience." },
    Artificer: { is_recommended: false, text: "A magical tinkerer with infused items and spellcasting. Item management, infusions, and spell tracking create a high mechanical load that can overwhelm beginners." },
  },
  races: {
    Dragonborn: { is_recommended: false, text: "A draconic hero with breath weapon and damage resistance. Simple racial traits, but choosing the right draconic ancestry adds a small decision layer for newer players." },
    Dwarf: { is_recommended: true, text: "A sturdy traditional warrior with excellent durability and darkvision. Dwarven Resilience and Combat Training are easy to use, making it an ideal beginner race." },
    Elf: { is_recommended: false, text: "A graceful, long-lived warrior with keen senses and fey ancestry. Strong in exploration and stealth, but the variety of elven subraces and traits adds choice complexity." },
    "Eladrin (Elf)": { is_recommended: false, text: "A fey-touched elf with seasonal abilities that shift their playstyle. Interesting tactical variety, but the changing mechanics can confuse new players." },
    Gnome: { is_recommended: false, text: "A small, clever inventor with innate magic resistance. Good for trickster or arcane builds, but gnomish subraces and feature interactions add mild complexity." },
    "Deep Gnome (Svirfneblin)": { is_recommended: false, text: "A subterranean gnome with superior darkvision and stealth bonuses. Niche but flavorful, best suited for players who enjoy light-dependent exploration tactics." },
    "Half-Elf": { is_recommended: false, text: "A versatile hybrid with ability score bonuses and skill versatility. Flexible by design, which is great for concept, but the breadth of options can slow new players." },
    "Half-Elf (High Elf)": { is_recommended: false, text: "An elf-leaning half-elf with an extra cantrip and a skill. Adds a small spellcasting choice layer that beginners may find confusing." },
    "Half-Elf (Wood Elf)": { is_recommended: false, text: "An elf-leaning half-elf suited to wilderness exploration. Movement and mask of the wild are easy to use, but subrace selection still adds decision weight." },
    "Half-Elf (Drow)": { is_recommended: false, text: "A dark elf-leaning half-elf with innate spellcasting and darkness control. Strong concept, but sunlight sensitivity and spell options add tactical bookkeeping." },
    "Half-Elf (Moon Elf)": { is_recommended: false, text: "An elf-leaning half-elf with heightened senses and a cantrip. Adds mild spellcasting complexity to an already flexible chassis." },
    "Half-Elf (Sun Elf)": { is_recommended: false, text: "An elf-leaning half-elf with magic resistance and a weapon training bonus. Good for gishes, but the flexibility can distract new players." },
    "Half-Elf (Sea Elf)": { is_recommended: false, text: "An ocean-themed half-elf with swim speed and amphibious breathing. Niche but thematic, best when water exploration is frequent." },
    "Half-Elf (Shadar-kai)": { is_recommended: false, text: "A shadow-touched half-elf with resistance and necrotic teleportation. Interesting tactical tool, but death-tinged mechanics may be less intuitive for beginners." },
    "Half-Elf (Eladrin)": { is_recommended: false, text: "A fey-touched half-elf with a season-linked teleport and charm resistance. Cool flavor, but seasonal ability swaps can confuse new players." },
    "Half-Orc": { is_recommended: true, text: "A tough, aggressive warrior with darkvision, intimidation presence, and a second-wind style death-defying trait. Low mechanical complexity with strong combat feel." },
    Halfling: { is_recommended: true, text: "A lucky, nimble smallfolk with reroll advantages and stealth. Lucky and Brave are simple to use, making halflings a very friendly beginner race." },
    "Lightfoot Halfling": { is_recommended: true, text: "A stealthy halfling that can hide behind larger allies. Low mechanical complexity and strong roleplay hooks." },
    "Stout Halfling": { is_recommended: true, text: "A hearty halfling with poison resistance and bonus constitution. Simple durability boost that is easy to explain and use." },
    "Ghostwise Halfling": { is_recommended: false, text: "A rare halfling subrace with silent speech. Unique communication mechanics, but very niche and situational." },
    Human: { is_recommended: true, text: "The baseline adventurer with balanced ability increases and an extra language. Simple, flexible, and forgiving for new players who want to focus on class mechanics." },
    "Variant Human": { is_recommended: true, text: "A customizable human who trades the standard bonus for a feat, extra skill, and two flexible ability increases. High tactical potential, but feat choice adds a small complexity step." },
    Tiefling: { is_recommended: false, text: "A hellish descendant with resistance and minor spellcasting. Fiendish legacy features are flavorful but can add spell-management weight for new players." },
    "Tiefling (Asmodeus)": { is_recommended: false, text: "A fire-touched tiefling with a cantrip and charisma boost. Simple offense, but managing the extra spell can distract from core class choices." },
    "Tiefling (Baalzebul)": { is_recommended: false, text: "A tiefling with a debuff cantrip and Thaumaturgy. Adds social and control options, which increases decision space for beginners." },
    "Tiefling (Zariel)": { is_recommended: false, text: "A martial tiefling with weapon bonuses and a damaging cantrip. Adds minor combat complexity, but still fairly straightforward." },
    "Tiefling (Dispater)": { is_recommended: false, text: "A deceptive tiefling with a detection cantrip and stealth utility. Adds exploration choices that new players may underuse." },
    "Tiefling (Fierna)": { is_recommended: false, text: "A tiefling with charm-focused cantrips and social utility. Adds roleplay and spellcasting layers that increase cognitive load." },
    "Tiefling (Glasya)": { is_recommended: false, text: "A trickster tiefling with illusion and deception tools. Fun conceptually, but illusions add mechanical overhead for new players." },
    "Tiefling (Levistus)": { is_recommended: false, text: "An ice-themed tiefling with defensive and damaging cantrips. Adds elemental and tactical options that can overwhelm beginners." },
    "Tiefling (Mammon)": { is_recommended: false, text: "A wealth-themed tiefling with a utility cantrip and gold-themed flavor. Adds minor magic and social complexity." },
    "Tiefling (Mephistopheles)": { is_recommended: false, text: "A fire-and-flames tiefling with a damaging cantrip. Adds offensive spell management to an otherwise simple package." },
    Goblin: { is_recommended: false, text: "A small, crafty creature with Fury of the Small and Nimble Escape. Strong tactical positioning tools, but the extra bonus-action option can be tricky for new players." },
    Hobgoblin: { is_recommended: false, text: "A disciplined warrior with tactical positioning bonuses. The Saving Face feature adds reactive decision-making that rewards experience." },
    Kenku: { is_recommended: false, text: "A bird-like mimic with clever movement and mimicry. Roleplay-heavy with limited but flavorful racial abilities; easy to underestimate mechanically." },
    Lizardfolk: { is_recommended: false, text: "A reptilian survivor with natural armor and a bite attack. Simple durability, but the many optional racial traits can slow new players down." },
    Orc: { is_recommended: false, text: "A powerful brute with Aggressive and darkvision. Simple combat presence, but reduced intelligence and pack tactics can confuse new tactical positioning." },
    "Dragonborn (Chromatic)": { is_recommended: false, text: "A draconic descendant with a damaging breath weapon and damage resistance. Simple core, but ancestry choice adds a small selection step." },
    "Dragonborn (Gem)": { is_recommended: false, text: "A gem-scaled dragonborn with psionic-like breath and resistance. Adds another ancestry option layer, which can distract from core class learning." },
    "Dragonborn (Metallic)": { is_recommended: false, text: "A metallic dragonborn with a stronger breath weapon and a minor transformative trait. Adds choice complexity and resource awareness." },
    Bugbear: { is_recommended: false, text: "A tall, aggressive goblinoid with reach and ambush mechanics. Fun for hit-and-run tactics, but the extra movement and surprise rules can trip up new players." },
    Changeling: { is_recommended: false, text: "A shapeshifting diplomat with identity-changing abilities. High social and deceptive potential, but shapechange mechanics add a mechanical and roleplay learning curve." },
    Dhampir: { is_recommended: false, text: "A vampire-like undead descendant with spider climb and biting. Adds dark thematic mechanics and resource-like hunger that can overwhelm new players." },
    Firbolg: { is_recommended: false, text: "A gentle giant with invisibility and nature magic. Easy to roleplay, but the subtle defensive tools require tactical timing to use well." },
    Githyanki: { is_recommended: false, text: "A psionic warrior from the Astral Plane with innate spellcasting and teleportation. Cool concept, but managing innate spells and psionic options adds complexity." },
    Githzerai: { is_recommended: false, text: "A disciplined monk-like race with psionic defense and meditation. The mental discipline mechanics add another layer for new players to track." },
    Reborn: { is_recommended: false, text: "A revenant-style race with past-life knowledge and death resilience. Flavorful, but the extra history and resilience mechanics add bookkeeping." },
    Shifter: { is_recommended: false, text: "A druidic shapeshifter with temporary shifting bonuses. Simple core loop, but Shifter type choice and temporary boost management add decision weight." },
    Tabaxi: { is_recommended: false, text: "A feline explorer with speed and climb. Fun for exploration and hit-and-run, but Feline Agility can leave new players overextended." },
    Triton: { is_recommended: false, text: "An aquatic warrior with amphibious breathing and elemental resistance. Strong in water-heavy campaigns, but situational otherwise." },
    Hexblood: { is_recommended: false, text: "A fey-touched or undead-touched lineage with a dark bargain. Adds a narrative and mechanical bargain layer that adds complexity to character creation." },
    "Aarakocra": { is_recommended: false, text: "A bird-like humanoid with flight and talon attacks. Flight is powerful, but managing aerial positioning and reach can be punishing for new players." },
    Aasimar: { is_recommended: false, text: "A celestial-touched hero with resistance and a healing transformation. Easy to flavor, but the transformation mechanics add a burst-management layer." },
    "Autognome": { is_recommended: false, text: "A mechanical gnome with a built-in tool and limited flight. Fun tinker theme, but the mechanical features add small but persistent complexity." },
    "Plasmoid": { is_recommended: false, text: "An ooze-like creature with flexible anatomy and poison resistance. Niche defensive toolkit that rewards experienced positioning." },
    "Yuan-ti Pureblood": { is_recommended: false, text: "A serpent-touched humanoid with innate spellcasting and poison immunity. Flavorful, but the extra spell list and immunity interactions add complexity." },
  }
};

function addRecommendations(filePath, type) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const key = type === "class" ? "classes" : "races";
  
  if (!data[key]) {
    console.log(`No ${key} found in ${filePath}`);
    return;
  }
  
  let count = 0;
  for (const item of data[key]) {
    const name = item.name;
    const rec = recommendations[type === "class" ? "classes" : "races"][name];
    if (rec) {
      item.recommendation = rec;
      count++;
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Updated ${count} ${type}s in ${path.basename(filePath)}`);
}

addRecommendations(CLASSES_EN, "class");
addRecommendations(RACES_EN, "race");
addRecommendations(CLASSES_ID, "class");
addRecommendations(RACES_ID, "race");

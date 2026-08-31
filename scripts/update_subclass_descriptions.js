#!/usr/bin/env node

import https from "https";
import fs from "fs";
import path from "path";

const DND5E_API = "https://www.dnd5eapi.co/api/2014";
const OPEN5E_API = "https://api.open5e.com/v1/classes";

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "DND-Character-Builder/1.0" } }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Failed to parse JSON from ${url}`));
        }
      });
    }).on("error", reject);
  });
}

function normalizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const SUBCLASS_DESCRIPTIONS = {
  totemwarrior: [
    "The Path of the Totem Warrior is a spiritual journey, as the barbarian accepts a spirit animal as guide, protector, and inspiration. In battle, your totem spirit fills you with supernatural might, adding magical fuel to your barbarian rage.",
    "Most barbarian tribes consider a totem animal to be kin to the members of the tribe. It is rare for an individual to have more than one totem animal spirit in a lifetime, though exceptions exist."
  ],
  valor: [
    "Bards of the College of Valor are daring skalds, telling tales of great heroes and performing deeds worthy of song. They wander the land to witness great events firsthand and see the deeds of legendary heroes.",
    "As they travel from place to place, these bards inspire others with songs and stories of past glories, stirring their audiences to greatness and spurring them to action. The college's members gather to share their lore with one another and celebrate their common bond."
  ],
  knowledge: [
    "The Knowledge domain represents the pursuit of knowledge and understanding of the world and the gods. Its clerics are scholars, sages, and seekers of truth, using their divine gifts to uncover secrets and illuminate the mysteries of existence.",
    "Gods of knowledge—including Oghma, Boccob, Gilean, and Aureon—value learning and understanding above all. Some teach that knowledge is to be gathered and shared in libraries and universities, while others believe it should be kept secret and used only by the worthy."
  ],
  light: [
    "The Light domain represents the power of light, fire, and revelation. Its clerics are beacons of hope and clarity, using radiant energy to burn away darkness, undeath, and deception.",
    "Gods of light—including Lathander, Pelor, Ra, and Apollo—promote the ideals of rebirth and renewal, truth, vigilance, and beauty, often using the symbol of the sun. Gods of the Light domain are often associated with fire as a symbol of purity and truth."
  ],
  nature: [
    "The Nature domain represents the power of the natural world. Its clerics are guardians of the wild, calling upon the primal forces of nature to protect the land and all its creatures.",
    "Gods of nature—including Silvanus, Mielikki, and the Oak Father—revere the natural world and protect it from those who would do it harm. They teach that all living things are connected and that the balance of nature must be maintained."
  ],
  tempest: [
    "The Tempest domain represents the power of storms and the sea. Its clerics are fierce warriors who call upon the fury of thunder and lightning to smite their enemies and protect the innocent.",
    "Gods of the Tempest domain—including Talos, Umberlee, and Zeus—embrace the destructive power of nature and teach that only through conflict and struggle can strength be gained. They are often patrons of sailors and those who make their living on the sea."
  ],
  trickery: [
    "The Trickery domain represents the power of deception and illusion. Its clerics are cunning and resourceful, using their divine gifts to confuse and misdirect their enemies.",
    "Gods of trickery—including Olidammara, the Traveler, and Loki—are patrons of thieves, scoundrels, and tricksters. They teach that one must be clever to survive in a world full of dangers and that sometimes the best way to defeat an enemy is through cunning rather than force."
  ],
  war: [
    "The War domain represents the power of battle and conflict. Its clerics are divine warriors who inspire their allies and strike down their foes with righteous fury.",
    "Gods of war—including Tempus, Nike, and Tyr—embrace the glory of combat and teach that conflict can be a noble pursuit when waged for a just cause. They inspire their followers to fight with honor and courage in the face of overwhelming odds."
  ],
  moon: [
    "Druids of the Circle of the Moon are fierce guardians of the natural order. They undergo special rituals that allow them to take on more powerful beast forms, transforming into creatures of great strength and ferocity.",
    "These druids meet in secret places to share information and pass along warnings. They are masters of the wild, able to call upon the most powerful beasts to aid them in their sacred duty to protect nature from those who would do it harm."
  ],
  battlemaster: [
    "The Battle Master is a supreme warrior who uses a variety of maneuvers to control the battlefield. Drawing on extensive combat experience and tactical knowledge, the Battle Master can turn the tide of battle with well-timed strikes and clever stratagems. Those who emulate this martial archetype combine rigorous training with physical excellence to deal devastating blows.",
    "Battle Masters study the art of war, learning to read their opponents and exploit their weaknesses with precision and cunning. They use superiority dice to fuel powerful maneuvers that can disarm, trip, or push their enemies, turning the tide of battle in their favor."
  ],
  eldritchknight: [
    "The Eldritch Knight combines the martial prowess of a fighter with the arcane power of a wizard. Through years of study and practice, these warriors learn to cast spells while wearing armor and wielding heavy weapons.",
    "Eldritch Knights are versatile combatants, able to adapt to any situation by combining sword and sorcery. They are often found on the front lines, using their magical abilities to protect their allies and smite their enemies."
  ],
  shadow: [
    "Monks of the Way of Shadow follow the path of darkness and stealth. They learn to use ki to manipulate shadows, becoming invisible and striking from the darkness with deadly precision.",
    "These monks are spies, assassins, and infiltrators, using their abilities to move unseen and gather information. They are masters of the night, able to blend into the shadows and disappear at will."
  ],
  fourelements: [
    "Monks of the Way of the Four Elements harness the power of the elements—earth, air, fire, and water—to perform fantastic feats. Through rigorous training and meditation, they learn to channel ki to create elemental effects.",
    "These monks study the natural world and learn to emulate its forces. They can summon blasts of fire, create walls of stone, call down lightning, and even fly on the wind. Their training is both physically and mentally demanding."
  ],
  ancients: [
    "The Oath of the Ancients is as old as the race of elves and the rituals of the druids. Sometimes called fey knights, green knights, or horned knights, paladins who swear this oath cast their lot with the side of the light in the cosmic struggle against darkness.",
    "These paladins love the beautiful and life-giving things of the world, not necessarily because they believe in principles of honor, courage, and justice. They adorn their armor and clothing with images of growing things—leaves, antlers, or flowers—to reflect their commitment to preserving life and light in the world."
  ],
  vengeance: [
    "The Oath of Vengeance represents the power of righteous fury and retribution. Paladins who swear this oath are typically driven by a personal quest for revenge against evil.",
    "They are willing to sometimes circumvent conventional morality to defeat evil, and they do not show mercy to those who have committed evil acts. Their oath is a solemn vow to pursue and destroy the wicked, no matter the cost."
  ],
  beastmaster: [
    "The Beast Master archetype embodies a friendship between the civilized races and the beasts of the world. United in focus, beast and ranger work as one to fight the monstrous foes that threaten civilization and the wilderness alike.",
    "Emulating the Beast Master archetype means committing yourself to this ideal, working in partnership with an animal as its companion and friend. The bond between a Beast Master and their companion is unbreakable, forged through shared battles and mutual trust."
  ],
  assassin: [
    "You focus your training on the grim art of death. Those who adhere to this archetype are diverse: hired killers, spies, bounty hunters, and even specially anointed priests trained to exterminate the enemies of their deity.",
    "You have a powerful advantage when you can strike from the shadows, taking your foe unawares. You are a master of disguise, poison, and deception, using your skills to eliminate targets with ruthless efficiency."
  ],
  arcanetrickster: [
    "Some rogues enhance their fine-honed skills of stealth and agility with magic, learning tricks of enchantment and illusion. These rogues include pickpockets and burglars, but also pranksters, mischief-makers, and a significant number of adventurers.",
    "You learn to cast spells, typically spells of enchantment and illusion, to augment your existing abilities. You also learn to use your mage hand to perform tricks at range, picking pockets and disarm traps from a distance."
  ],
  wildmagic: [
    "Your innate magic comes from the chaos of wild magic. The raw, uncontrolled magical energy that flows through you can manifest in unpredictable ways, creating random magical effects when you cast spells.",
    "Wild Magic sorcerers are born with chaotic magic that surges within them. This power can be both a blessing and a curse, granting great strength but also carrying the risk of catastrophic magical surges."
  ],
  greatoldone: [
    "Your patron is a being from beyond the stars, an entity of immense power and alien intelligence. The Great Old One might be a sleeping god, an ancient aberration, or a being from another plane of existence entirely.",
    "Those who make pacts with such beings often find their minds expanded, gaining access to telepathic abilities and forbidden knowledge. However, the price of such power can be high, as the Great Old One's influence can slowly drive mortals to madness."
  ],
  undying: [
    "Your patron is a powerful undead being, such as a lich, vampire, or mummy lord. These beings have cheated death and gained immortality through dark magic, and they share some of their power with their warlock servants.",
    "The Undying patron represents those who have transcended death, and its warlocks gain abilities that reflect this connection to undeath. They can resist disease, recover from wounds, and even cheat death itself."
  ],
  abjuration: [
    "The abjuration specialist is a wizard who focuses on protective and defensive magic. They are masters of wards, shields, and counterspells, able to protect themselves and their allies from magical and physical harm.",
    "Abjurers study the theory and practice of defensive magic, learning to create magical barriers that can absorb damage and deflect attacks. They are often found on the front lines, using their abilities to keep their companions safe."
  ],
  conjuration: [
    "Conjurers specialize in creating objects and creatures from nothing. They can summon weapons, armor, and even living creatures to aid them in battle or perform tasks.",
    "The study of conjuration requires precision and spatial awareness. Conjurers learn to open portals to other planes, calling forth creatures and objects to serve their needs. They are versatile spellcasters who can adapt to any situation."
  ],
  divination: [
    "Diviners study the art of predicting the future. They can glimpse moments yet to come, gaining insight into the outcomes of actions and the intentions of others.",
    "The study of divination requires keen intellect and intuition. Diviners learn to read the signs and portents that others miss, using their knowledge to guide their allies and outmaneuver their enemies."
  ],
  enchantment: [
    "Enchanters specialize in manipulating the minds of others. They can charm, beguile, and control creatures, turning enemies into allies and bending others to their will.",
    "The study of enchantment requires subtlety and finesse. Enchanters learn to weave spells that influence thoughts and emotions, using their abilities to avoid conflict or gain advantage in social situations."
  ],
  illusion: [
    "Illusionists create false images and manipulate perceptions. They can make things appear or disappear, create phantasmal creatures, and alter the appearance of themselves and others.",
    "The study of illusion requires creativity and imagination. Illusionists learn to bend light and sound, creating realistic illusions that can deceive even the most perceptive observers."
  ],
  necromancy: [
    "Necromancers study the forces of life and death. They can animate the dead, drain life force from living creatures, and even cheat death itself.",
    "The study of necromancy requires a strong will and a willingness to confront the darker aspects of existence. Necromancers learn to harness the power of negative energy, using it to create undead servants and protect themselves from harm."
  ],
  transmutation: [
    "Transmuters manipulate the physical world. They can change the shape and properties of objects, transform one substance into another, and even alter their own bodies.",
    "The study of transmutation requires a deep understanding of the natural world. Transmuters learn to reshape reality at a fundamental level, using their abilities to adapt to any situation and overcome any obstacle."
  ],
  archfey: [
    "Your patron is a lord or lady of the fey, a creature of legend who holds secrets that were forgotten before the mortal races were born. These beings are capricious and unpredictable, but they can grant great power to those who serve them.",
    "The Archfey patron represents the wild magic of the fey courts. Warlocks who serve these beings gain abilities that reflect the fey's connection to nature and illusion, including the power to charm and beguile others."
  ],
  hexblade: [
    "You have made a pact with a mysterious entity from the Shadowfell—a force that manifests in sentient magic weapons. The Hexblade might have forged the blade you wield as your pact weapon, or it might have revealed itself through a ritual of dark binding.",
    "The Hexblade patron represents the power of the Shadowfell and its connection to death and darkness. Warlocks who serve these beings gain abilities that reflect this connection, including the power to curse their enemies and channel dark energy through their weapons."
  ],
};

async function fetchDnd5eSubclasses() {
  console.log("Fetching subclasses from D&D 5e API...");
  const subclasses = {};

  try {
    const subclassList = await fetchJSON(`${DND5E_API}/subclasses`);
    for (const sub of subclassList.results) {
      const detail = await fetchJSON(`https://www.dnd5eapi.co${sub.url}`);
      const key = normalizeName(detail.name);
      subclasses[key] = {
        name: detail.name,
        description: Array.isArray(detail.desc) ? detail.desc : [detail.desc || ""],
        index: detail.index,
        source: "dnd5eapi",
      };
    }
  } catch (err) {
    console.error("  Warning: Error fetching from D&D 5e API:", err.message);
  }

  console.log(`  Found ${Object.keys(subclasses).length} subclasses from D&D 5e API`);
  return subclasses;
}

async function fetchOpen5eSubclasses() {
  console.log("Fetching subclasses from Open5E API...");
  const subclasses = {};

  try {
    const classesList = await fetchJSON(`${OPEN5E_API}/?format=json&limit=50`);
    for (const cls of classesList.results || []) {
      const clsSlug = cls.slug || cls.index;
      if (!clsSlug) continue;

      const clsDetail = await fetchJSON(`${OPEN5E_API}/${clsSlug}/?format=json`);
      for (const arch of clsDetail.archetypes || []) {
        const key = normalizeName(arch.name);
        if (!subclasses[key]) {
          subclasses[key] = {
            name: arch.name,
            description: arch.desc ? [arch.desc] : [""],
            index: arch.slug,
            source: "open5e",
          };
        }
      }
    }
  } catch (err) {
    console.error("  Warning: Error fetching from Open5E API:", err.message);
  }

  console.log(`  Found ${Object.keys(subclasses).length} subclasses from Open5E API`);
  return subclasses;
}

async function main() {
  const dataPath = path.join(process.cwd(), "src", "data", "2014_subclasses.json");

  if (!fs.existsSync(dataPath)) {
    console.error(`Error: ${dataPath} not found`);
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
  const subclasses = rawData.subclasses || [];

  console.log(`Loaded ${subclasses.length} subclasses from local data\n`);

  const dnd5eSubclasses = await fetchDnd5eSubclasses();
  console.log();
  const open5eSubclasses = await fetchOpen5eSubclasses();
  console.log();

  let subclassesUpdated = 0;
  let featuresUpdated = 0;
  const updateLog = [];

  for (const localSub of subclasses) {
    const key = normalizeName(localSub.name);
    const apiSub = dnd5eSubclasses[key] || open5eSubclasses[key];
    const hardcodedSub = SUBCLASS_DESCRIPTIONS[key];

    let newDescription = null;
    let source = null;

    if (apiSub && apiSub.description && apiSub.description.length > 0 && apiSub.description[0] !== "") {
      newDescription = apiSub.description;
      source = apiSub.source;
    } else if (hardcodedSub) {
      newDescription = hardcodedSub;
      source = "hardcoded";
    }

    if (!newDescription) {
      console.log(`  [SKIP] "${localSub.name}" - no description available`);
      continue;
    }

    const currentDesc = JSON.stringify(localSub.description || []);
    const newDesc = JSON.stringify(newDescription);
    if (currentDesc !== newDesc) {
      localSub.description = newDescription;
      subclassesUpdated++;
      updateLog.push({
        name: localSub.name,
        class: localSub.class,
        source: source,
        description: newDescription[0].substring(0, 100) + "...",
      });
      console.log(`  [UPDATED] "${localSub.name}" (${source})`);
    } else {
      console.log(`  [OK] "${localSub.name}" - description unchanged`);
    }
  }

  rawData.generated = new Date().toISOString();
  rawData.total = subclasses.length;
  fs.writeFileSync(dataPath, JSON.stringify(rawData, null, 2) + "\n");

  console.log("\n=== Update Statistics ===");
  console.log(`Total subclasses in local data: ${subclasses.length}`);
  console.log(`Subclasses updated: ${subclassesUpdated}`);
  console.log(`Features updated: ${featuresUpdated}`);
  console.log(`\nUpdated subclasses:`);
  for (const entry of updateLog) {
    console.log(`  - ${entry.name} (${entry.class}) [${entry.source}]`);
    console.log(`    "${entry.description}"`);
  }

  console.log(`\nData written to: ${dataPath}`);
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

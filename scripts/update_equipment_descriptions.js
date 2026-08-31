const fs = require('fs');
const path = require('path');

const ARMOR_FILE = path.join(__dirname, '..', 'src', 'data', '2014_armor.json');
const ITEMS_FILE = path.join(__dirname, '..', 'src', 'data', '2014_items.json');
const EQUIPMENTS_FILE = path.join(__dirname, '..', 'src', 'data', '2014_equipments.json');

const DESCRIPTIONS = {
  // === ARMOR ===
  breastplate:
    'A fitted metal chest piece that covers the torso while leaving the legs free for mobility. It offers solid protection without the weight of a full suit, making it a favored choice of soldiers and adventurers who value both defense and agility.',
  'chain-mail':
    'Interlocking metal rings woven into a shirt that covers the torso and arms. Heavy and durable, it provides excellent protection but is noisy and requires considerable strength to wear effectively.',
  'chain-shirt':
    'A shirt of interlocking metal rings worn as a lighter alternative to chain mail. It offers decent protection while allowing greater freedom of movement, often worn under clothing or combined with other armor.',
  'half-plate-armor':
    'A combination of plate armor pieces covering roughly half the body, paired with brigandine or leather on the rest. It offers substantial protection with less weight than full plate, though its articulated joints create slight noise.',
  'hide-armor':
    'Thick animal hides layered and boiled for rigidity, fashioned into a crude but functional suit. Common among barbarians and wilderness dwellers, it provides basic protection at low cost.',
  'leather-armor':
    'A breastpiece and shoulder guards of hardened leather, offering light protection while allowing full mobility. Favored by scouts and rogues, it is the simplest armor that still provides meaningful defense.',
  'padded-armor':
    'A quilted coat of layered cloth and batting that absorbs blows. While offering minimal protection, it is better than nothing and has the advantage of being wearable under other armor.',
  'plate-armor':
    'A full suit of carefully fitted and articulated steel plates covering the entire body. The pinnacle of armorcraft, it provides unmatched protection but is prohibitively expensive and requires great strength to wear.',
  'ring-mail':
    'A leather suit with heavy rings sewn onto it for additional protection. An older design that offers modest defense, it is less effective than chain armor but easier to produce.',
  'scale-mail':
    'A coat of leather covered with overlapping metal scales, resembling the hide of a dragon or fish. It offers good protection with moderate weight, though its many small scales can catch and snag.',
  shield:
    'A hand-held barrier of wood or metal used to block blows. Wielded in the off-hand, it provides a quick boost to defense and can be used offensively in a shield bash.',
  'splint-armor':
    'Vertical strips of metal riveted to a backing of leather and cloth. Similar in construction to a flail, it offers heavy protection at moderate cost, though its weight limits mobility.',
  'studded-leather-armor':
    'Hardened leather reinforced with closely spaced metal studs or rivets. It offers better protection than standard leather armor while maintaining the light weight and flexibility favored by rangers and scouts.',

  // === WEAPONS ===
  battleaxe:
    'A broad-bladed axe mounted on a sturdy haft, designed for war. Its heavy head delivers devastating chopping blows, cleaving through armor and shield alike.',
  blowgun:
    'A narrow tube used to propel small darts with a breath of air. Silent and deadly, it favors stealth over brute force.',
  club:
    'A simple length of wood shaped into a weapon. Crude but effective, it has served as a tool of violence since the earliest days.',
  'crossbow-hand':
    'A compact crossbow that can be wielded and fired with one hand. Its concealed size makes it a favored tool of assassins and scouts.',
  'crossbow-heavy':
    'A large crossbow with a powerful draw, capable of launching bolts with tremendous force. Its weight and bulk demand two hands to operate.',
  'crossbow-light':
    'A small, simple crossbow that is easy to load and fire. Popular among travelers and militia for its reliability and ease of use.',
  dagger:
    'A short, double-edged blade designed for stabbing and slashing. Light and concealable, it is a versatile tool in both combat and daily life.',
  dart:
    'A small, weighted projectile designed to be thrown with accuracy. Easy to conceal and quick to throw, darts are favored by those who prefer ranged precision.',
  flail:
    'A spiked metal ball attached to a handle by a chain. Its swinging strikes can bypass shields and deliver crushing bludgeoning damage.',
  glaive:
    'A polearm with a single-edged blade mounted at the end of a long shaft. Its reach allows wielders to strike foes from a safe distance.',
  greataxe:
    'An immense axe with a heavy, broad blade. Wielded with two hands, it delivers devastating slashing blows that can cleave through the toughest defenses.',
  greatclub:
    'A massive, heavy club fashioned from a thick log or bound timber. Crude and oversized, its weight delivers tremendous blunt force.',
  greatsword:
    'A towering two-handed blade of exceptional length and weight. Mastery of this weapon allows for sweeping cuts that can fell multiple foes.',
  halberd:
    'A versatile polearm combining an axe blade with a spear point and a hook. Effective for both chopping and thrusting, it is a staple of battlefield infantry.',
  handaxe:
    'A small, light axe designed for one-handed use or throwing. Its balance makes it equally effective in close combat or hurled at distant targets.',
  javelin:
    'A light spear designed primarily for throwing. Its aerodynamic design allows it to be hurled with great distance and penetrating force.',
  lance:
    'A long, sturdy weapon designed for mounted combat. When couched under the arm during a charge, it delivers devastating piercing damage.',
  'light-hammer':
    'A small, balanced hammer that can be thrown or wielded in close combat. Its compact head delivers focused bludgeoning force.',
  longbow:
    'A tall bow with a powerful draw, capable of sending arrows great distances with deadly accuracy. Crafted from a single piece of quality wood, it requires strength and skill to master.',
  longsword:
    'A versatile blade of moderate length, balanced for one or two-handed use. The quintessential knightly weapon, it excels at both slashing and thrusting.',
  mace:
    'A heavy metal head mounted on a sturdy shaft, designed to crush and bludgeon. Against heavily armored foes, its concentrated impact is particularly effective.',
  maul:
    'An enormous two-headed sledgehammer of immense weight. Wielded with two hands, its crushing blows can shatter bone and splinter shields.',
  morningstar:
    'A spiked mace with a heavy, flanged head designed to puncture and tear. Its brutal design inflicts grievous piercing wounds.',
  net:
    'A weighted mesh net designed to entangle and restrain foes. When thrown effectively, it can immobilize a creature, rendering it helpless.',
  pike:
    'An exceptionally long thrusting spear used by formations of infantry. Its extreme reach allows ranks of soldiers to strike at approaching enemies from behind the front line.',
  quarterstaff:
    'A length of hardened wood, typically six to eight feet long. Simple yet effective, it can be wielded as a versatile weapon or walking aid.',
  rapier:
    'A slender, sharply pointed sword designed for thrusting. Favored by duelists and nobles, it emphasizes speed and finesse over raw power.',
  scimitar:
    'A curved, single-edged sword designed for slashing. Its sweeping blade allows for quick, graceful cuts and is favored by cavalry and skirmishers.',
  shortbow:
    'A compact bow suitable for hunting and skirmishing. Easy to handle and quick to fire, it is a reliable weapon for those who fight at range.',
  shortsword:
    'A light, double-edged blade of moderate length. Well-suited for quick thrusts and cuts, it is a favored sidearm among soldiers and adventurers.',
  sickle:
    'A curved agricultural blade adapted for combat. Its hooked edge can catch limbs and deliver slashing cuts, though it is primarily a farming tool.',
  sling:
    'A simple leather strap used to hurl stones or lead bullets at high velocity. Ancient yet deadly, it requires skill but can strike from great range.',
  spear:
    'A simple shaft tipped with a sharpened point, usable for thrusting or throwing. One of the oldest and most reliable weapons known to civilization.',
  trident:
    'A three-pronged spear designed for both melee and throwing. Associated with coastal peoples and waterborne combat, it is effective on land and sea.',
  'war-pick':
    'A specialized hammer with a pointed spike opposite the hammer face. Designed to pierce armor, its concentrated impact can punch through metal plate.',
  warhammer:
    'A heavy hammer designed for combat, balanced for one or two-handed use. Its solid head delivers tremendous concussive force against armor and flesh alike.',
  whip:
    'A long, flexible lash of braided leather or cord. Though not a weapon of war in the traditional sense, its reach and finesse make it deadly in skilled hands.',

  // === ADVENTURING GEAR ===
  abacus:
    'A frame of beads on rods used for counting and calculation. Essential for merchants, bankers, and anyone who needs to keep precise accounts on the road.',
  'animal-feed-1-day':
    'A day\'s worth of feed for a single mount or beast of burden. Typically a mix of grain, dried vegetables, and hay.',
  arrow:
    'A shafted projectile designed for use with a bow. Each arrow consists of a wooden shaft, fletching, and a metal arrowhead.',
  backpack:
    'A sturdy leather sack with shoulder straps, designed to carry gear on the back. It has multiple compartments and can hold several days\' worth of supplies.',
  barrel:
    'A large wooden cask bound with iron hoops, used for storing liquids or dry goods. A standard barrel can hold up to 40 gallons of liquid.',
  basket:
    'A woven container of reeds or wicker, useful for carrying goods, foraging, or storing items. Lightweight and versatile.',
  bedroll:
    'A rolled-up bedding kit consisting of a thick blanket and a thin mattress, tied with leather straps. Essential for sleeping comfortably outdoors.',
  bell:
    'A small handheld metal bell that produces a clear ringing tone. Useful for signaling, alerting guards, or drawing attention.',
  'bit-and-bridle':
    'The headgear used to control a horse or similar mount, consisting of metal bars (bit) placed in the animal\'s mouth and straps (bridle) fitting around the head.',
  blanket:
    'A thick woven cloth used for warmth while sleeping or as a makeshift curtain, wrap, or padding.',
  'blowgun-needle':
    'A small, lightweight dart designed for use with a blowgun. Often coated with poison for silent takedowns.',
  'bottle-glass':
    'A fragile glass container with a narrow neck and cork stopper, used for holding liquids such as potions, ink, or wine.',
  bucket:
    'A cylindrical container of wood or metal with a handle, used for carrying water, mixing compounds, or holding various materials.',
  burglars_pack:
    'A curated collection of gear for the aspiring rogue, including a backpack, ball bearings, string, bells, candles, crowbar, hammer, pitons, a lantern, oil, rations, tinderbox, waterskin, and rope.',
  'burglars-pack':
    'A curated collection of gear for the aspiring rogue, including a backpack, ball bearings, string, bells, candles, crowbar, hammer, pitons, a lantern, oil, rations, tinderbox, waterskin, and rope.',
  camel:
    'A large desert beast of burden, capable of carrying heavy loads across arid terrain for days without water. Slower than a horse but better suited to desert conditions.',
  carriage:
    'A four-wheeled enclosed vehicle designed to carry passengers in relative comfort. Drawn by horses, it features padded seating and a roof.',
  cart:
    'A two-wheeled open vehicle pulled by a draft animal, used for hauling goods, supplies, or refuse. Simple and utilitarian.',
  'chalk-1-piece':
    'A small stick of soft limestone used to mark surfaces. Useful for leaving signs, marking paths, or tallying counts.',
  chariot:
    'A lightweight, two-wheeled vehicle drawn by horses, used for rapid transport or mounted combat. Its open design allows the rider to fight while moving.',
  chest:
    'A large wooden box with a hinged lid and lock, used for storing treasure, trade goods, or personal belongings. Reinforced with iron bands for durability.',
  'clothes-common':
    'A set of ordinary, practical garments suitable for common folk. Includes a simple shirt, pants or skirt, and basic footwear.',
  'clothes-costume':
    'An elaborate outfit designed for disguise or performance. May include masks, exotic fabrics, and accessories to help the wearer assume a different identity.',
  'clothes-fine':
    'An expensive set of garments made from quality fabrics with fine tailoring. Includes silk linings, decorative buttons, and matching accessories.',
  'clothes-travelers':
    'A sturdy set of garments designed for long journeys on foot. Made from durable fabrics in earth tones, it includes a cloak, sturdy boots, and a wide-brimmed hat.',
  'crossbow-bolt':
    'A short, thick shaft designed for use with a crossbow. Shorter and heavier than an arrow, it delivers tremendous impact at close to medium range.',
  diplomats_pack:
    'A collection of items for the traveling negotiator, including a chest, map cases, fine clothes, writing supplies, lamp, oil, paper, perfume, sealing wax, and soap.',
  'diplomats-pack':
    'A collection of items for the traveling negotiator, including a chest, map cases, fine clothes, writing supplies, lamp, oil, paper, perfume, sealing wax, and soap.',
  donkey:
    'A sturdy, sure-footed beast of burden. Slower than a horse but more reliable on rough terrain and less expensive to maintain.',
  dungeoneers_pack:
    'Essential gear for exploring underground, including a backpack, crowbar, hammer, pitons, torches, tinderbox, rations, waterskin, and rope.',
  'dungeoneers-pack':
    'Essential gear for exploring underground, including a backpack, crowbar, hammer, pitons, torches, tinderbox, rations, waterskin, and rope.',
  elephant:
    'A massive beast used as a living war machine or heavy transport. Elephants can carry enormous loads and are fearsome in battle.',
  entertainers_pack:
    'Gear for the traveling performer, including a backpack, bedroll, costumes, candles, rations, waterskin, and a disguise kit.',
  'entertainers-pack':
    'Gear for the traveling performer, including a backpack, bedroll, costumes, candles, rations, waterskin, and a disguise kit.',
  explorers_pack:
    'A well-rounded kit for wilderness travel, including a backpack, bedroll, mess kit, tinderbox, torches, rations, waterskin, and rope.',
  'explorers-pack':
    'A well-rounded kit for wilderness travel, including a backpack, bedroll, mess kit, tinderbox, torches, rations, waterskin, and rope.',
  'flask-or-tankard':
    'A small container for holding liquid, whether a simple ceramic tankard for ale or a metal flask for stronger spirits.',
  galley:
    'A large warship propelled by rows of oars and sails. Used for naval combat and transporting troops across open water.',
  'grappling-hook':
    'A multi-pronged metal hook attached to a rope, used to catch on ledges, walls, or rigging to enable climbing or crossing gaps.',
  hammer:
    'A simple tool with a weighted head, used for driving nails, breaking objects, or shaping metal. The same tool makes a surprisingly effective weapon.',
  'hammer-sledge':
    'A massive two-handed hammer with a heavy iron head, used for breaking stone, driving stakes, or demolishing structures.',
  'horse-draft':
    'A large, powerful horse bred for pulling heavy loads rather than speed. Essential for hauling wagons and carts over long distances.',
  'horse-riding':
    'A trained mount suitable for riding. Faster and more agile than a draft horse, it is the standard steed for adventurers and cavalry.',
  hourglass:
    'A timepiece consisting of two glass bulbs connected by a narrow passage, through which sand flows in exactly one hour. Useful for tracking short durations.',
  'ink-1-ounce-bottle':
    'A small bottle of black or colored ink, used for writing, drawing maps, or illuminating manuscripts. Essential for scribes and scholars.',
  'ink-pen':
    'A slender pointed instrument dipped in ink for writing or drawing. Typically made from a bird feather with a sharpened and split tip.',
  'jug-or-pitcher':
    'A ceramic or metal container with a handle and spout, used for storing and pouring liquids such as water, milk, or wine.',
  'ladder-10-foot':
    'A wooden ladder ten feet in length, consisting of two side rails connected by rungs. Useful for climbing walls, trees, or other vertical obstacles.',
  longship:
    'A long, shallow-draft vessel propelled by oars and a single sail. Designed for both open-ocean voyages and river navigation.',
  mastiff:
    'A large, powerful breed of dog trained for guarding, hunting, or warfare. Loyal and fierce, mastiffs make excellent companions and guard animals.',
  'mirror-steel':
    'A small polished steel mirror, useful for seeing around corners, signaling at a distance, or checking one\'s appearance.',
  mule:
    'A hybrid offspring of a horse and donkey, combining the best traits of both. Sure-footed, patient, and strong, mules are excellent pack animals.',
  'paper-one-sheet':
    'A single sheet of fine paper, suitable for writing letters, drawing maps, or recording important information.',
  'parchment-one-sheet':
    'A sheet of treated animal skin, prepared for writing. More durable than paper, parchment is used for important documents and maps.',
  'perfume-vial':
    'A small crystal vial containing concentrated fragrance. A single application can mask unpleasant odors or convey social status.',
  'pick-miners':
    'A heavy, pointed tool designed for breaking rock and ore. Its sharp point concentrates force to shatter stone with each strike.',
  piton:
    'A pointed metal spike driven into rock or wood to serve as an anchor point for ropes. Essential for climbing sheer surfaces.',
  'pole-10-foot':
    'A sturdy wooden pole, ten feet in length. Useful for probing pits, measuring depths, knocking down objects, or as a makeshift weapon.',
  pony:
    'A small horse suitable for lighter riders or as a pack animal. Sure-footed on mountain trails, ponies are favored by halflings and dwarves.',
  'pot-iron':
    'A heavy cast-iron cooking pot with a lid, capable of withstanding direct flame. Used for boiling water, cooking stews, or melting substances.',
  priests_pack:
    'A collection of items for the traveling cleric, including a backpack, blanket, candles, an alms box, incense, censer, vestments, rations, waterskin, and robes.',
  'priests-pack':
    'A collection of items for the traveling cleric, including a backpack, blanket, candles, an alms box, incense, censer, vestments, rations, waterskin, and robes.',
  robes:
    'Loose, flowing garments that cover the body from shoulder to ankle. Common among wizards, priests, and scholars, robes offer comfort and concealment.',
  sack:
    'A large cloth or leather bag with a drawstring closure, used for carrying bulk goods, loot, or supplies.',
  'saddle-pack':
    'A pair of leather bags designed to hang on either side of a horse\'s saddle, used for carrying supplies on long journeys.',
  'saddle-riding':
    'A leather seat secured to a horse\'s back with straps and buckles, providing stability and comfort for the rider.',
  saddlebags:
    'Reinforced leather bags that attach behind a saddle, used for carrying provisions, gear, and personal items during travel.',
  'sailing-ship':
    'A large ocean-going vessel powered by multiple masts and sails. Capable of crossing seas and carrying significant cargo or crew.',
  scholars_pack:
    'A kit for the traveling academic, including a backpack, book of lore, ink, ink pen, parchment, sand, and a small knife.',
  'scholars-pack':
    'A kit for the traveling academic, including a backpack, book of lore, ink, ink pen, parchment, sand, and a small knife.',
  'sealing-wax':
    'A stick of hardened wax that melts when heated, used to seal letters and packages. Often stamped with a signet ring to verify the sender.',
  shovel:
    'A broad, flat blade attached to a handle, used for digging earth, sand, or snow. Essential for burying the dead or excavating ruins.',
  'signal-whistle':
    'A small metal whistle that produces a piercing tone audible over great distances. Used for signaling between party members in poor visibility.',
  'signet-ring':
    'A ring bearing a family crest, guild symbol, or official seal. Used to authenticate documents by pressing into warm wax.',
  sled:
    'A flat-bottomed vehicle designed to slide over snow or ice. Pulled by animals or people, it is essential for transporting goods in arctic environments.',
  'sling-bullet':
    'A smooth, rounded stone or lead pellet designed for use with a sling. Easily found or manufactured, sling bullets are the ammunition of the common folk.',
  soap:
    'A bar of rendered fat mixed with lye and ash, used for cleaning wounds, washing clothes, or maintaining hygiene.',
  'spike-iron':
    'A heavy iron spike, larger and sturdier than a piton. Used as a door anchor, improvised weapon, or structural support.',
  'stabling-1-day':
    'A day\'s board for a single mount, including a stall, feed, water, and basic grooming.',
  vial:
    'A small glass container with a tight stopper, used for holding potions, poison, or other precious liquids. Typically holds about one ounce.',
  wagon:
    'A four-wheeled vehicle pulled by draft animals, used for hauling goods, supplies, or passengers over roads and trails.',
  warhorse:
    'A powerful, specially trained mount bred for combat. Warhorses are trained to remain calm in battle and can wear barding armor.',
  warship:
    'A large, heavily armed vessel designed for naval warfare. Equipped with rams, ballistae, and marines, it dominates the seas.',
  waterskin:
    'A leather bladder designed to carry water or other liquids. A full waterskin holds about a gallon and can sustain a traveler for a day.',
  whetstone:
    'A flat, coarse stone used to sharpen blades and tools. Regular use keeps swords, axes, and knives at peak effectiveness.',
};

async function fetchFromOpen5E(endpoint) {
  try {
    const res = await fetch(endpoint);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function main() {
  let armorUpdated = 0;
  let itemsUpdated = 0;
  let equipmentsUpdated = 0;

  // --- Update Armor ---
  const armorContent = fs.readFileSync(ARMOR_FILE, 'utf8');
  const armorData = JSON.parse(armorContent);
  for (const armor of armorData.armors) {
    const desc = DESCRIPTIONS[armor.index];
    if (desc) {
      armor.description = desc;
      armorUpdated++;
    }
  }
  fs.writeFileSync(ARMOR_FILE, JSON.stringify(armorData, null, 2), 'utf8');

  // --- Update Items ---
  const itemsContent = fs.readFileSync(ITEMS_FILE, 'utf8');
  const itemsData = JSON.parse(itemsContent);
  for (const item of itemsData.items) {
    if (!item.description || item.description.trim() === '') {
      const desc = DESCRIPTIONS[item.index];
      if (desc) {
        item.description = desc;
        itemsUpdated++;
      }
    }
  }
  fs.writeFileSync(ITEMS_FILE, JSON.stringify(itemsData, null, 2), 'utf8');

  // --- Update Equipments ---
  const eqContent = fs.readFileSync(EQUIPMENTS_FILE, 'utf8');
  const eqData = JSON.parse(eqContent);
  for (const eq of eqData.equipments) {
    if (!eq.description || eq.description.trim() === '') {
      const desc = DESCRIPTIONS[eq.index];
      if (desc) {
        eq.description = desc;
        equipmentsUpdated++;
      }
    }
  }
  fs.writeFileSync(EQUIPMENTS_FILE, JSON.stringify(eqData, null, 2), 'utf8');

  console.log(`\n=== Update Summary ===`);
  console.log(`Armors updated: ${armorUpdated}`);
  console.log(`Items updated: ${itemsUpdated}`);
  console.log(`Equipments updated: ${equipmentsUpdated}`);
  console.log(`Total updated: ${armorUpdated + itemsUpdated + equipmentsUpdated}`);

  console.log(`\n=== Sample Updated Entries ===`);
  const samples = ['breastplate', 'chain-mail', 'shield', 'backpack', 'arrow', 'bedroll', 'dagger'];
  for (const idx of samples) {
    const desc = DESCRIPTIONS[idx];
    if (desc) {
      console.log(`\n--- ${idx} ---`);
      console.log(`description: ${desc.substring(0, 100)}...`);
    }
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

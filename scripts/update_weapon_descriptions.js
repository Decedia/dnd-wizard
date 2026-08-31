const fs = require('fs');
const path = require('path');

const WEAPONS_FILE = path.join(__dirname, '..', 'src', 'data', '2014_weapon.json');

const WEAPON_DESCRIPTIONS = {
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
};

async function main() {
  const fileContent = fs.readFileSync(WEAPONS_FILE, 'utf8');
  const weaponData = JSON.parse(fileContent);

  const weaponIndexMap = new Map();
  for (const weapon of weaponData.weapons) {
    weaponIndexMap.set(weapon.index, weapon);
  }

  let updated = 0;
  let notFound = 0;
  const notFoundList = [];

  for (const [index, description] of Object.entries(WEAPON_DESCRIPTIONS)) {
    const weapon = weaponIndexMap.get(index);
    if (!weapon) {
      notFound++;
      notFoundList.push(index);
      continue;
    }

    weapon.description = description;
    updated++;
  }

  fs.writeFileSync(WEAPONS_FILE, JSON.stringify(weaponData, null, 2), 'utf8');

  console.log(`\n=== Update Summary ===`);
  console.log(`Weapons updated: ${updated}`);
  console.log(`Weapons not found locally: ${notFound}`);
  if (notFoundList.length > 0) {
    console.log(`Not found: ${notFoundList.join(', ')}`);
  }

  console.log(`\n=== Sample Updated Weapons ===`);
  const sampleWeapons = Object.entries(WEAPON_DESCRIPTIONS).slice(0, 5);
  for (const [index, desc] of sampleWeapons) {
    const weapon = weaponIndexMap.get(index);
    if (weapon) {
      console.log(`\n--- ${weapon.name} (${index}) ---`);
      console.log(`description: ${desc.substring(0, 120)}...`);
    }
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});

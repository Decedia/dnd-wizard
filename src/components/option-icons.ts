// A Game Icon for every option in the level-up pickers: one per option where
// the option has a clear picture (a totem animal, an element, a terrain), else
// one for the whole feature. Tools and weapons use their item icon. Flat and single-colour, like the race and class icons.

import type { IconType } from "react-icons";
import { findCatalogItem } from "@/data/item-catalog";
import { ITEM_ICONS } from "./item-icon-map";
import {
  GiAngelWings, GiArcheryTarget, GiArrowFlights, GiBearHead, GiBoar, GiBookCover, GiBowArrow, GiBreastplate, GiBroadsword,
  GiCat, GiCaveEntrance, GiCheckedShield, GiClaws, GiCloudRing, GiCrossedSwords, GiCrown, GiCrystalBall, GiDaemonSkull, GiDaggers,
  GiDeerHead, GiDesert, GiDodge, GiDragonBreath, GiDragonHead, GiEagleHead, GiFairy, GiFangs, GiFireBreath, GiFireRing, GiFist,
  GiForest, GiGiant, GiGrass, GiHawkEmblem, GiHills, GiHolySymbol, GiIceBolt, GiLightningStorm, GiLyre, GiMagicSwirl, GiMountains,
  GiNinjaArmor, GiOpenBook, GiOrcHead, GiPawPrint, GiPentacle, GiRobotGolem, GiRuneStone, GiScrollUnfurled, GiShamblingZombie,
  GiShield, GiShieldReflect, GiSittingDog, GiSkills, GiSlime, GiSnowflake1, GiSparkles, GiSpellBook, GiSpiderAlt, GiStoneBlock,
  GiSwamp, GiSwordsPower, GiTalk, GiTargetArrows, GiTigerHead, GiToolbox, GiTornado, GiUndergroundCave, GiVineFlower, GiWaterBolt,
  GiWaves, GiWhirlwind, GiWindHole, GiWolfHead, GiBeastEye,
  GiAnvil, GiBattleAxe, GiBee, GiBrain, GiCannon, GiChessKnight, GiDove, GiDramaMasks, GiDrinking, GiEyeOfHorus, GiFireBowl, GiGears, GiGhost,
  GiHealing, GiHoodedFigure, GiHorseHead, GiHourglass, GiKatana, GiKrakenTentacle, GiLockPicking, GiMagicLamp, GiMagicPortal, GiMagnifyingGlass,
  GiMedal, GiMeditation, GiMoon, GiMushroomGills, GiOakLeaf, GiPotionBall, GiQuillInk, GiRuneSword, GiScales, GiSkullCrossedBones, GiSoundWaves,
  GiMuscleUp, GiAcrobatic, GiHandOk, GiEyeTarget, GiCampfire, GiShouting,
  GiSpikedShield, GiStarSwirl, GiSun, GiSwordWound, GiTentacleStrike, GiThunderStruck, GiTwirlyFlower, GiWolfHowl, GiAngelOutfit,
} from "react-icons/gi";

/** Matched against the option name, first match wins. */
const BY_OPTION: [RegExp, IconType][] = [
  // Skills and tools (Expertise, bonus proficiencies)
  [/^Athletics$/, GiMuscleUp], [/^Acrobatics$/, GiAcrobatic], [/^Sleight of Hand$/, GiHandOk], [/^Stealth$/, GiHoodedFigure],
  [/^Arcana$/, GiMagicSwirl], [/^History$/, GiScrollUnfurled], [/^Investigation$/, GiMagnifyingGlass], [/^Nature$/, GiOakLeaf], [/^Religion$/, GiHolySymbol],
  [/^Animal Handling$/, GiPawPrint], [/^Insight$/, GiBrain], [/^Medicine$/, GiHealing], [/^Perception$/, GiEyeTarget], [/^Survival$/, GiCampfire],
  [/^Deception$/, GiDramaMasks], [/^Intimidation$/, GiShouting], [/^Performance$/, GiLyre], [/^Persuasion$/, GiTalk], [/^Thieves' Tools$/, GiLockPicking],
  // Fighting styles
  [/Archery/, GiArcheryTarget], [/Defense$/, GiCheckedShield], [/Dueling/, GiBroadsword], [/Great Weapon/, GiSwordsPower],
  [/Protection$/, GiShield], [/Two-Weapon/, GiDaggers], [/Blind Fighting/, GiBeastEye], [/Interception/, GiShieldReflect],
  [/Superior Technique/, GiCrossedSwords], [/Thrown Weapon/, GiArrowFlights], [/Unarmed Fighting/, GiFist], [/Blessed Warrior|Druidic Warrior/, GiSparkles],
  // Totems and beasts
  [/Bear$/, GiBearHead], [/Eagle$/, GiEagleHead], [/Wolf$/, GiWolfHead], [/Elk$/, GiDeerHead], [/Tiger$/, GiTigerHead],
  [/Panther/, GiCat], [/Mastiff/, GiSittingDog], [/Hawk/, GiHawkEmblem], [/Boar/, GiBoar], [/Spider/, GiSpiderAlt], [/Badger/, GiPawPrint],
  [/Beast of the Land/, GiPawPrint], [/Beast of the Sea/, GiWaves], [/Beast of the Sky/, GiHawkEmblem],
  [/^Bite$/, GiFangs], [/^Claws$/, GiClaws],
  // Elements and runes
  [/Fire Rune/, GiFireRing], [/Frost Rune/, GiIceBolt], [/Stone Rune/, GiStoneBlock], [/Hill Rune/, GiHills], [/Storm Rune/, GiLightningStorm], [/Cloud Rune/, GiCloudRing],
  [/Dragon Ancestor/, GiDragonHead], [/Fire|Flame|Inferno|Phoenix|Fire Snake/, GiFireBreath], [/Water|River|Wave|Ice|Frost|Cold/, GiWaterBolt],
  [/Air|Wind|Gong|Rush/, GiWindHole], [/Earth|Stone|Mountain|Eternal/, GiStoneBlock], [/Element|Elemental Attunement/, GiTornado],
  // Terrains
  [/^Arctic/, GiSnowflake1], [/^Coast/, GiWaves], [/^Desert/, GiDesert], [/^Forest/, GiForest], [/^Grassland/, GiGrass],
  [/^Mountain/, GiMountains], [/^Swamp/, GiSwamp], [/^Underdark/, GiUndergroundCave], [/^Underwater/, GiWaves],
  // Favored enemies
  [/^Aberrations/, GiBeastEye], [/^Beasts/, GiPawPrint], [/^Celestials/, GiAngelWings], [/^Constructs/, GiRobotGolem], [/^Dragons/, GiDragonHead],
  [/^Elementals/, GiTornado], [/^Fey/, GiFairy], [/^Fiends/, GiDaemonSkull], [/^Giants/, GiGiant], [/^Monstrosities/, GiClaws],
  [/^Oozes/, GiSlime], [/^Plants/, GiVineFlower], [/^Undead/, GiShamblingZombie], [/^Humanoid/, GiOrcHead],
  // Hunter
  [/Colossus Slayer/, GiTargetArrows], [/Giant Killer/, GiGiant], [/Horde Breaker/, GiWhirlwind], [/Volley/, GiBowArrow], [/Whirlwind/, GiWhirlwind],
  [/Evasion|Uncanny Dodge|Escape the Horde|Steel Will|Multiattack Defense|Stand Against/, GiDodge],
  // Armor, pact boons
  [/Guardian|Infiltrator/, GiBreastplate], [/Pact of the Blade/, GiBroadsword], [/Pact of the Chain/, GiCat], [/Pact of the Tome/, GiSpellBook], [/Pact of the Talisman/, GiPentacle],
];

/** Matched against the feature name when no option matched. */
const BY_FEATURE: [RegExp, IconType][] = [
  [/Fighting Style/, GiCrossedSwords], [/Invocation|replace_invocation/, GiPentacle], [/Metamagic/, GiMagicSwirl],
  [/Combat Superiority|Maneuver/, GiCrossedSwords], [/Arcane Shot/, GiBowArrow], [/Rune/, GiRuneStone], [/Expertise|Skill|Proficienc|Blessings of Knowledge/, GiSkills],
  [/Tool|Student of War|Kensei/, GiToolbox], [/Instrument/, GiLyre], [/Language|Envoy|Glamour|Intrigue/, GiTalk],
  [/Spell|Secrets|Arcanum|Cantrip|replace_spell|Divine Magic/, GiOpenBook], [/Companion/, GiPawPrint], [/Disciple|Elements/, GiTornado],
  [/Favored Enemy/, GiTargetArrows], [/Natural Explorer|Terrain/, GiForest], [/Dragon|Draconic/, GiDragonBreath], [/Totem|Aspect|Beast/, GiPawPrint],
  [/Storm Aura/, GiLightningStorm], [/Genie/, GiCrystalBall], [/Armor/, GiNinjaArmor], [/Subclass|Path|Oath|Circle|College|Domain|Patron|Tradition|Archetype|Origin/, GiCrown],
  [/Pact/, GiBookCover], [/Hunter|Multiattack|Defense|Tactics/, GiTargetArrows], [/Divine/, GiHolySymbol], [/Scroll/, GiScrollUnfurled],
];

const FALLBACK: IconType = GiSparkles;

/** The icon for one option of a feature (Bear for "Totem Spirit", a pentacle for any invocation). */
export function optionIcon(feature: string, option: string): IconType {
  for (const [re, icon] of BY_OPTION) if (re.test(option)) return icon;
  // Tools, instruments and weapons use their item icon.
  const item = findCatalogItem(option)?.icon;
  if (item && ITEM_ICONS[item]) return ITEM_ICONS[item];
  for (const [re, icon] of BY_FEATURE) if (re.test(feature)) return icon;
  return FALLBACK;
}


/** Subclasses: matched against the subclass name, first match wins; else the class's own crown. */
const BY_SUBCLASS: [RegExp, IconType][] = [
  // Barbarian
  [/Totem/, GiPawPrint], [/Berserker/, GiBattleAxe], [/Zealot/, GiHolySymbol], [/Path of the Beast/, GiClaws], [/Storm Herald/, GiLightningStorm],
  [/Ancestral/, GiGhost], [/Wild Magic/, GiMagicSwirl], [/Giant/, GiGiant],
  // Bard
  [/Lore/, GiSpellBook], [/Valor/, GiBroadsword], [/Swords/, GiDaggers], [/Glamour/, GiFairy], [/Whispers/, GiSoundWaves], [/Eloquence/, GiDramaMasks],
  [/Creation/, GiStarSwirl], [/Spirits/, GiGhost],
  // Cleric
  [/^Life/, GiHealing], [/^Light/, GiSun], [/^Nature|Ancients/, GiOakLeaf], [/Tempest/, GiThunderStruck], [/Trickery/, GiDramaMasks], [/^War\b/, GiCrossedSwords],
  [/Knowledge/, GiSpellBook], [/Death|Grave|Undying|Undead|Oathbreaker|Long Death/, GiSkullCrossedBones], [/Forge/, GiAnvil], [/Scribes/, GiQuillInk], [/Order/, GiScales],
  [/Peace|Redemption/, GiDove], [/Twilight|Moon|Shadow/, GiMoon], [/Arcana/, GiMagicSwirl],
  // Druid
  [/Land/, GiForest], [/Stars/, GiStarSwirl], [/Spores/, GiMushroomGills], [/Shepherd/, GiWolfHowl], [/Dreams/, GiFairy], [/Wildfire/, GiFireBowl],
  // Fighter
  [/Champion|Glory/, GiMedal], [/Battle Master/, GiCrossedSwords], [/Eldritch Knight/, GiRuneSword], [/Arcane Archer/, GiBowArrow], [/Cavalier/, GiHorseHead],
  [/Samurai|Kensei/, GiKatana], [/Echo/, GiShieldReflect], [/Psi|Soulknife|Aberrant/, GiBrain], [/Rune Knight/, GiRuneStone], [/Purple Dragon|Banneret/, GiCheckedShield],
  // Monk
  [/Open Hand/, GiFist], [/Four Elements/, GiTornado], [/Mercy/, GiDramaMasks], [/Drunken/, GiDrinking], [/Sun Soul/, GiSun], [/Astral Self/, GiMeditation],
  // Paladin
  [/Devotion/, GiHolySymbol], [/Vengeance/, GiSwordWound], [/Conquest|Crown/, GiCrown], [/Watchers/, GiEyeOfHorus],
  // Ranger
  [/Hunter/, GiArcheryTarget], [/Beast Master/, GiPawPrint], [/Gloom/, GiHoodedFigure], [/Horizon/, GiMagicPortal], [/Monster Slayer/, GiSpikedShield],
  [/Fey Wanderer|Archfey/, GiFairy], [/Swarmkeeper/, GiBee], [/Drake/, GiDragonHead],
  // Rogue
  [/Thief/, GiLockPicking], [/Assassin/, GiDaggers], [/Arcane Trickster/, GiMagicSwirl], [/Mastermind/, GiChessKnight], [/Swashbuckler/, GiBroadsword],
  [/Inquisitive/, GiMagnifyingGlass], [/Scout/, GiBowArrow], [/Phantom/, GiGhost],
  // Sorcerer
  [/Draconic|Dragon/, GiDragonHead], [/Divine Soul|Celestial/, GiAngelOutfit], [/Storm/, GiLightningStorm], [/Clockwork/, GiGears],
  // Warlock
  [/Fiend/, GiDaemonSkull], [/Great Old One/, GiTentacleStrike], [/Hexblade/, GiRuneSword], [/Fathomless/, GiKrakenTentacle], [/Genie/, GiMagicLamp],
  // Wizard
  [/Abjuration/, GiCheckedShield], [/Conjuration/, GiMagicPortal], [/Divination/, GiCrystalBall], [/Enchantment/, GiDramaMasks], [/Evocation/, GiFireBreath],
  [/Illusion/, GiTwirlyFlower], [/Necromancy/, GiSkullCrossedBones], [/Transmutation/, GiPotionBall], [/Bladesing/, GiBroadsword], [/War Magic/, GiShieldReflect],
  [/Chronurgy/, GiHourglass], [/Graviturgy/, GiStoneBlock],
  // Artificer
  [/Alchemist/, GiPotionBall], [/Armorer/, GiBreastplate], [/Artillerist/, GiCannon], [/Battle Smith/, GiRobotGolem],
];

/** The icon for a subclass card. */
export function subclassIcon(name: string): IconType {
  for (const [re, icon] of BY_SUBCLASS) if (re.test(name)) return icon;
  return GiCrown;
}

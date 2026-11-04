/**
 * Tasha's Cauldron of Everything optional class features, in our own words.
 * They only apply when the table turns them on (Character.optionalClassFeatures)
 * and TCE is one of the character's books. `replaces` names the base features
 * (by name prefix) that the option takes the place of.
 */

import { LANGUAGE_NAMES } from "./feat-options";

export interface OptionalClassFeature {
  className: string;
  level: number;
  name: string;
  text: { en: string; id: string };
  replaces?: string[];
  choice?: { options: string[]; count: number; grants: "skill" | "skill-expertise" | "language" };
  /** Only a choice: not listed as a feature of its own. */
  hidden?: boolean;
  /** Spells the feature teaches, keyed by the class level they arrive at. */
  spells?: Record<number, string[]>;
}

const VERSATILITY = (what: { en: string; id: string }) => ({
  en: `Whenever you reach a level that gives the Ability Score Improvement feature, you can replace ${what.en}.`,
  id: `Setiap kali mencapai level yang memberi fitur Ability Score Improvement, kamu bisa mengganti ${what.id}.`,
});

const ALL_SKILLS = [
  "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation",
  "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival",
];
const BARBARIAN_SKILLS = ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"];

const PRIMAL_KNOWLEDGE = {
  en: "Gain proficiency in one skill from the barbarian skill list.",
  id: "Dapatkan proficiency pada satu skill dari daftar skill barbarian.",
};
const HARNESS = (uses: string, usesId: string) => ({
  en: `As a bonus action, spend a use of Channel Divinity to regain one expended spell slot of a level no higher than half your proficiency bonus (rounded up). Usable once per long rest, ${uses}.`,
  id: `Sebagai bonus action, pakai satu Channel Divinity untuk memulihkan satu spell slot dengan level tidak lebih dari setengah proficiency bonus-mu (dibulatkan ke atas). Sekali per long rest, ${usesId}.`,
});

export const OPTIONAL_CLASS_FEATURES: OptionalClassFeature[] = [
  // Barbarian
  { className: "Barbarian", level: 3, name: "Primal Knowledge", text: PRIMAL_KNOWLEDGE, choice: { options: BARBARIAN_SKILLS, count: 1, grants: "skill" } },
  { className: "Barbarian", level: 7, name: "Instinctive Pounce", text: {
    en: "When you enter your rage, you can move up to half your speed as part of that bonus action.",
    id: "Saat memasuki rage, kamu bisa bergerak hingga setengah speed-mu sebagai bagian dari bonus action itu.",
  } },
  { className: "Barbarian", level: 10, name: "Primal Knowledge", text: PRIMAL_KNOWLEDGE, choice: { options: BARBARIAN_SKILLS, count: 1, grants: "skill" } },
  // Bard
  { className: "Bard", level: 2, name: "Magical Inspiration", text: {
    en: "A creature holding one of your Bardic Inspiration dice can roll it and add it to one damage or healing roll of a spell it casts.",
    id: "Makhluk yang memegang dadu Bardic Inspiration-mu bisa melemparnya dan menambahkannya ke satu lemparan damage atau penyembuhan dari spell yang ia cast.",
  } },
  { className: "Bard", level: 4, name: "Bardic Versatility", text: VERSATILITY({
    en: "one skill you chose for Expertise with another skill you're proficient in, or one bard cantrip with another bard cantrip",
    id: "satu skill Expertise-mu dengan skill lain yang kamu kuasai, atau satu cantrip bard dengan cantrip bard lain",
  }) },
  // Cleric
  { className: "Cleric", level: 2, name: "Harness Divine Power", text: HARNESS("twice from 6th level and three times from 18th", "dua kali mulai level 6, dan tiga kali mulai level 18") },
  { className: "Cleric", level: 4, name: "Cantrip Versatility", text: VERSATILITY({ en: "one cleric cantrip with another cleric cantrip", id: "satu cantrip cleric dengan cantrip cleric lain" }) },
  { className: "Cleric", level: 8, name: "Blessed Strikes", replaces: ["Divine Strike", "Potent Spellcasting"], text: {
    en: "Replaces your domain's Divine Strike or Potent Spellcasting. Once per turn, when a cantrip or weapon attack damages a creature, add 1d8 radiant damage.",
    id: "Menggantikan Divine Strike atau Potent Spellcasting dari domain-mu. Sekali per giliran, saat cantrip atau serangan senjata melukai makhluk, tambahkan 1d8 damage radiant.",
  } },
  // Druid
  { className: "Druid", level: 2, name: "Wild Companion", text: {
    en: "Spend one use of Wild Shape to cast find familiar without material components. The familiar is a fey and lasts a number of hours equal to half your druid level.",
    id: "Pakai satu Wild Shape untuk meng-cast find familiar tanpa komponen material. Familiar itu berupa fey dan bertahan selama jam sebanyak setengah level druid-mu.",
  } },
  { className: "Druid", level: 4, name: "Cantrip Versatility", text: VERSATILITY({ en: "one druid cantrip with another druid cantrip", id: "satu cantrip druid dengan cantrip druid lain" }) },
  // Fighter
  { className: "Fighter", level: 4, name: "Martial Versatility", text: VERSATILITY({
    en: "one fighting style with another fighter style, or one Battle Master maneuver with another maneuver",
    id: "satu fighting style dengan style fighter lain, atau satu maneuver Battle Master dengan maneuver lain",
  }) },
  // Monk
  { className: "Monk", level: 2, name: "Dedicated Weapon", text: {
    en: "After a short or long rest, touch one simple or martial weapon you're proficient with that isn't heavy or special. It counts as a monk weapon for you.",
    id: "Setelah short atau long rest, sentuh satu senjata simple atau martial yang kamu kuasai dan tidak heavy atau special. Senjata itu dihitung sebagai monk weapon bagimu.",
  } },
  { className: "Monk", level: 3, name: "Ki-Fueled Attack", text: {
    en: "If you spend ki during your action, you can make one unarmed strike or monk weapon attack as a bonus action before the end of the turn.",
    id: "Jika kamu memakai ki saat action-mu, kamu bisa melakukan satu unarmed strike atau serangan monk weapon sebagai bonus action sebelum giliran berakhir.",
  } },
  { className: "Monk", level: 4, name: "Quickened Healing", text: {
    en: "As an action, spend 2 ki points to regain hit points equal to a roll of your Martial Arts die plus your proficiency bonus.",
    id: "Sebagai action, pakai 2 ki point untuk memulihkan HP sebesar lemparan dadu Martial Arts ditambah proficiency bonus-mu.",
  } },
  { className: "Monk", level: 5, name: "Focused Aim", text: {
    en: "When you miss with an attack, spend 1 to 3 ki points to add 2 to the roll for each point, which can turn the miss into a hit.",
    id: "Saat seranganmu meleset, pakai 1 sampai 3 ki point untuk menambah 2 ke lemparan per point, yang bisa mengubahnya menjadi kena.",
  } },
  // Paladin
  { className: "Paladin", level: 3, name: "Harness Divine Power", text: HARNESS("twice from 7th level and three times from 15th", "dua kali mulai level 7, dan tiga kali mulai level 15") },
  { className: "Paladin", level: 4, name: "Martial Versatility", text: VERSATILITY({ en: "one fighting style with another paladin style", id: "satu fighting style dengan style paladin lain" }) },
  // Ranger
  { className: "Ranger", level: 1, name: "Deft Explorer", replaces: ["Natural Explorer"], text: {
    en: "Replaces Natural Explorer. Canny (1st level): expertise in one skill you're proficient in, and two languages. Roving (6th): +5 feet walking speed, and a climbing and swimming speed equal to it. Tireless (10th): as an action, gain 1d8 + Wisdom modifier temporary HP, proficiency bonus times per long rest; a short rest lowers your exhaustion by 1.",
    id: "Menggantikan Natural Explorer. Canny (level 1): expertise pada satu skill yang kamu kuasai, dan dua bahasa. Roving (level 6): +5 kaki walking speed, serta climbing dan swimming speed sebesar itu. Tireless (level 10): sebagai action, dapatkan 1d8 + modifier Wisdom temporary HP, sebanyak proficiency bonus per long rest; short rest mengurangi exhaustion-mu 1 tingkat.",
  }, choice: { options: ALL_SKILLS, count: 1, grants: "skill-expertise" } },
  // One pick of two, so the same language can't be taken twice.
  { className: "Ranger", level: 1, name: "Canny: Languages", hidden: true, text: {
    en: "Deft Explorer (Canny): learn two languages of your choice.",
    id: "Deft Explorer (Canny): pelajari dua bahasa pilihanmu.",
  }, choice: { options: LANGUAGE_NAMES, count: 2, grants: "language" } },
  { className: "Ranger", level: 1, name: "Favored Foe", replaces: ["Favored Enemy"], text: {
    en: "Replaces Favored Enemy. When you hit a creature, you can mark it as your favored foe for 1 minute (concentration). The first time each turn you hit it, add 1d4 damage (1d6 at 6th level, 1d8 at 14th). Proficiency bonus times per long rest.",
    id: "Menggantikan Favored Enemy. Saat mengenai makhluk, kamu bisa menandainya sebagai musuh pilihan selama 1 menit (concentration). Pertama kali tiap giliran kamu mengenainya, tambahkan 1d4 damage (1d6 di level 6, 1d8 di level 14). Sebanyak proficiency bonus per long rest.",
  } },
  { className: "Ranger", level: 3, name: "Primal Awareness", replaces: ["Primeval Awareness"], text: {
    en: "Replaces Primeval Awareness. You learn extra spells that don't count against your spells known: speak with animals (3rd), beast sense (5th), speak with plants (9th), locate creature (13th) and commune with nature (17th). Cast each once per long rest without a slot.",
    id: "Menggantikan Primeval Awareness. Kamu mempelajari spell tambahan yang tidak dihitung dalam spells known: speak with animals (level 3), beast sense (5), speak with plants (9), locate creature (13), dan commune with nature (17). Cast masing-masing sekali per long rest tanpa slot.",
  }, spells: { 3: ["Speak with Animals"], 5: ["Beast Sense"], 9: ["Speak with Plants"], 13: ["Locate Creature"], 17: ["Commune with Nature"] } },
  { className: "Ranger", level: 4, name: "Martial Versatility", text: VERSATILITY({ en: "one fighting style with another ranger style", id: "satu fighting style dengan style ranger lain" }) },
  { className: "Ranger", level: 10, name: "Nature's Veil", replaces: ["Hide in Plain Sight"], text: {
    en: "Replaces Hide in Plain Sight. As a bonus action, become invisible until the start of your next turn. Proficiency bonus times per long rest.",
    id: "Menggantikan Hide in Plain Sight. Sebagai bonus action, menjadi invisible sampai awal giliranmu berikutnya. Sebanyak proficiency bonus per long rest.",
  } },
  // Rogue
  { className: "Rogue", level: 3, name: "Steady Aim", text: {
    en: "As a bonus action, if you haven't moved this turn, give yourself advantage on your next attack this turn. Your speed is 0 until the end of the turn.",
    id: "Sebagai bonus action, jika belum bergerak giliran ini, beri dirimu advantage pada serangan berikutnya giliran ini. Speed-mu 0 sampai akhir giliran.",
  } },
  // Sorcerer
  { className: "Sorcerer", level: 4, name: "Sorcerous Versatility", text: VERSATILITY({
    en: "one Metamagic option with another, or one sorcerer cantrip with another sorcerer cantrip",
    id: "satu opsi Metamagic dengan yang lain, atau satu cantrip sorcerer dengan cantrip sorcerer lain",
  }) },
  { className: "Sorcerer", level: 5, name: "Magical Guidance", text: {
    en: "When you fail an ability check, spend 1 sorcery point to reroll the d20 and use the new roll.",
    id: "Saat gagal ability check, pakai 1 sorcery point untuk mengulang d20 dan memakai hasil baru.",
  } },
  // Warlock
  { className: "Warlock", level: 4, name: "Eldritch Versatility", text: VERSATILITY({
    en: "one warlock cantrip with another, your Pact Boon option with another, or (with Pact of the Tome) one Book of Shadows cantrip",
    id: "satu cantrip warlock dengan yang lain, opsi Pact Boon-mu dengan yang lain, atau (dengan Pact of the Tome) satu cantrip Book of Shadows",
  }) },
  // Wizard
  { className: "Wizard", level: 3, name: "Cantrip Formulas", text: {
    en: "After a long rest, you can replace one wizard cantrip you know with another wizard cantrip.",
    id: "Setelah long rest, kamu bisa mengganti satu cantrip wizard yang kamu kuasai dengan cantrip wizard lain.",
  } },
];

/** Whether this character uses the optional features: the table turned them on and owns Tasha's. */
export function usesOptionalClassFeatures(character: { optionalClassFeatures?: boolean; sources?: string[]; ruleset?: string }): boolean {
  return !!character.optionalClassFeatures && character.ruleset !== "2024" && (character.sources || []).includes("TCE");
}

/** The optional features a character has at their level, or none if they don't use them. */
export function getOptionalClassFeatures(character: { class?: string; level?: number; optionalClassFeatures?: boolean; sources?: string[]; ruleset?: string }): OptionalClassFeature[] {
  if (!usesOptionalClassFeatures(character)) return [];
  return OPTIONAL_CLASS_FEATURES.filter((f) => f.className === character.class && f.level <= (character.level || 1));
}

/** True when a base feature name is replaced by one of the given optional features. */
export function isReplacedFeature(name: string, optional: OptionalClassFeature[]): boolean {
  return optional.some((f) => (f.replaces || []).some((r) => name === r || name.startsWith(`${r} `) || name.startsWith(`${r}(`)));
}

/** Where the pick is kept in featureSelections; the same key the level-up wizard uses for class choices. */
export function optionalChoiceKey(feature: OptionalClassFeature): string {
  return `class-feature-${feature.level}-${feature.name}`;
}

/** The options still worth offering: no skill or language the character already has. */
export function getOptionalChoiceOptions(
  feature: OptionalClassFeature,
  character: { skills?: Record<string, boolean>; expertise?: string[]; languages?: string[] }
): string[] {
  const choice = feature.choice;
  if (!choice) return [];
  const skills = character.skills || {};
  const left =
    choice.grants === "skill" ? choice.options.filter((o) => !skills[o])
    : choice.grants === "skill-expertise" ? choice.options.filter((o) => skills[o] && !(character.expertise || []).includes(o))
    : choice.options.filter((o) => !(character.languages || []).includes(o));
  // Skills may not be picked yet when the level step comes first; offer them all then.
  return left.length > 0 ? left : choice.options;
}

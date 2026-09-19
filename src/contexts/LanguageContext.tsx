"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { translations as enTranslations } from "@/locales/en";
import { translations as idTranslations } from "@/locales/id";

export type Language = "en" | "id";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallbackOrParams?: Record<string, string | number> | string, fallback?: string) => string;
  tDesc: (key: string, fallback: string) => string;
  tSummary: (key: string, fallback: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({ language: "en", setLanguage: () => {}, t: (k, _a, fb) => fb || k, tDesc: (k, fb) => fb, tSummary: (k, fb) => fb });

export function useLanguage() {
  return useContext(LanguageContext);
}

const PROTECTED_TERMS = [
  "Fireball", "Magic Missile", "Cure Wounds", "Shield", "Mage Armor", "Detect Magic", "Identify",
  "Thunderwave", "Burning Hands", "Sleep", "Charm Person", "Command", "Healing Word",
  "Bless", "Bane", "Guiding Bolt", "Inflict Wounds", "Sanctuary", "Thaumaturgy",
  "Eldritch Blast", "Minor Illusion", "Prestidigitation", "Mage Hand", "Light",
  "Ray of Frost", "Acid Splash", "Poison Spray", "Shocking Grasp", "True Strike",
  "Vicious Mockery", "Spare the Dying", "Guidance", "Resistance", "Druidcraft",
  "Thorn Whip", "Produce Flame", "Shillelagh", "Mending", "Message", "Dancing Lights",
  "Friends", "Fire Bolt", "Ray of Sickness", "Witch Bolt", "Hellish Rebuke",
  "Armor of Agathys", "Expeditious Retreat", "False Life", "Feather Fall", "Find Familiar",
  "Fog Cloud", "Grease", "Jump", "Longstrider", "Protection from Evil and Good",
  "Thunderous Smite", "Wrathful Smite", "Absorb Elements", "Alarm", "Animal Friendship",
  "Beast Bond", "Charm Person", "Color Spray", "Comprehend Languages", "Detect Poison and Disease",
  "Disguise Self", "Dissonant Whispers", "Earth Tremor", "Entangle", "Expeditious Retreat",
  "Faerie Fire", "False Life", "Feather Fall", "Find Familiar", "Fog Cloud", "Goodberry",
  "Grease", "Healing Word", "Heroism", "Hideous Laughter", "Hunter's Mark", "Ice Knife",
  "Identify", "Illusory Script", "Jump", "Longstrider", "Mage Armor", "Magic Missile",
  "Protection from Evil and Good", "Purify Food and Drink", "Ray of Sickness", "Sanctuary",
  "Shield", "Shield of Faith", "Silent Image", "Sleep", "Speak with Animals", "Tasha's Hideous Laughter",
  "Thunderwave", "Unseen Servant", "Witch Bolt",
  "Barbarian", "Bard", "Cleric", "Druid", "Fighter", "Monk", "Paladin", "Ranger", "Rogue", "Sorcerer", "Warlock", "Wizard", "Artificer",
  "Dragonborn", "Dwarf", "Elf", "Gnome", "Half-Elf", "Halfling", "Half-Orc", "Human", "Tiefling",
  "Aarakocra", "Genasi", "Goliath", "Kenku", "Tabaxi", "Triton", "Bugbear", "Goblin", "Hobgoblin", "Kobold", "Orc", "Yuan-ti Pureblood",
  "Feral Tiefling", "Aasimar", "Firbolg", "Kalashtar", "Shifter", "Warforged", "Changeling", "Eladrin", "Sea Elf", "Shadar-kai",
  "High Elf", "Wood Elf", "Dark Elf", "Drow", "Hill Dwarf", "Mountain Dwarf", "Lightfoot Halfling", "Stout Halfling", "Rock Gnome", "Forest Gnome",
  "Acid", "Bludgeoning", "Cold", "Fire", "Force", "Lightning", "Necrotic", "Piercing", "Poison", "Psychic", "Radiant", "Slashing", "Thunder",
  "Abjuration", "Conjuration", "Divination", "Enchantment", "Evocation", "Illusion", "Necromancy", "Transmutation",
  "Blinded", "Charmed", "Deafened", "Frightened", "Grappled", "Incapacitated", "Invisible", "Paralyzed", "Petrified", "Poisoned", "Prone", "Restrained", "Stunned", "Unconscious", "Exhaustion",
  "Strength", "Dexterity", "Constitution", "Intelligence", "Wisdom", "Charisma",
  "Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival",
  "Lawful Good", "Neutral Good", "Chaotic Good", "Lawful Neutral", "True Neutral", "Chaotic Neutral", "Lawful Evil", "Neutral Evil", "Chaotic Evil",
  "Action", "Bonus Action", "Reaction", "Concentration", "Ritual", "Cantrip", "Spell Slot", "Hit Points", "Armor Class", "Saving Throw", "Proficiency Bonus", "Advantage", "Disadvantage", "Critical Hit", "Initiative", "Speed", "Hit Dice", "Death Save", "Long Rest", "Short Rest", "Level Up", "Experience Points",
  "Subclass", "Archetype", "Circle", "Domain", "Oath", "Patron", "Tradition", "College", "Path", "Way",
  "Weapon", "Armor", "Shield", "Potion", "Scroll", "Wand", "Staff", "Rod", "Ring", "Amulet", "Cloak", "Boots", "Gloves", "Belt", "Helmet", "Gauntlets",
  "Copper", "Silver", "Electrum", "Gold", "Platinum",
  "Darkvision", "Fey Ancestry", "Trance", "Relentless Endurance", "Savage Attacks", "Menacing", "Hellish Resistance", "Infernal Legacy",
  "Brave", "Lucky", "Halfling Nimbleness", "Naturally Stealthy", "Stout Resilience", "Dwarven Resilience", "Dwarven Combat Training", "Tool Proficiency", "Stonecutting",
  "Skill Versatility", "Fey Ancestry", "Trance", "Keen Senses", "Fey Step", "Mask of the Wild", "Elf Weapon Training", "Cantrip", "Extra Language",
  "Gnome Cunning", "Artificer's Lore", "Tinker", "Speed", "Size", "Languages",
  "Dexterity", "Constitution", "Wisdom", "Intelligence", "Charisma", "Strength",
  "Melee", "Ranged", "Touch", "Self", "Area", "Sphere", "Cube", "Cone", "Line", "Cylinder",
  "Instantaneous", "Round", "Minute", "Hour", "Day", "Until Dispelled", "Until Dispelled or Triggered",
  "Verbal", "Somatic", "Material",
  "Constitution Save", "Dexterity Save", "Wisdom Save", "Strength Save", "Intelligence Save", "Charisma Save",
  "Melee Spell Attack", "Ranged Spell Attack",
  "Higher Level", "Upcast", "At Higher Levels",
];

const protectedTermsRegex = new RegExp(`\\b(${PROTECTED_TERMS.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');

const translations: Record<Language, Record<string, string>> = {
  en: enTranslations,
  id: idTranslations,
};

const summaryTranslations: Record<string, string> = {};

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = params[key];
    if (value !== undefined) return String(value);
    return `{${key}}`;
  });
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("dnd-an-language") as Language | null;
    if (saved === "en" || saved === "id") {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("dnd-an-language", lang);
  }, []);

  const t = useCallback(
    (key: string, fallbackOrParams?: Record<string, string | number> | string, fallback?: string): string => {
      const dict = translations[language];
      let template: string;
      if (typeof fallbackOrParams === "string") {
        template = dict && dict[key] ? dict[key] : fallbackOrParams;
      } else if (typeof fallback === "string") {
        template = dict && dict[key] ? dict[key] : fallback;
      } else {
        template = dict && dict[key] ? dict[key] : key;
      }
      if (typeof fallbackOrParams === "object" && fallbackOrParams !== null) {
        return interpolate(template, fallbackOrParams);
      }
      return template;
    },
    [language]
  );

  const tDesc = useCallback(
    (key: string, fallback: string) => {
      const dict = translations[language];
      if (dict && dict[key]) {
        const translated = dict[key];
        if (language === "en") return translated;
        let result = translated;
        const matches = fallback.match(protectedTermsRegex);
        if (matches) {
          for (const term of matches) {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, 'gi');
            result = result.replace(regex, term);
          }
        }
        return result;
      }
      const enDict = translations.en;
      if (enDict && enDict[key]) return enDict[key];
      return fallback;
    },
    [language]
  );

  const tSummary = useCallback(
    (key: string, fallback: string) => {
      const dict = translations[language];
      const translated = dict && dict[key] ? dict[key] : summaryTranslations[key];
      if (translated) {
        if (language === "en") return translated;
        let result = translated;
        const matches = fallback.match(protectedTermsRegex);
        if (matches) {
          for (const term of matches) {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escaped, 'gi');
            result = result.replace(regex, term);
          }
        }
        return result;
      }
      const enDict = translations.en;
      if (enDict && enDict[key]) return enDict[key];
      return fallback;
    },
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t, tDesc, tSummary }), [language, setLanguage, t, tDesc, tSummary]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

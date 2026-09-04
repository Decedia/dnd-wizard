import {
  ShieldCheckIcon as ShieldCheck,
  SparklesIcon as Sparkles,
  EyeIcon as Eye,
  MagicWandIcon as MagicWand,
  LightningBoltIcon as LightningBolt,
  SkullIcon as Skull,
  SwapIcon as Swap,
} from "@/components/icons";

export type SpellSchool =
  | "abjuration"
  | "conjuration"
  | "divination"
  | "enchantment"
  | "evocation"
  | "illusion"
  | "necromancy"
  | "transmutation";

export interface SpellSchoolStyle {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  colorVar: string;
  bgColorVar: string;
}

export const SPELL_SCHOOLS: Record<SpellSchool, SpellSchoolStyle> = {
  abjuration: { icon: ShieldCheck, label: "Abjuration", colorVar: "--color-school-abjuration", bgColorVar: "--color-school-abjuration-bg" },
  conjuration: { icon: Sparkles, label: "Conjuration", colorVar: "--color-school-conjuration", bgColorVar: "--color-school-conjuration-bg" },
  divination: { icon: Eye, label: "Divination", colorVar: "--color-school-divination", bgColorVar: "--color-school-divination-bg" },
  enchantment: { icon: MagicWand, label: "Enchantment", colorVar: "--color-school-enchantment", bgColorVar: "--color-school-enchantment-bg" },
  evocation: { icon: LightningBolt, label: "Evocation", colorVar: "--color-school-evocation", bgColorVar: "--color-school-evocation-bg" },
  illusion: { icon: Eye, label: "Illusion", colorVar: "--color-school-illusion", bgColorVar: "--color-school-illusion-bg" },
  necromancy: { icon: Skull, label: "Necromancy", colorVar: "--color-school-necromancy", bgColorVar: "--color-school-necromancy-bg" },
  transmutation: { icon: Swap, label: "Transmutation", colorVar: "--color-school-transmutation", bgColorVar: "--color-school-transmutation-bg" },
};

export function getSpellSchoolStyle(school: string | undefined | null): SpellSchoolStyle | undefined {
  if (!school) return undefined;
  const key = school.toLowerCase().replace(" evocation dg", "").replace("dg", "") as SpellSchool;
  return SPELL_SCHOOLS[key];
}

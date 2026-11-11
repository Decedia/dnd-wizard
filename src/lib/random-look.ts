import { getStaticRace } from "@/lib/srd-client";

export type LookField = "age" | "height" | "weight" | "eyes" | "hair" | "skin";

const WORDS: Record<"en" | "id", Record<"eyes" | "hair" | "skin", string[]>> = {
  en: {
    eyes: ["Grey", "Amber", "Green", "Dark brown", "Pale blue", "Hazel", "Black", "Gold"],
    hair: ["Black, braided", "Red, short", "White, long", "Brown, curly", "Shaved", "Blond, tied back", "Grey, wild", "Auburn, wavy"],
    skin: ["Fair", "Tan", "Deep brown", "Olive", "Pale", "Ruddy", "Bronze", "Freckled"],
  },
  id: {
    eyes: ["Abu-abu", "Kuning madu", "Hijau", "Cokelat tua", "Biru pucat", "Cokelat kehijauan", "Hitam", "Keemasan"],
    hair: ["Hitam, dikepang", "Merah, pendek", "Putih, panjang", "Cokelat, keriting", "Plontos", "Pirang, diikat", "Abu-abu, berantakan", "Merah kecokelatan, bergelombang"],
    skin: ["Cerah", "Sawo matang", "Cokelat gelap", "Zaitun", "Pucat", "Kemerahan", "Perunggu", "Berbintik"],
  },
};

/** Adult age range by race; long-lived races get their own. */
function ageRange(race: string): [number, number] {
  const r = race.toLowerCase();
  if (r.includes("half-elf")) return [20, 120];
  if (r.includes("elf") || r.includes("eladrin") || r.includes("shadar")) return [100, 500];
  if (r.includes("dwarf") || r.includes("duergar")) return [50, 250];
  if (r.includes("gnome")) return [40, 300];
  if (r.includes("halfling")) return [20, 120];
  if (r.includes("half-orc") || r.includes("orc") || r.includes("goblin")) return [14, 50];
  return [18, 60];
}

const between = (lo: number, hi: number, rand: () => number) => Math.round(lo + rand() * (hi - lo));
const pick = <T,>(list: T[], rand: () => number) => list[Math.floor(rand() * list.length)];

/** A random, plausible look for a race: small races are short and light. */
export function randomLook(race: string, language: string, rand: () => number = Math.random): Record<LookField, string> {
  const words = WORDS[language === "id" ? "id" : "en"];
  const small = (getStaticRace(race, "2014")?.size || "").toLowerCase() === "small";
  const inches = small ? between(36, 46, rand) : between(60, 76, rand);
  // Taller is heavier, give or take.
  const pounds = small ? 30 + (inches - 36) * 2 + between(0, 10, rand) : 100 + (inches - 60) * 6 + between(0, 40, rand);
  const [lo, hi] = ageRange(race);
  return {
    age: String(between(lo, hi, rand)),
    height: `${Math.floor(inches / 12)}'${inches % 12}"`,
    weight: `${pounds} lb`,
    eyes: pick(words.eyes, rand),
    hair: pick(words.hair, rand),
    skin: pick(words.skin, rand),
  };
}

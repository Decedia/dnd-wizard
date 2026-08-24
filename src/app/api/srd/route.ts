import { NextResponse } from "next/server";

const DND5E_API = "https://www.dnd5eapi.co/api/2014";
const CACHE_TTL = 5 * 60 * 1000;

interface CachedData {
  races: any[];
  classes: any[];
  spells: any[];
  equipment: any[];
  languages: any[];
  timestamp: number;
}

let cache: CachedData | null = null;

async function fetchJSON(url: string) {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: ${res.status}`);
  }
  return res.json();
}

async function fetchAllRaces() {
  const list = await fetchJSON(`${DND5E_API}/races`);
  const races = await Promise.all(
    list.results.map((r: { url: string }) => fetchJSON(`https://www.dnd5eapi.co${r.url}`))
  );

  const traitUrls = new Set<string>();
  const languageUrls = new Set<string>();
  for (const race of races) {
    for (const trait of race.traits || []) {
      traitUrls.add(`https://www.dnd5eapi.co${trait.url}`);
    }
    for (const lang of race.languages || []) {
      languageUrls.add(`https://www.dnd5eapi.co${lang.url}`);
    }
  }

  const [traits, languages] = await Promise.all([
    Promise.all([...traitUrls].map((url) => fetchJSON(url))),
    Promise.all([...languageUrls].map((url) => fetchJSON(url))),
  ]);

  const traitMap = new Map(traits.map((t: any) => [t.index, t]));
  const languageMap = new Map(languages.map((l: any) => [l.index, l]));

  return races.map((race: any) => ({
    name: race.name,
    abilityScoreIncreases: Object.fromEntries(
      (race.ability_bonuses || []).map((b: any) => [b.ability_score.index, b.bonus])
    ),
    speed: race.speed,
    size: race.size,
    darkvision: (race.traits || []).some((t: any) => {
      const trait = traitMap.get(t.index);
      return trait && trait.name === "Darkvision";
    })
      ? { range: 60 }
      : false,
    traits: (race.traits || []).map((t: any) => {
      const trait = traitMap.get(t.index);
      return {
        name: trait?.name || t.index,
        description: trait?.desc?.[0] || "",
      };
    }),
    languages: (race.languages || []).map((l: any) => languageMap.get(l.index)?.name || l.index),
  }));
}

async function fetchAllClasses() {
  const list = await fetchJSON(`${DND5E_API}/classes`);
  const classes = await Promise.all(
    list.results.map((c: { url: string }) => fetchJSON(`https://www.dnd5eapi.co${c.url}`))
  );

  const subclassUrls = new Set<string>();
  const levelUrls = new Set<string>();
  for (const cls of classes) {
    for (const sub of cls.subclasses || []) {
      subclassUrls.add(`https://www.dnd5eapi.co${sub.url}`);
    }
    if (cls.class_levels) {
      levelUrls.add(`https://www.dnd5eapi.co${cls.class_levels}`);
    }
  }

  const [subclassesRaw, levelsRaw] = await Promise.all([
    Promise.all([...subclassUrls].map((url) => fetchJSON(url))),
    Promise.all([...levelUrls].map((url) => fetchJSON(url))),
  ]);

  const subclassMap = new Map(subclassesRaw.map((s: any) => [s.index, s]));
  const levelsMap = new Map(levelsRaw.map((l: any) => [l.index, l]));

  const SUBCLASS_LEVELS: Record<string, number> = {
    barbarian: 3,
    bard: 3,
    cleric: 1,
    druid: 2,
    fighter: 3,
    monk: 3,
    paladin: 3,
    ranger: 3,
    rogue: 3,
    sorcerer: 1,
    warlock: 1,
    wizard: 2,
  };

  const spellcastingMap = new Map<string, string>();
  for (const cls of classes) {
    const spellSlugs = new Set<string>();
    for (const spell of cls.spells || []) {
      spellSlugs.add(spell.index);
    }
    if (spellSlugs.size > 0) {
      const primary =
        cls.name === "Wizard"
          ? "int"
          : cls.name === "Cleric" || cls.name === "Druid"
            ? "wis"
            : cls.name === "Bard" || cls.name === "Paladin" || cls.name === "Sorcerer" || cls.name === "Warlock"
              ? "cha"
              : "int";
      spellcastingMap.set(cls.index, primary);
    }
  }

  return classes.map((cls: any) => {
    const rawLevels = levelsMap.get(cls.index) || [];
    const levels = rawLevels.map((lvl: any) => ({
      level: lvl.level,
      features: (lvl.features || []).map((f: any) => f.name),
      spellSlots: lvl.spell_slots || undefined,
    }));

    let prevBonus = 0;
    levels.forEach((lvl: any, idx: number) => {
      const raw = rawLevels[idx];
      const bonus = raw?.ability_score_bonuses || 0;
      lvl.asi = bonus > prevBonus;
      prevBonus = bonus;
    });

    const features = (levels[0]?.features || [])
      .map((name: string) => {
        const lvl = levels.find((l: any) => l.features.includes(name));
        return {
          name,
          description: name,
          type: "feature",
        };
      })
      .filter((f: any, idx: number, arr: any[]) => arr.findIndex((x: any) => x.name === f.name) === idx);

    return {
      name: cls.name,
      hitDie: cls.hit_die,
      hpPerLevel: Math.floor((cls.hit_die || 10) / 2) + 1,
      primaryAbility: spellcastingMap.get(cls.index) || "str",
      savingThrows: (cls.saving_throws || []).map((s: any) => s.index),
      flavorText: "",
      proficiencies: {
        armor: (cls.proficiencies || [])
          .filter((p: any) => /armor|shield/i.test(p.name))
          .map((p: any) => p.name),
        weapons: (cls.proficiencies || [])
          .filter((p: any) => /weapon/i.test(p.name))
          .map((p: any) => p.name),
        tools: (cls.proficiencies || [])
          .filter((p: any) => !/armor|shield|weapon|saving/i.test(p.name))
          .map((p: any) => p.name),
      },
      skillChoices: (cls.proficiency_choices || []).find((p: any) => p.type === "proficiencies") || { choose: 0, options: [] },
      startingEquipment: (cls.starting_equipment_options || []).map((opt: any) => ({
        description: opt.desc,
        items: [],
      })),
      features,
      levels,
      spellcastingAbility: spellcastingMap.get(cls.index),
      cantripsKnown: {},
      subclassLevel: SUBCLASS_LEVELS[cls.index],
      subclasses: (cls.subclasses || []).map((sub: any) => {
        const subRaw = subclassMap.get(sub.index);
        return {
          name: sub.name,
          description: subRaw?.desc || "",
          features: (subRaw?.features || []).map((f: any) => ({
            name: f.name,
            description: f.desc?.[0] || f.name,
          })),
        };
      }),
    };
  });
}

async function fetchAllSpells() {
  const list = await fetchJSON(`${DND5E_API}/spells`);
  const spells = await Promise.all(
    list.results.map((s: { url: string }) => fetchJSON(`https://www.dnd5eapi.co${s.url}`))
  );

  return spells.map((spell: any) => ({
    name: spell.name,
    level: spell.level,
    castingTime: spell.casting_time,
    range: spell.range,
    duration: spell.duration,
    description: spell.desc?.[0] || "",
    effect: spell.desc?.[0] || "",
  }));
}

async function fetchAllEquipment() {
  const list = await fetchJSON(`${DND5E_API}/equipment`);
  const items = await Promise.all(
    list.results.map((e: { url: string }) => fetchJSON(`https://www.dnd5eapi.co${e.url}`))
  );

  return items.map((item: any) => ({
    name: item.name,
    description: item.desc?.[0] || "",
    type: mapEquipmentCategory(item.equipment_category?.index),
    category: mapWeaponCategory(item.weapon_category),
    damageDice: item.damage?.damage_dice || item.damage?.damage_at_character_level?.["1"] || undefined,
    damageType: item.damage?.damage_type?.name || undefined,
    baseAC: item.armor_class?.base || undefined,
    armorType: item.armor_class?.type === "Light" ? "light" : item.armor_class?.type === "Medium" ? "medium" : item.armor_class?.type === "Heavy" ? "heavy" : item.armor_class?.type === "Shield" ? "shield" : undefined,
    maxDexBonus: item.armor_class?.dex_bonus ?? null,
  }));
}

function mapEquipmentCategory(index: string): "weapon" | "armor" | "item" {
  if (index?.includes("weapon")) return "weapon";
  if (index?.includes("armor")) return "armor";
  return "item";
}

function mapWeaponCategory(index: string | undefined): "melee" | "ranged" | undefined {
  if (!index) return undefined;
  if (index.includes("melee")) return "melee";
  if (index.includes("ranged")) return "ranged";
  return undefined;
}

async function fetchAllLanguages() {
  const list = await fetchJSON(`${DND5E_API}/languages`);
  return list.results.map((l: any) => ({ name: l.name }));
}

export async function GET() {
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache);
  }

  try {
    const [races, classes, spells, equipment, languages] = await Promise.all([
      fetchAllRaces(),
      fetchAllClasses(),
      fetchAllSpells(),
      fetchAllEquipment(),
      fetchAllLanguages(),
    ]);

    const data = { races, classes, spells, equipment, languages };
    cache = { ...data, timestamp: Date.now() };
    return NextResponse.json(data);
  } catch (error) {
    if (cache) {
      return NextResponse.json(cache);
    }
    return NextResponse.json({ error: "Failed to fetch SRD data" }, { status: 500 });
  }
}

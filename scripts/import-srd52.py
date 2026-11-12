#!/usr/bin/env python3
"""Build the app's 2024 rules data from the SRD 5.2 JSON files of 5e-bits/5e-database.

Usage:
  python3 -I scripts/import-srd52.py <dir with 5e-SRD-*.json from src/2024/en>

Download the inputs from
  https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2024/en/5e-SRD-<Name>.json
for Classes, Levels, Features, Subclasses, Species, Traits, Backgrounds, Feats, Spells.

Writes src/data/en/2024_{classes,subclasses,species,backgrounds,feats,spells}.json.
The source has known errors (it was wrong about 2014 Warlock tables before), so every
correction made after checking it lives in FIXES below, with the reason.
SRD 5.2 is CC BY 4.0 (credit in docs/CREDITS.md).
"""

import json
import re
import sys
from pathlib import Path

SRC = Path(sys.argv[1])
OUT = Path(__file__).resolve().parent.parent / "src" / "data" / "en"


def load(name):
    return json.loads((SRC / f"5e-SRD-{name}.json").read_text(encoding="utf-8"))


classes_raw = load("Classes")
levels_raw = load("Levels")
features_raw = {f["index"]: f for f in load("Features")}
subclasses_raw = load("Subclasses")
species_raw = load("Species")
traits_raw = {t["index"]: t for t in load("Traits")}
backgrounds_raw = load("Backgrounds")
feats_raw = load("Feats")
spells_raw = load("Spells")

# ---------------------------------------------------------------- text clean-up

ALL_TEXT = " ".join(
    [f.get("description", "") for f in features_raw.values()]
    + [t.get("description", "") for t in traits_raw.values()]
    + [s.get("description", "") for s in spells_raw]
    + [f.get("description", "") for f in feats_raw]
    + [x.get("description", "") for s in subclasses_raw for x in s["features"]]
)
WORDS_LOWER = {w.lower() for w in re.findall(r"[A-Za-z]{3,}", re.sub(r"(\w)- (\w)", "", ALL_TEXT))}


def fix_pair(m):
    """Undo a PDF line-break hyphen ("ex- pended") when the joined word appears elsewhere."""
    left, right = m.group(1), m.group(2)
    if (left + right).lower() in WORDS_LOWER:
        return left + right
    return m.group(0)


# Line-break hyphens the word check can't settle, and dashes the source flattened to "-".
TEXT_FIXES = [
    ("Great- axes", "Greataxes"),
    ("Instru- ment", "Instrument"),
    ("dis- rupt", "disrupt"),
    ("tradi- tions", "traditions"),
    ("time- the", "time—the"),
    ("Strength-with either a weapon or an Unarmed Strike-and", "Strength—with either a weapon or an Unarmed Strike—and"),
]


def clean(text):
    if not text:
        return ""
    text = text.replace("â€™", "’").replace("’", "'").replace("‘", "'").replace("“", '"').replace("”", '"')
    text = re.sub(r"(\b[A-Za-z]+)- ([a-z][A-Za-z]*)", fix_pair, text)
    for old, new in TEXT_FIXES:
        text = text.replace(old, new)
    lines = [ln.strip() for ln in text.split("\n")]
    out = []
    for ln in lines:
        if not ln:
            continue
        # A line that starts lowercase continues the previous sentence.
        if out and re.match(r"[a-z(]", ln) and not out[-1].endswith((":", ".")):
            out[-1] = out[-1] + " " + ln
        else:
            out.append(ln)
    return "\n\n".join(out)


# ---------------------------------------------------------------- fixes after checking

FIXES = {
    # Druid cantrips: 2 at levels 1-3, 3 at 4-9, 4 at 10-20. The source has 4 at 7, 5 at 16, 3 at 8-9 after 4.
    "druid_cantrips": {1: 2, 2: 2, 3: 2, 4: 3, 5: 3, 6: 3, 7: 3, 8: 3, 9: 3, 10: 4, 11: 4, 12: 4, 13: 4, 14: 4, 15: 4, 16: 4, 17: 4, 18: 4, 19: 4, 20: 4},
    # Rogue: Simple weapons plus Martial weapons with Finesse or Light. Longswords are neither.
    "rogue_weapons": ["simple", "Rapiers", "Scimitars", "Shortswords", "Whips", "Hand crossbows"],
    # Monk: Simple weapons plus Martial weapons with Light.
    "monk_weapons": ["simple", "Scimitars", "Shortswords", "Hand crossbows"],
    # The source's Oath of Devotion table is broken (it has the Paladin spell list mixed in).
    "devotion_spells": {"3": ["Protection from Evil and Good", "Shield of Faith"], "5": ["Aid", "Zone of Truth"], "9": ["Beacon of Hope", "Dispel Magic"], "13": ["Freedom of Movement", "Guardian of Faith"], "17": ["Commune", "Flame Strike"]},
    # The source glued the feature text into the Circle of the Land feature name.
    "land_spells_name": "Circle of the Land Spells",
    # The source leaves out the Sage's Magic Initiate list.
    "sage_feat_note": "Wizard",
    # SRD spelling of the Fighting Style feat.
    "two_weapon_fighting": "Two-Weapon Fighting",
}

SUBCLASS_SPELLS = {
    "Life Domain": {"3": ["Aid", "Bless", "Cure Wounds", "Lesser Restoration"], "5": ["Mass Healing Word", "Revivify"], "7": ["Aura of Life", "Death Ward"], "9": ["Greater Restoration", "Mass Cure Wounds"]},
    "Oath of Devotion": FIXES["devotion_spells"],
    "Draconic Sorcery": {"3": ["Alter Self", "Chromatic Orb", "Command", "Dragon's Breath"], "5": ["Fear", "Fly"], "7": ["Arcane Eye", "Charm Monster"], "9": ["Legend Lore", "Summon Dragon"]},
    "Fiend Patron": {"3": ["Burning Hands", "Command", "Scorching Ray", "Suggestion"], "5": ["Fireball", "Stinking Cloud"], "7": ["Fire Shield", "Wall of Fire"], "9": ["Geas", "Insect Plague"]},
}

# Circle of the Land picks one land type each Long Rest; spells by land, then Druid level.
LAND_SPELLS = {
    "Arid": {"3": ["Blur", "Burning Hands", "Fire Bolt"], "5": ["Fireball"], "7": ["Blight"], "9": ["Wall of Stone"]},
    "Polar": {"3": ["Fog Cloud", "Hold Person", "Ray of Frost"], "5": ["Sleet Storm"], "7": ["Ice Storm"], "9": ["Cone of Cold"]},
    "Temperate": {"3": ["Misty Step", "Shocking Grasp", "Sleep"], "5": ["Lightning Bolt"], "7": ["Freedom of Movement"], "9": ["Tree Stride"]},
    "Tropical": {"3": ["Acid Splash", "Ray of Sickness", "Web"], "5": ["Stinking Cloud"], "7": ["Polymorph"], "9": ["Insect Plague"]},
}

SPELL_ABILITY = {"Bard": "cha", "Cleric": "wis", "Druid": "wis", "Paladin": "cha", "Ranger": "wis", "Sorcerer": "cha", "Warlock": "cha", "Wizard": "int"}
ARMOR = {"Light Armor": "light", "Medium Armor": "medium", "Heavy Armor": "heavy", "Shields": "shields"}

# The 2014 cards' one-line "play this if" text fits the 2024 classes too.
classes_2014 = {c["name"]: c for c in json.loads((OUT / "2014_classes.json").read_text())["classes"]}

# ---------------------------------------------------------------- classes


def class_levels(index):
    rows = sorted([x for x in levels_raw if x["class"]["index"] == index and "subclass" not in x], key=lambda x: x["level"])
    assert len(rows) == 20, index
    return rows


def feature_text(ref):
    f = features_raw.get(ref["index"])
    return clean(f["description"]) if f else ""


classes = []
for c in classes_raw:
    name = c["name"]
    rows = class_levels(c["index"])
    profs = [p["name"] for p in c["proficiencies"]]
    armor = ["light", "medium", "heavy", "shields"] if "All armor" in profs else [ARMOR[p] for p in profs if p in ARMOR]
    weapons = []
    if "Simple Weapons" in profs:
        weapons.append("simple")
    if "Martial Weapons" in profs:
        weapons.append("martial")
    if name == "Rogue":
        weapons = FIXES["rogue_weapons"]
    if name == "Monk":
        weapons = FIXES["monk_weapons"]
    tools = [p.replace("Tool: ", "") for p in profs if p.startswith("Tool: ") or p == "Herbalism Kit"]
    skill_choice = c["proficiency_choices"][0]
    skills = [o["item"]["name"].replace("Skill: ", "") for o in skill_choice["from"].get("options", []) if o.get("item")]
    levels = []
    all_features = []
    cantrips, prepared, mastery = {}, {}, {}
    for row in rows:
        lvl = row["level"]
        feats = []
        for ref in row["features"]:
            entry = {"name": ref["name"], "description": feature_text(ref), "level": lvl}
            feats.append(entry)
            all_features.append(entry)
        sc = row.get("spellcasting") or {}
        level = {"level": lvl, "features": [{"name": f["name"], "description": f["description"]} for f in feats], "asi": any(f["name"] == "Ability Score Improvement" for f in feats)}
        slots = {str(i): sc.get(f"spell_slots_level_{i}", 0) for i in range(1, 10)}
        slots = {k: v for k, v in slots.items() if v}
        if slots:
            level["spellSlots"] = slots
        if row.get("class_specific"):
            level["classSpecific"] = row["class_specific"]
        levels.append(level)
        if sc.get("cantrips_known"):
            cantrips[lvl] = sc["cantrips_known"]
        if sc.get("prepared_spells"):
            prepared[lvl] = sc["prepared_spells"]
        wm = (row.get("class_specific") or {}).get("weapon_mastery")
        if wm:
            mastery[lvl] = wm
    if name == "Druid":
        cantrips = FIXES["druid_cantrips"]
    pa = c["primary_ability"]
    # Fighter's is "Strength or Dexterity", given as a pick.
    primary = [a["index"] for a in pa["ability_scores"]] if "ability_scores" in pa else [o["item"]["index"] for o in pa["ability_score_options"]["from"]["options"]]
    entry = {
        "name": name,
        "ruleset": "2024",
        "source": "PHB",
        "hitDie": c["hit_die"],
        "hpPerLevel": c["hit_die"] // 2 + 1,
        "primaryAbility": primary[0],
        "primaryAbilities": primary,
        "savingThrows": [s["index"] for s in c["saving_throws"]],
        "proficiencies": {"armor": armor, "weapons": weapons, "tools": tools},
        "skillChoices": {"count": skill_choice["choose"], "options": skills},
        "startingEquipment": [{"description": clean(o["desc"]), "items": []} for o in c.get("starting_equipment_options", [])],
        "features": all_features,
        "levels": levels,
        "subclassLevel": 3,
        "subclasses": [{"index": s["index"] + "-2024", "name": s["name"]} for s in c.get("subclasses", [])],
        "flavor": classes_2014.get(name, {}).get("flavor", ""),
    }
    if name in SPELL_ABILITY:
        entry["spellcastingAbility"] = SPELL_ABILITY[name]
        # Every 2024 caster prepares spells from a table; "known" counts no longer exist.
        entry["cantripsKnown"] = {str(k): v for k, v in cantrips.items()}
        entry["preparedSpells"] = {str(k): v for k, v in prepared.items()}
    if mastery:
        entry["weaponMastery"] = {str(k): v for k, v in mastery.items()}
    classes.append(entry)

# ---------------------------------------------------------------- subclasses

subclasses = []
for s in subclasses_raw:
    feats = []
    for f in s["features"]:
        fname = f["name"]
        if fname.startswith("Circle of the Land Spells"):
            fname = FIXES["land_spells_name"]
        feats.append({"name": fname, "level": f["level"], "description": clean(f["description"])})
    entry = {
        "class": s["class"]["name"],
        "classIndex": s["class"]["index"],
        "index": s["index"] + "-2024",
        "name": s["name"],
        "ruleset": "2024",
        "source": "PHB",
        "summary": s.get("summary", ""),
        "description": clean(s["description"]),
        "features": feats,
    }
    if s["name"] in SUBCLASS_SPELLS:
        entry["expandedSpells"] = SUBCLASS_SPELLS[s["name"]]
    if s["name"] == "Circle of the Land":
        entry["expandedSpellsByOption"] = LAND_SPELLS
    subclasses.append(entry)

# ---------------------------------------------------------------- species


def trait(index):
    t = traits_raw[index]
    return {"name": t["name"], "description": clean(t["description"])}


SIZE_OPTIONS = {"Human": ["Medium", "Small"], "Tiefling": ["Medium", "Small"]}
species = []
for s in species_raw:
    traits = [trait(t["index"]) for t in s["traits"]]
    names = [t["name"] for t in traits]
    darkvision = 120 if any("120" in n for n in names) else 60 if any("Darkvision" in n for n in names) else 0
    traits = [t for t in traits if not t["name"].startswith("Darkvision")]
    if s["name"] == "Dragonborn":
        # The source ties these two traits to each ancestry; the trait text is the same with the type swapped.
        breath = trait("draconic-breath-weapon-acid")
        breath["name"] = "Breath Weapon"
        breath["description"] = breath["description"].replace("1d10 acid damage", "1d10 damage of the type set by your Draconic Ancestry")
        resist = {"name": "Damage Resistance", "description": "You have Resistance to the damage type determined by your Draconic Ancestry trait."}
        traits = [trait("draconic-ancestry"), breath, resist] + [t for t in traits if t["name"] != "Draconic Ancestry"]
    choices = []
    if s.get("subspecies"):
        group = s["subspecies"][0]["name"].split(":")[0]
        choices.append({
            "id": f"{s['index']}-2024-lineage",
            "name": group,
            "type": "single",
            "options": [{"id": x["index"], "name": x["name"].split(": ", 1)[1]} for x in s["subspecies"]],
        })
    entry = {
        "name": s["name"],
        "ruleset": "2024",
        "source": "PHB",
        "type": s.get("type", "Humanoid"),
        "size": s.get("size") or "Medium",
        "speed": s["speed"],
        "darkvision": {"range": darkvision} if darkvision else False,
        # 2024 species give no ability increases; the background does.
        "abilityScoreIncreases": {},
        "traits": traits,
        "languages": ["Common"],
        "extraLanguages": 2,
    }
    if s["name"] in SIZE_OPTIONS:
        entry["sizeOptions"] = SIZE_OPTIONS[s["name"]]
    if choices:
        entry["choices"] = choices
    species.append(entry)

# ---------------------------------------------------------------- backgrounds

backgrounds = []
for b in backgrounds_raw:
    profs = [p["name"] for p in b["proficiencies"]]
    feat_note = b["feat"].get("note") or (FIXES["sage_feat_note"] if b["name"] == "Sage" else None)
    entry = {
        "name": b["name"],
        "ruleset": "2024",
        "source": "PHB",
        "abilityScores": [a["index"] for a in b["ability_scores"]],
        "feat": b["feat"]["name"] + (f" ({feat_note})" if feat_note else ""),
        "skills": [p.replace("Skill: ", "") for p in profs if p.startswith("Skill: ")],
        "tools": [p.replace("Tool: ", "") for p in profs if p.startswith("Tool: ")],
        "toolChoice": clean(b["proficiency_choices"][0]["desc"]) if b.get("proficiency_choices") else None,
        "equipment": clean(b["equipment_options"][0]["desc"]),
    }
    backgrounds.append(entry)

# ---------------------------------------------------------------- feats

FEAT_TYPES = {"origin": "Origin", "general": "General", "fighting-style": "Fighting Style", "epic-boon": "Epic Boon"}
feats = []
for f in feats_raw:
    name = FIXES["two_weapon_fighting"] if f["name"] == "Two Weapon Fighting" else f["name"]
    pre = f.get("prerequisites") or {}
    entry = {
        "name": name,
        "ruleset": "2024",
        "source": "PHB",
        "book": "PHB",
        "category": FEAT_TYPES[f["type"]],
        "description": clean(f["description"]),
        "repeatable": bool(f.get("repeatable")),
    }
    if pre.get("minimum_level"):
        entry["minLevel"] = pre["minimum_level"]
    if pre.get("feature_named"):
        entry["requiresFeature"] = pre["feature_named"]
    if f.get("prerequisite_options"):
        entry["prerequisites"] = clean(f["prerequisite_options"]["desc"])
    feats.append(entry)

# ---------------------------------------------------------------- spells

SAVE = {"Strength": "str", "Dexterity": "dex", "Constitution": "con", "Intelligence": "int", "Wisdom": "wis", "Charisma": "cha"}


def short_casting_time(text):
    if text.startswith("Bonus Action"):
        return "1 bonus action"
    if text.startswith("Reaction"):
        return "1 reaction"
    if text.startswith("Action"):
        return "1 action"
    return text


spells = []
for s in spells_raw:
    desc = clean(s["description"])
    save = re.search(r"(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma) saving throw", desc)
    entry = {
        "index": s["index"] + "-2024",
        "name": s["name"],
        "ruleset": "2024",
        "source": "PHB",
        "level": s["level"],
        "school": {"index": s["school"]["index"], "name": s["school"]["name"]},
        "classes": sorted(c["name"] for c in s["classes"]),
        "casting_time": short_casting_time(s["casting_time"]),
        "castingTimeFull": s["casting_time"],
        "range": s["range"],
        "components": {"verbal": "V" in s["components"], "somatic": "S" in s["components"], "material": "M" in s["components"], "materialDesc": s.get("material")},
        "duration": s["duration"],
        "concentration": s["concentration"],
        "ritual": s["ritual"],
        "description": desc,
        "higherLevel": clean(s.get("higher_level", "")),
    }
    if s.get("attack_type"):
        entry["attack_type"] = s["attack_type"]
    if save:
        entry["dc"] = {"dc_type": {"index": SAVE[save.group(1)], "name": SAVE[save.group(1)].upper()}}
    if s.get("damage"):
        entry["damage"] = s["damage"]
    spells.append(entry)

# ---------------------------------------------------------------- write


def write(name, key, rows):
    path = OUT / f"2024_{name}.json"
    path.write_text(json.dumps({key: rows}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{path.name}: {len(rows)}")


write("classes", "classes", classes)
write("subclasses", "subclasses", subclasses)
write("species", "races", species)
write("backgrounds", "backgrounds", backgrounds)
write("feats", "feats", feats)
write("spells", "spells", spells)

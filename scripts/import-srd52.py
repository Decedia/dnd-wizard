#!/usr/bin/env python3
"""Build the app's 2024 rules data from the SRD 5.2 JSON files of 5e-bits/5e-database.

Usage:
  python3 -I scripts/import-srd52.py <dir with 5e-SRD-*.json from src/2024/en>

Download the inputs from
  https://raw.githubusercontent.com/5e-bits/5e-database/main/src/2024/en/5e-SRD-<Name>.json
for Classes, Levels, Features, Subclasses, Species, Subspecies, Traits, Backgrounds, Feats,
Spells, Equipment, Weapon-Mastery-Properties.

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
subspecies_raw = {x["index"]: x for x in load("Subspecies")}
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

# ---------------------------------------------------------------- level 1 class picks

equipment_raw = load("Equipment")
mastery_raw = {m["name"]: clean(m["description"]) for m in load("Weapon-Mastery-Properties")}
WEAPONS = []
for e in equipment_raw:
    if not e.get("mastery"):
        continue
    cats = {c["index"] for c in e["equipment_categories"]}
    WEAPONS.append({
        "name": e["name"],
        "mastery": e["mastery"]["name"],
        "martial": "martial-weapons" in cats,
        "melee": "melee-weapons" in cats,
        "properties": [p["name"] for p in e.get("properties", [])],
    })

# Which weapons each class can train with Weapon Mastery (it needs proficiency).
MASTERY_WEAPONS = {
    "Barbarian": lambda w: not w["martial"] or w["melee"],
    "Fighter": lambda w: True,
    "Paladin": lambda w: True,
    "Ranger": lambda w: True,
    "Rogue": lambda w: not w["martial"] or "Finesse" in w["properties"] or "Light" in w["properties"],
}
# Paladin, Ranger and Rogue have 2 mastery weapons at every level; the source's tables leave the column out.
FIXES["weapon_mastery_flat"] = {"Paladin": 2, "Ranger": 2, "Rogue": 2}


def option(name, description):
    return {"name": name, "description": description}


# Picks the level 1 features ask for, as the wizard's feature choices. Descriptions are short own-words summaries.
CLASS_CHOICES = {
    ("Cleric", "Divine Order"): {"type": "single", "options": [
        option("Protector", "Trained for battle: Martial weapons and Heavy armor."),
        option("Thaumaturge", "One extra Cleric cantrip, and add your Wisdom modifier (at least +1) to Intelligence (Arcana or Religion) checks."),
    ]},
    ("Druid", "Primal Order"): {"type": "single", "options": [
        option("Magician", "One extra Druid cantrip, and add your Wisdom modifier (at least +1) to Intelligence (Arcana or Nature) checks."),
        option("Warden", "Trained for battle: Martial weapons and Medium armor."),
    ]},
    ("Warlock", "Eldritch Invocations"): {"type": "single", "options": [
        option("Pact of the Blade", "Conjure a pact weapon or bond with a magic weapon. You use Charisma to hit and for damage with it."),
        option("Pact of the Chain", "You learn Find Familiar and your familiar can take special forms, such as an imp or a sprite."),
        option("Pact of the Tome", "A Book of Shadows with three cantrips and two 1st-level rituals of your choice from any class."),
        option("Armor of Shadows", "Cast Mage Armor on yourself at will, without a spell slot."),
        option("Eldritch Mind", "Advantage on Constitution saving throws to keep Concentration."),
    ]},
}

# Metamagic options (SRD 5.2), in own words. Sorcery point cost first.
METAMAGIC = [
    option("Careful Spell", "1 point. Creatures you pick automatically pass the spell's saving throw and take no damage if they would take half."),
    option("Distant Spell", "1 point. Double the spell's range, or make a Touch spell reach 30 feet."),
    option("Empowered Spell", "1 point. Reroll some of the spell's damage dice (up to your Charisma modifier) and keep the new rolls."),
    option("Extended Spell", "1 point. Double the spell's duration (up to 24 hours) and get Advantage on saves to keep Concentration on it."),
    option("Heightened Spell", "2 points. One target has Disadvantage on its saves against the spell."),
    option("Quickened Spell", "2 points. Cast the spell as a Bonus Action, if you haven't cast a level 1+ spell this turn."),
    option("Seeking Spell", "1 point. Reroll a missed spell attack roll."),
    option("Subtle Spell", "1 point. Cast without Verbal, Somatic or Material components that have no cost, so no one sees you cast."),
    option("Transmuted Spell", "1 point. Change the spell's damage type to Acid, Cold, Fire, Lightning, Poison or Thunder."),
    option("Twinned Spell", "1 point. Cast the spell as if one level higher, when that lets it target one more creature."),
]
METAMAGIC_PICKS = {2: 2, 10: 2, 17: 2}


def invocation(name, description, min_level=1, requires=None):
    out = option(name, description)
    if min_level > 1:
        out["minLevel"] = min_level
    if requires:
        out["requires"] = requires
    return out


# Eldritch Invocations (SRD 5.2) with their level and pact prerequisites, in own words.
# Lessons of the First Ones is left out: it needs an Origin feat pick the wizard can't make yet.
INVOCATIONS = [
    invocation("Agonizing Blast", "Add your Charisma modifier to the damage of one Warlock cantrip that deals damage (like Eldritch Blast).", 2),
    invocation("Armor of Shadows", "Cast Mage Armor on yourself at will, without a spell slot."),
    invocation("Ascendant Step", "Cast Levitate on yourself at will, without a spell slot.", 5),
    invocation("Devil's Sight", "See normally in Dim Light and Darkness, even magical Darkness, out to 120 feet.", 2),
    invocation("Devouring Blade", "Thirsting Blade gives you two extra attacks instead of one.", 12, "Thirsting Blade"),
    invocation("Eldritch Mind", "Advantage on Constitution saving throws to keep Concentration."),
    invocation("Eldritch Smite", "When you hit with your pact weapon, spend a Pact Magic slot for extra Force damage (1d8, plus 1d8 per slot level) and you can knock the target Prone.", 5, "Pact of the Blade"),
    invocation("Eldritch Spear", "One Warlock cantrip that deals damage gets a much longer range (30 feet per Warlock level).", 2),
    invocation("Fiendish Vigor", "Cast False Life on yourself at will, without a spell slot, and get the highest number of Temporary Hit Points.", 2),
    invocation("Gaze of Two Minds", "As a Bonus Action, touch a willing creature and see and hear through its senses.", 5),
    invocation("Gift of the Depths", "Breathe underwater, swim at your Speed, and cast Water Breathing once per Long Rest without a slot.", 5),
    invocation("Gift of the Protectors", "Creatures who write their names in your Book of Shadows drop to 1 Hit Point instead of 0, once each per Long Rest.", 9, "Pact of the Tome"),
    invocation("Investment of the Chain Master", "Your familiar gets fly and swim speeds, attacks when you command it with a Bonus Action, and uses your spell save DC.", 5, "Pact of the Chain"),
    invocation("Lifedrinker", "Your pact weapon deals an extra 1d6 Necrotic, Psychic or Radiant damage on a hit, and once per turn you can spend a Hit Die to heal.", 9, "Pact of the Blade"),
    invocation("Mask of Many Faces", "Cast Disguise Self at will, without a spell slot.", 2),
    invocation("Master of Myriad Forms", "Cast Alter Self at will, without a spell slot.", 5),
    invocation("Misty Visions", "Cast Silent Image at will, without a spell slot.", 2),
    invocation("One with Shadows", "While in Dim Light or Darkness, cast Invisibility on yourself without a spell slot.", 5),
    invocation("Otherworldly Leap", "Cast Jump on yourself at will, without a spell slot.", 2),
    invocation("Pact of the Blade", "Conjure a pact weapon or bond with a magic weapon. You use Charisma to hit and for damage with it."),
    invocation("Pact of the Chain", "You learn Find Familiar and your familiar can take special forms, such as an imp or a sprite."),
    invocation("Pact of the Tome", "A Book of Shadows with three cantrips and two 1st-level rituals of your choice from any class."),
    invocation("Repelling Blast", "When a Warlock cantrip that deals damage hits a Large or smaller creature, push it up to 10 feet away.", 2),
    invocation("Thirsting Blade", "Attack twice with your pact weapon when you take the Attack action.", 5, "Pact of the Blade"),
    invocation("Visions of Distant Realms", "Cast Arcane Eye at will, without a spell slot.", 9),
    invocation("Whispers of the Grave", "Cast Speak with Dead at will, without a spell slot.", 7),
    invocation("Witch Sight", "You have Truesight out to 30 feet.", 15),
]

# Standard and rare languages (SRD 5.2), minus Common which everyone speaks.
LANGUAGES_2024 = ["Common Sign Language", "Draconic", "Dwarvish", "Elvish", "Giant", "Gnomish", "Goblin", "Halfling", "Orc", "Abyssal", "Celestial", "Deep Speech", "Infernal", "Primordial", "Sylvan", "Undercommon"]

# Picks at higher levels that the source tables only describe in text. Descriptions are own words.
LEVEL_CHOICES = {
    ("Barbarian", "Primal Knowledge"): {"type": "single", "grants": "skill", "description": "Pick one more skill from the Barbarian list.", "options": [option(s, "") for s in ["Animal Handling", "Athletics", "Intimidation", "Nature", "Perception", "Survival"]]},
    ("Ranger", "Deft Explorer"): {"type": "multiple", "count": 2, "grants": "language", "description": "Pick two languages. (Your Expertise pick is asked separately.)", "options": [option(n, "") for n in LANGUAGES_2024]},
    ("Cleric", "Blessed Strikes"): {"type": "single", "options": [
        option("Divine Strike", "Once per turn, a weapon hit deals an extra 1d8 Necrotic or Radiant damage (2d8 at level 14)."),
        option("Potent Spellcasting", "Add your Wisdom modifier to the damage of your Cleric cantrips."),
    ]},
    ("Druid", "Elemental Fury"): {"type": "single", "options": [
        option("Potent Spellcasting", "Add your Wisdom modifier to the damage of your Druid cantrips."),
        option("Primal Strike", "Once per turn, a weapon or Beast-form hit deals an extra 1d8 Cold, Fire, Lightning or Thunder damage (2d8 at level 15)."),
    ]},
}

fighting_styles = [f for f in feats_raw if f["type"] == "fighting-style"]
spells_by_level = {}
for sp in spells_raw:
    if any(cl["name"] == "Warlock" for cl in sp["classes"]):
        spells_by_level.setdefault(sp["level"], []).append(sp["name"])
ORDINAL = {6: "6th", 7: "7th", 8: "8th", 9: "9th"}
ARCANUM_LEVELS = {11: 6, 13: 7, 15: 8, 17: 9}


def add_feature(c, lvl, feature):
    """A pick the source table leaves out, added to that level's features (marked, so the lock test can tell)."""
    feature = {**feature, "added": True}
    c["levels"][lvl - 1]["features"].append(feature)
    c["features"].append({**feature, "level": lvl})


for c in classes:
    name = c["name"]
    if name == "Warlock":
        known = {lv["level"]: (lv.get("classSpecific") or {}).get("eldritch_invocations", 0) for lv in c["levels"]}
        for lvl in range(2, 21):
            gained = known[lvl] - known[lvl - 1]
            if gained > 0:
                add_feature(c, lvl, {"name": "Eldritch Invocations", "description": f"You learn {gained} more Eldritch Invocation{'s' if gained > 1 else ''}.", "choices": {"type": "multiple", "count": gained, "options": INVOCATIONS}})
        for lvl, spell_level in ARCANUM_LEVELS.items():
            for f in c["levels"][lvl - 1]["features"]:
                if f["name"] == "Mystic Arcanum":
                    f["name"] = f"Mystic Arcanum ({ORDINAL[spell_level]} level)"
                    f["choices"] = {"type": "spells", "count": 1, "description": f"Pick one level {spell_level} Warlock spell. You can cast it once per Long Rest without a spell slot.", "options": [option(n, "") for n in sorted(spells_by_level.get(spell_level, []))]}
            for f in c["features"]:
                if f["name"] == "Mystic Arcanum" and f["level"] == lvl:
                    f["name"] = f"Mystic Arcanum ({ORDINAL[spell_level]} level)"
    if name == "Sorcerer":
        for level in c["levels"]:
            for f in level["features"]:
                if f["name"] == "Metamagic" and level["level"] in METAMAGIC_PICKS:
                    count = METAMAGIC_PICKS[level["level"]]
                    f["choices"] = {"type": "multiple", "count": count, "description": f"Pick {count} Metamagic options.", "options": METAMAGIC}
    for level in c["levels"]:
        for f in level["features"]:
            if (name, f["name"]) in LEVEL_CHOICES:
                f["choices"] = LEVEL_CHOICES[(name, f["name"])]
            # The Epic Boon level is a feat pick, like an Ability Score Improvement.
            if f["name"] == "Epic Boon":
                level["asi"] = True

for c in classes:
    name = c["name"]
    if name in FIXES["weapon_mastery_flat"]:
        c["weaponMastery"] = {str(l): FIXES["weapon_mastery_flat"][name] for l in range(1, 21)}
    if name == "Wizard":
        c["spellbookSpells"] = {str(l): 6 + 2 * (l - 1) for l in range(1, 21)}
    for level in c["levels"]:
        for f in level["features"]:
            if f["name"] == "Weapon Mastery" and name in MASTERY_WEAPONS:
                count = c["weaponMastery"][str(level["level"])]
                f["choices"] = {
                    "type": "multiple",
                    "count": count,
                    "description": f"Pick {count} kinds of weapons. With those you can use their mastery move.",
                    "options": [option(w["name"], f"{w['mastery']}: {mastery_raw[w['mastery']]}") for w in WEAPONS if MASTERY_WEAPONS[name](w)],
                }
            elif f["name"] == "Fighting Style":
                f["choices"] = {"type": "single", "options": [option(fs["name"] if fs["name"] != "Two Weapon Fighting" else FIXES["two_weapon_fighting"], clean(fs["description"])) for fs in fighting_styles]}
            elif (name, f["name"]) in CLASS_CHOICES and level["level"] == 1:
                f["choices"] = CLASS_CHOICES[(name, f["name"])]
    # More weapons to train as the Weapon Mastery column grows (Barbarian 4 and 10, Fighter 4, 10 and 16).
    if name in MASTERY_WEAPONS:
        for lvl in range(2, 21):
            gained = c["weaponMastery"][str(lvl)] - c["weaponMastery"][str(lvl - 1)]
            if gained > 0:
                add_feature(c, lvl, {"name": "Weapon Mastery", "description": f"Train {gained} more kind{'s' if gained > 1 else ''} of weapon for Weapon Mastery.", "choices": {
                    "type": "multiple",
                    "count": gained,
                    "description": f"Pick {gained} more kind{'s' if gained > 1 else ''} of weapon.",
                    "options": [option(w["name"], f"{w['mastery']}: {mastery_raw[w['mastery']]}") for w in WEAPONS if MASTERY_WEAPONS[name](w)],
                }})
    for f in c["features"]:
        match = next((x for lv in c["levels"] if lv["level"] == f["level"] for x in lv["features"] if x["name"] == f["name"] and "choices" in x), None)
        if match:
            f["choices"] = match["choices"]

weapon_mastery = {
    "weapons": {w["name"]: w["mastery"] for w in WEAPONS},
    "properties": mastery_raw,
}

# ---------------------------------------------------------------- subclasses

SKILL_NAMES = ["Acrobatics", "Animal Handling", "Arcana", "Athletics", "Deception", "History", "Insight", "Intimidation", "Investigation", "Medicine", "Nature", "Perception", "Performance", "Persuasion", "Religion", "Sleight of Hand", "Stealth", "Survival"]

# Subclass features that ask for a pick, in the same shape as the 2014 subclass pick lists. Own words.
SUBCLASS_CHOICES = {
    "College of Lore": {"Bonus Proficiencies": {"count": 3, "grants": {"mode": "proficiency"}, "options": [option(n, "") for n in SKILL_NAMES]}},
    "Champion": {"Additional Fighting Style": {"count": 1, "fightingStyle": True, "options": [option(fs["name"] if fs["name"] != "Two Weapon Fighting" else FIXES["two_weapon_fighting"], clean(fs["description"])) for fs in feats_raw if fs["type"] == "fighting-style"]}},
    "Hunter": {
        "Hunter's Prey": {"count": 1, "options": [
            option("Colossus Slayer", "Once per turn, a weapon hit on a creature missing any Hit Points deals an extra 1d8 damage."),
            option("Horde Breaker", "Once per turn, make one more attack with the same weapon against a different creature within 5 feet of the first target."),
        ]},
        "Defensive Tactics": {"count": 1, "options": [
            option("Escape the Horde", "Opportunity Attacks against you have Disadvantage."),
            option("Multiattack Defense", "After a creature hits you, its other attacks against you this turn have Disadvantage."),
        ]},
    },
    "Circle of the Land": {"Circle of the Land Spells": {"count": 1, "options": [option(land, "Always-prepared spells: " + ", ".join(sp for lvl in sorted(spells, key=int) for sp in spells[lvl]) + ". You can change your land after a Long Rest.") for land, spells in LAND_SPELLS.items()]}},
    "Draconic Sorcery": {"Elemental Affinity": {"count": 1, "options": [option(t, f"Resistance to {t} damage, and add your Charisma modifier to one damage roll of a spell that deals {t} damage.") for t in ["Acid", "Cold", "Fire", "Lightning", "Poison"]]}},
}

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
    if s["name"] in SUBCLASS_CHOICES:
        entry["featureChoices"] = SUBCLASS_CHOICES[s["name"]]
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
# Species whose lineage spells use an ability the player picks (Elven Lineage, Gnomish Lineage, Fiendish Legacy).
SPELL_ABILITY_CHOICE = {"Elf", "Gnome", "Tiefling"}
# The lineage tables, written out from the trait text: the source splits them
# over many small traits and leaves out Speak with Animals, Prestidigitation
# (Rock Gnome) and Druidcraft (Wood Elf). Spells are keyed by character level.
LINEAGE_EXTRA = {
    "elven-lineage-drow": {
        "description": "Darkvision 120 feet. Dancing Lights cantrip. Faerie Fire at level 3, Darkness at level 5.",
        "darkvision": 120,
        "spells": {"1": ["Dancing Lights"], "3": ["Faerie Fire"], "5": ["Darkness"]},
    },
    "elven-lineage-high-elf": {
        "description": "Prestidigitation cantrip (swap it for another Wizard cantrip after a Long Rest). Detect Magic at level 3, Misty Step at level 5.",
        "spells": {"1": ["Prestidigitation"], "3": ["Detect Magic"], "5": ["Misty Step"]},
    },
    "elven-lineage-wood-elf": {
        "description": "Speed 35 feet. Druidcraft cantrip. Longstrider at level 3, Pass without Trace at level 5.",
        "speed": 35,
        "spells": {"1": ["Druidcraft"], "3": ["Longstrider"], "5": ["Pass without Trace"]},
    },
    "gnomish-lineage-forest-gnome": {
        "description": "Minor Illusion cantrip. Speak with Animals always prepared, cast free a number of times equal to your Proficiency Bonus per Long Rest.",
        "spells": {"1": ["Minor Illusion", "Speak with Animals"]},
    },
    "gnomish-lineage-rock-gnome": {
        "description": "Mending and Prestidigitation cantrips. Spend 10 minutes to build a Tiny clockwork toy that makes one Prestidigitation effect.",
        "spells": {"1": ["Mending", "Prestidigitation"]},
    },
    "fiendish-legacy-abyssal": {
        "description": "Resistance to Poison damage. Poison Spray cantrip. Ray of Sickness at level 3, Hold Person at level 5.",
        "resistance": "Poison",
        "spells": {"1": ["Poison Spray"], "3": ["Ray of Sickness"], "5": ["Hold Person"]},
    },
    "fiendish-legacy-chthonic": {
        "description": "Resistance to Necrotic damage. Chill Touch cantrip. False Life at level 3, Ray of Enfeeblement at level 5.",
        "resistance": "Necrotic",
        "spells": {"1": ["Chill Touch"], "3": ["False Life"], "5": ["Ray of Enfeeblement"]},
    },
    "fiendish-legacy-infernal": {
        "description": "Resistance to Fire damage. Fire Bolt cantrip. Hellish Rebuke at level 3, Darkness at level 5.",
        "resistance": "Fire",
        "spells": {"1": ["Fire Bolt"], "3": ["Hellish Rebuke"], "5": ["Darkness"]},
    },
}
# Spells a species trait gives everyone of that species (Otherworldly Presence).
SPECIES_SPELLS = {"Tiefling": {"1": ["Thaumaturgy"]}}
# Skill picks from species traits: Keen Senses (one of three) and Skillful (any one).
SPECIES_SKILL_CHOICE = {
    "Elf": {"count": 1, "options": ["Insight", "Perception", "Survival"]},
    "Human": {"count": 1},
}


def lineage_text(sub):
    """Dragonborn ancestry and Goliath ancestry options: the damage type, or the boon's text."""
    parts = []
    for t in sub["traits"]:
        if t["name"].startswith("Breath Weapon: "):
            parts.append(f"{t['name'].split(': ')[1]} breath and resistance.")
        elif not t["name"].startswith("Damage Resistance"):
            parts.append(clean(traits_raw[t["index"]]["description"]))
    return " ".join(parts)
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
        options = []
        for x in s["subspecies"]:
            option = {"id": x["index"], "name": x["name"].split(": ", 1)[1]}
            option.update(LINEAGE_EXTRA.get(x["index"]) or {"description": lineage_text(subspecies_raw[x["index"]])})
            options.append(option)
        choices.append({
            "id": f"{s['index']}-2024-lineage",
            "name": group,
            "type": "single",
            "options": options,
        })
    if s["name"] in SPELL_ABILITY_CHOICE:
        choices.append({
            "id": f"{s['index']}-2024-spell-ability",
            "name": "Spellcasting ability",
            "description": "The ability your lineage spells use. Pick the one your class casts with, or your highest mental score.",
            "type": "single",
            "options": [{"id": k, "name": n} for k, n in (("int", "Intelligence"), ("wis", "Wisdom"), ("cha", "Charisma"))],
        })
    if s["name"] in SIZE_OPTIONS:
        choices.append({
            "id": f"{s['index']}-2024-size",
            "name": "Size",
            "description": "Small or Medium. It changes nothing else for you.",
            "type": "single",
            "options": [{"id": z.lower(), "name": z} for z in SIZE_OPTIONS[s["name"]]],
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
    if s["name"] in SPECIES_SPELLS:
        entry["spells"] = SPECIES_SPELLS[s["name"]]
    if s["name"] in SPECIES_SKILL_CHOICE:
        entry["skillChoice"] = SPECIES_SKILL_CHOICE[s["name"]]
    if s["name"] == "Human":
        # Versatile: an Origin feat of the player's choice.
        entry["originFeat"] = True
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


# ---------------------------------------------------------------- spell text the source garbled
# The source flattened two-column tables: rows went missing (Divine Word 31-40, every odd
# Prismatic ray), and Control Weather's text and tables landed inside Control Water.
# These are the SRD 5.2 texts, rebuilt with each table as one line per row.
SPELL_TEXT = {
    "Augury": (
        "You receive an omen from an otherworldly entity about the results of a course of action that you plan to take within the next 30 minutes. The GM chooses the omen from the Omens table.\n\n"
        "Omens (omen: for results that will be ...)\n\n"
        "Weal: Good\n\nWoe: Bad\n\nWeal and woe: Good and bad\n\nIndifference: Neither good nor bad\n\n"
        "The spell doesn't account for circumstances, such as other spells, that might change the results.\n\n"
        "If you cast the spell more than once before finishing a Long Rest, there is a cumulative 25 percent chance for each casting after the first that you get no answer."
    ),
    "Confusion": (
        "Each creature in a 10-foot-radius Sphere centered on a point you choose within range must succeed on a Wisdom saving throw, or that target can't take Bonus Actions or Reactions and must roll 1d10 at the start of each of its turns to determine its behavior for that turn, consulting the table below.\n\n"
        "1: The target doesn't take an action, and it uses all its movement to move. Roll 1d4 for the direction: 1, north; 2, east; 3, south; or 4, west.\n\n"
        "2-6: The target doesn't move or take actions.\n\n"
        "7-8: The target doesn't move, and it takes the Attack action to make one melee attack against a random creature within reach. If none are within reach, the target takes no action.\n\n"
        "9-10: The target chooses its behavior.\n\n"
        "At the end of each of its turns, an affected target repeats the save, ending the spell on itself on a success."
    ),
    "Control Water": (
        "Until the spell ends, you control any water inside an area you choose that is a Cube up to 100 feet on a side, using one of the following effects. As a Magic action on your later turns, you can repeat the same effect or choose a different one.\n\n"
        "Flood. You cause the water level of all standing water in the area to rise by as much as 20 feet. If you choose an area in a large body of water, you instead create a 20-foot tall wave that travels from one side of the area to the other and then crashes. Any Huge or smaller vehicles in the wave's path are carried with it to the other side. Any Huge or smaller vehicles struck by the wave have a 25 percent chance of capsizing.\n\n"
        "The water level remains elevated until the spell ends or you choose a different effect. If this effect produced a wave, the wave repeats on the start of your next turn while the flood effect lasts.\n\n"
        "Part Water. You part water in the area and create a trench. The trench extends across the spell's area, and the separated water forms a wall to either side. The trench remains until the spell ends or you choose a different effect. The water then slowly fills in the trench over the course of the next round until the normal water level is restored.\n\n"
        "Redirect Flow. You cause flowing water in the area to move in a direction you choose, even if the water has to flow over obstacles, up walls, or in other unlikely directions. The water in the area moves as you direct it, but once it moves beyond the spell's area, it resumes its flow based on the terrain. The water continues to move in the direction you chose until the spell ends or you choose a different effect.\n\n"
        "Whirlpool. You cause a whirlpool to form in the center of the area, which must be at least 50 feet square and 25 feet deep. The whirlpool lasts until you choose a different effect or the spell ends. The whirlpool is 5 feet wide at the base, up to 50 feet wide at the top, and 25 feet tall. Any creature in the water and within 25 feet of the whirlpool is pulled 10 feet toward it. When a creature enters the whirlpool for the first time on a turn or ends its turn there, it makes a Strength saving throw. On a failed save, the creature takes 2d8 Bludgeoning damage. On a successful save, the creature takes half as much damage. A creature can swim away from the whirlpool only if it first takes an action to pull away and succeeds on a Strength (Athletics) check against your spell save DC."
    ),
    "Control Weather": (
        "You take control of the weather within 5 miles of you for the duration. You must be outdoors to cast this spell, and it ends early if you go indoors.\n\n"
        "When you cast the spell, you change the current weather conditions, which are determined by the GM. You can change precipitation, temperature, and wind. It takes 1d4 × 10 minutes for the new conditions to take effect. Once they do so, you can change the conditions again. When the spell ends, the weather gradually returns to normal.\n\n"
        "When you change the weather conditions, find a current condition on the following tables and change its stage by one, up or down. When changing the wind, you can change its direction.\n\n"
        "Precipitation: 1, Clear; 2, Light clouds; 3, Overcast or ground fog; 4, Rain, hail, or snow; 5, Torrential rain, driving hail, or blizzard.\n\n"
        "Temperature: 1, Heat wave; 2, Hot; 3, Warm; 4, Cool; 5, Cold; 6, Freezing.\n\n"
        "Wind: 1, Calm; 2, Moderate wind; 3, Strong wind; 4, Gale; 5, Storm."
    ),
    "Creation": (
        "You pull wisps of shadow material from the Shadowfell to create an object within range. It is either an object of vegetable matter (soft goods, rope, wood, and the like) or mineral matter (stone, crystal, metal, and the like). The object must be no larger than a 5-foot Cube, and the object must be of a form and material that you have seen.\n\n"
        "The spell's duration depends on the object's material, as shown in the Materials table. If the object is composed of multiple materials, use the shortest duration. Using any object created by this spell as another spell's Material component causes the other spell to fail.\n\n"
        "Vegetable matter: 24 hours\n\nStone or crystal: 12 hours\n\nPrecious metals: 1 hour\n\nGems: 10 minutes\n\nAdamantine or mithral: 1 minute"
    ),
    "Divine Word": (
        "You utter a word imbued with power from the Upper Planes. Each creature of your choice in range makes a Charisma saving throw. On a failed save, a target that has 50 Hit Points or fewer suffers an effect based on its current Hit Points, as shown in the Divine Word Effects table. Regardless of its Hit Points, a Celestial, an Elemental, a Fey, or a Fiend target that fails its save is forced back to its plane of origin (if it isn't there already) and can't return to the current plane for 24 hours by any means short of a Wish spell.\n\n"
        "0-20 Hit Points: The target dies.\n\n"
        "21-30 Hit Points: The target has the Blinded, Deafened, and Stunned conditions for 1 hour.\n\n"
        "31-40 Hit Points: The target has the Blinded and Deafened conditions for 10 minutes.\n\n"
        "41-50 Hit Points: The target has the Deafened condition for 1 minute."
    ),
    "Prismatic Spray": (
        "Eight rays of light flash from you in a 60-foot Cone. Each creature in the Cone makes a Dexterity saving throw. For each target, roll 1d8 to determine which color ray affects it, consulting the Prismatic Rays table.\n\n"
        "1, Red. Failed Save: 12d6 Fire damage. Successful Save: Half as much damage.\n\n"
        "2, Orange. Failed Save: 12d6 Acid damage. Successful Save: Half as much damage.\n\n"
        "3, Yellow. Failed Save: 12d6 Lightning damage. Successful Save: Half as much damage.\n\n"
        "4, Green. Failed Save: 12d6 Poison damage. Successful Save: Half as much damage.\n\n"
        "5, Blue. Failed Save: 12d6 Cold damage. Successful Save: Half as much damage.\n\n"
        "6, Indigo. Failed Save: The target has the Restrained condition and makes a Constitution saving throw at the end of each of its turns. If it successfully saves three times, the condition ends. If it fails three times, it has the Petrified condition until it is freed by an effect like the Greater Restoration spell. The successes and failures needn't be consecutive; keep track of both until the target collects three of a kind.\n\n"
        "7, Violet. Failed Save: The target has the Blinded condition and makes a Wisdom saving throw at the start of your next turn. On a successful save, the condition ends. On a failed save, the condition ends, and the creature teleports to another plane of existence (GM's choice).\n\n"
        "8, Special. The target is struck by two rays. Roll twice, rerolling any 8."
    ),
    "Reincarnate": (
        "You touch a dead Humanoid or a piece of one. If the creature has been dead no longer than 10 days, the spell forms a new body for it and calls the soul to enter that body. Roll 1d10 and consult the table below to determine the body's species, or the GM chooses another playable species.\n\n"
        "1: Roll again\n\n2: Dragonborn\n\n3: Dwarf\n\n4: Elf\n\n5: Gnome\n\n6: Goliath\n\n7: Halfling\n\n8: Human\n\n9: Orc\n\n10: Tiefling\n\n"
        "The reincarnated creature makes any choices that a species' description offers, and the creature recalls its former life. It retains the capabilities it had in its original form, except it loses the traits of its previous species and gains the traits of its new one."
    ),
    "Scrying": (
        "You can see and hear a creature you choose that is on the same plane of existence as you. The target makes a Wisdom saving throw, which is modified (see the tables below) by how well you know the target and the sort of physical connection you have to it. The target doesn't know what it is making the save against, only that it feels uneasy.\n\n"
        "Your knowledge of the target: Secondhand (heard of the target) +5; Firsthand (met the target) +0; Extensive (know the target well) -5.\n\n"
        "Your connection to the target: Likeness or picture -2; Garment or other possession -4; Body part, lock of hair, or bit of nail -10.\n\n"
        "On a successful save, the target isn't affected, and you can't use this spell on it again for 24 hours.\n\n"
        "On a failed save, the spell creates an Invisible, intangible sensor within 10 feet of the target. You can see and hear through the sensor as if you were there. The sensor moves with the target, remaining within 10 feet of it for the duration. If something can see the sensor, it appears as a luminous orb about the size of your fist.\n\n"
        "Instead of targeting a creature, you can target a location you have seen. When you do so, the sensor appears at that location and doesn't move."
    ),
}
# Text cut short or with a table squeezed into one line: (old, new) replacements.
SPELL_TEXT_PATCHES = {
    "Telekinesis": [("such as manipulating a simple tool,", "such as manipulating a simple tool, opening a door or a container, stowing or retrieving an item from an open container, or pouring the contents from a vial.")],
    "Prismatic Wall": [(
        "Prismatic Layers Order  Effects 2    Orange.",
        "\n\n1, Red. Failed Save: 12d6 Fire damage. Successful Save: Half as much damage. Additional Effects: Nonmagical ranged attacks can't pass through this layer, which is destroyed if it takes at least 25 Cold damage.\n\n2, Orange.",
    ), (
        "destroyed by a strong wind (such as the one created by Gust of Wind). 4    Green.",
        "destroyed by a strong wind (such as the one created by Gust of Wind).\n\n3, Yellow. Failed Save: 12d6 Lightning damage. Successful Save: Half as much damage. Additional Effects: The layer is destroyed if it takes at least 60 Force damage.\n\n4, Green.",
    ), (
        "can open a portal on a solid surface, destroys this layer. 6    Indigo.",
        "can open a portal on a solid surface, destroys this layer.\n\n5, Blue. Failed Save: 12d6 Cold damage. Successful Save: Half as much damage. Additional Effects: The layer is destroyed if it takes at least 25 Fire damage.\n\n6, Indigo.",
    ), (
        "destroyed by Bright Light shed by the Daylight spell.",
        "destroyed by Bright Light shed by the Daylight spell.\n\n7, Violet. Failed Save: The target has the Blinded condition and makes a Wisdom saving throw at the start of your next turn. On a successful save, the condition ends. On a failed save, the condition ends, and the creature teleports to another plane of existence (GM's choice). Additional Effects: This layer is destroyed by Dispel Magic.",
    )],
}

STAT_HEADERS = ("Bonus Actions", "Traits", "Reactions", "Actions")


def tidy_stat_block(text):
    """A summon's stat block came as one run-on line; give it one line per part."""
    def scores(m):
        parts = re.findall(r"(\w+)\s+(\d+)\s+([+-]\d+)\s+[+-]\d+", m.group(1))
        return "\n\n" + " · ".join(f"{a.upper()} {s} ({mod})" for a, s, mod in parts) + "\n\n"
    text = re.sub(r"\s*MOD SAVE\s+MOD SAVE\s+MOD SAVE\s+((?:\w+\s+\d+\s+[+-]\d+\s+[+-]\d+\s*){6})", scores, text)
    for header in STAT_HEADERS:
        text = re.sub(rf"\s+{header}\s{{3,}}", f"\n\n{header}: ", text)
    text = re.sub(r"\s(?=(?:Resistances|Immunities|Senses|Languages|CR) )", "\n\n", text)
    # The block starts with its size and type ("Large Beast, Unaligned").
    text = re.sub(r"\. ((?:Tiny|Small|Medium|Large|Huge|Gargantuan)(?: or Smaller)? [A-Z][\w ,()]*?, (?:Unaligned|Neutral)) ", r".\n\n\1\n\n", text, count=1)
    text = re.sub(r" (?=HP |Speed )", "\n\n", text)
    return re.sub(r"\n{3,}", "\n\n", text).strip()


def fix_spell_text(name, desc, higher):
    desc = SPELL_TEXT.get(name, desc)
    for old, new in SPELL_TEXT_PATCHES.get(name, []):
        assert old in desc, (name, old)
        desc = desc.replace(old, new)
    # "Using a Higher-Level Spell Slot." left inside the description goes to its own field.
    m = re.search(r"\s+Using a Higher-Level Spell Slot\.\s*", desc)
    if m and not higher:
        desc, higher = desc[: m.start()], desc[m.end():]
    if "MOD SAVE" in higher:
        higher = tidy_stat_block(higher)
    return desc.strip(), higher.strip()

spells = []
for s in spells_raw:
    desc, higher = fix_spell_text(s["name"], clean(s["description"]), clean(s.get("higher_level", "")))
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
        "higherLevel": higher,
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
(OUT / "2024_weapon_mastery.json").write_text(json.dumps(weapon_mastery, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"2024_weapon_mastery.json: {len(WEAPONS)}")
write("subclasses", "subclasses", subclasses)
write("species", "races", species)
write("backgrounds", "backgrounds", backgrounds)
write("feats", "feats", feats)
write("spells", "spells", spells)

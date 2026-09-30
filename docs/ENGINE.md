# Combat engine data

The turn engine reads this data. It is meant to be final, so it is authored once,
correctly, and gated by a validator that refuses to pass an invalid dataset.

## Layout

| Path | Holds |
|---|---|
| `src/data/engine/vocab.json` | Every closed vocabulary. The single source of truth. |
| `src/data/engine/types.ts` | The TypeScript model, plus drift tripwires against `vocab.json`. |
| `src/data/engine/resources.json` | Counters shared across features (Ki, Channel Divinity, spell slots). |
| `src/data/engine/states.json` | Named states a feature can be gated on (`raging`, `unarmored`). |
| `src/data/engine/forms.json` | Creature definitions referenced by `transform` and `summon`. |
| `src/data/engine/features/<kind>/<owner>.json` | The features. One file per class, race, feat category. |
| `scripts/validate-engine-data.mjs` | The gate. Exits non-zero on any problem. |

```bash
npm run engine:validate   # must pass before any change here is committed
npm run engine:coverage   # what still needs authoring
npm run engine:worklist   # the same, per owner, for working through
npm run typecheck         # the drift tripwires
```

## Coverage report

`scripts/engine-coverage.mjs` treats the existing `2014_*.json` files as an
*inventory only*, never as a source. It reports what exists, what is already
authored, which engine fields the old data could even supply, and which entries
need a decision before they can be written. Read-only.

It exists because the old data is too thin to convert: its `effect` field is
populated in 0 of 288 class features, real charges in 5 of 288, and nothing at
all on any of the 146 feats. Converting it would produce entries that pass
validation while saying nothing. The gate is a floor, not a ceiling.

## Id scheme

`<kind>.<owner>.<slug>`, snake_case, e.g. `class.fighter.action_surge` and
`race.dragonborn.breath_weapon`. The kind segment stops a subclass, a monster
and an item colliding when the engine looks features up globally. Ids are
permanent - `featuresUsedThisTurn` stores them - so the validator pins the shape.

Race traits carry their variant in a `variant` field: `owner: "Dragonborn"`,
`variant: "Chromatic"`. The old data instead spells the variant into the name
(`Dragonborn (Chromatic)`), which the validator rejects, and which duplicates
darkvision across nineteen entries instead of putting it on the base race once.

## The five rules

1. **Every mechanic is a value from a closed enum.** Authoring never invents a
   string, so nothing downstream parses prose. If a value you need is missing,
   add it to `vocab.json` *and* to the matching union in `types.ts` in the same
   change. The validator rejects the data until both are done.
2. **Numbers are resolved at authoring time.** There is no `"see class table"`.
   A level 3 barbarian's Rage carries a hard `3`. Use `tiers` for a value that
   changes with level, or `formCap` for a challenge-rating cap.
3. **Resources are top-level.** Channel Divinity, Ki, Sorcery Points and Hit Dice
   are pools that *many* features spend. A feature that draws on one declares
   `cost`, and does not carry its own `uses`.
4. **The core shape is stable.** Adding an enum value, an effect kind or a
   feature is additive and never moves an existing field. The one change that is
   not allowed is changing what an existing field *means* — that is the
   restructure this dataset exists to avoid.
5. **Effects are structured for display, not resolution.** A `damage` effect
   carries the dice and how it resolves so the UI can render "1d8 + 4 slashing,
   Dex save for half". The human still rolls the die. See "What this is not".

## A feature

```jsonc
{
  "id": "fighter.action_surge",        // "<kind>.<owner>.<slug>", lowercase, stable forever
  "name": "Action Surge",
  "kind": "class",
  "owner": "Fighter",
  "unlock": 2,                          // level; omitted for feats and backgrounds
  "activation": "action",               // action | bonus_action | reaction | free | passive
  "limits": { "per": "rest", "max": 1 },
  "trigger": null,                      // required for every reaction
  "targeting": { "scope": "self" },
  "effects": [
    { "kind": "extra_action", "count": 1, "note": "..." }
  ],
  "tiers": [{ "at": 11, "limits": { "per": "rest", "max": 2 } }],
  "summary": "Take one additional action on your turn",   // <= 120 chars, no trailing period
  "text": "On your turn, you can take one additional action. ...",  // verbatim, for proofreading
  "source": { "book": "PHB", "page": 72, "reference": "PHB Fighter 16" }
}
```

`summary` is rendered on a badge, hence the length and punctuation limits. `text`
is never shown as a badge but is the reason the dataset is trustworthy: it is
checked against the book.

## Activation

| Value | Meaning | Offered in the turn menu? |
|---|---|---|
| `action` | Costs the Action | Yes, in the action slot |
| `bonus_action` | Costs the Bonus Action | Yes, in the bonus slot |
| `reaction` | Costs the Reaction, needs a `trigger` | Only when the trigger matches |
| `free` | No action cost, but still invoked | Yes, in the action slot |
| `passive` | Always on | No |

`passive` features are what the character sheet shows as always-on, and what
`computeDerivedStats` reads. `free` is the one that gets confused: it is
invocable but free, so it appears in the menu without spending anything
(Sneak Attack rides on an attack that already happened).

A reaction without a `trigger` is a hard validation error, because the turn
engine has no way to know when to offer it.

## Resolution

Every `damage` and `heal` effect carries a `resolution`, because all three of
these occur constantly and modelling only saves would force a change later:

```jsonc
{ "mode": "save",   "ability": "dex", "onSuccess": "half", "onFailure": "full" }
{ "mode": "attack", "reaches": ["5 ft melee"] }
{ "mode": "auto" }
```

`onSuccess: null` means the effect lands regardless.

## Shared pools

```jsonc
// resources.json
{ "id": "ki", "kind": "pools", "recharge": "short_rest", "maxByLevel": { "2": 2, "6": 3 } }

// the feature that spends it
{ "id": "monk.flurry_of_blows", "cost": [{ "resource": "ki", "amount": 1 }], "limits": { "per": "turn", "max": 1 } }
```

Use **either** `cost` **or** `limits`, not both, unless they mean different
things. Wild Shape carries a cost and no limit, because `wild_shape_uses` is
already the limit. Second Wind carries a limit and no cost.

`max` and `maxByLevel` are mutually exclusive; the validator rejects a resource
that sets both.

## Gates

A feature can require the character to be in a state: `gates: ["raging"]`.
Every id must exist in `states.json`, so a typo cannot silently disable a
feature. Gates are distinct from D&D *conditions*, which are effects applied to
a creature and are modelled by the `condition` effect kind.

## What this is not

This is a **turn tracker**, not a simulator. The engine answers "what can I
invoke, do I have it left, and what does it do" — it does not roll dice, make
attack rolls for you, or track conditions across five creatures. Players roll
real dice, which is how D&D is played.

Auto-resolution would be a separate consumer of this same data, not a change to
it. That is why `effects` is structured rather than prose.

## Status

Phase 0, complete. Six stress-test features exist specifically to prove the
vocabulary holds against the hardest 5e constructs:

| Feature | What it stresses |
|---|---|
| `druid.wild_shape` | Level-keyed CR caps, form changes mid-combat, a form slot reference |
| `druid.wildfire_spirit` | A summon that acts on its own turn and carries its own actions |
| `druid.wildfire_spirit_attack` | An attack-mode effect, and a `free` activation with a trigger |
| `druid.wildfire_spirit_movement` | A zero-draw feature that is still a real action |
| `sorcerer.metamagic` | Modifying a *different* action after it is chosen |
| `cleric.channel_divinity_turn_undead` | A shared pool spent by a feature |
| `fighter.action_surge` | An extra action inside an action, and a tier that changes a limit |
| `dragonborn.draconic_resilience` | A reaction that only fires at 0 HP |
| `dragonborn.breath_weapon` | A resource-backed area attack |

Two changes came out of writing them, which is the point of writing them first:

- `Resolution` replaced a `save`-only field. Attack rolls are as common as saves,
  and a `save`-only field would have needed changing within the first hundred
  features.
- `formCap` replaced a per-tier `effects` override. Repeating the whole effect
  array at every tier was unreadable and would have diverged between tiers.

Not yet authored: the rest of the class and racial features, feats, backgrounds,
monsters, and magic items with actives. Monster-only activators (`multiattack`,
`legendary_action`, `recharge`) belong in the vocabulary before monsters are
written.

### Measured backlog

`npm run engine:coverage` puts the real figure at **1253** entries, not the
~650 estimated before the report existed:

| Group | Exists | Authored | To write |
|---|---|---|---|
| class features | 288 | 4 | 284 |
| subclass features | 601 | 0 | 601 |
| racial traits | 218 | 1 | 217 |
| feats | 146 | 0 | 146 |

The earlier estimate was wrong because it read subclass features from a
`levels` array that subclasses do not have; they sit at the top level with a
per-feature `level`.

Also flagged, and all of them need handling rather than mechanical conversion:

- **35 features stored as duplicate rows** across levels, to be collapsed into
  one entry with `tiers`.
- **37 placeholder rows** with no content at all (`Path feature`, `Divine Domain
  feature`, `Martial Archetype feature`, and one per class at each subclass
  level). The real feature has to be written.
- **2 features with the tier in the name** (`Extra Attack (2)`, `Extra Attack (3)`).
- **Races modelled wrongly.** 9 legacy Tiefling variants (27 traits) that do not
  exist in 2014, and 8 Half-Elf variants (32 traits) that are not a choice — a
  2014 half-elf takes one elf variant, not all of them. Darkvision is duplicated
  across 19 entries and belongs on the base race once.
- **Vocabulary is only 12/33 exercised** by the nine authored features, and 3/17
  trigger events. The rest are untested until real content uses them, which is
  why the vocabulary should not be pruned on the strength of nine entries.

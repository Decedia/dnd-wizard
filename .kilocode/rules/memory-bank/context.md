# Active Context: DND Wizard

## Current State

**App Status**: ✅ DND-AN creation wizard fully restructured (Steps 1-9 + per-level sequence)

### Creation Wizard Restructure
- **Step 1 — Identity**: Removed Level/Proficiency/XP; added Background select dropdown; custom language input added below SRD language checkboxes.
- **Step 2 — Race**: Card-select from SRD races; on selection, race traits auto-added as locked Features & Traits entries (green "default" tag, no delete/edit).
- **Step 3 — Class**: Card-select from SRD classes; on selection, non-attack features auto-added as locked Features & Traits; attack-type features (Sneak Attack) auto-added as class-granted attacks in Attacks & Spellcasting.
- **Step 4 — Ability Scores & Saving Throws**: Merged view with one-time info popup; method toggle (Standard Array / Point Buy / Dice Roll); Standard Array pool removal when assigned; Dice Roll uses 4d6 drop-lowest with 1-reroll and manual override per ability; saving throws auto-display from class.
- **Step 5 — Background**: Unchanged (name + personality traits + ideal + bond + flaw).
- **Step 6 — Skills**: One-time info popup explaining class-restricted skills and proficiency; existing restricted-list + count-enforced behavior preserved; no Expertise mechanics introduced here.
- **Step 7 — Equipment**: Choice groups rendered as radio buttons (or-groups); selected weapons auto-populate Attacks via computeEquippedEffects; non-weapon items shown with one-line description always visible.
- **Step 8 — Looks / Appearances**: Renamed from Final Touches; same fields (age, height, weight, eyes, skin, hair, backstory).
- **Step 9 — Level & Hit Points**: New step; +/- level selector (1-10); shows Level 1 baseline HP (hit die + CON mod); Next generates per-level step sequence for levels 2 through selected level.
- **Per-level steps (10+)**: Dynamically generated using `generateLevelUpSteps` (same function used by LevelUpFlow); sequence: HP → Features → Subclass → ASI → Expertise → Spell Selection; progress indicator continues counting (e.g. "Step 11 of 14").
- **Spell Selection (per-level)**: Tabbed layout (Cantrips, 1st-5th Level); only shows tabs for spell levels the character has slots for; selection limits enforced per tab (cantrips-known / spell-slots-known); selected spells tagged with level learned.
- **Finish flow**: All accumulated changes applied in one write; racial ability bonuses applied on finish.

### SRD Data Updates
- Added `type: "feature" | "attack"` tags to all class features in `srd.ts` (Fighter, Wizard, Rogue).
- Rogue `scalingFeatures` type updated from `"sneak_attack" | "expertise"` to `"feature" | "attack"`.
- Expanded `spells` array from 10 to 28 spells covering Cantrips (0) through Level 5, each with `castingTime`, `range`, `duration`, `effect` fields.
- Added `backgrounds` array (13 5e backgrounds) to `srd.ts`.
- Updated `SRDSpell` interface to include casting metadata.

### Character Type Updates (`storage.ts`)
- `features` now includes `source?: "race" | "class" | "custom"` and `locked?: boolean`.
- `attacks` now includes `source?: "weapon" | "class"` and `classFeatureName?: string`.
- `inventory` items now include `description?: string`.
- `abilityMethod` type updated from `"manual"` to `"diceroll"`.
- New `getClassGrantedAttacks()` helper returns class-granted attack entries (e.g. Sneak Attack).
- `computeEquippedEffects()` now merges class-granted attacks with weapon attacks.

### Sheet Rendering Updates
- `FeaturesTraitsSection`: Locked features show with green border, "default" tag, read-only fields, no delete button.
- `AttacksAndSpellcastingSection`: Class-granted attacks shown with gold border, "class-granted" tag, read-only.

### Level Up Flow Updates
- `generateLevelUpSteps` now generates `spellSelection` steps at levels where spell slots increase or cantrips known increases.
- `LevelUpStep` type extended with `spellSelection` variant.
- `LevelUpFlow` modal now includes `SpellSelectionStep` for post-creation level up.
- `PerLevelStepsFlow` component created for inline per-level steps during character creation.

## Recently Completed

- [x] Restructured DND-AN creation wizard end-to-end (Steps 1-8 fixes + new Steps 9+)
- [x] Added `type: "feature" | "attack"` tags to all class features in srd.ts
- [x] Expanded spells to 28 entries with full casting metadata (levels 0-5)
- [x] Added backgrounds list to srd.ts
- [x] Updated Character type with source/locked on features, class-granted on attacks
- [x] Updated FeaturesTraitsSection and AttacksAndSpellcastingSection for locked/class-granted rendering
- [x] Fixed StepIdentity (removed Level/Proficiency/XP, added Background select, custom language)
- [x] Updated StepRace to auto-add locked race traits
- [x] Updated StepClass to auto-add locked class features and route attacks
- [x] Updated StepAbilityScores with one-time popup, Dice Roll method, Standard Array pool removal
- [x] Updated StepSkills with one-time info popup
- [x] Updated StepEquipment with auto-populated Attacks & Inventory descriptions
- [x] Renamed StepFinalTouches to StepLooksAppearances
- [x] Created StepLevelHitPoints component
- [x] Created PerLevelStepsFlow component for inline per-level steps
- [x] Added spell selection tabbed UI to both PerLevelStepsFlow and LevelUpFlow
- [x] Unified Level Up logic between creation and post-creation via `generateLevelUpSteps`
- [x] Consolidated per-level steps: each level now produces one step with multiple sections (hp, features, subclass, asi, expertise, spellSlots, spellSelection)
- [x] Fixed granted equipment quantity display template literal bug in StepEquipment
- [x] Added editable quantity and dice dropdown for custom/editable inventory items in StepEquipment
- [x] Replaced equip checkbox with Equip/Equipped button for weapons and armor in StepEquipment and InventorySection
- [x] Added equip button for granted items and fixed button overflow with flex-wrap
- [x] Replaced LevelUpFlow modal with dedicated `/character/[id]/level-up` page
- [x] Modified `generateLevelUpSteps` to always include level 1 step and moved expertise into level 1
- [x] Removed expertise selection from StepSkills during Rogue character creation
- [x] Level 1 step during character creation skips HP rolling
- [x] Fixed create page `handleNext` condition to properly reach final Finish & Save step for level > 1
- [x] Removed +/- level buttons from character sheet IdentitySection; level is now static display
- [x] Level Up button in character sheet navigates to `/character/[id]/level-up` page
- [x] Lint, typecheck, and build verified

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/character/create/page.tsx` | Character creation wizard orchestrator (9 base + dynamic per-level steps) | ✅ Ready |
| `src/components/character-creator/StepIdentity.tsx` | Name, player, alignment, languages + custom, background select | ✅ Ready |
| `src/components/character-creator/StepRace.tsx` | Race card-select with auto-locked traits | ✅ Ready |
| `src/components/character-creator/StepClass.tsx` | Class card-select with auto-locked features | ✅ Ready |
| `src/components/character-creator/StepAbilityScores.tsx` | Ability scores with popup, 3 methods, saving throws | ✅ Ready |
| `src/components/character-creator/StepBackground.tsx` | Background + personality/ideal/bond/flaw | ✅ Ready |
| `src/components/character-creator/StepSkills.tsx` | Skills with popup, restricted list, expertise picker | ✅ Ready |
| `src/components/character-creator/StepEquipment.tsx` | Equipment choices, auto-populate attacks/inventory | ✅ Ready |
| `src/components/character-creator/StepLooksAppearances.tsx` | Age, height, weight, eyes, skin, hair, backstory | ✅ Ready |
| `src/components/character-creator/StepLevelHitPoints.tsx` | Level selector (1-10), baseline HP display | ✅ Ready |
| `src/components/character-creator/PerLevelStepsFlow.tsx` | Inline per-level step sequence with spell selection | ✅ Ready |
| `src/data/srd.ts` | 5e SRD data with type tags, expanded spells, backgrounds | ✅ Ready |
| `src/lib/storage.ts` | Character type with source/locked, class-granted attacks helpers | ✅ Ready |
| `src/lib/level-up.ts` | Level-up computation + `generateLevelUpSteps` with sections consolidation | ✅ Ready |
| `src/app/character/[id]/level-up/page.tsx` | Dedicated level-up page (replaces modal) | ✅ Ready |
| `src/components/character-sheet/FeaturesTraitsSection.tsx` | Locked feature rendering with "default" tag | ✅ Ready |
| `src/components/character-sheet/AttacksAndSpellcastingSection.tsx` | Class-granted attack rendering with "class-granted" tag | ✅ Ready |

## Current Focus

Wizard restructure complete. Next steps:
1. Add character deletion from home screen
2. Implement PDF export/import
3. Add database persistence (via add-database recipe)
4. Future: Refactor shared step rendering between PerLevelStepsFlow and LevelUpFlow to reduce duplication
5. Future: Fighting Style choice, Action Surge tracker, Arcane Recovery tracker

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-08-18 | Replaced nav demo with DND Wizard app scaffold |
| 2026-08-18 | Built full character sheet screen with 7 sections, auto-save, sticky header, section nav |
| 2026-08-18 | Replaced all placeholder data with real 5e SRD data, added racial bonus auto-calculation, auto-skip Spells for non-Wizards |
| 2026-08-18 | Added Level Up system with reusable modal, SRD levels 1-10 data, ASI picker, and Wizard spell slot summaries |
| 2026-08-19 | Wired SRD data into UI and calculations: HP auto-calc, skills restricted list + count, equipment choice packages, sneak attack numeric effect, expertise picker for Rogue |
| 2026-08-19 | Replaced single LevelUpModal with multi-step LevelUpFlow; added subclass data (Fighter/Rogue L3, Wizard L2); added Dice Roller screen and reusable Dice component |
| 2026-08-19 | Full wizard restructure: Steps 1-8 fixes, new Step 9 (Level & HP), per-level step sequence, spell selection tabs, locked race/class features, class-granted attacks rendering |
| 2026-08-19 | Consolidated per-level steps: each level produces one step with multiple sections (hp/features/subclass/asi/expertise/spellSlots/spellSelection); updated LevelUpStep type and both PerLevelStepsFlow and LevelUpFlow to render sections |
| 2026-08-20 | Replaced LevelUpFlow modal with dedicated `/character/[id]/level-up` page; modified `generateLevelUpSteps` to always include level 1 step with expertise; removed expertise from StepSkills for Rogue during creation; level 1 step skips HP rolling; removed +/- level buttons from character sheet; level up navigates to dedicated page |
| 2026-08-20 | Fixed granted equipment quantity display bug (`x{itemRef.quantity}` → `x${itemRef.quantity}`); added editable quantity and dice dropdown for custom/editable inventory items in StepEquipment |

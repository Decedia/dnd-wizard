# Active Context: DND Wizard

## Current State

**App Status**: ✅ Multi-step Level Up flow + Dice Roller complete

### Level Up Flow
- Replaced single `LevelUpModal` with `LevelUpFlow` — a multi-step guided flow using the same `ProgressIndicator` + `StepCard` + Back/Next pattern as the character creation wizard.
- Triggered when the level slider increases (in both Wizard and Character Sheet). Multiple levels gained at once generate a full step sequence in ascending order.
- Steps are dynamically generated per class from `srd.json`:
  - **Hit Points** — always included; integrates the `<Dice/>` component (roll or take average).
  - **New Class Features** — informational, auto-added to Features list on finish.
  - **Subclass Selection** — shown at the class's `subclassLevel` (Fighter/Rogue L3, Wizard L2) with radio-button options.
  - **Ability Score Improvement** — shown on ASI levels with +/- controls.
  - **Expertise** — shown for Rogue at levels 1 and 6.
  - **Spell Slot Update** — shown for casters when slots increase.
- "Finish Level Up" applies all accumulated changes in one write. Backing out or canceling discards everything.
- `useLevelUp` hook and `LevelUpModal` removed.

### Subclass Data
- Added `subclassLevel` and `subclasses` to `SRDClass` interface and data in `srd.ts`.
- Fighter (L3): Champion, Battle Master, Eldritch Knight.
- Wizard (L2): 8 Arcane Tradition schools.
- Rogue (L3): Thief, Assassin, Arcane Trickster.

### Dice Roller
- Reusable `<Dice/>` component supporting d4, d6, d8, d10, d12, d20, d100 with CSS shapes and animations.
- New `/dice` route with a 2×4 grid, each die independently tappable with last result shown.
- "Roll All Dice" button with staggered timing.
- Added Dice entry to `BottomNav` and home screen.

## Recently Completed

- [x] Extended `Character` type with full sheet fields (identity, stats, skills, features, inventory, spells, appearance)
- [x] Local storage utilities for character CRUD + empty character factory
- [x] `SectionCard` base component with header and divider
- [x] `IdentitySection` - name, race, class, level, background, alignment
- [x] `StatsSection` - 6 ability scores with auto-modifiers, AC, HP, speed
- [x] `SkillsSection` - 18 standard 5e skills with proficiency checkboxes and auto-calculated totals
- [x] `FeaturesTraitsSection` - repeatable name/description list with add/remove
- [x] `InventorySection` - repeatable item/quantity list with currency row
- [x] `SpellsSection` - repeatable spell name/level list with collapse toggle
- [x] `AppearanceBioSection` - age, height, weight, eyes, skin, hair, personality, backstory
- [x] `StickyMiniHeader` - shows character name + class/level while scrolling
- [x] `SectionNav` - floating vertical pill nav with scroll-spy (desktop)
- [x] `CharacterSheetContext` - provides debounced auto-save to all section inputs
- [x] Character view page (`/character/[id]`) with manual save + confirmation toast
- [x] `/character/new` creates empty character and redirects to its sheet
- [x] All icons updated to flat SVG design
- [x] Wire create button to step-by-step character creation wizard (`/character/create`)
- [x] Create `src/data/srd.ts` with real 5e SRD data (races, classes, skills, spells)
- [x] Update Race and Class steps to use SRD data with expandable traits/features
- [x] Update Ability Scores step to auto-apply racial bonuses and show base + final scores
- [x] Update Skills step hints to use real SRD descriptions
- [x] Update Spells step to use real SRD spell list and descriptions
- [x] Skip Spells step for non-Wizard classes (Fighter/Rogue auto-skip to Final Touches)
- [x] Fix StepBackground persistence bug (was passing empty strings instead of character state)
- [x] Update Character Sheet IdentitySection, SkillsSection, SpellsSection to pull from SRD data
- [x] Expand SRD class data with levels 1-10 arrays (features, ASI, spell slots)
- [x] Create reusable LevelUpModal component with features list, ASI picker, spell slots summary
- [x] Create useLevelUp hook for detecting level increases and computing cumulative level data
- [x] Wire level-up modal into Character Sheet IdentitySection and Creation Flow StepIdentity
- [x] Add spellSlots field to Character type for Wizard spell slot tracking
- [x] Add `hpPerLevel` to SRDClass interface and classes (Fighter=6, Wizard=4, Rogue=5)
- [x] Rewrite `computeDerivedStats` HP logic to use class `hitDie` (level 1) and `hpPerLevel` (subsequent levels) + CON modifier
- [x] Add `getClassLevel1Hp`, `getClassPerLevelHp`, `getMaxExpertiseCount` helpers to `storage.ts`
- [x] Add `hpGain` to `LevelUpResult` in `level-up.ts`
- [x] Update `LevelUpModal` to display HP gain description and expertise picker for level 6 Rogue
- [x] Update `AttacksAndSpellcastingSection` to always show Sneak Attack read-only stat for Rogues
- [x] Create `ExpertisePicker` component for selecting expertise skills
- [x] Update `SkillsSection` (character sheet) to integrate `ExpertisePicker`
- [x] Update `StepSkills` (character creator) to accept full `Character` data and show `ExpertisePicker`
- [x] Update character creator page to show expertise modal after Skills step for Rogues
- [x] Update character sheet page with Level Up button, HP gain display, and expertise handling
- [x] Skills not in class allowed list are grayed out, not hidden, in both wizard and sheet
- [x] Equipment choices render as radio-button groups with granted items shown as non-interactive
- [x] Replace single `LevelUpModal` with multi-step `LevelUpFlow` component
- [x] Add `subclassLevel` and `subclasses` to SRDClass for Fighter/Wizard/Rogue
- [x] Create `/dice` route with Dice Roller screen and `Dice` component
- [x] Add Dice Roller entry to `BottomNav` and home screen
- [x] Remove old `LevelUpModal.tsx` and `useLevelUp.ts` hook
- [x] Lint, typecheck, and build verified

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/globals.css` | Dark fantasy theme, `.input` styles, dice CSS | ✅ Ready |
| `src/app/layout.tsx` | Root layout with fonts + bottom nav | ✅ Ready |
| `src/app/page.tsx` | Home screen (My Characters list + Dice Roller entry) | ✅ Ready |
| `src/app/dice/page.tsx` | Dice Roller screen | ✅ Ready |
| `src/app/character/new/page.tsx` | Creates empty character and redirects | ✅ Ready |
| `src/app/character/[id]/page.tsx` | Full character sheet page with Level Up button | ✅ Ready |
| `src/app/character/create/page.tsx` | Character creation wizard with Level Up flow | ✅ Ready |
| `src/components/BottomNav.tsx` | Floating bottom nav with Dice entry | ✅ Ready |
| `src/components/AppHeader.tsx` | App header with dragon logo | ✅ Ready |
| `src/lib/storage.ts` | LocalStorage CRUD + Character type + HP/expertise helpers | ✅ Ready |
| `src/data/srd.ts` | 5e SRD data (races, classes, skills, spells, hpPerLevel, subclassLevel, subclasses, scalingFeatures) | ✅ Ready |
| `src/lib/level-up.ts` | Level-up computation + `generateLevelUpSteps` | ✅ Ready |
| `src/components/level-up/LevelUpFlow.tsx` | Multi-step level-up flow with HP (Dice), ASI, subclass, expertise, spell slots | ✅ Ready |
| `src/components/Dice.tsx` | Reusable animated dice component | ✅ Ready |
| `src/components/character-creator/StepRace.tsx` | Race selection with SRD traits | ✅ Ready |
| `src/components/character-creator/StepClass.tsx` | Class selection with SRD features | ✅ Ready |
| `src/components/character-creator/StepAbilityScores.tsx` | Ability scores with racial auto-bonuses | ✅ Ready |
| `src/components/character-creator/StepSkills.tsx` | Skill selection with SRD descriptions + expertise picker | ✅ Ready |
| `src/components/character-creator/StepEquipment.tsx` | Equipment choice packages from SRD | ✅ Ready |
| `src/components/character-creator/StepSpells.tsx` | Spell picker with SRD data (Wizard only) | ✅ Ready |
| `src/components/character-creator/StepFinalTouches.tsx` | Appearance and backstory | ✅ Ready |
| `src/components/character-sheet/SectionCard.tsx` | Base card component | ✅ Ready |
| `src/components/character-sheet/StickyMiniHeader.tsx` | Sticky scroll header | ✅ Ready |
| `src/components/character-sheet/SectionNav.tsx` | Floating vertical section nav with scroll-spy | ✅ Ready |
| `src/components/character-sheet/CharacterSheetContext.tsx` | Context for auto-save blur handler | ✅ Ready |
| `src/components/character-sheet/IdentitySection.tsx` | Identity fields with Level Up flow | ✅ Ready |
| `src/components/character-sheet/StatsSection.tsx` | Stats with auto-modifiers, read-only Max HP | ✅ Ready |
| `src/components/character-sheet/SkillsSection.tsx` | 18 skills with proficiency, expertise tag + ExpertisePicker | ✅ Ready |
| `src/components/character-sheet/ExpertisePicker.tsx` | Expertise skill selection for Rogues | ✅ Ready |
| `src/components/character-sheet/FeaturesTraitsSection.tsx` | Repeatable features/traits | ✅ Ready |
| `src/components/character-sheet/InventorySection.tsx` | Equipment choices + granted items + currency | ✅ Ready |
| `src/components/character-sheet/AttacksAndSpellcastingSection.tsx` | Attacks with sneak attack display | ✅ Ready |
| `src/components/character-sheet/SpellsSection.tsx` | Repeatable spells with collapse toggle | ✅ Ready |
| `src/components/character-sheet/AppearanceBioSection.tsx` | Appearance & backstory | ✅ Ready |

## Current Focus

Level Up multi-step flow and Dice Roller complete. Next steps:
1. Add character deletion from home screen
2. Implement PDF export/import
3. Add database persistence (via add-database recipe)
4. Future: Fighting Style choice, Action Surge tracker, Arcane Recovery tracker

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

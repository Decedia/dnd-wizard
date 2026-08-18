# Active Context: DND Wizard

## Current State

**App Status**: ✅ Level Up system complete

The character creation wizard and character sheet both support a Level Up system. When the level field increases, a modal opens showing cumulative new class features, an ASI picker with +/- controls, and Wizard spell slot summaries. The SRD data now includes levels 1-10 for each class with features, ASI markers (levels 4 and 8), and Wizard spell slot progression.

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
- [x] Lint, typecheck, and build verified

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/globals.css` | Dark fantasy theme, `.input` styles | ✅ Ready |
| `src/app/layout.tsx` | Root layout with fonts + bottom nav | ✅ Ready |
| `src/app/page.tsx` | Home screen (My Characters list) | ✅ Ready |
| `src/app/character/new/page.tsx` | Creates empty character and redirects | ✅ Ready |
| `src/app/character/[id]/page.tsx` | Full character sheet page | ✅ Ready |
| `src/components/BottomNav.tsx` | Floating bottom nav with dragon hero | ✅ Ready |
| `src/components/AppHeader.tsx` | App header with dragon logo | ✅ Ready |
| `src/lib/storage.ts` | LocalStorage CRUD + Character type + helpers | ✅ Ready |
| `src/data/srd.ts` | 5e SRD data (races, classes, skills, spells, levels 1-10) | ✅ Ready |
| `src/lib/level-up.ts` | Level-up computation helpers | ✅ Ready |
| `src/hooks/useLevelUp.ts` | Reusable level-up state hook | ✅ Ready |
| `src/components/level-up/LevelUpModal.tsx` | Reusable level-up modal component | ✅ Ready |
| `src/components/character-creator/StepRace.tsx` | Race selection with SRD traits | ✅ Ready |
| `src/components/character-creator/StepClass.tsx` | Class selection with SRD features | ✅ Ready |
| `src/components/character-creator/StepAbilityScores.tsx` | Ability scores with racial auto-bonuses | ✅ Ready |
| `src/components/character-creator/StepSkills.tsx` | Skill selection with SRD descriptions | ✅ Ready |
| `src/components/character-creator/StepSpells.tsx` | Spell picker with SRD data (Wizard only) | ✅ Ready |
| `src/components/character-creator/StepFinalTouches.tsx` | Appearance and backstory | ✅ Ready |
| `src/components/character-sheet/SectionCard.tsx` | Base card component | ✅ Ready |
| `src/components/character-sheet/StickyMiniHeader.tsx` | Sticky scroll header | ✅ Ready |
| `src/components/character-sheet/SectionNav.tsx` | Floating vertical section nav with scroll-spy | ✅ Ready |
| `src/components/character-sheet/CharacterSheetContext.tsx` | Context for auto-save blur handler | ✅ Ready |
| `src/components/character-sheet/IdentitySection.tsx` | Identity fields | ✅ Ready |
| `src/components/character-sheet/StatsSection.tsx` | Stats with auto-modifiers | ✅ Ready |
| `src/components/character-sheet/SkillsSection.tsx` | 18 skills with proficiency checkboxes | ✅ Ready |
| `src/components/character-sheet/FeaturesTraitsSection.tsx` | Repeatable features/traits | ✅ Ready |
| `src/components/character-sheet/InventorySection.tsx` | Repeatable inventory + currency | ✅ Ready |
| `src/components/character-sheet/SpellsSection.tsx` | Repeatable spells with collapse toggle | ✅ Ready |
| `src/components/character-sheet/AppearanceBioSection.tsx` | Appearance & backstory | ✅ Ready |

## Current Focus

Level Up system is complete. Next steps:
1. Add character deletion from home screen
2. Implement PDF export/import
3. Add database persistence (via add-database recipe)

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

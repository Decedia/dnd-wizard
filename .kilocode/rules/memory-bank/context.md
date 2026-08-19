# Active Context: DND Wizard

## Current State

**App Status**: ✅ SRD data-wired mechanics complete (HP, Skills, Equipment, Sneak Attack, Expertise)

The character creation wizard and character sheet are now fully wired to the structured `srd.json` data:
- **HP Auto-calculation**: Level 1 uses max hit die + CON mod; each level up adds class flat per-level HP + CON mod. Max HP is read-only, current HP remains manually adjustable.
- **Skills Restricted List**: Once a class is selected, the skill checklist filters to only that class's allowed skills from `srd.json`'s `{count, options}` structure. Non-class skills are shown but grayed out. Selection count is enforced and locked when the pick count is reached.
- **Equipment Choice Packages**: Starting equipment renders as radio-button choice groups from `srd.json` instead of free-text entry. Granted items appear as a confirmed non-interactive list. All items integrate with the existing Equipped toggle / auto-AC / auto-Attack behavior.
- **Sneak Attack (Rogue)**: Read-only stat displays near Attacks & Spellcasting, auto-calculated from `srd.json` per-level scaling. Attacks from finesse/ranged weapons show a sneak attack tag.
- **Expertise (Rogue)**: Expertise picker allows selecting 2 skills (from already-chosen proficiencies + Thieves' Tools) at level 1, and 2 more at level 6. EXPERTISE-tagged skills show doubled proficiency bonus in skill totals. Triggered in Wizard after Skills step and via Level Up modal at level 6.

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
- [x] Lint, typecheck, and build verified

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/globals.css` | Dark fantasy theme, `.input` styles | ✅ Ready |
| `src/app/layout.tsx` | Root layout with fonts + bottom nav | ✅ Ready |
| `src/app/page.tsx` | Home screen (My Characters list) | ✅ Ready |
| `src/app/character/new/page.tsx` | Creates empty character and redirects | ✅ Ready |
| `src/app/character/[id]/page.tsx` | Full character sheet page with Level Up button | ✅ Ready |
| `src/app/character/create/page.tsx` | Character creation wizard with expertise modal | ✅ Ready |
| `src/components/BottomNav.tsx` | Floating bottom nav with dragon hero | ✅ Ready |
| `src/components/AppHeader.tsx` | App header with dragon logo | ✅ Ready |
| `src/lib/storage.ts` | LocalStorage CRUD + Character type + HP/expertise helpers | ✅ Ready |
| `src/data/srd.ts` | 5e SRD data (races, classes, skills, spells, hpPerLevel, scalingFeatures) | ✅ Ready |
| `src/lib/level-up.ts` | Level-up computation with hpGain | ✅ Ready |
| `src/hooks/useLevelUp.ts` | Reusable level-up state hook | ✅ Ready |
| `src/components/level-up/LevelUpModal.tsx` | Level-up modal with HP, ASI, expertise, spell slots | ✅ Ready |
| `src/components/character-creator/StepRace.tsx` | Race selection with SRD traits | ✅ Ready |
| `src/components/character-creator/StepClass.tsx` | Class selection with SRD features | ✅ Ready |
| `src/components/character-creator/StepAbilityScores.tsx` | Ability scores with racial auto-bonuses | ✅ Ready |
| `src/components/character-creator/StepSkills.tsx` | Skill selection with SRD descriptions + expertise picker | ✅ Ready |
| `src/components/character-creator/StepSpells.tsx` | Spell picker with SRD data (Wizard only) | ✅ Ready |
| `src/components/character-creator/StepFinalTouches.tsx` | Appearance and backstory | ✅ Ready |
| `src/components/character-sheet/SectionCard.tsx` | Base card component | ✅ Ready |
| `src/components/character-sheet/StickyMiniHeader.tsx` | Sticky scroll header | ✅ Ready |
| `src/components/character-sheet/SectionNav.tsx` | Floating vertical section nav with scroll-spy | ✅ Ready |
| `src/components/character-sheet/CharacterSheetContext.tsx` | Context for auto-save blur handler | ✅ Ready |
| `src/components/character-sheet/IdentitySection.tsx` | Identity fields | ✅ Ready |
| `src/components/character-sheet/StatsSection.tsx` | Stats with auto-modifiers, read-only Max HP | ✅ Ready |
| `src/components/character-sheet/SkillsSection.tsx` | 18 skills with proficiency, expertise tag + ExpertisePicker | ✅ Ready |
| `src/components/character-sheet/ExpertisePicker.tsx` | Expertise skill selection for Rogues | ✅ Ready |
| `src/components/character-sheet/FeaturesTraitsSection.tsx` | Repeatable features/traits | ✅ Ready |
| `src/components/character-sheet/InventorySection.tsx` | Equipment choices + granted items + currency | ✅ Ready |
| `src/components/character-sheet/AttacksAndSpellcastingSection.tsx` | Attacks with sneak attack display | ✅ Ready |
| `src/components/character-sheet/SpellsSection.tsx` | Repeatable spells with collapse toggle | ✅ Ready |
| `src/components/character-sheet/AppearanceBioSection.tsx` | Appearance & backstory | ✅ Ready |

## Current Focus

SRD data-wired mechanics complete. Next steps:
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

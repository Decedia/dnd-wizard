# Active Context: DND Wizard

## Current State

**App Status**: ✅ DND-AN creation wizard fully restructured (Steps 1-9 + per-level sequence)

### Data Layer
- **Static race data**: `src/data/2014_races.json` contains all 9 common 2014 SRD races with full trait descriptions, ability score increases, languages, and darkvision info
- **Static class data**: `src/data/2014_classes.json` contains all 12 classes with full 20-level progression, spell slots, ASI levels, subclasses, and features with real API descriptions
- **Static subclass data**: `src/data/2014_subclasses.json` contains all 12 subclasses with features and descriptions fetched from API
- **Static equipment data**: `src/data/2014_weapon.json`, `2014_armor.json`, `2014_items.json`, `2014_equipments.json` contain full equipment data from API
- **Static spell data**: Spells still in `src/data/srd.ts` (28 spells, levels 0-5)
- **Static wizard spell data**: `src/data/2014_wizard_spells.json` contains all 204 wizard spells from API (levels 0-9)
- **Client data access**: `src/lib/srd-client.ts` provides `getStaticRaces/Race`, `getStaticClasses/Class`, `getStaticSpells`, `getStaticWizardSpells`, `getStaticWeapons/Armors/Items/Equipments`, `getEquipmentData()` and more
- **Wizard spell restriction**: Spell selection components (`PerLevelStepsFlow`, `LevelUpFlow`, `level-up/page`) use `getStaticWizardSpells()` when class is Wizard, otherwise `getStaticSpells()`
- **All components migrated**: No components import from `src/data/srd.ts` except `src/lib/srd-client.ts` for spells and `src/lib/storage.ts` for getRaceData helper

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
- `generateLevelUpSteps` (src/lib/level-up.ts) generates per-level steps: HP, subclassSelection (at subclassLevel if no subclass), features (class + subclass features earned at that level), ASI, expertise (Rogue), spellSlots, spellSelection.
- Subclass features/choices now included; subclass feature choices stored under `subclass-feature-<name>` key, consumed by `applySubclassFeatures`.
- Real Level Up flow implemented as `/character/[id]/level-up` route + `src/components/LevelUpWizard.tsx` (target-level selector, per-level steps, applies HP/features/ASI/expertise/spells/subclass to the character on finish). "Level Up" button added to character bio tab.

## Recently Completed

- [x] Fixed level up features, ASI, and subclass selection using 2014 SRD JSON as reference for what players gain per level
- [x] Added `StepSubclass` component + `subclass` creation step (per class, shown at subclassLevel); subclass feature-choice selections wired into wizard via `getSubclassFeatureSelections`
- [x] Built real Level Up flow: `src/components/LevelUpWizard.tsx` + `/character/[id]/level-up` route; "Level Up" button on character bio tab
- [x] `generateLevelUpSteps` extended to include `subclassSelection` (when reaching subclass level w/o subclass) and per-level subclass features/choices; each subclass feature shown only at its own level
- [x] ASI allocation applied during both creation (StepLevel) and Level Up; subclass feature choices stored under `subclass-feature-<name>` key consumed by `applySubclassFeatures`
- [x] Rewrote StepEquipment: removed pending selection state, clicks immediately add to inventory, inline weapon list, info for all options, granted items auto-added, fixed double-selection bug; lint and typecheck pass
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
- [x] Updated Rogue SRD subclass data: Thief, Assassin, Arcane Trickster with 3 features each matching D&D 5e PHB
- [x] Removed redundant "Roguish Archetype" text from level 3 features
- [x] Added `"subclass"` to Character feature source type
- [x] Character creation `handleFinish` now adds subclass features when subclass is selected
- [x] Added all common SRD races (Dragonborn, Gnome, Half-Elf, Half-Orc, Tiefling) to `srd.ts`; race traits auto-wire into Features & Traits on selection
- [x] Removed unused `RACES` constant from `storage.ts`
- [x] Lint, typecheck, and build verified
- [x] Added static `src/data/2026_races.json` with all 9 common 2014 SRD races and full trait descriptions
- [x] Updated `StepRace` and `IdentitySection` to use static race data instead of live API
- [x] Live API route remains for classes, spells, equipment, languages
- [x] Replaced equip checkbox with Equip/Equipped button for weapons and armor in StepEquipment and InventorySection
- [x] Added equip button for granted items and fixed button overflow with flex-wrap
- [x] Replaced LevelUpFlow modal with dedicated `/character/[id]/level-up` page
- [x] Modified `generateLevelUpSteps` to always include level 1 step and moved expertise into level 1
- [x] Removed expertise selection from StepSkills during Rogue character creation
- [x] Level 1 step during character creation skips HP rolling
- [x] Fixed create page `handleNext` condition to properly reach final Finish & Save step for level > 1
- [x] Removed +/- level buttons from character sheet IdentitySection; level is now static display
- [x] Level Up button in character sheet navigates to `/character/[id]/level-up` page
- [x] Updated Rogue SRD subclass data: Thief, Assassin, Arcane Trickster with 3 features each matching D&D 5e PHB
- [x] Removed redundant "Roguish Archetype" text from level 3 features
- [x] Added `"subclass"` to Character feature source type
- [x] Character creation `handleFinish` now adds subclass features when subclass is selected
- [x] Lint, typecheck, and build verified
- [x] Comprehensive character sheet dark theme restyle: updated all 14 section components, tabs, toggles, and global CSS to near-black backgrounds with red/burgundy accents; lint and typecheck pass

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
| `src/components/character-creator/StepEquipment.tsx` | Equipment choices, immediate inventory commit, inline weapon picker, auto-granted items | ✅ Ready |
| `src/components/character-creator/StepLooksAppearances.tsx` | Age, height, weight, eyes, skin, hair, backstory | ✅ Ready |
| `src/components/character-creator/StepLevelHitPoints.tsx` | Level selector (1-10), baseline HP display | ✅ Ready |
| `src/components/character-creator/PerLevelStepsFlow.tsx` | Inline per-level step sequence with spell selection | ✅ Ready |
| `src/data/2014_races.json` | Static race data for 9 SRD races | ✅ Ready |
| `src/data/2014_classes.json` | Static class data for 12 classes with 20 levels each, subclasses, features | ✅ Ready |
| `src/data/2014_subclasses.json` | Static subclass data fetched from API | ✅ Ready |
| `src/data/2014_weapon.json` | Static weapon data (37 weapons) | ✅ Ready |
| `src/data/2014_armor.json` | Static armor data (13 armors) | ✅ Ready |
| `src/data/2014_items.json` | Static item data (187 items) | ✅ Ready |
| `src/data/2014_equipments.json` | Combined static equipment data (237 items) | ✅ Ready |
| `src/data/2014_wizard_spells.json` | Wizard-only spell list (204 spells, levels 0-9) | ✅ Ready |
| `src/lib/srd-client.ts` | Static data accessors for all SRD data with source filtering | ✅ Ready |
| `src/components/SourceBadge.tsx` | Color-coded sourcebook badge component (PHB/SCAG/XGE/TCE/etc.) | ✅ Ready |
| `src/components/character-creator/StepSourceSelection.tsx` | Sourcebook selection step for character creation | ✅ Ready |
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
5. Future: Add more PHB subclass features to subclass JSON entries
6. Future: Add more class feature choice options (e.g., Fighting Style variants, Expertise skills per class)

## Recently Completed (continued)

- [x] Created `FeatPopup.tsx` component for displaying feat details in character sheet
- [x] Updated `FeaturesTraitsSection.tsx` to show feat popup when clicking on feat names in view mode
- [x] Added ability score selection (+1 to two abilities) and skill proficiency selection to variant human UI in `StepOrigin.tsx`
- [x] Added `variantHumanAbilities` and `variantHumanSkill` fields to Character type in `storage.ts`
- [x] Updated `character-creation.ts` to apply variant human bonuses during finalization (ability bonuses, skill proficiency, feat)
- [x] Updated `getCreationSteps` validation to require all variant human selections (2 abilities, 1 skill, 1 feat) before proceeding
- [x] Updated `getRaceTraits` to include selected feat in variant human traits
- [x] Fixed variant human racial bonuses (replaces +1-to-all with +1-to-two-abilities)
- [x] Added FeatSelector confirmation button (no auto-close on selection)
- [x] Fixed all popups to not auto-close (added Cancel/Confirm buttons)
- [x] Changed all blacks to softer `#1a1a1a` for better visual comfort
- [x] Added dark mode with sun/moon toggle button (header right corner on home page only)
- [x] Added delete character button at home page (with confirmation)
- [x] Added heal and damage buttons with popup in CombatStatsSection
- [x] Added spell usage tracking (mark spells as used this turn)
- [x] Added feature usage tracking (mark features as used this turn)
- [x] Added floating "End Turn" button that resets spell/feature usage
- [x] Rewrote PDF export with @react-pdf/renderer (crisp text, no cut-off)
- [x] Performance improvements: render only active tab panel, memoize context values, lazy-load PDF libraries, memoize expensive computations, remove window.location.reload() on delete; typecheck and build pass

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
| 2026-08-20 | Fixed granted equipment quantity display bug; added editable quantity and dice dropdown for custom/editable inventory items in StepEquipment |
| 2026-08-20 | Replaced live API race fetching with static `src/data/2026_races.json` containing all 9 common 2014 SRD races |
| 2026-08-20 | Fetched equipment data from API into `2014_weapon.json` (37), `2014_armor.json` (13), `2014_items.json` (187), `2014_equipments.json` (237 total) |
| 2026-08-20 | Added `getStaticWeapons/Armors/Items/Equipments()` and `getEquipmentData()` to `srd-client.ts`; migrated StepEquipment and InventorySection to use static equipment data |
| 2026-08-20 | Fetched all subclass data from API into `2014_subclasses.json`; updated `2014_classes.json` subclass features with real API descriptions |
| 2026-08-20 | Verified all class feature descriptions match API; no changes needed (already correct) |
| 2026-08-20 | Migrated all remaining components off `src/data/srd.ts` to `src/lib/srd-client.ts` static data accessors; lint and typecheck pass |
| 2026-08-20 | Fetched all 204 wizard spells from D&D 5e API into `2014_wizard_spells.json` (levels 0-9, 14-27-31-28-23-23-19-15-12-12 spells per level) |
| 2026-08-20 | Added `SRDWizardSpell` interface and `getStaticWizardSpells()`, `getStaticWizardSpell()`, `getWizardSpellNames()` to `srd-client.ts` |
| 2026-08-20 | Updated spell selection in `PerLevelStepsFlow.tsx`, `level-up/page.tsx`, and `LevelUpFlow.tsx` to use wizard-only spell list when class is Wizard |
| 2026-08-20 | Fixed LevelUpFlow prop naming: renamed `className` to `charClass` to avoid TSX parsing conflicts; updated child components `HpStep` and `ExpertiseStep` |
| 2026-08-20 | Migrated all remaining components off `src/data/srd.ts` to `src/lib/srd-client.ts` static data accessors; lint and typecheck pass |
| 2026-08-23 | Fixed Barbarian level progression bug: Feral Instinct moved from level 6 to level 7; ASI remains at level 8 |
| 2026-08-23 | Added `subclassInfo` section type to `generateLevelUpSteps`; selected subclass now displays on every level-up step for classes that have subclasses |
| 2026-08-23 | Updated `LevelUpFlow`, `level-up/page`, and `PerLevelStepsFlow` with `SubclassInfoStep` read-only components; lint and typecheck pass |
| 2026-08-23 | Refreshed subclass data from D&D 5e API: updated `2014_subclasses.json` and embedded subclass features in `2014_classes.json` for 12 API-available subclasses; preserved static-only subclasses (Totem Warrior) |
| 2026-08-23 | Comprehensive character sheet restyle: updated globals.css to near-black theme (#0a0a0a, #141414, #2a2a2a), changed tab labels to Combat/Spells/Abilities/Character, restyled all 14 section components with red/burgundy accents, dark cards, clean stat blocks, red section headers, and subtle borders; lint and typecheck pass |
| 2026-08-23 | Redesigned character sheet: added tabbed layout (Combat/Character/Gear/Bio), View/Edit mode toggle, standardized description typography, separated attack damage display with info tooltips, removed floating dot nav; all 14 sections updated with editMode prop; lint and typecheck pass |
| 2026-08-23 | Restructured character sheet tabs: Combat/Features/Gear/Bio; removed character name from AppHeader; moved Skills/FeaturesTraits/OtherProficiencies to Features tab, Inventory/Spells to Gear tab, Identity/LevelXp/AppearanceBio to Bio tab; lint and typecheck pass |
| 2026-08-23 | Added dedicated Spells tab (Combat/Features/Gear/Spells/Bio); SpellsSection now always renders without collapse toggle; SpellcastingStatsSection moved to Spells tab; AttacksAndSpellcastingSection now shows ability modifier source (DEX/STR) inline on each attack instead of only in tooltip; lint and typecheck pass |
| 2026-08-23 | Restored section titles in SectionCard; CombatStatsSection redesigned: AC and Speed displayed side-by-side as stat badges, HP shown as red progress bar with current/max values, Temp HP shown as white bar; Speed uses new circular SpeedStat with shoe icon; edit mode exposes inline inputs for all values; lint and typecheck pass |
| 2026-08-23 | Removed duplicate weapon attack description from AttacksAndSpellcastingSection; InventorySection weapon stats now include ability modifier source (STR/DEX) in the inline stats line; SpellsSection now shows spellcasting ability modifier badge next to each spell in view mode; lint and typecheck pass |
| 2026-08-23 | Rebuilt character creation and level-up systems from scratch with new subclass UX: deleted old creator/level-up components and created new streamlined flow (Identity/Race/Class/Subclass/Abilities/Skills/Equipment/Spells/Appearance); updated SRD JSON with complete D&D 5e API data (12 classes, 319 spells, 9 races, 37 weapons, 13 armors, 237 equipment items, 549 total items); added contextual hints to every creation step; lint and typecheck pass |
| 2026-08-23 | Added descriptions for all inventory items: Shield now has proper static description in `2014_armor.json`; `InventorySection.getItemDescription` now generates fallback descriptions for weapons (to hit + damage + modifier), armor (AC value), and generic items when no static description exists; lint and typecheck pass |
| 2026-08-23 | Improved subclass UX across creation and level-up: StepCard now supports `hint` prop for new-player guidance; all 9 creation steps have contextual hints; StepClass shows subclass availability and level; subclass selection step shows features inline with each option and clear descriptions; feature choices (e.g., Barbarian Totem) are always visible and selectable; lint and typecheck pass |
| 2026-08-23 | Comprehensive SRD data refresh from D&D 5e API: created `fetch_srd_data.js` to fetch and transform all data; updated `2014_classes.json` (12 classes with full 20-level features, spell slots, subclasses), `2014_subclasses.json` (12 subclasses with full features), `2014_races.json` (9 races with trait descriptions), `2014_spells.json` (319 spells, new file), `2014_items.json` (549 items: 187 equipment + 362 magic items), `2014_equipments.json` (237 items), `2014_weapon.json` (37 weapons), `2014_armor.json` (13 armors); fixed `srd-client.ts` type issues (`description?: string | string[]`, `Record<string, number>`, `as unknown as` cast); lint and typecheck pass |
| 2026-08-24 | Added all PHB subclasses (28 new) to `2014_subclasses.json` and updated class arrays; added `choices` data to class features (Fighting Style, Expertise, Eldritch Invocations, Favored Enemy, Natural Explorer); created `StepFeatureSelections.tsx` and integrated feature-selection steps into creation wizard; fixed nested StepCard visual bug in creation page; added `featureSelections` field to Character type; lint and typecheck pass |
| 2026-08-24 | Rewrote StepEquipment with actual selection UI: equipment choices now show as radio-button style selection groups; descriptions are parsed to detect weapon types ("martial weapon", "simple weapon", etc.) and flag them as `weapon_choice` in srd.json; when rendering such an option, shows a tappable "Choose a X weapon →" label that opens a filtered weapon selection popup; popup shows each weapon's name, damage dice, damage type, and properties; once selected, weapon is added to pending equipment with correct damageDice/damageType for Attacks & Spellcasting section; updated srd.json startingEquipment for Fighter, Paladin, Barbarian, Cleric, Ranger, Bard, Druid, Monk, Sorcerer, Warlock with proper weapon_choice flags; lint and typecheck pass |
| 2026-08-24 | Added `StepLevel.tsx` with +/- level selector (1-20) showing baseline HP; subclass step now only appears when `character.level >= subclassLevel`; feature selection steps now only appear for features available at the selected level; subclass is cleared when level drops below threshold; lint and typecheck pass |
| 2026-08-24 | Rewrote StepEquipment: removed pending selection state (`selectedChoices`/`selectedWeaponData`), clicks now immediately add items to inventory; replaced weapon popup with inline expandable weapon list; all equipment options show info (damage dice, AC, properties) even when unselected; granted items auto-added with `isGranted: true` and excluded from choice groups; fixed double-selection bug by removing previous group selection before adding new one; Current Inventory shows GRANTED badge; InventorySection dropdown now populates `description` field; lint and typecheck pass |
| 2026-08-24 | Updated StepEquipment to show complete item information for all types: weapons display damage dice, damage type, properties, and category; armor displays AC, max Dex bonus, armor type, and description; regular items display their static descriptions from SRD data; `getItemInfo` now uses `getEquipmentData` to fetch descriptions for adventuring gear; added `renderItemInfo` helper for consistent info rendering across selected options, unselected options, and Current Inventory; lint and typecheck pass |
| 2026-08-24 | Added SUBCLASS SELECTION as the FINAL conditional step in the creation wizard, isolated from Level Up. `getCreationSteps` now appends the subclass step LAST, gated by a single static check `character.level >= classData.subclassLevel`. `StepSubclass.tsx` redesigned with Part 1 (read-only "Your [Class] Features So Far" from `character.features`, locked/default tags) and Part 2 ("Choose Your Path" selectable subclass cards with full starting feature lists). `srd-client.ts` gained `getStaticSubclasses(className)` reading `2014_subclasses.json`. `character-creation.ts` gained `syncBaseFeatures` (keeps class/race features as locked defaults, drops subclass when level < unlock) and `applySubclassFeatures` (adds selected subclass starting features as locked defaults on finalize). `create/page.tsx` wraps `update` with `syncBaseFeatures`. lint and typecheck pass |

- [x] Comprehensive SRD data refresh from D&D 5e API
- [x] Fixed TypeScript type issues in srd-client.ts for JSON imports
- [x] All typechecks pass
- [x] Added all PHB subclasses to `2014_subclasses.json` (28 new subclasses: Totem Warrior, Valor, Knowledge, Light, Nature, Tempest, Trickery, War, Moon, Battle Master, Eldritch Knight, Shadow, Four Elements, Ancients, Vengeance, Beast Master, Assassin, Arcane Trickster, Wild Magic, Great Old One, Undying, Abjuration, Conjuration, Divination, Enchantment, Illusion, Necromancy, Transmutation)
- [x] Updated `2014_classes.json` subclass arrays to include all PHB subclasses
- [x] Added `choices` data to class features requiring selection (Fighting Style, Expertise, Eldritch Invocations, Favored Enemy, Natural Explorer) via `scripts/add-feature-choices.js`
- [x] Added `featureSelections: Record<string, string[]>` to Character type in `storage.ts`
- [x] Added `getFeatureSelections()` to `character-creation.ts` to extract selection steps from SRD class features
- [x] Added `feature-selections` step type to `CreationStep` union
- [x] Created `StepFeatureSelections.tsx` component to render feature selection UI with multi-select support
- [x] Fixed nested StepCard visual bug in creation page by removing outer wrapper (step components already render their own StepCard)
- [x] Creation wizard now generates dynamic feature-selection steps after base steps when class has choice features; lint and typecheck pass
| 2026-08-24 | Extended subclass progression in creation wizard: `applySubclassFeatures` and `isSubclassStepComplete` (and the StepSubclass UI) now cover every subclass feature earned from the unlock level up through the character's current level (verified through level 10+), not just the unlock-level feature. Added `getEarnedSubclassFeatures` helper; choice features at each earned level require selection. lint and typecheck pass |
| 2026-08-24 | Restructured StepSubclass (creation wizard) "Choose Your Path" section into per-level pill tabs: one pill per level that grants subclass features, content shown/hidden per active tab, with Back/Next buttons to move between levels. Tabs are rendered (disabled) until a subclass is chosen; choice-selection UI lives inside each level's tab. Nested-button issue fixed by moving feature/choice rendering out of the subclass selection cards. lint/typecheck/build pass |
| 2026-08-25 | Redesigned app to minimalist light theme based on screenshot reference: switched from dark theme to light paper/ink palette with thin 1px borders, reduced visual weight, flat design; updated globals.css with new design tokens (paper, ink, border-muted), simplified all components (AppHeader, BottomNav, SectionCard, SheetTabs, SectionNav, StatsSection, CombatStatsSection, SkillsSection, IdentitySection, styled components, LevelUpWizard, WizardNav, ProgressIndicator, StepCard, ViewEditToggle, StickyMiniHeader, home page, character view, character create); typecheck and lint pass |
| 2026-08-26 | Removed Dice Roller button from home page (`src/app/page.tsx`); removed `Dices` icon import; lint and typecheck pass |
| 2026-08-26 | Changed default font color to pure black everywhere: updated `--color-ink` from `#171717` to `#000000` in globals.css and replaced all hardcoded `#171717` text color values with `#000000`; typecheck and lint pass |
| 2026-08-29 | Implemented full variant human mechanism: added FeatPopup component for character sheet, updated FeaturesTraitsSection to show feat details on click, added ability score + skill proficiency selection to variant human UI in StepOrigin, added variantHumanAbilities/variantHumanSkill fields to Character type, updated character-creation.ts to apply bonuses during finalization, updated validation to require all selections; typecheck and build pass |
| 2026-08-30 | Added spell effects for all self-targeting spells: expanded `BUFF_DEFINITIONS` in `spellEffects.ts` from 20 to 89 entries covering all self-range spells with mechanical effects (AC bonuses, temp HP, speed, resistances, advantage/disadvantage, damage bonuses); added `getBuffsByClass()` and `getAllBuffs()` helper functions; updated `SpellsSection.tsx` with buff toggle buttons per spell; updated `BuffTracker.tsx` to show effect descriptions on hover and support class filtering; updated `CombatStatsSection.tsx` to pass class filter to BuffTracker; typecheck and build pass |
| 2026-08-31 | Comprehensive description update for all game data: updated spell descriptions (316 from Open5E SRD, 88 retain D&D 5e API text), class descriptions (12 classes from Open5E), race trait descriptions (21 traits from Open5E), weapon descriptions (37 weapons from Open5E), subclass descriptions (30 subclasses from D&D 5e API + curated), and feature descriptions (387 features from D&D 5e API); created update scripts in `scripts/` directory; lint and typecheck pass |
| 2026-08-31 | Fixed srd.ts equipment descriptions: updated the `equipment` array in `src/data/srd.ts` to match the Open5E descriptions from `2014_weapon.json`. This array is used as a fallback in `getEquipmentData()` in `srd-client.ts` and was still showing old placeholder descriptions (e.g. "A martial weapon favored by rogues" instead of the full Open5E description); typecheck pass |
| 2026-08-31 | Updated ALL item descriptions in srd.ts: updated the equipment array (13 weapons, 3 armors, 10 items) and all starting equipment items for Fighter, Wizard, Rogue, and Warlock to match Open5E SRD descriptions from JSON files; typecheck pass |
| 2026-08-31 | Added inline badges to item descriptions: created DiceBadge component, updated InfoButton/DescriptionModal/DescriptionText to parse [dice] and [damage] markup tags, updated weapon descriptions in srd.ts to include inline dice and damage type badges (e.g. [dice]1d8[/dice] [damage]piercing[/damage]), updated pack descriptions with detailed contents; typecheck pass |
| 2026-08-31 | Added sourcebook tagging system: added `source` field to all JSON data files (subclasses, races, spells, weapons, armors, items, equipments, feats), created `SourceBadge.tsx` component with color-coded badges for PHB/SCAG/XGE/TCE/MTF/EGW/FTD/VRGR, updated `srd-client.ts` with optional `sources` parameter on all getter functions for filtering, added `getAvailableSources()` helper; typecheck and build pass |
| 2026-08-31 | Added sourcebook selection step to character creation wizard: created `StepSourceSelection.tsx` component with checkboxes for PHB/SCAG/XGE/TCE/MTF/EGW/FTD/VRGR, added `sources` field to Character type, updated all `getStaticSubclasses` calls to filter by selected sources, PHB is always included and cannot be unchecked; typecheck and build pass |
| 2026-08-31 | Added XGE (Xanathar's Guide to Everything) content: 32 subclasses (Ancestral Guardian, Storm Herald, Zealot, College of Glamour/Swords/Whispers, Forge/Grave Domain, Circle of Dreams/Shepherd, Arcane Archer/Cavalier/Samurai, Drunken Master/Kensei/Sun Soul, Oath of Conquest/Redemption/Watchers, Horizon Walker/Monster Slayer, Inquisitive/Mastermind/Scout/Swashbuckler, Divine Soul/Shadow Magic/Storm Sorcery, The Celestial, Bladesinging/War Magic), 39 spells (Tasha's Hideous Laughter, Dragon's Breath, Storm Sphere, etc.), 17 feats (Bountiful Luck, Dragon Fear, Dragon Hide, Drow High Magic, Dwarven Fortitude, Elven Accuracy, Fade Away, Fey Teleportation, Flames of Phlegethos, Infernal Constitution, Orcish Fury, Prodigy, Second Chance, Squat Nimbleness, Crusher, Fell Thrower, Wood Elf Magic); also added 8 TCE subclasses (Fey Wanderer, Swarmkeeper, Aberrant Mind, Clockwork Magic, The Genie, The Fathomless, Chronurgy Magic, Graviturgy Magic, Order of Scribes); updated classes.json to include all new subclasses in class arrays; typecheck and build pass |
| 2026-08-31 | Added TCE (Tasha's Cauldron of Everything) spells and feats: 24 spells (Blade Bite, Booster Pulse, Dream of the Blue Veil, Druid Grove, Gravity Shift, Intellect Fortress, Otherworldly Form, Power Word Pain, Psychic Scream, Pulse Wave, Sapping Sting, Spirit Shroud, Summon Aberration, Summon Beast, Summon Celestial, Summon Construct, Summon Elemental, Summon Fey, Summon Fiend, Summon Shadowspawn, Summon Undead, Time Slipp, Touch of the Void, Void Writing), 31 feats (Fey Touched, Shadow Touched, Eldritch Adept, Metamagic Adept, Fighting Initiate, Piercer, Crusher, Slasher, Skill Expert, Alert, Weapon Master, Moderately Armored, Heavily Armored, Lightly Armored, Shield Master, Medium Armor Master, Defensive Duelist, Dragon Hide, Fade Away, Fey Teleportation, Flames of Phlegethos, Orcish Fury, Second Chance, Squat Nimbleness, Bountiful Luck, Drow High Magic, Dwarven Fortitude, Elven Accuracy, Dragon Fear, Infernal Constitution, Prodigy); typecheck and build pass |
| 2026-08-31 | Integrated TCE content into website: added 19 TCE wizard spells to 2014_wizard_spells.json (total 223 wizard spells), updated getStaticWizardSpells() and getWizardSpellsByLevel() to accept sources parameter for filtering, passed character.sources to getWizardSpellsByLevel() in LevelUpWizard.tsx (Spell Mastery and Signature Spells), passed data.sources to FeatSelector in StepRace.tsx and StepLevel.tsx for TCE feat selection; typecheck and build pass |
| 2026-08-31 | Added MTF (Mordenkainen's Tome of Foes) content: 14 feats (Aberrant Dragonmark, Critter, Infernal Constitution, Orcish Fury, Second Chance, Squat Nimbleness, Bountiful Luck, Drow High Magic, Dwarven Fortitude, Elven Accuracy, Fade Away, Fey Teleportation, Flames of Phlegethos, Prodigy), 3 races (Eladrin Elf, Githyanki, Githzerai), 1 subclass (Oath of Redemption Paladin). Updated LevelUpWizard to pass character.sources to getStaticSpells() and getSubclassFlagsByName() for proper source filtering. Removed incorrectly attributed Dream of the Blue Veil from MTF (it's TCE). Totals: 475 spells, 113 feats (14 MTF), 13 races (3 MTF), 83 subclasses (1 MTF); typecheck and build pass |
| 2026-08-31 | Added SourceBadge to all content displays: spells (already done), feats (FeaturesTraitsSection, FeatPopup), races (StepRace, StepOrigin, IdentitySection), subclasses (FeaturesTraitsSection header), spell selections (StepFeatureSelections). Badges show for non-PHB sources (SCAG, XGE, TCE, etc.) with color-coded backgrounds. Updated ViewField component to support badge prop; typecheck and build pass |
| 2026-08-31 | Added EGW (Explorer's Guide to Wildemount) content: 18 spells, 14 feats, 11 races (Bugbear, Changeling, Firbolg, Goblin, Hobgoblin, Kenku, Lizardfolk, Orc, Shifter, Tabaxi, Triton), 1 subclass (Echo Knight Fighter). Added 4 EGW wizard spells to wizard spell list (total 231). Echo Knight linked in classes.json. Totals: 493 spells (18 EGW), 127 feats (14 EGW), 24 races (11 EGW), 84 subclasses (1 EGW); typecheck and build pass |
| 2026-08-31 | Added FTD (Fizban's Treasury of Dragons) and VRGR (Van Richten's Guide to Ravenloft) content. FTD: 10 spells, 3 feats, 3 races (Dragonborn Gem/Metallic/Chromatic), 3 subclasses (Draconic Disciple, Drake Warden, Ascendant Dragon). VRGR: 8 spells, 15 feats, 3 races (Dhampir, Hexblood, Reborn), 2 subclasses (The Undead, College of Spirits). Added 9 FTD wizard spells (total 240). All subclasses linked in classes.json; typecheck and build pass |
| 2026-09-01 | Fixed Artificer equipment selection: `buildChoiceGroups` in `character-creation.ts` now checks for `isWeaponChoice`/`isInstrumentChoice`/`isArcaneFocusChoice`/`isHolySymbolChoice`/`isDruidicFocusChoice` flags directly on starting equipment entries, creating proper choice options without requiring `(a)`/`(b)` markers or "or" in the description. This enables the "any two simple weapons" option for Artificer to render with a weapon selection popup; typecheck and build pass |
| 2026-09-01 | Source badge positioning and class filtering: moved SourceBadge to right corner of race/class selection cards in `StepOrigin.tsx` and `StepRace.tsx`; added `source` field to `SRDClass` interface; `getStaticClasses()` now accepts optional `sources` parameter for filtering; `StepOrigin` passes `data.sources` to `getStaticClasses` so unchecking an extension filters out non-PHB classes; typecheck and build pass |

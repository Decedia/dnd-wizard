# Active Context: DND Wizard

## Current State

**App Status**: ✅ Character sheet screen complete

The character sheet screen is built with all 7 sections, sticky mini-header, floating vertical section navigation with scroll-spy, auto-save on blur (debounced), and manual save with confirmation.

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

Character sheet is complete. Next steps:

1. Implement step-by-step Character Creator flow (`/character/new`)
2. Add PDF export/import
3. Wire in real SRD race/class/spell data
4. Add character deletion from home screen

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

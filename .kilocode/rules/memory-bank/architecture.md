# Architecture: D&D 5e Character Manager

## Overview

Mobile-first PWA for managing D&D 5e characters. Built with Next.js 16 App Router, React 19, TypeScript, and Tailwind CSS v4. Data is bundled as static JSON (~45k lines) with Dexie/IndexedDB for persistence. No backend required — fully client-side.

## Layered Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Pages (src/app/) — route handlers + page orchestrators         │
│  • Home, Create, Sheet, Level-Up, Dice, Tasks                  │
│  • Manage character state, wire sections together               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ props + callbacks
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Components (src/components/)                                   │
│  • character-sheet/ — 14 sections (Combat/Features/Gear/Spells/Bio) │
│  • character-creator/ — 9 wizard steps                          │
│  • LevelUpWizard.tsx — 2898 lines, dual-use (creation + level-up) │
│  • Shared: InfoButton, SourceBadge, Dice, WizardNav, AppHeader  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ useSRD(), useCharacterSheet()
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Contexts (src/contexts/)                                       │
│  • SRDContext — async data loading + caching                    │
│  • ThemeContext — light/dark mode                               │
│  • CharacterSheetContext — edit mode, description toggle        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Lib / Business Logic (src/lib/)                                │
│  • storage.ts — Character type (130+ fields), CRUD, derived stats│
│  • srd-client.ts — 30+ static data accessors + caching          │
│  • character-creation.ts — wizard steps, finalize, sync         │
│  • level-up.tsx — generateLevelUpSteps                         │
│  • spellEffects.ts — 89 BUFF_DEFINITIONS, computeBuffModifiers  │
│  • db.ts — Dexie IndexedDB wrapper                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  Data (src/data/) — 17 JSON/TS files, build-time imports        │
│  Races, classes, subclasses, spells, equipment, feats, etc.     │
└─────────────────────────────────────────────────────────────────┘
```

## Key Design Patterns

### 1. Character Sheet Sections

Each section is a `"use client"` component with the signature:
```ts
function Section({ character, onChange, editMode }: SectionProps)
```

Sections receive the full `character` object and an `onChange` patch function. They call `onChange({ ...partial })` to update state, which triggers:
1. React re-render
2. `computeDerivedStats()` via `useMemo`
3. Debounced `saveCharacter()` (400ms) to IndexedDB

### 2. Tabbed Navigation

`SheetTabs` controls which sections are visible via `activeTab` state in the sheet page. Five tabs:
- Combat: Stats, CombatStats, PassiveStats, DeathSaves, HitDice, Attacks
- Features: Skills, FeaturesTraits, OtherProficiencies
- Gear: Inventory, Currency
- Spells: Spells, SpellcastingStats
- Bio: Identity, LevelXp, AppearanceBio

### 3. View/Edit Mode

Every section conditionally renders inputs vs static text based on `editMode`. Toggled via `ViewEditToggle` in `AppHeader`. Edit mode exposes inline inputs, action buttons, and delete controls.

### 4. Wizard Flow (Character Creation)

`getCreationSteps(character)` dynamically builds the step list based on current character state. Steps include conditional feature-selection steps for classes with choice features (Fighting Style, Expertise, etc.). The "Level" step delegates to `LevelUpWizard` with `startFromLevelOne={true}`.

### 5. Level Up Wizard

`LevelUpWizard.tsx` is a 2898-line component used both inline (during creation) and standalone (`/character/[id]/level-up`). It generates per-level step info via `buildLevelInfos()`, renders a `LevelCard` per level, and on completion applies all selections to the character.

### 6. Spell & Buff System

- Spells stored as `{ id, name, level, source, srdSpellName, damageDice, damageType, description }`
- `BUFF_DEFINITIONS` maps 89 spells to mechanical effects (AC bonus, temp HP, speed, resistances, etc.)
- `computeBuffModifiers()` aggregates all active buffs into a single `BuffModifiers` object
- `toggleSpellUsed()` adds/removes from `spellsUsedThisTurn` and creates/removes `ActiveBuff` entries
- `advanceTurn()` decrements `turnsRemaining`, removes expired buffs

### 7. Condition Parsing

`computeDerivedStats()` interprets `activeStates` strings to apply mechanical effects:
- Cover: half (+2), three-quarters (+5), total (+5)
- Exhaustion: parsed from `"exhaustion N"` strings (levels 1–6)
- Other: prone, poisoned, restrained, paralyzed, etc.

### 8. Sourcebook Filtering

All SRD data accessors accept an optional `sources` parameter. Characters store a `sources: string[]` field. During creation, `StepSourceSelection` lets users pick sourcebooks (PHB always included). All subsequent data lookups filter by `character.sources`.

### 9. Auto-Save & Backup

- `saveCharacter()` tries Dexie first, falls back to localStorage
- Debounced at 400ms via `onFieldBlur` trigger
- Auto-backup every 24h triggers JSON download
- `normalizeCharacter()` merges legacy saves against current defaults

### 10. PDF Export

`CharacterSheetPrint.tsx` renders a fixed-width (710px), 3-page PDF layout using inline styles. Pages: (1) Combat + Abilities, (2) Attacks + Features + Inventory, (3) Spellcasting + Spells + Bio.

## Component Conventions

- **Imports**: `@/components/...`, `@/lib/...`, `@/contexts/...`
- **Icons**: Imported from `@/components/icons` with descriptive aliases
- **Styling**: Mix of Tailwind utilities + component classes (`.card`, `.btn`, `.input`)
- **Theme tokens**: `bg-paper`, `text-ink`, `border-border`, `text-text-primary`, etc.
- **Modals**: Fixed overlay `z-[9999]`, `bg-[var(--color-overlay)]`, centered card with close button
- **Conditional rendering**: `editMode && <button>...</button>` pattern for edit-only controls

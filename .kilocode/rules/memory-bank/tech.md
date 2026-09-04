# Technical Context: D&D 5e Character Manager

## Technology Stack

| Technology       | Version    | Purpose                                          |
| ---------------- | ---------- | ------------------------------------------------ |
| Next.js          | 16.2.6     | React framework with App Router                  |
| React            | 19.2.3     | UI library (client-rendered SPA)                 |
| TypeScript       | 5.9.3      | Type-safe JavaScript                             |
| Tailwind CSS     | 4.1.17     | Utility-first CSS with CSS-based `@theme` config |
| Dexie            | 4.4.5      | IndexedDB wrapper for local persistence          |
| @react-pdf/renderer | 4.9.0   | PDF generation                                   |
| jspdf            | 4.2.1      | PDF generation                                   |
| html2canvas      | 1.4.1      | HTML-to-image for PDF export                     |
| next-pwa         | 5.6.0      | PWA / service worker                             |
| react-icons      | 5.7.0      | Icon library (Heroicons + Game Icons)            |
| Bun              | Latest     | Package manager & runtime                        |

## Development Environment

### Commands

```bash
bun install        # Install dependencies
bun dev            # Start dev server
bun build          # Production build
bun start          # Start production server
bun lint           # Run ESLint
bun typecheck      # Run TypeScript type checking
```

### Key Configuration Files

| File                  | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `next.config.ts`      | Next.js + PWA wrapper; runtime caching for `/data/*` |
| `tsconfig.json`       | Strict TS; path alias `@/*` → `src/*`                |
| `postcss.config.mjs`  | Tailwind v4 PostCSS plugin                           |
| `eslint.config.mjs`   | ESLint flat config extending `eslint-config-next`    |
| `src/app/globals.css` | Tailwind `@theme` tokens + component classes         |

## Architecture

### App Structure

- **Framework**: Next.js 16 App Router, predominantly client-rendered (`"use client"`)
- **State**: React Context (SRD data, theme, sheet settings) + local `useState`; no external state library
- **Styling**: Tailwind CSS v4 with CSS-based design tokens; light/dark mode via `[data-theme="dark"]`
- **Persistence**: Dexie (IndexedDB `dnd-wizard-db`) primary, localStorage fallback; 400ms debounced auto-save; 24h auto-backup

### Routes

| Path                          | Purpose                              |
| ----------------------------- | ------------------------------------ |
| `/`                           | Home — character list with import/export |
| `/character/new`              | Auto-creates empty character, redirects |
| `/character/create`           | Character creation wizard (multi-step) |
| `/character/[id]`             | Character sheet view/edit with tabs   |
| `/character/[id]/level-up`    | Level-up wizard (levels 1–20)        |
| `/dice`                       | Dice roller                          |
| `/tasks`                      | Task management UI                   |
| `/api/srd`                    | Server API route for SRD data fetch  |

### Data Layer

- **Static SRD data**: 17 JSON/TS files in `src/data/` (~45k lines) — races, classes, subclasses, spells, equipment, feats, backgrounds, invocations
- **SRD client**: `src/lib/srd-client.ts` — 30+ accessor functions with memory + localStorage caching (5min TTL)
- **Character model**: 130+ field `Character` interface in `src/lib/storage.ts`
- **Derived stats**: `computeDerivedStats()` computes AC, speed, initiative, saves, spell DCs, class resources, cover/exhaustion/grapple/shove
- **Spell effects**: `src/lib/spellEffects.ts` — 89 `BUFF_DEFINITIONS` with `computeBuffModifiers()` aggregation and turn-based duration tracking

### Key Libraries

- **dexie**: IndexedDB wrapper for character persistence
- **@react-pdf/renderer + jspdf + html2canvas**: PDF export/import round-trip
- **next-pwa**: Service worker with offline caching of SRD data and app shell
- **react-icons**: Heroicons v2 (58) + Game Icons (80+) for D&D-themed UI

## File Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout (SRDProvider, ThemeProvider, BottomNav)
│   ├── page.tsx                # Home — character list
│   ├── globals.css             # Tailwind @theme tokens + component classes
│   ├── character/
│   │   ├── create/page.tsx     # Character creation wizard
│   │   ├── new/page.tsx        # New character redirect
│   │   └── [id]/
│   │       ├── page.tsx        # Character sheet (14 sections, 5 tabs)
│   │       └── level-up/page.tsx # Level-up wizard
│   ├── dice/page.tsx           # Dice roller
│   └── tasks/                  # Task management
├── components/
│   ├── character-creator/      # 9 creation wizard steps
│   ├── character-sheet/        # 14 sheet sections + styled components
│   ├── LevelUpWizard.tsx       # Level-up wizard (2898 lines)
│   ├── InfoButton.tsx          # Description modal
│   ├── SourceBadge.tsx         # Sourcebook color-coded badges
│   ├── Dice.tsx                # Animated 3D dice roller
│   └── icons.ts                # Icon aliases (Heroicons + Game Icons)
├── contexts/
│   ├── SRDContext.tsx          # SRD data loading/caching
│   └── ThemeContext.tsx        # Light/dark theme toggle
├── data/
│   ├── 2014_races.json         # 24 races
│   ├── 2014_classes.json       # 12 classes with 20-level progression
│   ├── 2014_subclasses.json    # 82 subclasses
│   ├── 2014_spells.json        # 475+ spells
│   ├── 2014_wizard_spells.json # 240+ wizard spells
│   ├── 2014_arcane_trickster_spells.json
│   ├── 2014_weapon.json        # 37 weapons
│   ├── 2014_armor.json         # 13 armors
│   ├── 2014_equipments.json    # 237 equipment items
│   ├── 2014_items.json         # 549 items
│   ├── 2014_feats.json         # 127 feats
│   ├── subclass_spells.json    # Domain/circle/oath/wizard spell grants
│   ├── subclass_feature_choices.json
│   ├── spell_categorization.json
│   ├── warlock_invocations.json
│   └── backgrounds.ts          # 9 PHB backgrounds
├── lib/
│   ├── storage.ts              # Character type, helpers, CRUD, derived stats
│   ├── srd-client.ts           # Static data accessors + caching
│   ├── character-creation.ts   # Wizard logic, finalize, sync features
│   ├── level-up.tsx            # Level-up step generation
│   ├── spellEffects.ts         # Buff definitions + computation
│   └── db.ts                   # Dexie database wrapper
└── hooks/
```

## Technical Constraints

- Mobile-first design (`max-w-lg` container, bottom nav, touch-friendly controls)
- PWA support with offline caching
- No external state management library (Zustand, Redux, etc.)
- Server Components not heavily used; predominantly client-rendered
- TypeScript strict mode enabled

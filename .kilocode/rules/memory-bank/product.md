# Product Context: D&D 5e Character Manager

## Why This App Exists

D&D 5e players need a digital character sheet that works offline on mobile, supports all official content, and handles the complexity of character creation, level progression, and combat tracking. Paper sheets are fragile, digital alternatives are often class-specific or require subscriptions, and existing apps lack deep SRD integration or offline capability.

## Problems It Solves

1. **Character Creation Complexity**: Guided wizard handles all 12 classes with dynamic steps, feature choices, equipment groups, and subclass selection
2. **Level-Up Bookkeeping**: Per-level progression through level 20 with HP, ASI, subclass features, spell slots, and class-specific resources
3. **Combat Tracking**: Action/bonus/reaction toggles, HP management, concentration checks, exhaustion, cover, and active buffs
4. **Spell Management**: Spell selection, preparation tracking, usage per turn, concentration tracking, and 89 predefined mechanical buff effects
5. **Offline Play**: PWA with service worker caches all SRD data and app shell; works without internet
6. **Sourcebook Flexibility**: Choose which sourcebooks to include (PHB, XGE, TCE, MTF, EGW, FTD, VRGR)
7. **Data Portability**: JSON export/import and PDF export/import round-trip

## How It Works (User Flow)

1. **Home**: Browse saved characters, create new, import from JSON/PDF
2. **Create**: 9-step wizard (Source → Origin → Abilities → Features → Skills → Equipment → Appearance → Personality → Level)
3. **Level Up**: Select target level, roll/assign HP, make ASI/feat choices, select spells, unlock subclass features
4. **Play**: View/edit character sheet across 5 tabs (Combat, Features, Gear, Spells, Bio); toggle actions, track HP/buffs, mark spells used
5. **End Turn**: Reset spell/feature usage, advance buff durations
6. **Export**: Generate PDF or JSON for sharing/backup

## Key User Experience Goals

- **Mobile-First**: `max-w-lg` layout, bottom navigation, touch-friendly controls
- **Offline-Ready**: All SRD data bundled; IndexedDB persistence with auto-save
- **Fast Character Creation**: Dynamic wizard steps, auto-filled features, locked defaults for race/class traits
- **Deep Rules Support**: Cover, exhaustion, grapple/shove, concentration checks, spell buffs with mechanical effects
- **Visual Clarity**: Light paper/ink theme with thin borders, sourcebook badges, damage-type colors, state indicators
- **Quick Access**: Sticky header with view/edit toggle, tab bar, floating section navigation

## What This App Provides

1. **Full SRD Integration**: 475+ spells, 82 subclasses, 37 weapons, 13 armors, 549 items, 127 feats, 24 races, 12 classes
2. **Character Creation Wizard**: 9 dynamic steps with conditional feature selections, equipment choice groups, and level progression
3. **Level-Up Wizard**: Levels 1–20 with HP, ASI, subclass, spells, invocations, pact boons, Magical Secrets
4. **Editable Character Sheet**: 14 sections across 5 tabs with view/edit modes
5. **Combat Tracking**: Actions, HP, exhaustion, cover, concentration, active states, buffs
6. **Spell System**: 89 buff definitions with AC/speed/resistance/damage effects; turn-based duration tracking
7. **PDF Export**: 3-page fixed-width layout for print/sharing
8. **Dice Roller**: Animated 3D dice with advantage/disadvantage
9. **Sourcebook Filtering**: Toggle PHB, SCAG, XGE, TCE, MTF, EGW, FTD, VRGR
10. **PWA**: Offline caching, install prompt, auto-backup every 24h

## Integration Points

- **Persistence**: Dexie/IndexedDB primary, localStorage fallback
- **PDF**: @react-pdf/renderer + jspdf + html2canvas
- **PWA**: next-pwa + Workbox
- **Data**: Static JSON imports with runtime caching
- **AI Context**: Memory bank in `.kilocode/rules/memory-bank/`

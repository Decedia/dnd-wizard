# Project Brief: D&D 5e Character Manager

## Purpose

A mobile-first D&D 5e character manager PWA. Enables players to create, edit, and track D&D 5e characters with full rules support, combat tracking, spell management, and level-up progression. Works offline as a PWA.

## Target Users

- D&D 5e players and DMs who want a digital character sheet
- Users who want sourcebook-flexible character management (PHB, XGE, TCE, etc.)
- Mobile-first users who need offline access

## Core Use Cases

1. **Character Creation**: Multi-step wizard (origin → abilities → skills → equipment → appearance → level) with dynamic steps based on class/race
2. **Character Sheet**: 14-section editable sheet across 5 tabs (Combat, Features, Gear, Spells, Bio) with view/edit modes
3. **Level Up**: Wizard supporting levels 1–20 with HP rolling, ASI, subclass selection, spell selection, and class-specific features
4. **Combat Tracking**: Action/bonus/reaction toggles, HP/damage/healing, concentration checks, exhaustion, cover, active states and buffs
5. **Spell Management**: Spell selection, preparation tracking, usage per turn, concentration tracking, duration countdown, 89 predefined buff effects
6. **PDF Export/Import**: 3-page character sheet PDF generation and import
7. **Dice Roller**: Animated 3D dice with advantage/disadvantage
8. **Sourcebook Filtering**: Choose which sourcebooks to include (PHB, SCAG, XGE, TCE, MTF, EGW, FTD, VRGR)

## Key Requirements

### Must Have

- Full D&D 5e SRD data bundled (races, classes, subclasses, spells, equipment, feats)
- Offline-first PWA with IndexedDB persistence
- Mobile-first responsive design (max-w-lg)
- Character creation wizard with dynamic steps
- Editable character sheet with 14 sections
- Level-up wizard (levels 1–20)
- Spell tracking with buff effects
- Combat state tracking (actions, exhaustion, cover, concentration)
- PDF export/import
- Light/dark theme

### Nice to Have

- Sourcebook filtering (implemented)
- Variant Human support (implemented)
- Subclass feature choices (implemented)
- Warlock invocations, pact boons (implemented)
- Bard Magical Secrets (implemented)
- Druid Circle terrain selection (implemented)
- Database persistence migration (recipe available)

## Success Metrics

- Complete D&D 5e character lifecycle (create → play → level up)
- All 12 classes, 82 subclasses, 475+ spells supported
- Offline functionality via PWA
- Clean TypeScript with passing lint/typecheck

## Constraints

- Framework: Next.js 16 + React 19 + TypeScript
- Styling: Tailwind CSS v4 with CSS-based theme tokens
- Package manager: Bun
- No backend required — fully client-side
- State: React Context + local state (no external state library)
- Persistence: Dexie/IndexedDB with localStorage fallback

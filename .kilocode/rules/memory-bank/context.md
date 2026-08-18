# Active Context: DND Wizard

## Current State

**App Status**: ✅ Foundation scaffold complete

The "DND Wizard" mobile-first D&D 5e character creator shell is in place with dark fantasy theme, persistent local storage, bottom navigation, and placeholder screens for the character creation flow.

## Recently Completed

- [x] Project scaffold with Next.js 16 + TypeScript + Tailwind CSS 4
- [x] Dark fantasy theme: deep charcoal background, parchment cards, burgundy accent, gold highlights
- [x] Custom typography: Cinzel (display/title), Geist (body)
- [x] Floating bottom navigation (pill shape, dragon icon hero button for New Character)
- [x] Home screen with "My Characters" list and empty state
- [x] Character Creation placeholder (`/character/new`)
- [x] Character View placeholder (`/character/[id]`)
- [x] Local storage utilities for character persistence
- [x] Mobile-first layout with max-width container, large tap targets
- [x] Lint and typecheck passing
- [x] Production build verified

## Current Structure

| File/Directory | Purpose | Status |
|----------------|---------|--------|
| `src/app/globals.css` | Dark fantasy theme, custom colors, fonts | ✅ Ready |
| `src/app/layout.tsx` | Root layout with fonts + bottom nav | ✅ Ready |
| `src/app/page.tsx` | Home screen (My Characters list, empty state) | ✅ Ready |
| `src/app/character/new/page.tsx` | Character Creator placeholder | ✅ Ready |
| `src/app/character/[id]/page.tsx` | Character View placeholder | ✅ Ready |
| `src/components/BottomNav.tsx` | Floating bottom nav with dragon hero button | ✅ Ready |
| `src/components/AppHeader.tsx` | App header with dragon logo + title | ✅ Ready |
| `src/lib/storage.ts` | LocalStorage CRUD for characters | ✅ Ready |

## Current Focus

Foundation is complete. Next steps:

1. Implement race/class selection steps in `/character/new`
2. Build character sheet sections (ability scores, skills, equipment)
3. Add stat calculations and validation
4. Expand bottom nav or add character deletion

## Available Recipes

| Recipe | File | Use Case |
|--------|------|----------|
| Add Database | `.kilocode/recipes/add-database.md` | Data persistence with Drizzle + SQLite |

## Session History

| Date | Changes |
|------|---------|
| Initial | Template created with base setup |
| 2026-08-18 | Replaced nav demo with DND Wizard app scaffold |

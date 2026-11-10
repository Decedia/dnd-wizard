# Content & Data Rules

Read this **before** touching any user-facing text, SRD data, or a selection UI.
Every rule below is grounded in an existing file anchor — check the anchor before assuming.

---

## 1. Localization (Indonesian)

**The rule:** every user-facing string is localized. UI wrapper text is Indonesian; D&D
mechanical terms stay English.

| Goes in the data | Stays English |
| --- | --- |
| Labels, buttons, hints, empty states, guide text | Ability codes (`STR`, `DEX`) |
| Form field labels and placeholders | Skill names (`Athletics`, `Stealth`) |
| Validation and etiquette copy | Class / race / spell names |
| | Damage types (`fire`, `necrotic`) |

**How:**

- Call `t(key, params, fallback)` — **params second, fallback third**. Use its `{placeholder}`
  interpolation; never build a template with `.replace("{n}")`, which silently misses every
  other placeholder. Signature: `src/contexts/LanguageContext.tsx:12`.
- Add the key to **both** `src/locales/en.js` and `src/locales/id.js` in the same change.
  Keys are grouped by prefix (`feat.*`, `modal.*`, `creator.*`).
- Never mix languages inside one string, and never append an Indonesian fragment to English
  source data — that produces `"…at least one spell. Belum dipilih."`.

**Where content actually lives** — this repo splits it three ways, and putting text in the
wrong file is the most common miss:

| Kind of text | File |
| --- | --- |
| UI chrome, labels, buttons | `src/locales/en.js`, `src/locales/id.js` |
| SRD trait `description` / `summary` | `src/locales/srd-strings-en.json`, `srd-strings-id.json`, keyed `<dataset>.<id>.<field>` e.g. `2014_races.dwarf.darkvision.description` |
| Per-locale fields on races/classes (`flavor`) | The locale data files themselves: `src/data/en/…` and `src/data/id/…` |

**One flavor field only.** Races and classes carry a single `flavor`. Do not add `flavorText`
alongside it — two texts per entry reads as a bug and the old one translated badly.

---

## 2. Dice render inline

All rules text goes through `RichText` (blocks) or `RichInline` (one line, e.g. a clamped card
subtitle), both in `src/components/RichText.tsx`. Do not hand-write dice as plain text,
`<code>`, or bold.

- The matcher lives in `src/lib/rich-text.ts` (`DICE`, `TOKEN_RE`). Recognized shapes are
  `ndn` (`2d6`), `dn` (`d20`), a plural (`d10s`) and a flat modifier (`2d6 + 4`).
- To support a new shape, extend `DICE` — never add a second, ad-hoc regex.
- `src/tests/rich-text.test.ts` locks the behaviour; add a case when you extend a matcher.
- `src/components/character-sheet/DamageExtractor.tsx:14` has its own pattern and is
  **out of scope** — it feeds damage calculation, so changing it changes numbers, not looks.

---

## 3. Damage, saving throw and condition badges

Prose that mentions a damage type, a saving throw or a condition renders as a badge with an
icon. `RichText` already does this, so **the rule is simply to route text through it** — never
hand-write these as plain text or your own `<span>`.

| What is said | What happens |
| --- | --- |
| `fire damage`, `kerusakan api` | Damage badge, coloured by the damage type, with its icon |
| `fire or cold damage` | One badge per type |
| `Charisma saving throw(s)`, `saving throw Konstitusi` | Saving throw badge |
| `frightened`, `lumpuh`, any listed condition | Condition badge with its icon |
| `30 feet`, `1 minute`, `DC 15`, `bonus action`, `short rest` | Bold, no badge |
| `Charisma` or a skill name alone | Plain text |
| `fire` alone | Plain text — only `… damage` / `kerusakan …` is a badge |

English and Indonesian words are matched together, because the Indonesian data keeps many
terms in English. To add a term, extend the word maps in `src/lib/rich-text.ts`
(`DAMAGE_WORDS`, `ABILITY_WORDS`, `CONDITION_WORDS`, `TERMS`). Badge colours come from theme
tokens (`src/lib/damage-types.ts`); never use raw palette colours.

---

## 4. Bullets

- Use `- ` or `* ` for unordered and `1. `, `2. ` for ordered. **One item per line.**
  Parsed by `parseBlocks` in `src/lib/rich-text.ts`.
- A new line starts a new paragraph. Keep a bullet block homogeneous — do not mix `-` and
  `1.` markers inside one block.
- If content will be parsed, don't pre-wrap it in `<ul>`/`<ol>` — the renderers build the list.
- Provide a `summary` when you add a trait; `RaceInfoPanel` prefers it over the longer
  `description`.

---

## 5. Native elements & theme colors

- New selection UI uses **native** `<div>`, `<button>`, `<label>`, `<select>`, `<option>`,
  `<input>`. Do not use `<Card>`, `<Button>`, `<Box>`, `<Container>` — their classes win over
  your Tailwind utilities.
- Theme tokens only: `bg-surface`, `text-ink`, `text-ink-muted`, `bg-ink`, `border-border-strong`,
  `bg-paper-muted`, `text-warning-400/500`, `success-*`. Never `slate-*`, `indigo-*`, `amber-*`.
  The tokens flip between light and dark; a raw palette color does not.

---

## 6. Modal structure

- One floating nav. Do not render a second bottom navigation; the fixed `WizardNav` owns it.
- Page-level outermost scroll container gets `pb-32` so content clears the floating nav.
- Inside `BottomSheet` the body is `flex-1 overflow-y-auto overscroll-contain p-4 pb-8 max-h-[75vh]`.
  The footer is already a `flex-shrink-0` sibling of the scroll area — do **not** add
  `sticky bottom-0` to it, there is no scrolling ancestor for it to stick to.
- **An info button is a sibling of the selection button, never nested inside it.** Follow
  `src/components/ui/SplitSelectionCard.tsx:63-119`: a `flex-1` select button plus a fixed-width
  `border-l` info button. A button nested in a `<label>` that owns a hidden radio merges the
  two controls and is a real, reported bug.

---

## 7. Data file hygiene

- **Never JSON round-trip `src/data/engine/features/feat/*.json`.** Those files are
  hand-formatted with inline objects; a parse/stringify cycle rewrites hundreds of unrelated
  lines. Apply exact text replacements. Same caution for any file with inline objects.
- Delete dead fields rather than leaving them to rot (the `flavorText` removal is the model).
- Do not invent prerequisites. Engine `requires` must match the rules — Great Weapon Master
  and Crossbow Expert were given requirements the PHB never gave them, which silently blocked
  both feats. Check the SRD `prerequisites` field before writing an engine `requires`.
- New option data (feat sub-choices, group labels) belongs in a typed module with `labelId`
  keys, e.g. `src/data/feat-options.ts`, so labels localize instead of being baked in.

---

## 8. Before you call it done

Run these and report which you could not run:

```
bun typecheck
bun lint
bun test src/tests/srd-data.test.ts
npx next build
```

Behaviour changes to gating, matching, or calculation need a verification script exercising
the real exported function — both the passing and the refused case. A claim like
"enabled when the prerequisite is met" is only true if you checked the negative too.

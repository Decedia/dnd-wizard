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

All dice in prose must flow through the `DiceText` chip pipeline. Do not hand-write dice as
plain text, `<code>`, or bold.

- The recognized shapes are `ndn` (`2d6`), `dn` (`d20`) and `nd` (`2d`), matching
  `DICE_SHAPE` at `src/components/DiceText.tsx:25`.
- To support a new shape, extend `DICE_SHAPE` — never add a second, ad-hoc regex. New text
  surfaces should import `highlightDice` (as `src/components/FormattedDescription.tsx:5` does).
- The word boundaries on `DICE_SHAPE` are load-bearing: the trailing `(?![\w-])` stops
  `"3-dimensional"` matching as `"3d"`.
- `src/components/character-sheet/DamageExtractor.tsx:14` has its own pattern and is
  **out of scope** — it feeds damage calculation, so changing it changes numbers, not looks.

---

## 3. Ability, skill, damage and status badges

Prose that mentions an ability, a saving throw, a skill, a damage type, or a status condition
must render as a colour-coded badge with an icon, not plain text. `DiceText` already does this,
so **the rule is simply to route text through it** — never hand-write these as plain text or
your own `<span>`.

The handling is word-order sensitive, and getting it wrong is the usual failure:

| What is said | What happens |
| --- | --- |
| `Charisma saving throw` | Badge, coloured by Charisma |
| `Charisma saving throws` | Same badge — the trailing `s` is optional (`throws?`) |
| `Dexterity saving throw` | Badge, coloured by Dexterity |
| `Athletics`, `Stealth`, any listed skill | Badge on its own, coloured by the governing ability |
| `fire damage`, `1d8 necrotic damage` | Damage badge, coloured by the damage type, with its icon |
| `frightened`, `stunned`, any listed status | Status badge with its icon |
| `Charisma` alone | **Not** a badge — only `… saving throw(s)` is |
| `fire` alone | **Not** a badge — only `… damage` is |

The plural matters: the SRD data writes "saving throws" about half the time, and a regex pinned
to the singular `throw` silently skips those.

The word boundaries are load-bearing and match on the surrounding words, not just the term:

- `SAVING_THROW_RE` — `src/components/DiceText.tsx:97`
- `DAMAGE_TYPE_RE` — `src/components/DiceText.tsx:95` (requires the word `damage`)
- `SKILL_RE` — `src/components/DiceText.tsx:98`
- `STATUS_RE` — `src/components/DiceText.tsx:96`

To add a term, extend the relevant list (`DAMAGE_TYPES`, `STATUSES`, `SKILLS`, `ABILITIES`) and
the colour/icon maps beside it. Never add a second ad-hoc matcher.

**Known violation, do not copy it:** `getAbilityBadgeStyle` at `src/components/DiceText.tsx:168`
uses raw palette colours (`bg-red-100`, `dark:bg-emerald-500/20`) instead of theme tokens, which
breaks rule 5. New badge colours must use theme tokens; fixing the existing ones is tracked
separately so this file does not claim a compliance the code does not have.

---

## 4. Bullets

- Use `- ` or `* ` for unordered and `1. `, `2. ` for ordered. **One item per line.**
  Parsed at `src/components/DiceText.tsx:196-197` and
  `src/components/FormattedDescription.tsx:54,63`.
- A blank line separates paragraphs. Keep a bullet block homogeneous — do not mix `-` and
  `1.` markers inside one block, because `FormattedDescription` picks one style for the whole
  paragraph (`FormattedDescription.tsx:92-93`).
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

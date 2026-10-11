## Read First

**Before editing any user-facing text, SRD data, locale file, or selection UI, read
[`.kilocode/rules/content-rules.md`](.kilocode/rules/content-rules.md).**

It covers localization (Indonesian wrapper copy, English D&D terms, which of the three locale
files a string belongs in), inline dice rendering, bullet syntax, native elements, theme color
tokens, modal layout, data-file hygiene (never JSON round-trip the hand-formatted feat files),
and the checks required before finishing.

The short version: localize everything with `t()`, render dice through `DiceText`, use `- ` and
`1. ` bullets one per line, native HTML elements with theme tokens only, and verify with
`bun typecheck && bun lint && bun test src/tests/srd-data.test.ts && npx next build`.

## Optional Feature Guides

When users request features beyond the base template, check for available recipes in `.kilocode/recipes/`.

### Available Recipes

| Recipe       | File                                | When to Use                                           |
| ------------ | ----------------------------------- | ----------------------------------------------------- |
| Add Database | `.kilocode/recipes/add-database.md` | When user needs data persistence (users, posts, etc.) |

### How to Use Recipes

1. Read the recipe file when the user requests the feature
2. Follow the step-by-step instructions
3. Update the memory bank after implementing the feature

## Memory Bank Maintenance

After completing the user's request, update the relevant memory bank files:

- `.kilocode/rules/memory-bank/context.md` - Current state and recent changes
- Other memory bank files as needed when architecture, tech stack, or project goals change

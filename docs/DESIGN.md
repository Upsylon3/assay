# Design direction

> **Status: proposed.** Nothing here is applied to the interface yet. Today's
> page uses a neutral blue-grey default (the two `:root` blocks at the top of
> `index.html`). Applying this is item 2 on the [roadmap](ROADMAP.md).

## The idea

**A 1974 laboratory instrument catalogue, built today.** Paper stock, bench
green, one red stamp. The interface should read like a spec sheet and a test
report, not a shop window: retro in colour, type and small details, modern in
layout, readability and accessibility.

The name fits it. An assay is a test of what something is really made of;
the app asks the same of a listing.

## Principles

1. **A readout, not a storefront.** Numbers in tabular figures, labelled,
   with units, next to the evidence they rest on. This is the product's
   existing honesty about benchmark coverage, given a look.
2. **The verdict is about value, never about the seller.** Assay cannot tell
   whether an advert is honest ([PROJECT.md](PROJECT.md)), so any stamp or
   label speaks about price against performance only.
3. **Colour never works alone.** Every state that uses colour also has text
   or a shape.
4. **Quiet.** Rules instead of shadows, small radii (4 to 6 px), no motion
   beyond hover and focus.
5. **Nothing external.** The site is static and works offline, so no web
   fonts and no remote assets: system stacks only, `font-variant-numeric:
   tabular-nums` for figures, a monospace stack for readouts.

## Palette

The names match the CSS variables already in `index.html`, so a first pass is
a change of values, followed by a search for hard-coded colours. Contrast
ratios are against the page background; every pairing in use is at least 4.5:1.

| Token | Role | Light ("paper") | Dark ("recorder") |
|---|---|---|---|
| `--bg` | Page | `#ece7d8` | `#111a18` |
| `--panel` | Cards, dialogs | `#f6f2e6` | `#18241f` |
| `--soft` | Inset areas | `#e4decc` | `#141f1c` |
| `--text` | Body text | `#1b2522` (12.7) | `#e5e8dc` (14.3) |
| `--muted` | Secondary text | `#566159` (5.2) | `#9ba89f` (7.2) |
| `--line` | Rules | `#cdc6b2` | `#2b3a35` |
| `--acc`, `--good` | Accent and "strong value" | `#1d6554` (5.6) | `#6cc3aa` (8.5) |
| `--bad` | Poor value, errors | `#a8302a` (5.4) | `#f08377` (6.9) |
| `--warn` | Estimates, caution | `#8f5a00` (4.7) | `#e3ab3d` (8.6) |

Accent and "good" share a hue on purpose: the verdict is the product's one
positive colour. White on the light accent is 6.9:1; near-black on the dark
accent is 8.9:1.

## Small details

- A thin double rule under the header instead of a blurred sticky bar.
- Labels in small letterspaced capitals; values in the monospace stack.
- A footer line made of facts the page already knows: the model version and
  the dataset date, for example `performance-v2.4 · data 2026-10-16`.

## Take the feel, not the assets

The references are the mood of mid-century corporate laboratories and the
games that borrowed it. Never copy a game's logo, wordmark, typeface or
artwork; the look comes from the palette, the type and the details above.

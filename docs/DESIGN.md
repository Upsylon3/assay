# Design direction

Assay shares Home's console styling and frontend polish, with its own 1970s
corporate-laboratory identity: paper, bench green, and instrument readouts.
The workbench keeps scoring, saved-data formats and sync intact. Entry, navigation
and progressive disclosure are streamlined around the main comparison flow.

## Visual language

- Warm paper in light mode; deep green-black instrument surfaces in dark mode.
- Bench-green actions and positive states, rust errors, amber cautions, and a
  four-color stripe band running from sage to forest green.
- Fredoka headings, Inter body text, IBM Plex Mono labels and numeric readouts.
- Raised console keys, restrained panel bevels, consistent radii and quiet rules.
- Responsive layouts, visible keyboard focus and reduced-motion support.

`styles.css` owns the visual system and the existing layout rules. Its theme
variables give Assay a distinct green palette while preserving Home's component
style, Assay's existing light default, and the saved theme preference. Fonts are bundled in `assets/fonts` with their
licenses; there are no font CDN requests or build dependencies.

Home source reference: local checkout `c7e854b`, `design/tokens.css`,
`design/components.css`, and `apps/home/src/styles/index.css`.

The laboratory feel comes from original colors, typography and materials; no
third-party logos, artwork or branding are reproduced.

## Scope

All existing tabs, forms, ranking outputs, table controls, dialogs and account
flows retain their behavior. Content and information architecture need a separate
review. Keep numeric figures tabular and pair status colors with existing text.

## Workbench interface

The welcome panel uses an original vector instrument illustration and a brief
trace animation (disabled for reduced motion). The result panel uses the existing
collection-relative deal score in a labelled dial, not a new score or certainty
estimate. The decorative welcome trace is hidden from assistive technology.

Listing cards keep price, performance and deal score visible at mobile widths.
Save, Versus and Edit remain direct actions; Inspect listing contains availability,
delete and the benchmark breakdown. Longer methodology notes are expandable.
Mobile navigation wraps so every view stays visible without horizontal scrolling.

Entry starts with CPU, GPU and price. Memory/storage are optional and expand on
edit. Blank values use 16 GB DDR4 / 1 TB SSD with assumption flags; explicit zero
SSD stays zero. Hardware pickers support arrows, Enter and Escape. No scoring
formula, benchmark data, account flow or backup format changes are introduced.

Only the active view is rendered during updates; tables and Versus are refreshed
on entry. The default table omits redundant asking-price and sub-score columns;
Detailed columns and CSV retain every existing field.

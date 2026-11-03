# Design direction

Assay shares Home's console styling and frontend polish, with its own 1970s
corporate-laboratory identity: paper, bench green, and instrument readouts.
This pass changes presentation only: scoring, content, storage and sync stay intact.

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

# Roadmap

Three parts: a short list of committed work, a list of ideas that are
explicitly **not** committed, and the gaps the project already knows about.

## Committed

1. **Review content and information architecture** after the Home-aligned visual
   pass documented in [DESIGN.md](DESIGN.md).
2. **Keep widening benchmark coverage** without presenting guesses as
   measurements. Unsupported hardware keeps its explicit fallback; missing
   FPS results are never interpolated.

## Ideas, not committed

- **Automatic marketplace synchronization** remains uncommitted. Local saved-input
  intake and a loaded-page collector now exist; see [BULK_IMPORT.md](BULK_IMPORT.md).
- **Move the application script out of `index.html`.** Most of the logic is
  inline today. CI checks syntax and the entry handler; extracting modules
  could extend coverage without relying on HTML extraction.

## Known gaps

- Password reset is not implemented. Keep a JSON backup.
- Browser checks cover rendering, navigation and live account sync. Automated
  tests cover application logic and merge behavior
  ([DEVELOPMENT.md](DEVELOPMENT.md#what-is-not-covered)).
- Shared CPU/GPU entries and the shared reference PC are readable by every visitor by design. The security policy asks for validation and abuse resistance to be considered whenever the code that allows shared writes changes ([SECURITY.md](SECURITY.md)); there is no standing work on it.

# Roadmap

Three parts: a short list of committed work, a list of ideas that are
explicitly **not** committed, and the gaps the project already knows about.

## Committed

1. **Cut the first tagged release, 0.8.0.** Rename the repository, merge the
   release process and tag it; the steps are in
   [RELEASING.md](RELEASING.md#the-first-release-080).
2. **Review content and information architecture** after the Home-aligned visual
   pass documented in [DESIGN.md](DESIGN.md).
3. **Keep widening benchmark coverage** without presenting guesses as
   measurements. Unsupported hardware keeps its explicit fallback; missing
   FPS results are never interpolated.

## Ideas, not committed

- **Import listings from pasted advert links or text**, filling price, link
  and any CPU, GPU, RAM or storage found in the title or description, and
  leaving a field blank when it is unsure. The app does not scrape
  marketplaces today and this would not change that for logged-in pages.
- **Move the application script out of `index.html`.** Most of the logic is
  inline today, which is why CI can only check that it parses. Splitting it
  would make it testable; whether that is worth abandoning the one-file
  simplicity is undecided.

## Known gaps

- Password reset is not implemented. Keep a JSON backup.
- The interface and the sync/merge logic have no automated tests
  ([DEVELOPMENT.md](DEVELOPMENT.md#what-is-not-covered)).
- The "FPS suite estimates" label in the header is written by hand and has to
  be changed with the model version ([VERSIONING.md](../VERSIONING.md)).
- Shared CPU/GPU entries and the shared reference PC are readable by every visitor by design. The security policy asks for validation and abuse resistance to be considered whenever the code that allows shared writes changes ([SECURITY.md](SECURITY.md)); there is no standing work on it.

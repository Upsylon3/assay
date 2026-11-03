# Contributing

Thanks for helping improve Assay. The most useful contributions improve ranking correctness, benchmark evidence, accessibility, reliability, or the clarity of the interface.

This is a personal project and the code is not licensed for reuse ([LICENSE](LICENSE)), so please open an issue to discuss a change before sending a pull request.

## Development setup

[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) has the full workflow. The short version:

```bash
git clone https://github.com/Upsylon3/assay.git
cd assay
git config core.hooksPath .githooks      # enable the commit-message hook, once per clone
node scripts/check-benchmark-data.js
node tests/scoring-engine.test.js
node tests/conventions.test.js
```

Open `index.html` directly in a browser. No npm install or build step is needed. For local-only work, clear the Supabase URL and key in `config.js` to prevent requests to the configured shared project, and do not commit that edit.

## Commits, branches and merging

Use [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <imperative summary>`, for example `fix(table): keep the sort column after a filter change`.

- Types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `ci`, `build`, `perf`, `revert`.
- Scope is optional, lowercase, kebab-case. A trailing `!` marks a breaking change.
- Start the summary with a lowercase letter or a digit and do not end it with a period.
- Branch names are `<type>/<kebab-case-name>`, for example `feat/goal-toggle` or `docs/release-guide`.
- Prefer one squash commit per reviewed pull request, using its title as the commit subject. The pull-request title is checked too.

The `commit-msg` hook and the `Repository conventions` workflow run `scripts/check-commit-message.mjs`. Commits before 0.8.0 predate the convention and are left as they are.

## Comments

Comment *why*, not what. A good comment explains a decision, a trade-off or something that would look wrong but is deliberate: why a benchmark ratio is only used inside one suite, why a storage key still says `pvl_`, why a deletion is kept as a tombstone. If the code needs a comment to say what it does, rename or restructure it first.

## Before opening a pull request

- Describe the user-visible problem and expected behavior.
- Keep the change focused and explain any trade-off that affects ranking or saved data.
- Run the benchmark validator and both test files.
- Check the site in a browser at a narrow/mobile and desktop viewport when UI is affected.
- Do not commit personal listing backups, credentials, tokens, admin passphrases, or environment-specific secrets.
- Update documentation in the same change whenever a feature, configuration step, score definition, or maintenance workflow changes, and add user-visible changes to `[Unreleased]` in [CHANGELOG.md](CHANGELOG.md).
- Do not bump `VERSION` unless the pull request is a deliberate release ([docs/RELEASING.md](docs/RELEASING.md)).

## Benchmark-data changes

Benchmark data is part of the product's evidence. Treat its provenance and comparability as required information.

1. Check the exact processor or graphics card model against the linked source.
2. Keep model aliases conservative and non-ambiguous.
3. Record the direct HTTPS source URL and identify the benchmark suite/methodology.
4. Compare numbers only when they come from the same suite, test bench, resolution, and rendering mode.
5. Do not fill gaps through interpolation or invent FPS values. Unsupported GPUs should keep the existing fallback behavior.
6. Update the dataset's `updatedAt` date for data refreshes and update the model version when scoring behavior changes.
7. Add or update regression tests when a scoring rule changes.

Run:

```bash
node scripts/check-benchmark-data.js
node tests/scoring-engine.test.js
```

The validator catches malformed data and alias collisions; it does not prove that source pages are accurate or unchanged. A human must review the source and methodology.

## Changes to scoring behavior

Scoring changes can change which listing appears to be the best deal. PRs should explain what changed, why the prior model was insufficient, and which tests demonstrate the intended behavior. Keep the following concepts separate:

- workload-specific performance relative to the reference PC;
- the component-cost-share value index;
- ratios such as performance per currency unit;
- the collection-relative normalized Value / 100 display;
- optional GPU-suite FPS, which is an aggregate estimate rather than a specific game's expected FPS.

Do not mix different benchmark scales or present a fallback as a directly measured result.

## Changes to Supabase or persisted data

Changes to `setup.sql`, account synchronization, listing IDs, merge timestamps, or deletion tombstones require extra care because a mistake can affect users' saved data. Explain compatibility and migration steps, preserve row-level security, and test with at least two sessions when changing sync behavior. Never grant public access to account-owned listing rows.

## Pull request checklist

The [pull-request template](.github/PULL_REQUEST_TEMPLATE.md) carries the same list.

- [ ] The purpose and expected behavior are explained.
- [ ] `node scripts/check-benchmark-data.js` passes.
- [ ] `node tests/scoring-engine.test.js` passes.
- [ ] `node tests/conventions.test.js` passes.
- [ ] Browser behavior was checked if the UI changed.
- [ ] Documentation and `CHANGELOG.md` are updated where relevant.
- [ ] The title, branch name and commits follow the conventions above.
- [ ] No private data or secrets are included.

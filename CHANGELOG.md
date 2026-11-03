# Changelog

All notable changes to this project are documented here. Format follows
[Keep a Changelog](https://keepachangelog.com/), versioning follows
[SemVer](https://semver.org/): one version number for the whole project
(see the `VERSION` file), bumped on any meaningful release.

Entries for 0.1.0 to 0.7.0 were written afterwards, from the Git history,
when the release process below was introduced. Those versions were never
tagged; see [VERSIONING.md](VERSIONING.md) for which commit each one stands for.

## [Unreleased]

### Changed
- Align the interface with Home: warm paper/green-black themes, bench-green console controls, bundled Inter/Fredoka/IBM Plex Mono fonts, sage-to-forest stripe header, clearer panel hierarchy, and responsive forms, tables and dialogs. Scoring, content and saved data are unchanged.

### Fixed
- The conventions check no longer fails a pull request or a push to `main` for the old `Weekly PassMark sync` commit subject. The weekly sync used that subject before the convention existed, and two such commits reached the 0.8.0 pull request. Only that exact subject is tolerated, and only inside a commit range; new messages, branch names and pull-request titles are still checked.

## [0.8.0] — A name, a release process and a documentation set

### Added
- **A release process.** [VERSIONING.md](VERSIONING.md) sets one SemVer number for the whole project, held in a plain `VERSION` file because the project has no `package.json` and no build step on purpose. [docs/RELEASING.md](docs/RELEASING.md) is the checklist. A `Release` workflow runs on a `vX.Y.Z` tag: it checks that the tag is annotated and reachable from `main`, that `VERSION`, the tag and the newest changelog heading agree, and that `Validate static app` succeeded on that exact commit, then publishes the GitHub Release with this file's section as its notes.
- **Conventional Commits, enforced.** `scripts/check-commit-message.mjs` checks commit subjects and branch names. A `commit-msg` hook in `.githooks/` runs it locally (enable it once per clone, see [CONTRIBUTING.md](CONTRIBUTING.md)), and a `Repository conventions` workflow runs it on every pull request and every push to `main`. The same workflow re-validates the release metadata on every commit, so a missing changelog entry fails in the pull request that caused it.
- `tests/conventions.test.js`: 26 checks covering the commit and branch rules and the release validator, including deliberately broken copies (a changelog whose newest heading does not match, an empty section, a tag without the `v`). It runs in `Validate static app`.
- A fuller documentation set: [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md), [docs/ROADMAP.md](docs/ROADMAP.md) (committed work kept apart from ideas, plus the known gaps) and [docs/DESIGN.md](docs/DESIGN.md) (a proposed visual direction, **not applied to the interface yet**).
- A `LICENSE` file: proprietary, all rights reserved. It is the most restrictive starting position, chosen because it is easy to relax later and hard to undo in the other direction.
- A pull-request template (summary, why, safety and compatibility, verification, documentation and release) and a Dependabot config for the GitHub Actions the workflows use.

### Changed
- **Rename: Scam or Steal is now Assay.** The page title, header, README, docs, `setup.sql` header, CSV export (`assay-listings.csv`), backup export (`assay-backup.json`), the "isn't an Assay backup" import message and the PassMark sync's User-Agent all follow. "Scam or steal" stays as the question the project answers.
- The repository and live URLs change with the repository rename (`Upsylon3/assay`, `upsylon3.github.io/assay/`). GitHub redirects the old repository address; GitHub Pages does **not** redirect the old live address.
- The internal `PVL_` namespace (`PVL_CONFIG`, `PVL_BENCHMARKS`, `PVL_SCORING`) and the `pcvaluelab_*` / `pvl_*` browser-storage keys keep their names. They come from the project's first name, and renaming storage keys would orphan listings already saved in people's browsers. This is now explained in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- `SCORING-MODEL.md` is now `docs/SCORING_MODEL.md` and `SECURITY.md` is now `docs/SECURITY.md`; every link to them is updated. GitHub still finds the security policy in `docs/`.
- The weekly PassMark sync commits as `chore(parts): weekly PassMark sync`, so the bot's pushes to `main` pass the new convention check.
- `README.md` is restructured around a status table, the repository layout, the checks and a documentation index. `CONTRIBUTING.md` now covers commits, branches, merging and the "comment the why" rule, and keeps its benchmark, scoring and Supabase sections.

### Fixed
- The README now describes the goal toggle and link review, which shipped in 0.7.0 without being documented.

### Not verified
- The `Release` and `Repository conventions` workflows have not run on GitHub yet. The scripts they call are covered by `tests/conventions.test.js` and were run locally; the workflow files themselves were only read through, not executed.
- The visual direction in `docs/DESIGN.md` is a proposal. Nothing in the interface uses it yet.

## [0.7.0] — Goal toggle and link review

### Added
- **A goal toggle on Compare: Daily driver, Resale profit or Both.** The ranking, the top-pick banner and the table's `Goal score / 100` follow it. Both rewards a listing that is good at the two rather than excellent at one.
- **Link review.** When a listing's name is an advert URL, the app records when it was last checked. A `Review links (n)` button counts the links not checked in the last two days and opens a dialog that works through them; each listing shows how long ago its link was checked.
- A full-width table layout.
- The first full documentation set: a rewritten README, a project description, an architecture overview, a deployment guide, a contributing guide, a security policy and the scoring model.

### Changed
- Trim the workload profile list and open the table with a basic set of columns; `Show all columns` reveals the rest.

### Removed
- An automated listing checker (a scheduled workflow, a script, tests and `setup.sql` additions, including autodelete for Leboncoin listings) was added and dropped on the same day. Link checking is manual, through link review.

### Fixed
- Remove leftover merge-conflict markers from `benchmark-data.js`.

## [0.6.0] — Benchmark-backed scoring

### Added
- **A versioned scoring engine** (`scoring-engine.js`, model `performance-v2.4` today) that keeps performance and value apart and only compares benchmark numbers that come from the same suite.
- **Curated, sourced benchmark data** (`benchmark-data.js`): PassMark CPU single-thread values, Tom's Hardware's resolution-specific GPU gaming suite (1080p, 1440p, 4K; rasterization and ray tracing) and its 2026 CPU gaming and application suites, each record with aliases and a source URL. Absent or zero ray-tracing entries are treated as unsupported and fall back safely.
- **Gaming controls** for resolution and rasterization or ray tracing, and an **aggregate GPU-suite FPS estimate** shown in listings and the spreadsheet only when the GPU has curated data for the selected resolution and mode.
- Evidence and confidence in the table: the method used for each row and how much matching benchmark evidence it rests on.
- `scripts/check-benchmark-data.js`, which rejects missing fields, invalid values and alias collisions, and `tests/scoring-engine.test.js`. Both run in `Validate static app` on pushes and pull requests to `main`.
- `SCORING-MODEL.md`: the formula, profile weights, sources, limits and evidence levels.

### Changed
- Bust the browser cache when the scoring model changes, so a stale `scoring-engine.js` is not served against new data.

## [0.5.0] — Workload profiles, a separate performance score, sortable table and Versus

### Added
- **Workload profiles.** Performance is now weighed by what the chosen workload needs, no longer by what a typical build spends on each part; the budget-share model stays, as the value index. The **performance score is kept separate from value**, so a faster PC is not automatically the better deal.
- **Sortable listings**, a spreadsheet-style table with a column to sort on, and a **Versus** view comparing two saved PCs; table rows link into it.
- Workload and comparison preferences are saved between visits.
- JavaScript syntax validation for the inline script in `index.html`, run in CI.

### Fixed
- Remove a duplicate `Versus` function declaration, and repair the comparison links.

## [0.4.0] — Accounts and cross-device sync

### Added
- **Optional accounts** (email and password; no email is ever sent). Each account owns one private row, protected by row-level security. Listings carry an id and a last-edited time: when two devices have been edited apart, the newest version of each listing wins, a listing only one device has is kept, and a deletion travels as a small tombstone. The first sign-in adds the listings already on that device to the account without doubling any.
- JSON export and import stay, for sharing and for use without an account. Import adds to the collection; it never replaces it.
- **A Supabase keep-alive.** A daily workflow and `scripts/supabase-keepalive.mjs` call the project so the free tier never pauses; if it is paused anyway and a `SUPABASE_ACCESS_TOKEN` secret exists, the script restores it. A failure it cannot fix fails the run on purpose, so GitHub emails the owner.
- `setup.sql` is safe to run again: it only adds what is missing and never rewrites an existing admin secret.

### Fixed
- Correct the Supabase URL format in `config.js`.

## [0.3.0] — Setup deduction, availability and "worth only", and the first rebrand

### Added
- **Setup included.** Tick it on a listing and the app deducts the setup's value (€150 by default, adjustable in Settings or per listing) from the asking price, so the PC is ranked at its real price.
- **Availability.** Mark a listing paused or sold; an `Available only` view filter combines with All, Favourites and DDR5 only.
- **Logically worth only**, a filter that hides any listing costing more than a more powerful one. Listings at the same price all stay.

### Changed
- Rework how value is computed, and rename PC Value Lab to Scam or Steal (a small rebrand, in the README at the time).

### Removed
- The one-off `apply-site-update` workflow and the `patch-index` script.

### Fixed
- Correct the RAM figure shown in the ranking.

## [0.2.0] — Shared parts and the weekly PassMark sync

### Added
- **Shared CPU and GPU parts** in a free Supabase project, with row-level security and an admin passphrase set in `setup.sql`, and a built-in part list (`builtin-parts.js`).
- **A weekly PassMark sync.** `scripts/update-parts.mjs` makes exactly one request to each PassMark list, rebuilds `builtin-parts.js` from them, and stops without touching the file if anything looks wrong. A workflow runs it every Monday.

### Removed
- User-suggested parts: the part list is PassMark-only.

## [0.1.0] — First upload

### Added
- The first page (`index.html`), its favicon and a README. The history does not record more than that about this version.

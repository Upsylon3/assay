# Development

How to run Assay locally, what the checks cover, and what is not covered.

## Requirements

- A modern browser.
- Node.js 22 for the checks. The validation workflow uses 22; the scheduled
  maintenance workflows run on 20 and the scripts need 18 or later. There is
  nothing to install: no `package.json`, no dependencies, no build step.

## Run it

```bash
git clone https://github.com/Upsylon3/assay.git
cd assay
```

Open `index.html` in the browser. With the repository's `config.js` the app
talks to the configured Supabase project. For a local-only run, empty both
values in `config.js` (see [DEPLOYMENT.md](DEPLOYMENT.md#2-localoffline-mode));
listings then stay in that browser's storage and sign-in is unavailable.
Do not commit that edit.

Enable the commit-message hook once per clone:

```bash
git config core.hooksPath .githooks
```

## The checks

| Command | What it covers |
|---|---|
| `node scripts/check-benchmark-data.js` | The curated benchmark data: missing fields, invalid values, alias collisions. It does not prove a source page is accurate. |
| `node tests/update-parts.test.mjs` | Offline PassMark generation, single-thread parsing and safe failure without overwriting data. |
| `node tests/scoring-engine.test.js` | The scoring engine: profiles, fallbacks, GPU suites, coverage minimums, aggregate FPS and the unsupported-GPU path. |
| `node tests/curated-sources.test.mjs` | Offline source checker: score/FPS drift, blocked layouts and read-only behavior. |
| `node tests/app-logic.test.js` | Actual ranking integration, available-only dominance, backups, currency and archived comparisons. |
| `node tests/listing-validation.test.js` | Numeric boundaries, legacy data, reference validation and conservative catalog refresh. |
| `node tests/ui-entry.test.js` | Listing entry: assumptions, explicit capacities, validation and stable identity on edit. |
| `node tests/conventions.test.js` | The repository's own tooling: the commit and branch rules and the release validator (29 checks). |
| `node scripts/validate-release.mjs vX.Y.Z .` | That `VERSION`, the tag and the newest changelog heading agree. Prints the release notes. |

CI runs the regression checks above, plus a syntax check of the inline script in
`index.html`, on every push and pull request to `main`.

## What CI runs

| Workflow | When | What it does |
|---|---|---|
| `validate-static-app.yml` | Pushes and pull requests to `main` | Syntax-checks the inline script, validates the benchmark data, runs all regression test files |
| `conventions.yml` | Pull requests, pushes to `main` | Commit subjects, PR title, branch name, release metadata |
| `release.yml` | A `v*` tag, or by hand | Validates the tag and publishes the GitHub Release ([RELEASING.md](RELEASING.md)) |
| `update-parts.yml` | Mondays 06:00 UTC, or by hand | Rebuilds `builtin-parts.js` from PassMark and commits it if it changed |
| `audit-benchmarks.yml` | Mondays 06:30 UTC, or by hand | Read-only verification of all curated scores and six FPS baselines against the live source tables |
| `supabase-keepalive.yml` | Daily | Keeps the free Supabase project from pausing |

## Working on the maintenance scripts

`scripts/update-parts.mjs` reads PassMark's CPU Mark, single-thread and GPU lists. For offline testing it
can read saved copies of those pages through the `CPU_HTML_FILE` and
`GPU_HTML_FILE` environment variables, plus `CPU_SINGLE_HTML_FILE` for the single-thread chart, so you do not need to hit PassMark to
try a change. If anything looks wrong it stops and leaves `builtin-parts.js`
untouched; `FORCE=true` skips those safety checks and is only for a change
you have checked by hand.

## What is not covered

- **The interface.** Most application logic lives in an inline script in
  `index.html`. CI syntax-checks the script and tests the entry handler with DOM stand-ins.
  Rendering and navigation still require browser checks. Check UI changes
  in a browser at a narrow and a desktop width.
- **Live account integration.** Deterministic tests cover revision payloads, deletion ties, URL identities and delayed responses after signout/account switching. Real Supabase authentication and concurrent devices still require end-to-end checks; this audit did not mutate live account data.
- **The workflows themselves.** They only run on GitHub.

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the files fit together and
[../CONTRIBUTING.md](../CONTRIBUTING.md) for how to propose a change.

### Listing entry regression checks

Run `node tests/ui-entry.test.js` to check blank-field assumptions, explicit
capacities (including no SSD), validation, and stable IDs/favourites on edit.
This exercises the real form submit handler with lightweight DOM stand-ins;
it does not replace desktop/mobile browser checks or cover account sync.

### Listing intake checks

`node tests/listing-import.test.js` covers local parsing, a synthetic 65-ad batch,
French specification ambiguity, canonical URL deduplication, inert saved HTML,
loaded-card collection, and explicit availability evidence. It runs in CI with
syntax checks for all three new listing modules. Real Leboncoin layouts still
need user-supplied exports for compatibility verification.

### Benchmark provenance

Run `node scripts/check-curated-sources.mjs` for a read-only live source comparison, or supply saved HTML through `CPU_HIERARCHY_HTML_FILE` and `GPU_HIERARCHY_HTML_FILE`. The separate weekly audit reports source drift or blocked/changed source pages in Actions; it never silently updates curated values. See [BENCHMARK_AUDIT.md](BENCHMARK_AUDIT.md).

Backups now use envelope version 5 and preserve named references, custom parts and scoring preferences. Versions 1–4 remain importable; older scores-only references cannot be assigned invented model names.

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
| `node tests/scoring-engine.test.js` | The scoring engine: profiles, fallbacks, GPU suites, coverage minimums, aggregate FPS and the unsupported-GPU path. |
| `node tests/ui-entry.test.js` | Listing entry: assumptions, explicit capacities, validation and stable identity on edit. |
| `node tests/conventions.test.js` | The repository's own tooling: the commit and branch rules and the release validator (29 checks). |
| `node scripts/validate-release.mjs vX.Y.Z .` | That `VERSION`, the tag and the newest changelog heading agree. Prints the release notes. |

CI runs the first four, plus a syntax check of the inline script in
`index.html`, on every push and pull request to `main`.

## What CI runs

| Workflow | When | What it does |
|---|---|---|
| `validate-static-app.yml` | Pushes and pull requests to `main` | Syntax-checks the inline script, validates the benchmark data, runs all three test files |
| `conventions.yml` | Pull requests, pushes to `main` | Commit subjects, PR title, branch name, release metadata |
| `release.yml` | A `v*` tag, or by hand | Validates the tag and publishes the GitHub Release ([RELEASING.md](RELEASING.md)) |
| `update-parts.yml` | Mondays 06:00 UTC, or by hand | Rebuilds `builtin-parts.js` from PassMark and commits it if it changed |
| `supabase-keepalive.yml` | Daily | Keeps the free Supabase project from pausing |

## Working on the maintenance scripts

`scripts/update-parts.mjs` reads PassMark's two lists. For offline testing it
can read saved copies of those pages through the `CPU_HTML_FILE` and
`GPU_HTML_FILE` environment variables, so you do not need to hit PassMark to
try a change. If anything looks wrong it stops and leaves `builtin-parts.js`
untouched; `FORCE=true` skips those safety checks and is only for a change
you have checked by hand.

## What is not covered

- **The interface.** Most application logic lives in an inline script in
  `index.html`. CI syntax-checks the script and tests the entry handler with DOM stand-ins.
  Rendering and navigation still require browser checks. Check UI changes
  in a browser at a narrow and a desktop width.
- **Sync and merge.** Changes to account sync, listing ids, timestamps or
  tombstones have no automated tests. Test them with two sessions by hand.
- **The workflows themselves.** They only run on GitHub.

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the files fit together and
[../CONTRIBUTING.md](../CONTRIBUTING.md) for how to propose a change.

### Listing entry regression checks

Run `node tests/ui-entry.test.js` to check blank-field assumptions, explicit
capacities (including no SSD), validation, and stable IDs/favourites on edit.
This exercises the real form submit handler with lightweight DOM stand-ins;
it does not replace desktop/mobile browser checks or cover account sync.

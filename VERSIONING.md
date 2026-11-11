# Assay versioning policy

Assay uses **one Semantic Versioning number for the whole project**. The
`VERSION` file at the repository root is the sole release authority. The
current release baseline is **`0.8.0`**.

## The authoritative version

- Change only `VERSION` for a release. There is no `package.json`: the app
  is static and has no build step, so nothing else needs a version.
- The newest versioned `CHANGELOG.md` heading must match `VERSION`.
- A stable release is an annotated Git tag named `vX.Y.Z` on its exact
  validated release commit, plus a GitHub Release whose notes come from the
  matching changelog section.

A release is invalid when `VERSION`, the newest changelog heading and the
Git tag disagree.

## Other version numbers in the repository

These are **not** release versions. They describe the data and the model,
and they move on their own schedule.

| What | Where | Changes when |
|---|---|---|
| Scoring model, `performance-v2.5` today | `MODEL_VERSION` in `scoring-engine.js`, top of [docs/SCORING_MODEL.md](docs/SCORING_MODEL.md) | Scoring behaviour changes |
| Benchmark dataset, `schemaVersion` and `updatedAt` | top of `benchmark-data.js` | `updatedAt` on a data refresh; `schemaVersion` when the shape of a record changes |
| Backup file format, `version` | the JSON export in `index.html` | The exported structure changes in a way import has to handle |
| "FPS suite estimates v2.4" in the page header | `index.html`, typed by hand | Whenever the model version changes; nothing updates it automatically |

A change to scoring behaviour bumps the model version and normally earns a
MINOR release, because it can change which listing looks like the best deal.
A weekly PassMark sync is a data refresh, not a release.

## Semantic Versioning

Use `MAJOR.MINOR.PATCH`:

| Change | Version increment | Meaning |
|---|---|---|
| MAJOR | `X+1.0.0` | An incompatible change to saved listings, backups, the Supabase schema or a public address |
| MINOR | `X.(Y+1).0` | A backwards-compatible capability, or a scoring change |
| PATCH | `X.Y.(Z+1)` | A backwards-compatible bug fix or security fix |

While `MAJOR` is `0`, a MINOR release may include changes a 1.x line would
call breaking; the changelog says so when it happens. Moving to `1.0.0` is a
deliberate decision, not a milestone with a checklist.

A `feat` normally calls for MINOR and a `fix` for PATCH. Documentation,
tests, refactors, CI changes, dependency refreshes and weekly data syncs do
not each earn a version bump. Group work according to the user-visible
milestone it actually completes.

## Release history

Before 0.8.0 nothing was versioned or tagged, and the commits do not carry
a version label. The changelog's 0.1.0 to 0.7.0 entries group the history
into the milestones below. The hashes are **historical source anchors**, not
tags: nothing is tagged retroactively, and no commit is rewritten.

| Version | Milestone | Historical source commit |
|---|---|---|
| `0.1.0` | First upload | `7394fb1` |
| `0.2.0` | Shared parts and the weekly PassMark sync | `e878559` |
| `0.3.0` | Setup deduction, availability and "worth only", first rebrand | `4e8b7d9` |
| `0.4.0` | Accounts and cross-device sync | `fbb2505` |
| `0.5.0` | Workload profiles, a separate performance score, table and Versus | `f5169f7` |
| `0.6.0` | Benchmark-backed scoring | `bad878c` |
| `0.7.0` | Goal toggle and link review | `7e92984` |
| `0.8.0` | A name, a release process and a documentation set | the first tagged release |

## Changelog

Keep `CHANGELOG.md` in reverse chronological order:

- Put pending, user-relevant changes under `[Unreleased]`.
- Use `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed` and `Security`
  headings as applicable.
- For a release, move the completed entries into
  `## [X.Y.Z] — Short release summary`.
- Record observable changes and real verification limitations. Do not claim
  checks or deployment scenarios that were not actually run.

## Git history and tags

Use Conventional Commits for new work; see [CONTRIBUTING.md](CONTRIBUTING.md).
Prefer one squash commit per reviewed pull request, using its validated
title as the `main` commit subject. Commits before 0.8.0 predate the
convention and stay as they are.

Release tags are annotated and immutable. Never force-move or reuse a tag
that has a published GitHub Release; correct a release with the next version.

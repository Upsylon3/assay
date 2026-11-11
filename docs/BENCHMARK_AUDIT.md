# Benchmark evidence audit

Reviewed on **12 November 2026, Europe/Paris** against the current published
[CPU hierarchy](https://www.tomshardware.com/reviews/cpu-hierarchy,4312.html)
and [GPU hierarchy](https://www.tomshardware.com/reviews/gpu-hierarchy,4388.html).

## What was verified

`node scripts/check-curated-sources.mjs` compares every bundled curated score
with its exact model in the corresponding source table: **25 CPU cells and
180 GPU cells and six FPS baselines, 211 values total**. All match after this audit's corrections. It reads
the source tables directly rather than relying on a web search excerpt, and
reports mismatches or missing source models as failures. A separate read-only
`Audit published benchmark evidence` workflow runs every Monday at 06:30 UTC
and can also be triggered manually. It never commits source changes automatically.
Source drift, changed markup or blocked requests fail that workflow visibly;
ordinary pull-request tests remain offline and deterministic.

For reproducibility with previously saved HTML, set `CPU_HIERARCHY_HTML_FILE`
and `GPU_HIERARCHY_HTML_FILE` to those files before running the checker. The
checker prints SHA-256 hashes of the source documents it checked. Offline tests
cover altered scores, FPS baseline drift, missing tables and read-only behavior. Full source
pages, including their advertising markup, are not bundled with the app.

## Corrections and exact model identities

- RX 6600 ray-tracing coverage was incorrectly stored as unavailable zeros.
  The published 1080p / 1440p / 4K indices are **10.2 / 7.6 / 4.8** and now
  replace those zeros. Its unusual 1440p raster index, **14.9**, is exactly what
  the source publishes, so it was retained.
- The CPU source measures **14700K and 12700K**. Curated records now identify
  those models rather than assigning their results to the distinct KF variants.
- A generic RTX 4060 Ti name no longer borrows the explicitly measured 8GB
  variant. Generic RTX 3060 names likewise remain separate from the 12GB suite
  result. Ambiguous variants use the broad PassMark comparison when necessary.
- The six FPS baselines were checked against the source's RTX 5090 rows:
  raster **203.8 / 167.3 / 110.8**, RT **125.7 / 100.8 / 64.1**. Each resolution
  has its own baseline; indices are not multiplied by the 1080p baseline at
  every resolution.

## Limits of this evidence

A matching table cell proves transcription and exact model identity, not that
the source benchmark predicts a particular listing's performance. Published
indices are rounded; derived suite FPS can consequently differ slightly from
the source's displayed FPS. Suite FPS is independent of the user's reference
PC and remains an aggregate GPU test result, not a full-PC or per-game promise.

PassMark's broad catalog is checked separately by the weekly generator and its
offline safeguards. Single-thread aliases now prioritize exact identities and
reject ambiguous normalized names. Comparisons select a common benchmark basis
across available listings (or the selected Versus pair), so partial curated coverage cannot put competitors on
different scoring scales. Missing coverage remains explicit.

The audit does not independently re-benchmark hardware or certify advert claims,
physical condition, cooling, power limits, VRAM, or seller-provided specifications.

## Application logic audit

The same review fixed and added regression coverage for:

- Different benchmark sources reversing faster/slower sibling rankings; archived hardware changing buyable winners; ambiguous normalized CPU identities and GPU VRAM variants.
- Unavailable bargains hiding buyable alternatives, unavailable-only Versus producing NaN, stale example hardware scores, and outdated cached script dependencies.
- Storage parsing borrowing RAM/HDD capacities, missing SSDs becoming assumptions, repeated drive counts, generic advert URLs losing identifying parameters, and older captured availability overwriting newer checks.
- Backup settings/custom parts not restoring, custom draft hardware being reparsed before its catalog was restored, and legacy currency overriding current preferences.
- Negative/non-finite listing numbers and malformed references entering calculations; distinct same-spec adverts collapsing during sync; equal-timestamp deletions losing to live records; delayed account/token responses applying after signout or account switching.

Verification: all nine regression suites, the benchmark validator, inline/module syntax checks, and the live source checker pass. An isolated Edge browser checked Compare, Table, Versus and Settings at desktop and mobile sizes, with no uncaught page errors or mobile horizontal overflow. Test listings were synthetic; live user accounts were not modified. Cloud tests use controlled transports and delayed responses, so this is not a certification of real Supabase service behavior or cross-device clock accuracy.

Retail market weights remain approximate model inputs, not independently verified resale transaction prices. The interface calls their output resale value and explains that it is a heuristic, not a promised selling price or profit. Advert claims and hardware condition still require inspection; no finite code audit can guarantee the absence of every possible defect.

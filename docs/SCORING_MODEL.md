# Assay scoring model

**Current performance model:** `performance-v2.6`

## Two scores, two questions

- **Performance index** asks how the CPU and GPU compare with the selected reference PC for the selected workload.
- **Value index** is a parts-value heuristic, not a predicted selling price or profit. It retains the app's market-price-share model and adjusts for RAM/storage market value and the optional aesthetics setting. It is not used as a proxy for raw performance.
- **Value per currency** divides the value index by effective price.
- **Performance per currency** divides the workload performance index by effective price.

An included setup deduction is capped so effective price never falls below 1 currency unit.

## Performance formula

The collection selects its benchmark basis once through `scoreMany`, before scoring individual rows. Available listings select the common basis for buyable rankings in Compare and Table. Adding/removing an available listing can change that basis; filters, display order and archived listings cannot. Archived listings are non-ranking diagnostics with zero deal scores. Versus rescores its selected pair on their common evidence and displays pair-relative scores, so it never mixes an archived fallback with an active suite result. A pair’s index can differ from the full collection when their shared coverage is more specific.

1. CPU gaming/application suites are used only if the reference and **every compared listing** have the required exact compatible records. Otherwise the entire collection uses PassMark CPU metrics.
2. PassMark CPU single-thread percentage is the listing's measured single-thread rating divided by the reference rating. Multi-thread percentage uses CPU Mark divided by reference CPU Mark. The profile blends these percentages using `singleMix` only when all CPUs have single-thread coverage. If coverage is incomplete, all rows use CPU Mark only and show an explicit warning; single-thread comparison percentages remain unavailable. A known raw single-thread rating may still be displayed.
3. GPU gaming-suite percentages are used only if the reference and every listing have a positive record at the selected resolution/rendering mode. Otherwise every GPU uses G3D Mark. Missing or zero suite values never become zero-FPS claims.
4. CPU/GPU percentages are combined using the selected profile's shares. Benchmarks from different sources are never chosen independently for competing rows of the same component.
5. Exact benchmark model identity takes precedence over aliases. Ambiguous normalized names, unspecified VRAM variants, and K/F/KF suffixes do not borrow another model's measured evidence.

The interface currently exposes the three profiles below. The engine also supports a matched application-suite profile for programmatic consumers, but it is not an additional selectable workload.

| Profile | CPU share | GPU share | Single-thread mix |
| --- | ---: | ---: | ---: |
| Balanced / general use | 45% | 55% | 45% |
| Gaming | 35% | 65% | 75% |
| CPU-heavy / competitive gaming | 60% | 40% | 80% |

These profiles are useful relative estimates, not a substitute for exact game- or application-specific benchmark results. The app also reports an **estimated GPU-suite FPS** when a GPU has a curated record: it multiplies the GPU’s suite percentage by the source’s published RTX 5090 geometric-mean FPS at the chosen resolution and rendering mode. This is a multi-game suite aggregate, not an estimate for any one title and not a guarantee for the whole PC. The published GPU testbed uses a Ryzen 7 9800X3D, so slower CPUs can bottleneck more strongly, especially at 1080p. RAM/VRAM capacity, power limits, cooling, drivers and game settings can also change real outcomes. Unsupported GPUs deliberately show no FPS estimate rather than an invented or interpolated value.

## Benchmark data

### CPU single-thread

`builtin-parts.js` contains automatically refreshed PassMark PerformanceTest single-thread ratings from all rows embedded in https://www.cpubenchmark.net/singleThread.html, alongside CPU Mark and G3D Mark. The chart currently embeds thousands of rows across categories, including rows hidden by its display filters. The sync checks minimum coverage, shrinkage and score changes before writing anything; a blocked or truncated page preserves the entire previous catalog. It makes one request per page (two CPU pages and one GPU page), with no per-CPU requests. `benchmark-data.js` contains a curated subset of Tom’s Hardware CPU Hierarchy 2026 gaming, single-threaded application and multi-threaded application scores. Each record includes aliases and a source URL. Tom’s CPU gaming suite tests 17 games at 1080p with an RTX 5090 FE; it is a CPU-limited comparison suite, not a prediction of a user’s exact FPS. The application suite uses a separate test bench and must not be mixed with PassMark scores. PassMark CPU Mark and G3D Mark remain the broad fallback and are refreshed by the existing generator.

### GPU gaming

`benchmark-data.js` contains a curated subset of Tom's Hardware's 2026 GPU hierarchy:
- rasterization at native 1080p, 1440p and 4K Ultra;
- a separate ray-tracing suite at the same resolutions;
- indices relative to the RTX 5090 in the corresponding resolution/mode table. The FPS estimator uses the source’s RTX 5090 suite baselines: raster 203.8 / 167.3 / 110.8 FPS and ray tracing 125.7 / 100.8 / 64.1 FPS at 1080p / 1440p / 4K respectively. These are geometric-mean suite results, not per-game values.

The source suite uses a geometric mean across multiple games and excludes upscaling/frame generation. These percentages should never be described as expected FPS in an individual game.

Source: https://www.tomshardware.com/reviews/gpu-hierarchy,4388.html

### Evidence quality

- **High:** both CPU single-thread records and a compatible GPU gaming-suite record are available.
- **Medium:** one of those two evidence groups is available.
- **Low:** the score falls back to the broad PassMark CPU/GPU composite.

Confidence describes benchmark coverage, not certainty about a particular PC's real-world performance.

## Adding or refreshing data

Tom’s Hardware suite records are curated. PassMark CPU Mark, single-thread ratings and G3D Mark are refreshed together by the weekly sync; single-thread coverage is also validated in CI. A data validation script checks source URLs, numeric ranges, duplicate model aliases and the update date on every CI run. This catches malformed edits, not changed values at the source; a human still needs to refresh the records when the source methodology or rankings change.

1. Verify the exact model and benchmark value on the linked source page.
2. Preserve the source URL, aliases and benchmark suite/methodology.
3. Only compare scores within the same source/test suite, resolution and mode. Do not merge scores from different test benches into one scale.
4. If a GPU is not in the gaming suite, let it fall back to PassMark instead of estimating or interpolating a score.
5. Update `updatedAt` and the model version when a scoring behavior changes.
6. Run `node scripts/check-benchmark-data.js`, `node tests/scoring-engine.test.js` and the GitHub Actions static-app workflow.

## Regression coverage

The tests check the Ryzen 5 2600X to Ryzen 7 5700X upgrade with the same GPU, CPU gaming suite selection, productivity app-suite blending, resolution-specific raster scores, separate ray-tracing scores, unknown hardware fallback, custom reference fallback, minimum dataset coverage, and the i7-12700F versus Ryzen 7 5700X daily-driver regression. Offline sync tests cover chart parsing, category deduplication, repeatable generation, missing pages, suspicious score changes and preservation of unknown fields.

## Audit and ongoing source checks

See [BENCHMARK_AUDIT.md](BENCHMARK_AUDIT.md) for the source review and known limits. A separate Monday/manual workflow runs `node scripts/check-curated-sources.mjs` to detect upstream score, model, FPS-baseline or page-layout changes. Failures appear in GitHub Actions; the check does not silently replace curated evidence. Ordinary pull-request CI uses deterministic offline fixtures instead of requiring a live third-party site.

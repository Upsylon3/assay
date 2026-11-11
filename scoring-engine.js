/* Versioned performance model. Benchmark ratios are only compared within a compatible source/test suite. */
(function(root){
  "use strict";
  const MODEL_VERSION = "performance-v2.5";
  const normalize = value => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
  function findRecord(rows, name) {
    const key = normalize(name);
    return (rows || []).find(row => [row.model, ...(row.aliases || [])].some(alias => normalize(alias) === key)) || null;
  }
  function singleThreadRecord(name) {
    // Strip vendor boilerplate only; retain model suffixes such as F, KF and X3D.
    const cpuKey = value => normalize(String(value || "")
      .replace(/^\d+(?:st|nd|rd|th) Gen\s+/i, "")
      .replace(/\((?:R|TM)\)/gi, "")
      .replace(/\s+(?:\d+-Core|Six-Core|Eight-Core|Twelve-Core) Processor$/i, "")
      .replace(/^(?:AMD|Intel)\s+/i, ""));
    const key = cpuKey(name);
    const row = ((root.BUILTIN && root.BUILTIN.cpuSingleThread) || []).find(([model]) => cpuKey(model) === key);
    return row ? { model: row[0], score: row[1], source: "https://www.cpubenchmark.net/singleThread.html" } : null;
  }
  function gpuGamingRecord(name) {
    return findRecord((root.PVL_BENCHMARKS && root.PVL_BENCHMARKS.gpuGaming) || [], name);
  }
  function cpuGamingRecord(name) {
    return findRecord((root.PVL_BENCHMARKS && root.PVL_BENCHMARKS.cpuGaming) || [], name);
  }
  function cpuAppSingleRecord(name) {
    return findRecord((root.PVL_BENCHMARKS && root.PVL_BENCHMARKS.cpuAppSingleThread) || [], name);
  }
  function cpuAppMultiRecord(name) {
    return findRecord((root.PVL_BENCHMARKS && root.PVL_BENCHMARKS.cpuAppMultiThread) || [], name);
  }
  function score(parts, reference, profile) {
    const cpuMark = Math.max(0, Number(parts.cpuScore) || 0);
    const gpuMark = Math.max(0, Number(parts.gpuScore) || 0);
    const refCpu = Math.max(1, Number(reference.cpu) || 1);
    const refGpu = Math.max(1, Number(reference.gpu) || 1);
    const record = singleThreadRecord(parts.cpuName);
    const refRecord = singleThreadRecord(reference.cpuName);
    const useSingleThreadBenchmarks = !!(record && refRecord);
    const cpuSingle = record ? record.score : null;
    const cpuMultiPct = cpuMark / refCpu * 100;
    const cpuSinglePct = useSingleThreadBenchmarks ? record.score / refRecord.score * 100 : null;
    const singleMix = Math.max(0, Math.min(1, Number(profile.singleMix ?? 0.5)));
    const passmarkCpuPct = useSingleThreadBenchmarks
      ? cpuSinglePct * singleMix + cpuMultiPct * (1 - singleMix) : cpuMultiPct;
    const cpuGame = cpuGamingRecord(parts.cpuName);
    const refCpuGame = cpuGamingRecord(reference.cpuName);
    const cpuAppSingle = cpuAppSingleRecord(parts.cpuName);
    const refCpuAppSingle = cpuAppSingleRecord(reference.cpuName);
    const cpuAppMulti = cpuAppMultiRecord(parts.cpuName);
    const refCpuAppMulti = cpuAppMultiRecord(reference.cpuName);
    const cpuGamingAvailable = !!(profile.useCpuGamingBenchmarks && cpuGame && refCpuGame && cpuGame.score > 0 && refCpuGame.score > 0);
    const cpuAppsAvailable = !!(profile.useCpuAppBenchmarks && cpuAppSingle && refCpuAppSingle && cpuAppMulti && refCpuAppMulti &&
      cpuAppSingle.score > 0 && refCpuAppSingle.score > 0 && cpuAppMulti.score > 0 && refCpuAppMulti.score > 0);
    const cpuPct = cpuGamingAvailable ? cpuGame.score / refCpuGame.score * 100
      : cpuAppsAvailable ? (cpuAppSingle.score / refCpuAppSingle.score * 100) * singleMix + (cpuAppMulti.score / refCpuAppMulti.score * 100) * (1 - singleMix)
      : passmarkCpuPct;
    const cpuBenchmarkType = cpuGamingAvailable ? "tomCpuGaming" : cpuAppsAvailable ? "tomCpuApps" : "passmark";
    const cpuWarning = cpuBenchmarkType === "passmark" && !useSingleThreadBenchmarks && singleMix > 0
      ? "Single-thread comparison unavailable: CPU Mark only; workload ranking may be understated or overstated." : "";
    const rawGpuPct = gpuMark / refGpu * 100;
    const gameRecord = gpuGamingRecord(parts.gpuName);
    const refGameRecord = gpuGamingRecord(reference.gpuName);
    const resolution = ["1080p", "1440p", "4k"].includes(profile.resolution) ? profile.resolution : "1440p";
    const graphicsMode = profile.graphicsMode === "rayTracing" ? "rayTracing" : "raster";
    const gameScoresAvailable = !!(profile.useGameBenchmarks && gameRecord && refGameRecord &&
      gameRecord[graphicsMode] && refGameRecord[graphicsMode] &&
      gameRecord[graphicsMode][resolution] > 0 && refGameRecord[graphicsMode][resolution] > 0);
    const gpuPct = gameScoresAvailable
      ? gameRecord[graphicsMode][resolution] / refGameRecord[graphicsMode][resolution] * 100
      : rawGpuPct;
    const suiteBaselines = {
      raster: { "1080p": 203.8, "1440p": 167.3, "4k": 110.8 },
      rayTracing: { "1080p": 125.7, "1440p": 100.8, "4k": 64.1 }
    };
    // Convert the source suite index into its published geometric-mean FPS baseline.
    // This is a multi-game GPU-suite estimate, not a per-game or full-PC guarantee.
    const gpuSuiteFps = gameRecord && gameRecord[graphicsMode] && Number.isFinite(gameRecord[graphicsMode][resolution])
      ? gameRecord[graphicsMode][resolution] / 100 * suiteBaselines[graphicsMode][resolution]
      : null;
    const cpuShare = Math.max(0, Number(profile.cpuShare ?? 0.5));
    const gpuShare = Math.max(0, Number(profile.gpuShare ?? 0.5));
    const total = cpuShare + gpuShare || 1;
    const idx = Math.max(0, cpuPct * cpuShare / total + gpuPct * gpuShare / total);
    const hasCuratedCpuEvidence = cpuGamingAvailable || cpuAppsAvailable || useSingleThreadBenchmarks;
    const confidence = gameScoresAvailable && hasCuratedCpuEvidence ? "high"
      : (gameScoresAvailable || hasCuratedCpuEvidence) ? "medium" : "low";
    const evidence = [
      cpuGamingAvailable ? "Tom's Hardware 2026 17-game CPU suite"
        : cpuAppsAvailable ? "Tom's Hardware 2026 single-/multi-thread application suites"
        : useSingleThreadBenchmarks ? "PassMark CPU single-thread + CPU Mark multi-thread"
        : "PassMark CPU Mark only (single-thread comparison unavailable)",
      gameScoresAvailable ? `Tom's Hardware 2026 ${graphicsMode === "rayTracing" ? "ray-tracing" : "raster"} ${resolution} GPU suite` : "PassMark G3D Mark GPU fallback"
    ].join("; ");
    return {
      idx, cpuPct, cpuSinglePct, cpuMultiPct, cpuSingleScore: cpuSingle, cpuSingleMeasured: !!record, cpuWarning,
      cpuPassmarkPct: passmarkCpuPct, cpuBenchmarkType, cpuGamingMeasured: cpuGamingAvailable, cpuAppsMeasured: cpuAppsAvailable,
      gpuPct, gpuPassmarkPct: rawGpuPct, gpuGamingMeasured: gameScoresAvailable,
      gpuBenchmarkType: gameScoresAvailable ? graphicsMode : "passmark",
      gpuResolution: resolution, gpuSuiteFps, confidence, evidence, modelVersion: MODEL_VERSION
    };
  }
  root.PVL_SCORING = { score, normalize, modelVersion: MODEL_VERSION, singleThreadRecord, gpuGamingRecord, cpuGamingRecord, cpuAppSingleRecord, cpuAppMultiRecord };
})(window);

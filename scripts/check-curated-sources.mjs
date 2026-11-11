// Read-only provenance check. Run manually when reviewing a curated refresh;
// Run separately from pull-request CI: this checks live upstream availability
// and drift, while the ordinary test suite remains deterministic and offline.
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import vm from "node:vm";

const cpuUrl = "https://www.tomshardware.com/reviews/cpu-hierarchy,4312.html";
const gpuUrl = "https://www.tomshardware.com/reviews/gpu-hierarchy,4388.html";
async function source(url, envName) {
  if (process.env[envName]) return readFile(process.env[envName], "utf8");
  const response = await fetch(url, {signal: AbortSignal.timeout(60000)});
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}
const clean = html => html.replace(/<[^>]*>/g, "").replace(/&(?:nbsp|amp);/g, " ").replace(/\s+/g, " ").trim();
const tables = html => [...html.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)].map(([table]) => ({
  text: clean(table),
  rows: [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].map(([, row]) =>
    [...row.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(([, cell]) => clean(cell)))
}));
const cpuName = name => name.replace(/^(?:AMD|Intel) /, "");
const gpuName = name => name.replace(/^(?:AMD|NVIDIA) /, "");
const errors = [];
let checked = 0;
function verify(label, actual, expected) {
  checked++;
  if (!Number.isFinite(expected) || actual !== expected) errors.push(`${label}: bundled ${actual}, source ${expected}`);
}
try {
  const [cpuHtml, gpuHtml, code, scorer] = await Promise.all([
    source(cpuUrl, "CPU_HIERARCHY_HTML_FILE"),
    source(gpuUrl, "GPU_HIERARCHY_HTML_FILE"),
    readFile(new URL("../benchmark-data.js", import.meta.url), "utf8"),
    readFile(new URL("../scoring-engine.js", import.meta.url), "utf8")
  ]);
  const sandbox = {window: {}};
  vm.runInNewContext(code, sandbox);
  vm.runInNewContext(scorer, sandbox);
  const data = sandbox.window.PVL_BENCHMARKS;
  const cpuTables = tables(cpuHtml);
  for (const [key, title, column] of [
    ["cpuGaming", "Gaming CPU Benchmarks Rankings 2026", 2],
    ["cpuAppSingleThread", "2026 Single-Threaded CPU Benchmarks", 1],
    ["cpuAppMultiThread", "2026 Multi-Threaded CPU Benchmarks", 1]
  ]) {
    const table = cpuTables.find(table => table.text.startsWith(title));
    if (!table) throw new Error(`Source layout changed: ${title}`);
    for (const record of data[key]) {
      // Exact model only: K/F/KF suffixes are separate evidence identities.
      const row = table.rows.find(row => row[0].replace(/ \(\$[\d.]+\)$/, "") === cpuName(record.model));
      verify(`${key} ${record.model}`, record.score, row ? parseFloat(row[column]) : NaN);
    }
  }
  const gpuTables = tables(gpuHtml);
  for (const [mode, title] of [["raster", "GPU Benchmarks Hierarchy — Rasterization Performance"], ["rayTracing", "GPU Benchmarks Hierarchy — Ray Tracing Performance"]]) {
    const table = gpuTables.find(table => table.text.startsWith(title));
    if (!table) throw new Error(`Source layout changed: ${title}`);
    const baselineRow = table.rows.find(row => row[0] === "GeForce RTX 5090");
    for (const [index, resolution] of ["1080p", "1440p", "4k"].entries()) {
      const fps = baselineRow?.[index + 2]?.match(/\(([\d.]+)\)/)?.[1];
      verify(`${mode} ${resolution} FPS baseline`, sandbox.window.PVL_SCORING.suiteBaselines[mode][resolution], Number(fps));
    }
    for (const record of data.gpuGaming) {
      const row = table.rows.find(row => row[0] === gpuName(record.model));
      for (const [index, resolution] of ["1080p", "1440p", "4k"].entries()) {
        verify(`${record.model} ${mode} ${resolution}`, record[mode]?.[resolution], row ? parseFloat(row[index + 2]) : NaN);
      }
    }
  }
  console.log(`Checked ${checked} curated CPU/GPU score cells and FPS baselines against exact source models.`);
  console.log(`CPU source SHA-256: ${createHash("sha256").update(cpuHtml).digest("hex")}`);
  console.log(`GPU source SHA-256: ${createHash("sha256").update(gpuHtml).digest("hex")}`);
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else console.log("All curated scores match the published tables.");
} catch (error) {
  console.error(`Source audit failed: ${error.message}`);
  process.exitCode = 1;
}

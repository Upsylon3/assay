import assert from "node:assert/strict";
import { readFile, writeFile, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const dataFile = new URL("../benchmark-data.js", import.meta.url);
const original = await readFile(dataFile, "utf8");
const sandbox = {window: {}};
vm.runInNewContext(original, sandbox);
vm.runInNewContext(await readFile(new URL("../scoring-engine.js", import.meta.url), "utf8"), sandbox);
const data = sandbox.window.PVL_BENCHMARKS;
const baselines = sandbox.window.PVL_SCORING.suiteBaselines;
const dir = await mkdtemp(path.join(tmpdir(), "assay-source-check-"));
const cpuFile = path.join(dir, "cpu.html");
const gpuFile = path.join(dir, "gpu.html");
const name = model => model.replace(/^(?:AMD|Intel|NVIDIA) /, "");
const row = values => `<tr>${values.map(value => `<td>${value}</td>`).join("")}</tr>`;
const table = (title, rows) => `<table><caption>${title}</caption>${rows.join("")}</table>`;
const cpu = [
  ["cpuGaming", "Gaming CPU Benchmarks Rankings 2026"],
  ["cpuAppSingleThread", "2026 Single-Threaded CPU Benchmarks"],
  ["cpuAppMultiThread", "2026 Multi-Threaded CPU Benchmarks"]
].map(([key, title]) => table(title, data[key].map(record => row(key === "cpuGaming"
  ? [`${name(record.model)} ($500)`, "$900", `${record.score}%`]
  : [name(record.model), `${record.score}%`])))).join("");
const gpu = [["raster", "Rasterization"], ["rayTracing", "Ray Tracing"]].map(([mode, title]) =>
  table(`GPU Benchmarks Hierarchy — ${title} Performance`, data.gpuGaming.map(record => row([
    name(record.model), "$1000", ...["1080p", "1440p", "4k"].map(resolution =>
      `${record[mode][resolution]}% (${record.model.includes("5090") ? baselines[mode][resolution] : 50})`)
  ])))).join("");
const script = fileURLToPath(new URL("../scripts/check-curated-sources.mjs", import.meta.url));
const run = () => spawnSync(process.execPath, [script], {encoding: "utf8", env: {
  ...process.env, CPU_HIERARCHY_HTML_FILE: cpuFile, GPU_HIERARCHY_HTML_FILE: gpuFile
}});
try {
  await writeFile(cpuFile, cpu);
  await writeFile(gpuFile, gpu);
  let result = run();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /Checked 211 /);
  await writeFile(cpuFile, cpu.replace("97%", "96%"));
  result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /cpuGaming AMD Ryzen 7 9800X3D/);
  await writeFile(cpuFile, cpu);
  await writeFile(gpuFile, gpu.replace("(167.3)", "(166.3)"));
  result = run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /raster 1440p FPS baseline/);
  await writeFile(gpuFile, "<html>Blocked source</html>");
  assert.notEqual(run().status, 0, "missing tables must fail visibly");
  assert.equal(await readFile(dataFile, "utf8"), original, "source checks must never mutate bundled data");
  console.log("Curated source verifier tests passed: exact cells, FPS baseline drift, layout failures and read-only behavior.");
} finally {
  await rm(dir, {recursive: true, force: true});
}

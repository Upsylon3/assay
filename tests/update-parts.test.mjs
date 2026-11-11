import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";

const script = fileURLToPath(new URL("../scripts/update-parts.mjs", import.meta.url));
const dir = await mkdtemp(path.join(tmpdir(), "assay-parts-test-"));
const output = path.join(dir, "builtin-parts.js");
const cpuPage = path.join(dir, "cpu.html");
const gpuPage = path.join(dir, "gpu.html");
const singlePage = path.join(dir, "single.html");
const table = (count, marker) => Array.from({length: count}, (_, i) => `<tr><td><a href="${marker}?id=${i}">Part ${i}</a></td><td>20,000</td></tr>`).join("");
const chart = count => Array.from({length: count}, (_, i) => `<li><a href="/cpu.php?id=${i}"><span class="prdname">Part ${i}</span><span class="index">(80%)</span><span class="count">3,842</span><span class="price-neww">$100.00</span></a></li>`).join("");
const run = () => spawnSync(process.execPath, [script], {
  cwd: dir, encoding: "utf8", env: {...process.env, FORCE: "false", GITHUB_STEP_SUMMARY: "", CPU_HTML_FILE: cpuPage, GPU_HTML_FILE: gpuPage, CPU_SINGLE_HTML_FILE: singlePage},
});
try {
  await writeFile(output, "window.BUILTIN = {cpus: [], gpus: []};\n");
  await writeFile(cpuPage, table(3000, "cpu_lookup.php"));
  await writeFile(gpuPage, table(1500, "video_lookup.php"));
  await writeFile(singlePage, chart(3000) + '<li><span class="prdname">Part 0</span><span class="count">3,842</span></li>');
  let result = run();
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const good = await readFile(output, "utf8");
  const sandbox = {window: {}};
  vm.runInNewContext(good, sandbox);
  assert.equal(sandbox.window.BUILTIN.cpuSingleThread.length, 3000, "deduplicate categories");
  assert.equal(sandbox.window.BUILTIN.cpuSingleThread[0][1], 3842, "parse count rather than percent or price");
  assert.equal(run().status, 0, "generated schema must be readable on the next sync");
  assert.equal(await readFile(output, "utf8"), good, "unchanged sources produce identical output");
  await writeFile(singlePage, '<html>Blocked or changed layout</html>');
  result = run();
  assert.notEqual(result.status, 0);
  assert.equal(await readFile(output, "utf8"), good, "a broken single-thread page must preserve the entire catalog");
  await writeFile(singlePage, chart(3000).replaceAll("3,842", "7,999"));
  result = run();
  assert.notEqual(result.status, 0, "large single-thread score changes must trigger the safety stop");
  assert.equal(await readFile(output, "utf8"), good);
  await writeFile(singlePage, chart(3000) + '<li><span class="prdname">Part 0</span><span class="count">1,234</span></li>');
  assert.notEqual(run().status, 0, "contradictory category duplicates must stop the sync");
  assert.equal(await readFile(output, "utf8"), good);
  await writeFile(singlePage, chart(3000));
  await writeFile(output, good.replace("cpuSingleThread: [", 'unexpected: [], cpuSingleThread: ['));
  const extra = await readFile(output, "utf8");
  assert.notEqual(run().status, 0, "unknown existing fields must never be silently erased");
  assert.equal(await readFile(output, "utf8"), extra);
  console.log("PassMark sync regression tests passed");
} finally {
  await rm(dir, {recursive: true, force: true});
}

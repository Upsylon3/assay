// Regression tests for the repository's own tooling: the commit/branch
// convention checker and the release validator. Run with plain Node, like
// the scoring tests: `node tests/conventions.test.js`.
const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const { mkdtempSync, writeFileSync, readFileSync } = require("node:fs");
const { tmpdir } = require("node:os");
const { join } = require("node:path");

const repo = join(__dirname, "..");
const run = (script, args, cwd = repo) =>
  spawnSync(process.execPath, [join(repo, "scripts", script), ...args], { cwd, encoding: "utf8" });

// --- Commit subjects ------------------------------------------------------
for (const ok of [
  "feat(table): add a column picker",
  "fix: stop the weekly sync wiping builtin-parts.js",
  "docs: explain the release steps",
  "chore(release): prepare v0.8.0",
  "feat(sync)!: change the listing id format",
  "chore(parts): weekly PassMark sync",
]) {
  assert.equal(run("check-commit-message.mjs", ["--message", ok]).status, 0, `should accept: ${ok}`);
}
for (const bad of [
  "Weekly PassMark sync",               // no type
  "fix: Stop the sync wiping parts",    // capital after the colon
  "feat(Table): add a column picker",   // scope must be lowercase
  "fix: general bug fixes.",            // trailing period
  "update stuff",
]) {
  assert.equal(run("check-commit-message.mjs", ["--message", bad]).status, 1, `should reject: ${bad}`);
}

// --- Branch names ---------------------------------------------------------
for (const ok of ["feat/goal-toggle", "docs/release-guide", "dependabot/github_actions/actions/checkout-5"]) {
  assert.equal(run("check-commit-message.mjs", ["--branch", ok]).status, 0, `should accept branch: ${ok}`);
}
for (const bad of ["main", "my-fix", "Feat/Thing", "feat/Two_Words"]) {
  assert.equal(run("check-commit-message.mjs", ["--branch", bad]).status, 1, `should reject branch: ${bad}`);
}

// --- Ranges: the legacy bot subject is tolerated, nothing else is --------------
const { execFileSync } = require("node:child_process");
const repoDir = mkdtempSync(join(tmpdir(), "assay-range-"));
const git = (...a) => execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...a], { cwd: repoDir, encoding: "utf8" });
git("init", "-q");
git("commit", "-q", "--allow-empty", "-m", "chore: base");
const base = git("rev-parse", "HEAD").trim();
git("commit", "-q", "--allow-empty", "-m", "Weekly PassMark sync");
git("commit", "-q", "--allow-empty", "-m", "fix: keep the sort column");
assert.equal(run("check-commit-message.mjs", ["--range", `${base}..HEAD`], repoDir).status, 0, "the legacy sync subject must not fail a range");
git("commit", "-q", "--allow-empty", "-m", "update stuff");
assert.equal(run("check-commit-message.mjs", ["--range", `${base}..HEAD`], repoDir).status, 1, "any other bad subject in the range must still fail");
assert.equal(run("check-commit-message.mjs", ["--message", "Weekly PassMark sync"]).status, 1, "the legacy subject is still refused as a new message");

// --- Release validator, against the real repository -----------------------
const version = readFileSync(join(repo, "VERSION"), "utf8").trim();
const real = run("validate-release.mjs", [`v${version}`, repo]);
assert.equal(real.status, 0, `the current version must validate: ${real.stderr}`);
assert.ok(real.stdout.trim().length > 0, "release notes must not be empty");
assert.equal(run("validate-release.mjs", ["v999.999.999", repo]).status, 1, "a mismatched tag must be refused");
assert.equal(run("validate-release.mjs", ["1.0.0", repo]).status, 1, "a tag without the v prefix must be refused");

// --- Release validator, against deliberately broken copies -----------------
const scratch = (version, changelog) => {
  const dir = mkdtempSync(join(tmpdir(), "assay-release-"));
  writeFileSync(join(dir, "VERSION"), version + "\n");
  writeFileSync(join(dir, "CHANGELOG.md"), changelog);
  return dir;
};
assert.equal(
  run("validate-release.mjs", ["v1.0.0", scratch("1.0.0", "# Changelog\n\n## [Unreleased]\n\n## [0.9.0] — older\n\n- x\n")]).status,
  1, "newest changelog heading must match VERSION");
assert.equal(
  run("validate-release.mjs", ["v1.0.0", scratch("1.0.0", "# Changelog\n\n## [1.0.0] — empty\n\n## [0.9.0] — older\n\n- x\n")]).status,
  1, "an empty changelog section must not be published");
const good = run("validate-release.mjs", ["v1.0.0", scratch("1.0.0", "# Changelog\n\n## [Unreleased]\n\n## [1.0.0] — first\n\n- Added x.\n\n## [0.9.0] — older\n\n- y\n")]);
assert.equal(good.status, 0);
assert.equal(good.stdout.trim(), "- Added x.", "only the matching section becomes the release notes");

console.log("conventions: all checks passed");

#!/usr/bin/env node
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const TYPES = "feat|fix|docs|chore|refactor|test|ci|build|perf|revert";
const HEADER = new RegExp(
  `^(?:${TYPES})(?:\\([a-z0-9]+(?:-[a-z0-9]+)*\\))?!?: [a-z0-9][^\\r\\n]*$`
);
const BRANCH = /^(feat|fix|docs|chore|refactor|test|ci|build|perf)\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
// The weekly PassMark sync used to commit with this exact subject, before the
// Conventional Commits rule existed (0.8.0). Those commits are already in
// history, and a branch that was opened before the rule can still carry one,
// which would turn every such pull request and push red for a message nobody
// can fix without rewriting main. The workflow now commits as
// "chore(parts): weekly PassMark sync". Only this exact string is tolerated,
// and only when checking a range: new commits, branch names and PR titles are
// still held to the rule.
const LEGACY_SUBJECTS = new Set(["Weekly PassMark sync"]);
const args = process.argv.slice(2);

function usage() {
  console.error(
    "Usage: check-commit-message.mjs --message <subject> | --message-file <path> | --range <base..head> | --branch <name>"
  );
  process.exit(2);
}

function validateMessage(message, source) {
  const subject = String(message).split(/\r?\n/, 1)[0];
  if (subject !== subject.trim()) {
    console.error(`✗ ${source}: remove leading or trailing whitespace from the subject.`);
    return false;
  }
  if (!HEADER.test(subject) || subject.endsWith(".")) {
    console.error(
      `✗ ${source}: "${subject}" is not a valid Conventional Commit subject. ` +
      "Use <type>(<scope>): <imperative summary>."
    );
    return false;
  }
  return true;
}

function validateBranch(name) {
  if (name.startsWith("dependabot/")) return true;
  if (BRANCH.test(name)) return true;
  console.error(
    `✗ branch "${name}" must use a type prefix and kebab-case name, ` +
    "for example feat/shared-folder-expiry or docs/release-guide."
  );
  return false;
}

let ok = true;
const mode = args[0];

try {
  if (mode === "--message") {
    if (!args[1]) usage();
    ok = validateMessage(args[1], "message");
  } else if (mode === "--message-file") {
    if (!args[1]) usage();
    ok = validateMessage(readFileSync(args[1], "utf8"), args[1]);
  } else if (mode === "--branch") {
    if (!args[1]) usage();
    ok = validateBranch(args[1]);
  } else if (mode === "--range") {
    if (!args[1] || !args[1].includes("..")) usage();
    const output = execFileSync(
      "git",
      ["log", "--no-merges", "--format=%H%x1f%s", args[1]],
      { encoding: "utf8" }
    );
    const entries = output.split(/\r?\n/).filter(Boolean);
    for (const entry of entries) {
      const [sha, subject] = entry.split("\x1f", 2);
      if (LEGACY_SUBJECTS.has(subject)) continue;
      if (!validateMessage(subject ?? "", sha?.slice(0, 8) ?? "commit")) ok = false;
    }
    if (entries.length === 0) console.log("No non-merge commits in the selected range.");
  } else {
    usage();
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}

if (!ok) process.exit(1);
console.log("Commit/branch convention check passed.");

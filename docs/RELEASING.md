# Releasing Assay

This is the operational checklist for producing a release. The version
authority and the increment rules are in [VERSIONING.md](../VERSIONING.md).

## 1. Prepare the release

1. Merge release-bound pull requests into `main`. Do not release from an
   unreviewed feature branch.
2. Set the target version in `VERSION`.
3. Move the completed entries from `[Unreleased]` in `CHANGELOG.md` into a
   new heading matching `VERSION`: `## [X.Y.Z] — Short release summary`.
   Leave an empty `[Unreleased]` above it.
4. Commit the preparation with a Conventional Commit subject, for example
   `chore(release): prepare v0.9.0`, through a pull request.
5. Run the regression checks in [Development](DEVELOPMENT.md) and smoke-test
   affected workflows on desktop and mobile. At minimum, check the benchmark
   data, scoring, repository tooling and release metadata locally:

   ```bash
   node scripts/check-benchmark-data.js
   node tests/scoring-engine.test.js
   node tests/conventions.test.js
   node scripts/validate-release.mjs vX.Y.Z .   # prints the release notes
   ```

6. Merge the PR after its checks pass. Wait for `Validate static app` and
   `Repository conventions` to pass on the exact resulting `main` commit.

## 2. Tag and publish

```bash
git fetch origin main
# Set release_sha to the exact main commit that passed CI.
git tag -a vX.Y.Z "$release_sha" -m "Assay vX.Y.Z"
git push origin vX.Y.Z
```

The `Release` workflow then checks that the tag is annotated and reachable
from `main`, that `VERSION`, the tag and the newest changelog heading agree,
and that `Validate static app` succeeded on that exact commit. It repeats the
three test commands and publishes the GitHub Release with the changelog
section as its notes. If a Release for the tag already exists it leaves it
alone.

If the workflow fails before it creates the Release for a transient reason,
re-run it from **Actions → Release → Run workflow** with the tag name. If the
tag itself was wrong and nothing was published, delete the tag and tag the
right commit. Once a Release is published, correct it with the next version.

## 3. After the release

- Open the Release page and check the notes match the changelog.
- Nothing is deployed by a release. GitHub Pages serves `main`, so the live
  site already has the change; the tag only marks which commit it was.
- Weekly PassMark syncs keep landing on `main` between releases. They are
  data refreshes and do not need a release.

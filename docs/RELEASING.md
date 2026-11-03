# Releasing Assay

This is the operational checklist for producing a release. The version
authority and the increment rules are in [VERSIONING.md](../VERSIONING.md).

## 1. Prepare the release

1. Merge release-bound pull requests into `main`. Do not release from an
   unreviewed feature branch.
2. Wait for `Validate static app` and `Repository conventions` to pass on the
   exact commit you intend to tag.
3. Update the version in the `VERSION` file only.
4. Move the completed entries from `[Unreleased]` in `CHANGELOG.md` into a
   new heading matching `VERSION`: `## [X.Y.Z] — Short release summary`.
   Leave an empty `[Unreleased]` above it.
5. Commit the preparation with a Conventional Commit subject, for example
   `chore(release): prepare v0.9.0`, through a pull request.
6. Run the checks locally, or confirm the equivalent CI checks on the
   resulting `main` commit:

   ```bash
   node scripts/check-benchmark-data.js
   node tests/scoring-engine.test.js
   node tests/conventions.test.js
   node scripts/validate-release.mjs vX.Y.Z .   # prints the release notes
   ```

   The syntax check of the inline script in `index.html` only runs in CI.

## 2. Tag and publish

```bash
git switch main && git pull
git tag -a vX.Y.Z -m "Assay vX.Y.Z"
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

## The first release, 0.8.0

0.8.0 comes with the rename, so do these once, in this order:

1. Rename the repository to `assay` (**Settings → General → Repository
   name**). GitHub redirects the old repository address; GitHub Pages does
   not redirect the old live address, so the site now lives at
   `https://upsylon3.github.io/assay/`.
2. Update any local clone: `git remote set-url origin https://github.com/Upsylon3/assay.git`.
3. Merge the change that carries this file, then tag that merge commit as
   `v0.8.0` as above.

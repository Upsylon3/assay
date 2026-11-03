## Summary

<!-- What changes for the user? -->

## Why

<!-- Link the issue or roadmap item. Explain why this belongs in Assay. -->

## Implementation

<!-- Describe the approach and important trade-offs. -->

## Safety and compatibility

- Security/privacy impact:
- Saved-data impact (listing format, backups, `setup.sql`, sync):
- Scoring impact (does a ranking change? model or dataset version bumped?):
- Reversibility/rollback:

## Verification

- [ ] `node scripts/check-benchmark-data.js`
- [ ] `node tests/scoring-engine.test.js`
- [ ] `node tests/conventions.test.js`
- [ ] Checked in a browser at a narrow and a desktop width, if the UI changed
- [ ] All applicable GitHub checks are green

Exact commands and results:

## Documentation and release

- [ ] Relevant docs updated in this change
- [ ] `CHANGELOG.md` updated under `[Unreleased]` for user-visible changes
- [ ] No version bump unless this is a deliberate release

## Self-review

- [ ] Read the complete diff against `main`
- [ ] No unrelated changes, secrets, personal backups or generated artifacts
- [ ] Nothing claimed as tested that was not actually run

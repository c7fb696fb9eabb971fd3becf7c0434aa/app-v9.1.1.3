# TODO 16: Staging Acceptance, Production Cutover, and Rollback

**Status:** NOT STARTED  
**Depends on:** TODO 14, TODO 15

## Goal

Move from tested staging to the requested production Pages URL without losing recovery options.

## Work

- Run the complete user journey on staging with a dedicated write-enabled test account and non-production content.
- Confirm the owner account can authenticate and write to the exact repo; do not use a shared or embedded PAT.
- Verify public home -> right drawer login -> real PAT verification -> direct protected Secret Studio URL (with no drawer link) -> create page/sub-page/card, edit/move/delete, attach permitted media, review, one atomic commit, CI, Pages deploy, and public visibility.
- Record baseline current deployed URL/build/commit before cutover.
- Confirm production API secrets, allowed origins, branch protection, workflow permissions, Pages settings, rate limits, and alerting.
- Obtain explicit production cutover approval; deploy, smoke-test, and monitor. Keep rollback commit/artifact ready.

## Done When

- The public home -> right sidebar -> PAT login -> directly addressed protected Studio -> edit/publish -> Pages-visible path passes in staging and production.
- Every acceptance point is backed by commit SHA, workflow URL/status, and UI/API test evidence.
- Rollback is demonstrated and the owner signs off.

## Verification

If any security, auth, atomicity, CI, or deployment check fails, stop cutover and fix the owning TODO. Never force-push, delete the last working Pages artifact, or claim success without checking the public site.

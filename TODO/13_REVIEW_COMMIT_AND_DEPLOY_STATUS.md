# TODO 13: Review, Commit, and Deployment Status

**Status:** IN PROGRESS  
**Depends on:** TODO 07, TODO 08, TODO 11, TODO 12

## Goal

Make publishing intentional, atomic, observable, and recoverable.

## Work

- Build a review page/drawer showing all creates, edits, moves, reorders, deletes, and asset changes.
- Show target repository/branch and current/base commit; require explicit Publish confirmation.
- Send the complete batch through the GitHub Git Database API; preserve the draft on any failure.
- Return commit SHA/URL and track the exact Actions workflow run for that SHA.
- Distinguish committed, CI validation failed, build failed, deployment pending, deployed, and deployment unknown.
- Provide reload/reconcile paths; expected-head protection prevents a retry from overwriting a concurrent commit.

## Done When

- User can inspect and cancel before commit.
- One publish action produces one atomic commit and a traceable deployment state.
- UI never claims published solely because a GitHub file API call returned success.

## Verification

End-to-end test successful publish, invalid batch, stale branch, network retry, duplicate request, failed CI, successful Pages deploy, and delayed workflow status.

**Implemented locally:** A review dialog displays fixed repository/branch, base commit, mutation summary, commit message, and explicit confirmation. Publish uses one Git tree/commit and expected-head non-force update. Validation/conflict/GitHub failures preserve the draft. On success, the UI shows the commit SHA/URL and does not claim deployment completion before the matching Actions result.

**Not implemented/verified:** The UI does not yet poll the Actions run/deployment result. Real commit, concurrent publish, retry/replay, CI state, and deployed status require authenticated browser acceptance on an approved target.

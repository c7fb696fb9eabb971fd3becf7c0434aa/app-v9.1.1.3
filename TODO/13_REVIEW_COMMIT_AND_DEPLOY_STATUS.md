# TODO 13: Review, Commit, and Deployment Status

**Status:** IN PROGRESS  
**Depends on:** TODO 07, TODO 08, TODO 11, TODO 12

## Goal

Make publishing intentional, atomic, observable, and recoverable.

## Work

- Build a review page/drawer showing all creates, edits, moves, reorders, deletes, and asset changes.
- Show target repository/branch and current/base commit; require explicit Publish confirmation.
- Send the complete batch once with idempotency key; display progress and preserve draft on any failure.
- Return commit SHA/URL and track the exact Actions workflow run for that SHA.
- Distinguish committed, CI validation failed, build failed, deployment pending, deployed, and deployment unknown.
- Provide retry or reconcile paths without silently generating duplicate commits.

## Done When

- User can inspect and cancel before commit.
- One publish action produces one atomic commit and a traceable deployment state.
- UI never claims published solely because a GitHub file API call returned success.

## Verification

End-to-end test successful publish, invalid batch, stale branch, network retry, duplicate request, failed CI, successful Pages deploy, and delayed workflow status.

**Implemented locally:** A review dialog displays fixed repository/branch, base commit, mutation summary, commit message, and explicit confirmation. Publish sends the complete batch once with an idempotency key and expected head; the same key is retained across ambiguous retries of an unchanged request. Validation/conflict/API failures preserve the draft. On success, the UI shows the commit SHA/URL and explicitly does not claim deployment completion.

**Not implemented/verified:** There is no Actions-run/deployment-status API or Pages deploy workflow yet; the repository workflow currently runs CI only. Successful real commit, concurrent publish, retry/replay, CI state, and deployed status require provisioned auth and a staging repository.

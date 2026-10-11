# TODO 07: Browser GitHub Repository Client and Atomic Commits

**Status:** IN PROGRESS  
**Depends on:** TODO 03, TODO 04, TODO 06

## Goal

Read and publish content through GitHub's API directly from the GitHub Pages SPA, with a fixed repository binding and atomic branch updates.

## Work

- Use a fixed owner, repository, and branch; no user-selectable targets or arbitrary paths.
- Read the branch ref, Git commit/tree, record blobs, and asset paths from GitHub.
- Validate page/card/content relationships and build a single Git tree and commit for the full batch.
- Check expected branch head and update the ref with `force: false`; surface conflicts without discarding drafts.
- Map revoked token, permission, rate-limit, malformed content, and conflict states into actionable UI errors.

## Done When

- Create/update/move/reorder/delete batches become one commit with complete tree state.
- A stale or concurrently advanced head is rejected without force-push.
- Repository client is isolated behind the `features/github` public API.

## Verification

Unit tests currently cover snapshot endpoint traversal, commit/ref payload shape, fixed repository binding, and stale-head rejection. Schema rejection, binary asset round-trip, conflict/retry cases, and real GitHub acceptance still need dedicated coverage. Real writes must use an owner-approved isolated target; do not create or delete production content as a smoke test.

**Implemented locally:** direct GitHub REST/Git Database client reads fixed `main`, validates content, constructs blobs/tree/commit, and updates the ref non-forcibly. The browser token is held in memory only. GitHub live acceptance remains pending.

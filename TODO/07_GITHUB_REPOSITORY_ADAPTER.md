# TODO 07: GitHub Repository Adapter and Atomic Commits

**Status:** IN PROGRESS  
**Depends on:** TODO 03, TODO 04, TODO 06

## Goal

Implement a server-only GitHub adapter that reads repository data and commits a complete validated batch atomically.

## Work

- Restrict repository owner/name/branch to server configuration; never accept a client-selected repo or arbitrary Git path.
- Implement read tree/blob operations and translate GitHub rate-limit, missing-file, conflict, and permission errors.
- Build a Git tree containing all page/card/asset changes, create one commit with the fetched current head as parent, and update the ref only if it still points to that head.
- Return commit SHA/URL and typed conflict state. Never force-update a ref.
- Add idempotency for retryable publish requests and request IDs for traceable failures.

## Done When

- Create/update/move/reorder/delete batches result in one commit and all-or-nothing tree state.
- Stale head returns a conflict without losing either user's work.
- Adapter has no import path from the browser application.

## Verification

Unit-test API payloads and SHA handling; integration-test against an isolated staging repo for create/update/delete, duplicate retries, branch race, 403, 404, 409, and rate limit. Verify no write was made to production during tests.

**Local evidence:** The server-only GitHub adapter uses the configured repository binding, constructs a complete tree/commit batch, and updates the ref against its expected head without force. It returns snapshot commit SHA and maps authentication, permission, missing-resource, rate-limit, and conflict outcomes. Publish requests require an idempotency key; API and adapter behavior are covered by synthetic unit tests. Workspace API tests (19) pass.

**Not verified:** No isolated staging repository or credential is configured, so remote create/update/delete, duplicate concurrency, branch-race, and live rate-limit behavior remain unverified.

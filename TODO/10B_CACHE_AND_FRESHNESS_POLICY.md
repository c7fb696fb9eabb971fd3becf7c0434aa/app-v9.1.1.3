# TODO 10B: Cache, Prefetch, and Freshness Policy

**Status:** IN PROGRESS  
**Depends on:** TODO 02, TODO 03, TODO 06, TODO 07, TODO 08, TODO 10A

## Goal

Define intentional caching by data sensitivity and Git commit version; avoid stale edits and prohibit persistent browser storage for credentials/drafts.

## Policy to Implement

- Public built assets/content snapshots may use immutable caching when keyed by content hash or commit SHA. The generated index identifies its source commit.
- Authenticated API responses, user identity, PAT-derived data, drafts, and authorization results use `Cache-Control: no-store`; they never enter service worker, IndexedDB, localStorage, or shared CDN caches.
- A bounded in-memory query cache is permitted only if the owner approves it. Key it by authenticated session identity and source commit; clear on logout, expiry, auth change, publish, and conflict.
- After commit, invalidate/refetch from returned commit SHA; do not show stale cached records as committed state.
- Prefetch public static chunks/content only under TODO 10A. Private requests require explicit user navigation and valid session.
- Define cache TTL, revalidation, stale-while-revalidate eligibility, and offline behavior per data class; do not apply one policy globally.

## Done When

- Every request/data class has documented cache headers, keying, invalidation, and offline behavior.
- No PAT/session/private content is persisted in browser storage or included in a shared cache.
- Editor displays source SHA and detects stale drafts before publishing.

## Verification

Inspect response headers and browser storage; test commit invalidation, session change/logout, stale snapshot, offline public page, API no-store, and CDN cache-key isolation.

**Local evidence:** `docs/CACHE_POLICY.md` and shared `CACHE_POLICY` define separate handling for static assets, public commit-addressed content, and private API/session data. API auth/repository responses and browser authenticated fetches use no-store; browser auth is memory-only, with no service worker or persistent query cache. API/web tests pass.

**Not verified:** Deployed CDN headers/cache-key isolation, public-content stale/refetch behavior after publish, and offline browser behavior await deployment and editor flows.

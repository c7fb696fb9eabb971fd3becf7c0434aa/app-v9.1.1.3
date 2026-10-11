# Cache and Freshness Policy

| Data class | Cache policy | Identity/freshness | Offline behavior |
|---|---|---|---|
| HTML shell | Revalidate (`no-cache`) | Each request may receive the current entrypoint | Previously loaded shell can render its current in-memory route only |
| Hashed JS/CSS/media assets | Immutable for one year | Content-hashed filename | Already-downloaded assets may be reused by the browser |
| Public content snapshot | Immutable only when the URL includes its source commit SHA | `ContentIndex.sourceCommit` identifies the exact Git snapshot | A previously loaded public snapshot may remain readable but must display its source commit |
| Authenticated API, identity, authorization | `Cache-Control: no-store`, `Pragma: no-cache`, and browser `cache: 'no-store'` | Every operation validates the volatile bearer session; protected writes also compare the expected branch head | Fail closed; no persistent/private stale response |
| PAT and app session | Never placed in browser cache, localStorage, IndexedDB, Cache API, or URL | PAT is exchanged once; opaque session is memory-only and expires server-side | Re-enter PAT after reload or expiration |
| Drafts and previews | No persistent cache | In-memory feature state is based on a source commit SHA | Draft is lost on reload; user must reconcile after a branch conflict |

The app intentionally has no service worker or persistent query cache. No in-memory server-response cache is currently approved. Authenticated responses are excluded from shared CDN caching; only commit-addressed public content and fingerprinted static assets may be immutable. The generated public index and deployment headers are not yet wired because their build/deployment tasks remain outstanding.

## Invalidation

Logout, session expiry, authentication failure, publish, and repository conflict clear the volatile session or the owning feature's draft/query state. A successful publish response identifies the new commit SHA; the client must refetch from that commit before showing new content as committed. It must not claim the Pages deployment is complete based only on a successful repository commit.

# Cache and Freshness Policy

| Data class | Cache policy | Identity/freshness | Offline behavior |
|---|---|---|---|
| HTML shell | Revalidate (`no-cache`) | Each request may receive the current entrypoint | Previously loaded shell can render its current in-memory route only |
| Hashed JS/CSS/media assets | Immutable for one year | Content-hashed filename | Already-downloaded assets may be reused by the browser |
| Public content snapshot | Immutable only when the URL includes its source commit SHA | `ContentIndex.sourceCommit` identifies the exact Git snapshot | A previously loaded public snapshot may remain readable but must display its source commit |
| Authenticated GitHub API, identity, authorization | Browser `cache: 'no-store'`; omit ambient credentials and referrer | GitHub validates the volatile PAT; writes compare the expected branch head | Fail closed; no persistent/private stale response |
| PAT | Never placed in browser cache, localStorage, IndexedDB, Cache API, URL, logs, or build output | PAT is held only in a closure-backed memory reference for the active tab | Re-enter PAT after reload; sign out to clear immediately |
| Drafts and previews | No persistent cache | In-memory feature state is based on a source commit SHA | Draft is lost on reload; user must reconcile after a branch conflict |

The app intentionally has no service worker or persistent query cache. Only public immutable assets and fingerprinted static assets may be CDN-cached.

## Invalidation

Sign-out, authentication failure, publish, and repository conflict clear the PAT or the owning feature's draft/query state. A successful publish identifies the new commit SHA; refetch before showing new content as committed. Do not claim Pages deployment based only on a successful repository commit.

# Cache and Freshness Policy

| Data class                                        | Cache policy                                                                                                                         | Identity/freshness                                                                                   | Offline behavior                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| HTML shell                                        | Revalidate (`no-cache`)                                                                                                              | Each request may receive the current entrypoint                                                      | Previously loaded shell can render its current in-memory route only                        |
| Hashed JS/CSS/media assets                        | Immutable for one year                                                                                                               | Content-hashed filename                                                                              | Already-downloaded assets may be reused by the browser                                     |
| Public content snapshot                           | Immutable only when the URL includes its source commit SHA                                                                           | `ContentIndex.sourceCommit` identifies the exact Git snapshot                                        | A previously loaded public snapshot may remain readable but must display its source commit |
| Authenticated GitHub API, identity, authorization | Browser `cache: 'no-store'`; omit ambient credentials and referrer                                                                   | GitHub validates the PAT on sign-in and session restoration; writes compare the expected branch head | Fail closed; no persistent/private stale response                                          |
| PAT                                               | Stored in tab-scoped `sessionStorage` and active-tab memory; never in localStorage, IndexedDB, Cache API, URL, logs, or build output | Revalidated with GitHub after page refresh; readable by JavaScript in the page                       | Sign out to clear immediately; browser clears session storage when the tab session ends    |

The app intentionally has no service worker or persistent query cache. Only public immutable assets and fingerprinted static assets may be CDN-cached.

## Invalidation

Sign-out and invalid-token responses clear the PAT from memory and session storage. The current
`/backend` route has no draft state or publishing UI. Do not claim Pages deployment based only on a
successful repository commit.

# TODO 10A: Route Lazy Loading and Intent Prefetch

**Status:** IN PROGRESS  
**Depends on:** TODO 02, TODO 05A, TODO 09B, TODO 09C

## Goal

Keep first-load fast while making route transitions feel immediate, without fetching private data before authorization.

## Work

- Split public reader, PAT login, Secret Studio, editor sections, and heavy attachment viewers into measured route/feature chunks.
- Load Studio JavaScript only after direct route navigation; show a stable accessible Suspense/loading boundary and retryable chunk-load error.
- Prefetch public route code/content only on credible intent (keyboard focus, pointer hover, or explicit navigation preparation), with cancellation/debounce and network/save-data checks.
- Never prefetch protected API data while signed out; do not send PAT/session credential in a speculative request.
- Keep prefetch constrained by module boundaries and bundle budgets; avoid eager loading every feature from the app shell.

## Done When

- Home/login do not download Studio/editor chunks.
- Direct Studio navigation loads its chunk predictably and errors recoverably.
- Intent prefetch improves measured navigation without extra authenticated requests or excessive data transfer.

## Verification

Use browser network traces and bundle analyzer to verify chunk boundaries; test focus/hover/touch/reduced-data, offline/chunk error, auth boundary, and route transition behavior.

**Local evidence:** Login and Studio are route-level lazy imports; Studio loads only behind the direct-route authorization guard. Login intent prefetch respects online/save-data/network constraints. The production build emits separate Studio and Login chunks (0.54 kB and 2.98 kB uncompressed respectively); no Studio bundle analyzer or browser network trace has been captured.

**Not verified:** Browser focus/hover/touch/offline traces and the full reduced-data interaction matrix remain outstanding.

# TODO 10C: Page Boundaries and Frontend Observability

**Status:** IN PROGRESS  
**Depends on:** TODO 05A, TODO 09A, TODO 09C, TODO 10

## Goal

Make public pages, login, and Studio independently resilient and diagnosable without cross-page state leakage.

## Work

- Give route features independent error/loading boundaries and explicit communication contracts.
- Share only typed identity/session, navigation, design tokens, and API clients through approved interfaces.
- Keep page-local draft state out of the global app shell; clear private feature state when auth expires or user changes.
- Add sanitized route-level error reporting and request correlation IDs; never capture PAT, session credentials, private card data, or auth headers.
- Add route metrics for chunk load, API failure, editor conflict, publish, and workflow completion.

## Done When

- A Studio failure does not crash public home/login and vice versa.
- Cross-feature communication flows through documented typed interfaces.
- Diagnostic events are useful and demonstrably secret-free.

## Verification

Inject route/chunk/API errors and assert isolation, recovery controls, clean logout state, correlated safe logs, and no sensitive fields in telemetry payloads.

**Local evidence:** Public, login, and Studio routes have independent error boundaries and recovery UI. API failures carry request IDs; client observability allowlists route, event kind, status, and request ID rather than serializing errors or credentials. The web test suite includes the route boundary and telemetry sanitization tests (14 total, passing).

**Not verified:** Browser-injected chunk/API failure scenarios and metrics for future editor conflict, publish, and workflow completion routes remain outstanding.

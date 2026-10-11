# TODO 01: Product Requirements and Journey Contract

**Status:** DONE  
**Depends on:** None

## Goal

Freeze the first release's user journey and measurable acceptance criteria before architecture or code is selected.

## Hierarchical Research Map

### 1. Existence: System Boundary

GreenDocs is a static public documentation site plus a protected Git-backed editor. In scope: the browser UI; GitHub Pages host and exact repository; a server API that verifies GitHub PAT identity and performs authorized repository operations; GitHub Actions build/deploy; page/card/asset data; the developer's local toolchain and test environments. Out of scope: a general-purpose CMS for arbitrary repositories, multi-tenant organizations, a bespoke identity provider, and reproducing the legacy implementation. Production publishing is not complete until the API, repo permissions, workflow, and Pages URL work together.

### 2. Realms

1. Public reading experience.
2. Authentication, authorization, and session security.
3. Secret Studio authoring and hierarchy navigation.
4. Content schema, media, and rendering.
5. GitHub repository integration and commit history.
6. CI, build, and Pages/API delivery.
7. Design system and accessibility.
8. Developer environment, tests, observability, and operations.

### 3. Fields

- Frontend routing, React composition, responsive UI, accessibility, bundle loading, and client/API communication.
- Backend HTTP API, input validation, session management, GitHub REST/Git data operations, concurrency, and rate limiting.
- Content engineering: page/card/attachment schemas, stable IDs, tree projection, URLs/slugs, search, ordering, and migrations.
- Delivery engineering: pnpm workspace, TypeScript, Vite/Tailwind, GitHub Actions, GitHub Pages, Cloud Run, secret management, and rollback.

### 4. Disciplines

Product requirements and acceptance; application architecture; secure credential handling; component/API design; schema/versioning; Git consistency; deployment engineering; UI systems; test engineering; reliability and operations.

### 5. Domains

The first release domains are public navigation, PAT sign-in, repo permission check, protected Studio routing, page/sub-page lifecycle, card lifecycle, attachment lifecycle, draft/review/publish lifecycle, atomic commit/conflict lifecycle, static rendering, and deployment status/rollback.

### 6. Sub-Domains

- Identity: token validation, account identity, repo-specific write authorization, expiry, logout, revocation.
- Hierarchy: stable page IDs, parent IDs, sibling slugs, order, tree navigation, route mapping, cycle prevention.
- Cards/assets: card identity and fields, MIME/size policy, external links, asset references, deletion/reference integrity.
- Publishing: batch validation, expected-head check, atomic Git tree/commit/ref update, idempotency, CI status.
- Client performance: route chunks, Suspense/error boundaries, intent prefetch, public freshness, private no-store behavior.
- Quality: unit/API/browser/E2E tests, keyboard and screen-reader flow, visual regression, secret scanning, audit logs.

### 7. Specialties

Hash routing on static hosting; GitHub PAT verification through `/user`; repository permission verification; server-side secret storage; immutable IDs independent of file names; Git commit parent/ref compare-and-set; React route-level lazy chunks; hash-versioned public assets; API CORS/CSRF/session controls; Cloud Run identity federation; focused, reviewable changes with a test per behavior.

### 8. Topics

The exact journey is: open the public home at the supplied Pages URL; open the right drawer; choose Login; enter a classic PAT; see the GitHub identity and repo permission result; directly navigate to the protected Secret Studio URL (Studio is not linked from the drawer); create/edit/reorder/move/delete pages, sub-pages, cards, and media; review the batch; confirm publish; inspect commit SHA and CI/Pages status; see the resulting public content.

The public client ID is not part of PAT authentication. The PAT is a runtime secret and is never written to frontend code, browser persistence, docs, Git, logs, or URLs. GitHub is the durable content/history source. Browser drafts are memory-only. Public content may be cached only with commit-aware freshness; authenticated responses and session data are not persistently cached by the app.

### 9. Governing Concepts and Invariants

1. Authentication proves the GitHub identity; authorization separately proves write access to the one configured repo/branch.
2. Hiding Studio navigation is not access control; direct route and every API request require authorization.
3. Stable IDs are the identity of records. Titles, slugs, order, UI position, and storage paths are separate concepts.
4. No client-controlled arbitrary repo/path writes; server config binds owner/repo/branch.
5. One publish batch is one validated atomic commit with expected-head protection; never force-push.
6. Draft, committed, CI-passed, and Pages-deployed are distinct states and must be shown distinctly.
7. No PAT or private session data in persistent browser storage, logs, build output, or Git.
8. Public pages, private editor, and API are separate modules with explicit contracts and failure boundaries.
9. No duplicated magic configuration, embedded secrets, unregistered routes, inline repeated icons, simulated success, or undocumented component side effects.
10. Performance features (lazy loading, prefetch, caching) are measured and cannot bypass auth or show stale committed state.
11. All high-impact operations are reviewable, testable, auditable, and recoverable from Git history.

### 10. Irreducible Elements

- Product: route map, role/permission matrix, interaction states, acceptance scenarios.
- Frontend: public shell, right drawer (no Studio link), PAT login, identity status, direct protected Studio route, tree explorer, page editor, card editor, attachment picker, preview, review/publish status, error/loading boundaries, visual primitives, unique icon registry.
- Backend: configuration schema, auth/session endpoints, authorization middleware, page/card/asset APIs, validation, GitHub adapter, conflict/idempotency logic, health/status/telemetry.
- Data: page/card/asset schemas, stable ID rules, slug/order rules, generated public index, schema version/migration policy.
- Delivery: pinned Node/pnpm/React/TypeScript/Vite/Tailwind versions, lockfile, GitHub CI, Pages and Cloud Run workflows, secret store, branch protection, staging and rollback.
- Verification: schema/unit/API/integration/browser/E2E/security/accessibility/visual tests and acceptance evidence.

The task files 02-16 own detailed design and execution of these elements; this map bounds the product and exposes dependencies before implementation.

## Work

- Define public routes using the Pages URL and hash-based route shape: `#/`, `#/login`, and a protected direct Secret Studio URL (candidate `#/studio`) with page/card routes.
- Specify the public home, right-side navigation, GitHub PAT login, verified session, direct URL entry to Secret Studio, publish confirmation, and deployment-complete screens/states.
- Exclude Secret Studio from right-side drawer/global navigation. Hiding the link is not an access-control mechanism; the route and all API operations still require verified authorization.
- Define user-visible states: loading, signed out, invalid token, valid token/no repo permission, connected, dirty draft, conflict, commit in progress, CI failure, deploying, published, and rollback.
- Specify permissions: one authenticated GitHub user may edit only the configured repository and allowed branch; no arbitrary repository target from client input.
- Define first-release scope, non-goals, screen sizes, accessibility expectations, and recovery behavior.
- Record that the provided OAuth client ID is not used by PAT authentication unless a later approved OAuth flow is chosen.

## Done When

- A reviewer can follow the entire user journey without ambiguity.
- Acceptance criteria distinguish authentication, authorization, commit success, CI success, and Pages publication.
- Product owner approves the route map and first-release scope.

## Verification

Walk the flow from a fresh browser session and enumerate expected UI/API responses for success, invalid PAT, insufficient permission, stale branch, failed build, and successful deployment.

**Evidence:** The approved user journey and the requested ten-level research model are recorded above; the owner clarified direct URL-only Studio access and the complete PAT-to-Pages path in the task request.

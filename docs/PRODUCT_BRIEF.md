# GreenDocs Product Brief

## Problem and product

GreenDocs aims to make structured technical documentation manageable as version-controlled
content: documentation records, hierarchy, attachments, reviewable history, and publication should
live with the Git repository instead of depending on a separate content database.

The application is intentionally GitHub-only. GitHub provides identity, repository storage,
source-control history, and static hosting. The application has no server-side API or database.

## Audience

- People who need to browse technical documentation published from the configured repository.
- Repository collaborators who may maintain and publish that documentation as authoring
  capabilities are developed.
- Maintainers developing and operating the GreenDocs application.

## Product goals

1. Render hierarchical pages and cards from validated, versioned repository records.
2. Keep Git as the authoritative content history and make repository changes atomic and reviewable.
3. Make authentication, authorization, content limits, and the static-hosting security trade-offs
   explicit.
4. Provide an accessible, responsive documentation experience.
5. Avoid an application server, external database, or alternate identity provider unless an ADR
   changes the GitHub-only constraint.

## Product constraints and non-goals

- GitHub is the configured identity provider, repository host, API, and deployment platform.
- GitHub Pages serves a static SPA; it cannot hide a user-entered PAT from JavaScript executing in
  the page.
- Authentication stores the PAT in tab-scoped `sessionStorage` so sign-in survives refresh. It
  must never be stored in URLs, source, logs, or build output; browser JavaScript can read the
  session-stored PAT.
- Publishing must validate the full resulting content and update the fixed branch without a force
  push, against the expected branch head.
- The application has no server-side API or external database. Introducing either is a
  product/architecture change, not an assumption agents may make.

## Current implementation (verified 2026-10-18)

### Available in the application

- A public landing route and a dedicated GitHub PAT sign-in route.
- Sign-in calls GitHub directly, verifies the returned identity and write permission on the fixed
  repository, and stores the PAT in tab-scoped session storage. The app revalidates it with GitHub
  after refresh; sign-out and invalid credentials clear it.
- The protected `/home` route reads the repository's Git ref, commit, tree, and relevant blobs;
  validates schema-v2 records; and renders page hierarchy with independently swappable container
  cards and supported attachments.
- The protected, undiscoverable `/#/backend` route renders an independent header and a two-panel
  workspace. Its Select overlay contains a validated, read-only repository snapshot. Persisted
  schema-v2 pages, containers, and cards retain their IDs and names. New pages and nested pages receive a default
  container; users can add containers and cards inside a selected
  container, select items, rename them, reorder siblings, and confirm cascading deletion. Every
  tree item is rendered as a panel, and child rows use shared connector styling. Selecting a
  container drives its card preview; multi-card carousel selection stays synchronized with the
  record editor, with unsaved fields kept in page memory by record ID. Empty and single-card
  containers have no carousel controls. The card editor exposes title, tag, definition, key rule,
  code, specification, and a per-card attachment carousel; the preview reflects active-card
  attachments in real time. Name and derived category share one row. Attachments support local
  image, audio, video, and PDF uploads (up to 10 MiB each), typed remote media URLs, and separately
  identified generic external links. Remote media URLs must use HTTPS and be publicly reachable;
  audio URLs render in a native audio player. Schema-v2 edits can be saved as one atomic commit after
  full-content validation and expected-head checks. Legacy schema-v1 records are rejected; the
  editor has no compatibility or migration flow. An empty repository opens as an empty v2 workspace,
  and its first successful save writes the manifest with the content. A stale-head conflict
  stops the write and preserves the in-memory draft. Unsaved tree edits and drafts reset on refresh.
  The backend and public page use the same
  selection resolver and carousel controls for persisted schema-v2 containers. See
  the
  [Backend Workspace Visual Map](./BACKEND_WORKSPACE_MAP.md) for its as-built composition.
- The backend does not yet provide persistent drafts. Valid schema-v2 records can be saved directly
  to the configured repository.
- GitHub API requests use `no-store`; repository and schema boundaries have tests.
- GitHub Actions runs CI and deploys the static web app to GitHub Pages from `main`.

### Not established by the repository

- Persistent local drafts.
- A staffed support process or named documentation owners.
- A prioritized product roadmap maintained in this repository.

## Current priorities and source of scope

The repository contains no tracked TODO or roadmap file. The configured GitHub Issues query returned
zero open issues on 2026-10-12. Therefore, this repository does not establish a prioritized active
backlog or authorize agents to invent one.

Use the [configured repository issue tracker](https://github.com/c7fb696fb9eabb971fd3becf7c0434aa/app-v9.1.1.3/issues)
as the source for accepted work. At task start, inspect the current issue or the user's acceptance
criteria. If the issue tracker has no applicable task, ask the project owner to set product
priority before expanding scope. Keep this statement current if a different tracker or formal
roadmap is adopted.

## Acceptance principles

- State the intended user-visible behavior and safety boundaries before implementation.
- Validate the actual requirement with focused tests; builds alone do not establish browser or
  authenticated acceptance.
- Report separately what is implemented, what was tested, and what remains unverified.
- Update this brief only when product intent, scope authority, constraints, or shipped capability
  changes; do not copy detailed architecture or procedure here.

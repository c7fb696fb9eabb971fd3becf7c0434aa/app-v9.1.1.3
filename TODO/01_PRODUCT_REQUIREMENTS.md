# TODO 01: Product Requirements and Journey Contract

**Status:** DONE
**Depends on:** None

## Product Boundary

GreenDocs is a GitHub-only documentation site and editor:

- GitHub Pages hosts the static public site and Studio UI.
- GitHub authenticates the user and exposes the fixed repository API.
- The supplied Git repository stores records, media, code, and history.
- GitHub Actions validates/builds and deploys Pages.
- No separate API host, external identity provider, database, secret store, or cloud project is part of the system.

## User Journey

Open the public Pages URL -> choose GitHub sign-in in the navigation -> enter a PAT -> the SPA verifies the actual GitHub user and push permission on the fixed repository -> navigate to the direct Studio route -> edit pages, sub-pages, cards, and attachments in memory -> review changes -> explicitly commit to GitHub -> observe the commit and Actions/Pages result.

Unauthenticated direct Studio access returns to public home. The Studio route is not linked in the public drawer. The page explains that a browser-held PAT is exposed to any script executing in the page while signed in.

## Requirements and Invariants

1. GitHub is the single runtime identity and data service.
2. The configured owner/repository/branch are fixed in code/config and cannot be chosen by browser input.
3. The PAT is sent only to `api.github.com`, held in active-tab memory, and never persisted or logged.
4. Sign-in verifies `/user` identity and repository `permissions.push`; no synthetic identity or fallback mode exists.
5. Stable IDs define records; parent IDs, sibling slugs, and ordering remain distinct.
6. Drafts/media are memory-only until explicit publish.
7. A reviewed publish creates one validated Git tree and commit, based on the expected branch head; never force-update.
8. Commit success, CI success, and Pages deployment are separate statuses.
9. All high-impact operations are explicit, reviewable, and recoverable through Git history.
10. XSS/dependency compromise is a residual risk of browser-held PAT access and must be disclosed.

## Non-Goals

- Arbitrary repositories or multi-tenant CMS behavior.
- Non-GitHub identity/data/deployment services.
- OAuth identity fabrication or treating a public client ID as a secret.
- Persisting credentials, drafts, or private content in browser storage.
- Force-pushes or silent publishing.

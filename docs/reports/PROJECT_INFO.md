# Project Information

**Purpose:** GreenDocs is a Git-backed documentation editor and publisher. Authorized users edit a page/card hierarchy in a GUI; committed data builds into a static public documentation site.

## Canonical Endpoints

- Git repository: https://github.com/c7fb696fb9eabb971fd3becf7c0434aa/app-v9.1.1.3.git
- Public site: https://c7fb696fb9eabb971fd3becf7c0434aa.github.io/app-v9.1.1.3/
- Expected production branch: `main`
- GitHub OAuth client ID (public identifier; not a credential): `Ov23lia5n28LWDlbVJLZ`

The OAuth client ID is included as supplied for reference. The PAT value is intentionally not stored in this document or any client bundle. The operator enters a PAT through the sign-in flow; the API verifies its GitHub identity and repository write permission, then stores it only in server-side secret storage for the session lifetime.

## Operating Rules

1. Git is authoritative for pages, cards, attachments, and history.
2. The browser never writes directly to GitHub and never persists content or credentials in local storage.
3. Every mutation is authorized, validated, and committed by the API to the configured repository.
4. A push to `main` runs CI and a separate GitHub Pages workflow builds/deploys the web application. The API remains a separately provisioned service.
5. UI preview is not published state; the commit SHA and workflow result identify publication status.

## Explicit Non-Goals

- Reconstructing the existing naming-based content tree.
- Treating browser storage, a client cache, or the static bundle as editable authority.
- Embedding a PAT in source, Markdown, Vite-exposed environment variables, or Git history.

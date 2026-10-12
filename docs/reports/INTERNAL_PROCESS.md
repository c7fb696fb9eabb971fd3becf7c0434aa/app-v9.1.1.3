# Application Process Snapshot

This describes currently implemented runtime behavior. The current architecture source is
[System Architecture](../ARCHITECTURE.md); product availability is recorded in the
[Product Brief](../PRODUCT_BRIEF.md).

## 1. GitHub sign-in

1. The user enters a GitHub PAT on the dedicated login route.
2. The browser sends it directly to `api.github.com/user` and the configured repository metadata
   endpoint.
3. The application displays the GitHub identity returned by `/user` and proceeds only when GitHub
   reports repository push permission.
4. The PAT is held in a React ref in active-tab memory. Sign-out or a GitHub 401 clears it. Reload
   requires signing in again.
5. Successful sign-in navigates to `/#/home`; an authenticated visit to `/#/` redirects to
   `/home`.

## 2. Read and render

- `/home` reads the configured branch ref, commit, recursive tree, and page/card blobs through
  GitHub's Git Database API.
- Records and relationships are validated by the shared content schema before rendering.
- The Home page renders repository pages, nested pages, cards, and supported attachments.
- The source commit SHA identifies the read snapshot. This does not imply that browser editing or
  draft reconciliation is implemented.

## 3. Repository publishing capability

`GitHubRepositoryClient.publish` validates a complete mutation batch, checks the expected branch
head, creates a Git tree and commit, and updates the configured ref without force. Unit tests cover
the operation. No production application component currently invokes it; there is no editor/publish
screen.

## 4. Persistence and service boundaries

- There is no application API, server-side session, content database, or cloud runtime.
- GitHub is authoritative for committed repository content and commit history.
- The application does not persist authentication or browser drafts across reloads.
- Rate limits, payload limits, fixed repository paths, schema validation, and expected-head checks
  constrain repository access and writes.

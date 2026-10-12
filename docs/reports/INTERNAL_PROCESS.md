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
4. The PAT is held in a React ref and tab-scoped `sessionStorage`. After reload, GitHub identity
   and repository push permission are revalidated before restoring the session. Sign-out or a
   GitHub 401 clears it.
5. Successful sign-in navigates to `/#/home`; an authenticated visit to `/#/` redirects to
   `/home`.

## 2. Read and render

- `/home` reads the configured branch ref, commit, recursive tree, and page/card blobs through
  GitHub's Git Database API.
- Records and relationships are validated by the shared content schema before rendering.
- The Home page renders repository pages, nested pages, cards, and supported attachments.
- The source commit SHA identifies the read snapshot. The protected `/backend` route renders an
  independent header and empty workspace panels; it does not load repository data.

## 3. Repository publishing capability

`GitHubRepositoryClient.publish` validates complete mutations, checks the expected branch head,
creates a Git tree and commit, and updates the configured ref without force. The operation has
tests, but no current user-facing page creates drafts or calls it.

## 4. Persistence and service boundaries

- There is no application API, server-side session, content database, or cloud runtime.
- GitHub is authoritative for committed repository content and commit history.
- The application persists the PAT only in tab-scoped `sessionStorage` for refresh restoration;
  sign-out clears it.
- Rate limits, payload limits, fixed repository paths, schema validation, and expected-head checks
  constrain repository access and writes.

# Application Process

## 1. GitHub Sign-In

1. The user enters a GitHub PAT in the login page.
2. The browser sends it directly over HTTPS to `api.github.com/user` and the fixed repository metadata endpoint.
3. The app displays GitHub's actual login/account ID and proceeds only if the repository response grants push permission.
4. The credential remains in a closure-backed memory reference. Sign-out, GitHub 401, or closing the tab clears access. Reload requires sign-in again.
5. Successful sign-in always redirects to `/#/home`; if an authenticated user visits `/#/`, the app redirects them back to `/home`.

## 2. Read and Render

- `/home` reads the configured GitHub branch ref, commit/tree, and page/card blobs, then renders pages, sub-pages, and cards.
- Studio reads the same repository snapshot for editing.
- Content records are validated with the shared schema; assets and hierarchy are resolved from stable IDs and explicit relationships.
- A source commit SHA identifies the snapshot used for editing.
- Studio is a protected direct URL that developers enter manually; no public or authenticated navigation links to it.

## 3. Edit and Publish

1. GUI actions update an in-memory draft; no edit is written before explicit Publish.
2. The browser validates the page/card hierarchy, attachment references, paths, types, and size limits.
3. The user reviews the repository, branch, base SHA, and complete mutation summary.
4. The client checks that the branch still points to the draft's expected SHA, creates any binary blobs, then creates one Git tree and commit.
5. It advances the branch with `force: false`. A race/non-fast-forward fails; drafts remain available for reload/reconciliation.
6. GitHub Actions runs CI and Pages deployment for commits pushed to `main`. The UI distinguishes commit success from Pages deployment success.

## 4. Operations

- No server-side logs, session database, external storage, or cloud runtime exists.
- Git commit history is the audit and recovery trail; browser drafts are transient.
- Rate limits, payload limits, fixed repository paths, schema validation, and expected-head checks apply before repository writes.

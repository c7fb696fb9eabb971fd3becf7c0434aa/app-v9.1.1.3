# Internal Process

## 1. Sign-In and Authorization

1. The user supplies a classic GitHub PAT over HTTPS to the API. It is never sent to the static web app's build environment or GitHub Pages.
2. The API calls GitHub `/user` to validate the token and obtain the actual login and account ID.
3. The API checks access to the configured owner/repository and confirms write permission. A valid token without repository write access is rejected.
4. The API stores the PAT in server-side secret storage, encrypted at rest, with expiry/revocation controls. It issues a short-lived opaque session credential; the browser keeps that session in memory only. Reloading requires re-authentication unless a same-site session host is deliberately configured.
5. All endpoints authorize the session and repository target server-side. Never accept arbitrary owner/repository/path values from the client.

## 2. Read and Render

- The Studio requests page/card/asset records from the API, which reads the configured Git branch.
- The public site is static: CI validates repository records and generates a versioned public content index during build. Published pages do not depend on an authenticated API at browse time.
- A commit SHA identifies the exact content snapshot used by a preview or deployment.

## 3. Edit and Publish

1. GUI actions update an in-memory draft with stable record IDs; the UI shows unsaved, validated, and stale/conflict states.
2. API validation checks schema, required fields, slug uniqueness within siblings, parent existence, ordering, attachment paths/MIME/size, and repository-owned IDs.
3. The user reviews a change summary and confirms Publish.
4. The API fetches the current branch head and constructs one Git tree containing the complete file batch. It creates one commit whose parent is that head, then advances the branch ref without force. This keeps page/card/asset changes atomic.
5. If the branch head moved meanwhile, the API refuses the ref update and returns a conflict. The UI reloads and asks the user to reconcile; it never force-pushes over another user's commit.
6. A push to `main` runs CI, builds Pages, and deploys. The UI polls workflow status and reports commit SHA, build outcome, and public URL.

## 4. Operations

- Page/card delete and reorder are normal validated record updates. No destructive Git operation is silently performed.
- Git commit history remains the audit/rollback log; local browser history is not a persistence layer.
- API logs contain request IDs, actor ID, repository, commit SHA, and outcome only. Never log PATs, session credentials, request authorization headers, or secret environment values.
- Rate limits, request timeouts, payload limits, idempotency keys, and GitHub API error mapping are required before enabling production writes.

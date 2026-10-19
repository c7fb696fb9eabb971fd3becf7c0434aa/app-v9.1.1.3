# Operations Guide

This guide describes the checked-in development and release workflow. It does not grant machine,
GitHub, browser, or credential access; verify the active environment and permissions.

## Local environment

- Windows 10/11 workspace, PowerShell recommended.
- Node.js `24.21.0`, pinned in `.node-version`.
- Corepack with pnpm `12.11.2`, pinned in the root `packageManager`.
- The root pnpm workspace contains the web application plus `packages/contracts` and
  `packages/content-schema`.
- No application API process or separate database is part of the current workspace.

Read [AGENTIC/LOCAL_ENVIRONMENT.md](../AGENTIC/LOCAL_ENVIRONMENT.md) for the checked-in
environment requirements and install-approval rules. From the repository root:

```powershell
corepack pnpm@12.11.2 dev
```

The configured project workspace is ready to run; start the app directly without preliminary
port, network, environment, or dependency checks. Vite binds the configured port `5173` and uses
`strictPort`, so it reports an error if that port is occupied. Use the URL in Vite's ready output.
Only investigate setup or port state after the start command fails. Do not run install as a startup
ritual; if a dependency is genuinely missing, follow the install-approval rule in
[Local Environment](../AGENTIC/LOCAL_ENVIRONMENT.md).

The app's deployed URL is recorded in [Project Access](../AGENTIC/PROJECT_ACCESS.md). When the user
requests both local and deployed apps, open both URLs in the VS Code integrated browser when
available; do not make the user copy them from chat or print them there unless requested. Do not run
a separate availability probe; open the requested page directly.

## Git workflow

This workspace is already connected to the configured GitHub repository. When the user explicitly
requests a commit or push, reuse the existing Git remote and active authentication instead of
repeating clone, credential, or OAuth setup. Check only the current repository/worktree, intended
branch/remote, and commit identity if needed; inspect the task's diff, stage only its files, run
relevant checks, and perform the requested operation. The explicit request authorizes that
operation, so do not ask for the same confirmation again.

If the target is ambiguous or the actual operation fails because of missing identity,
authentication, or permission, stop and report that concrete blocker. A configured remote alone
does not prove push permission. Never request credentials in chat, change credential wiring, or
force-push.

For maintenance and verification tasks:

```powershell
corepack pnpm@12.11.2 lint
corepack pnpm@12.11.2 typecheck
corepack pnpm@12.11.2 test
corepack pnpm@12.11.2 build
corepack pnpm@12.11.2 format:check
```

Use the smallest relevant check while iterating; run the full CI set before a release or when
needed to establish cross-workspace confidence. Do not install missing tools or packages without
owner approval.

## Test and quality gates

`pnpm lint` checks module boundaries, known credential patterns, local Markdown links, and
Oxlint. `pnpm typecheck` builds the content-schema declaration output and typechecks workspaces.
`pnpm test` runs repository-boundary/security-script tests and workspace Vitest tests.
`pnpm format:check` checks the configured application and project configuration files.
`pnpm build` builds workspaces that define a build.

GitHub Actions runs formatting, lint, typecheck, tests, and build for pull requests and pushes to
`main` using a frozen lockfile. See [CI workflow](../.github/workflows/ci.yml).

## Release and deployment

- `main` is the configured production branch.
- A push to `main` starts CI and the GitHub Pages deployment workflow.
- The Pages workflow builds the repository-root web application and deploys its static `dist`
  artifact.
- A commit does not itself prove CI or deployment succeeded. Verify each state from the matching
  workflow run and deployed site.
- Use an approved test repository/branch for write acceptance. Never use production content for
  an unapproved smoke test or force-push.

See [deployment workflow](../.github/workflows/deploy-pages.yml) and
[project access](../AGENTIC/PROJECT_ACCESS.md) for target wiring and write-safety rules.

## Support and incident handling

There is no named support rota or service-level commitment in the repository. For application
issues, gather the route, reproducible steps, expected and actual result, browser/runtime version,
and redacted error/status information. Never collect tokens, authorization headers, or private
repository content in an issue.

For GitHub failures, distinguish invalid/revoked credentials (401), insufficient access (403/404),
rate limiting, network failure, stale branch head, CI failure, and Pages deployment failure. The
user should re-enter credentials only in the approved login UI. If a credential may have leaked,
the owner should revoke it and replace it with the narrowest suitable credential; do not copy or
repeat the exposed value.

## Security and production writes

- GitHub is the only approved identity and runtime data platform under the current ADR.
- PATs are entered into the login form and held in active-tab memory plus tab-scoped
  `sessionStorage` so refresh can restore the session. JavaScript running in the signed-in page can
  read and use them.
- Never store credentials in `.env`, source, localStorage, IndexedDB, Cache API, URL, logs,
  screenshots, commits, or reports. The approved session-storage exception is cleared on sign-out
  and invalid-token response.
- Production repository edits and deploy operations require explicit approval of the exact
  operation. Before an authorized Git write, verify branch, remote, staged diff, and test result.
- The application reads and writes schema v2 only. Legacy v1 repository content must be converted
  outside the application before it can be used. An empty repository needs no setup commit; the
  first content save writes `content/manifest.json` with the new v2 records.
- A successful connection test verifies live repository reads, not Contents write access or branch
  policy. If a save is denied, use the reported GitHub operation and HTTP status to check token
  Contents permissions and repository branch rules. Never collect or log the PAT for diagnosis.
- See [ADR 0002](./adr/0002-pat-auth-and-session-security.md) and
  [Project Access](../AGENTIC/PROJECT_ACCESS.md) for full security controls.

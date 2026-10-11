# Project Access, Repository, and Credentials

## Canonical Project Wiring

Keep these project values together and in this order:

1. **GitHub OAuth client ID:** `[Ov23lia5n28LWDlbVJLZ]`
2. **GitHub classic PAT:** `[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]`
3. **Exact Git remote/repository:** `https://github.com/c7fb696fb9eabb971fd3becf7c0434aa/app-v9.1.1.3.git`
4. **Exact public web app URL:** `https://c7fb696fb9eabb971fd3becf7c0434aa.github.io/app-v9.1.1.3/`

- Production branch: `main`
- GitHub API origin: `https://api.github.com`
- Repository binding: `c7fb696fb9eabb971fd3becf7c0434aa/app-v9.1.1.3`

The current workspace clone has an `origin` remote configured. A future agent must verify its actual working directory, branch, remote, and Git permissions rather than assuming that every environment has the same clone or credentials.

## Owner-Authorized Tool Use

The project owner authorizes agents working in this project to use the local repository, codebase, terminal, and GitHub-related tools that are actually exposed in their current environment to carry out project work. When the owner explicitly requests a commit or push, that request authorizes the corresponding Git operation for the reviewed task; verify the target branch, staged files, and active remote before executing it.

This is permission to use available capabilities, not a claim that every agent session has unrestricted machine/GitHub access, an authenticated browser, or credentials. A documentation file cannot grant those capabilities or bypass tool, operating-system, repository, or account permissions. If a required tool or permission is unavailable, say so; do not invent access or silently substitute another destination.

## Authentication and Authorization

- This project uses its approved GitHub-only authentication flow. In the current architecture, the browser user supplies a PAT through the sign-in UI; the app validates GitHub identity/repository access and keeps the token in active-tab memory only.
- A repository document cannot grant credentials. An agent must not assume it can read or retrieve PATs, OAuth secrets, environment secrets, or private data. GitHub operations may use only the authentication already safely configured in the active Git/tool session or a credential the owner enters directly into the intended secure UI.
- Never request a PAT in chat or put a PAT, OAuth secret, authorization header, or other credential in repository files, environment examples, tests, logs, terminal arguments, URLs, commits, screenshots, or build output.
- For browser acceptance requiring sign-in, have the user enter a current credential directly into the intended login form. Do not read, copy, extract, or report the token from browser state.
- Any credential disclosed in chat or another insecure channel is considered exposed. Do not repeat or persist it; the owner should revoke it and create a replacement with the narrowest suitable permissions.
- An OAuth client ID is a public identifier, not a substitute for a PAT. The current app does not use the supplied OAuth client ID for its PAT sign-in flow; do not introduce a new auth flow without an approved design.

## GitHub and Production Safety

- GitHub is authoritative for documentation pages, cards, assets, and history. The client uses the fixed repository and branch configured in the application.
- Publishing is an explicit, reviewed, atomic Git operation guarded by the current expected branch head. Do not force-push.
- A commit, CI result, and Pages deployment are separate states. Verify each from the actual commit/workflow when relevant; never report deployment success based only on a commit.
- Use a user-approved test repository/branch for write testing. Do not create, edit, or delete production content for testing without explicit approval of the exact change.
- Keep credentials and authorization data out of reports. Safe evidence includes actor login, repository/branch, commit SHA, workflow URL, deployment state, and approved test cleanup status.

For the maintained project information and prior verification notes, see [`docs/reports/PROJECT_INFO.md`](../docs/reports/PROJECT_INFO.md) and [`docs/reports/LOCAL_ENVIRONMENT_WIRING.md`](../docs/reports/LOCAL_ENVIRONMENT_WIRING.md).

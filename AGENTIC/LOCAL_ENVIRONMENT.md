# Local Environment and Tools

## Workspace Access

The agent works from the repository folder opened in VS Code and may use the codebase and local tools made available by that environment. This is not a promise of unrestricted access to the host, network, GitHub account, browser profile, credentials, or every installed tool. Check the actual workspace and tool list before relying on a capability.

The repository is a Windows workspace in the current setup. Use Windows-style paths in shell commands, avoid destructive operations, and do not overwrite unrelated user changes.

## Ready-to-run development server

The configured GreenDocs workspace is ready to run: the pinned Node.js/Corepack toolchain and
workspace dependencies are set up. When asked to start the app, run the development command
directly from the repository root:

```powershell
corepack pnpm@12.11.2 dev
```

Do not delay startup with port scans, environment inventories, live-site probes, or a repeated
dependency install. The web package runs Vite on the configured port (`5173`) and requires that
port to be free (`strictPort`). Use Vite's ready message as confirmation and open the local URL it
prints in the integrated browser; do not repeat it in chat unless the user asks or that browser is
unavailable. If startup fails, then diagnose the reported error; do not install or download tools
or dependencies without the owner's approval.

The deployed app URL is maintained in [Project Access](./PROJECT_ACCESS.md). When asked to start
the local app and show the deployed app, open both URLs directly in the VS Code integrated browser
if available. Do not print the URLs in chat unless the user asks or the browser tool is unavailable.
Do not make a separate public availability request; opening the requested page is sufficient.

## Ready-to-use Git and GitHub

The project clone is already wired to the configured GitHub repository, and the active VS Code/Git
environment may already provide commit identity and push authentication. For an explicitly
requested commit or push, do not redo setup or attempt to wire GitHub again. Briefly check the
current repository/worktree, task branch and remote, and the Git identity needed for a commit; then
review and stage only the task's changes, run relevant checks, and carry out the requested operation.
The owner's explicit request is authorization for that operation.

Do not ask the owner to confirm the same commit/push request again. If a target branch/remote is
ambiguous, identity is missing, or the actual Git operation reports an authentication/permission
failure, stop at that specific blocker and report it. Never request credentials in chat, change
credential configuration, force-push, or claim push access based only on a configured remote.
Do not perform extra GitHub connectivity or permission probes when the requested Git operation can
itself establish whether the configured access works.

## Project Toolchain

The checked-in root `package.json` currently specifies:

- Node.js `>=24.21.0 <25`
- Corepack with pnpm `12.11.2`
- Vite/React web app under `apps/web`

Use the repository's pinned package manager and scripts from the workspace root:

```powershell
corepack pnpm@12.11.2 dev
corepack pnpm@12.11.2 lint
corepack pnpm@12.11.2 typecheck
corepack pnpm@12.11.2 test
corepack pnpm@12.11.2 build
corepack pnpm@12.11.2 format:check
```

Read the relevant package manifest and project docs if scripts/tool requirements have changed. Prefer the smallest targeted command that verifies the change, escalating to broader checks only when needed.

## Missing Tool or Dependency

If a required tool, runtime, package, browser capability, or permission is missing:

1. Identify the exact missing item and the task that requires it.
2. Check whether the repository already provides a supported alternative.
3. Explain what would be downloaded/installed, where it would be installed, and why.
4. Ask the user for explicit confirmation before downloading or installing it.
5. Wait for confirmation; do not install, bootstrap, or bypass the missing capability while waiting.

Do not describe the environment as having “all tools” or unlimited access. Report capability failures clearly and continue only with safe work that the available tools support.

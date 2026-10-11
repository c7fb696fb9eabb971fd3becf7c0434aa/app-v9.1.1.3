# Local Environment and Tools

## Workspace Access

The agent works from the repository folder opened in VS Code and may use the codebase and local tools made available by that environment. This is not a promise of unrestricted access to the host, network, GitHub account, browser profile, credentials, or every installed tool. Check the actual workspace and tool list before relying on a capability.

The repository is a Windows workspace in the current setup. Use Windows-style paths in shell commands, avoid destructive operations, and do not overwrite unrelated user changes.

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

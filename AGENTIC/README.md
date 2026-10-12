# Agent Onboarding

Use this directory to bring a coding agent up to speed on the GreenDocs workspace. These documents describe verified project wiring and operating expectations; they do not grant access beyond the permissions of the current VS Code, operating-system, and GitHub sessions.

## First-Run Order

1. Read [Project access and security](./PROJECT_ACCESS.md) for canonical repository/site URLs and credential boundaries.
2. Read [Local environment and tools](./LOCAL_ENVIRONMENT.md) for the workspace, supported commands, and install-approval process.
3. Read [Execution and delegation](./EXECUTION_AND_DELEGATION.md) for concise work, verification, agent handoffs, and Git side-effect rules.
4. Read the project [README](../README.md) and relevant architecture/security docs under `docs/`.
5. Inspect the current branch, worktree, and task-related code before editing. Preserve pre-existing user changes.

## Workspace Agent Files

- [Project-wide Copilot instructions](../.github/copilot-instructions.md) point every workspace agent to this onboarding.
- [Muai execution agent](../.github/agents/muai.agent.md) is the bounded implementation/operations worker. Use it only when it is available in the current agent host; its existence as a file does not guarantee the host can invoke it or provide a browser session.

## Current Project Snapshot

- GreenDocs is a Git-backed documentation editor and publisher; GitHub is the identity, source-control, content, and Pages platform.
- The production branch is `main`. The application has a public landing page and an authenticated documentation home.
- Do not perform production content writes or deployment smoke tests without explicit approval of the exact operation.

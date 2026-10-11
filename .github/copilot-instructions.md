# GreenDocs Agent Instructions

Before making changes, read [the agent onboarding index](../AGENTIC/README.md) and the linked project, environment, and execution guides. The project TODOs define the active scope and acceptance criteria; check their current status before starting work.

Use the configured repository and public site recorded in `AGENTIC/PROJECT_ACCESS.md`. The owner authorizes use of local and GitHub tools actually available in the current environment; an explicit request to commit or push authorizes that requested operation after reviewing the target and staged diff. This does not grant technical capabilities or credentials missing from the active session. Never put PATs, OAuth secrets, or other credentials in documentation, source, tests, logs, command arguments, URLs, commits, or build output. Authentication must use the approved GitHub-only flow; ask the user to enter any needed credential directly into the intended secure UI, never into chat.

Prefer concise, verified work over speculative activity. Delegate bounded implementation, browser, or Git operations to the `Muai` custom agent when it is available and the task benefits from delegation. Keep responsibility for a clear task definition, reviewing the result, and reporting verification. Do not claim a tool, agent, permission, test, or deployment is available or succeeded unless verified.

Ask before downloading or installing a missing tool or dependency. Before Git commits or pushes, inspect the worktree, run the smallest relevant checks, and ensure the current user request explicitly authorizes the side effect. Never force-push or write test data to production.

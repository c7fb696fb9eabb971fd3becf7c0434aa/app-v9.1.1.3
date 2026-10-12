# Agent Onboarding

This is the short warm-up entry point for agents. Shared project facts live in maintained repository
docs and code—not in an agent's conversation or persona. These documents do not grant access beyond
the tools and permissions actually available in the active environment.

## Warm-up order

1. Read the [documentation index](../docs/README.md) and [product brief](../docs/PRODUCT_BRIEF.md)
   for the product purpose, current shipped capabilities, and scope authority.
2. Read the [system architecture](../docs/ARCHITECTURE.md) for the current component map and
   important boundaries.
3. Read [project access and security](./PROJECT_ACCESS.md) before any GitHub or credential-related
   operation.
4. Read [local environment and tools](./LOCAL_ENVIRONMENT.md) and
   [execution and delegation](./EXECUTION_AND_DELEGATION.md) before running commands, installing
   tools, delegating, or performing Git side effects.
5. Read the relevant sections of the [operations guide](../docs/OPERATIONS.md), domain docs, and
   ADRs; inspect the current branch, worktree, code, and tests for the task.
6. Check the current tracker item and acceptance criteria. The repository does not define a local
   TODO list; see [Active Scope](../docs/ACTIVE_SCOPE.md).

Do not load every document for every task. Follow links from the index to the canonical source
relevant to the task. If code, docs, or the task disagree, describe the discrepancy and verify
current behavior before making a decision.

## Workspace customizations

- [Project-wide Copilot instructions](../.github/copilot-instructions.md) provide the minimal
  always-on warm-up contract.
- [Project Architect](../.github/agents/project-architect.agent.md) is a read-only architecture
  guide. It verifies against the current docs and code and is optional—not an information gate.
- [Backend Planner](../.github/agents/backend-planner.agent.md) is a read-only planner for the
  protected `/backend` blank header route. It returns an implementation plan and does not edit code.
- [Muai execution agent](../.github/agents/muai.agent.md) handles bounded implementation and
  operations when exposed by the active host.
- [Documentation maintenance skill](../.github/skills/documentation-maintenance/SKILL.md) is an
  on-demand workflow for updating the documentation system.
- [GitHub content-change skill](../.github/skills/github-content-change/SKILL.md) is an on-demand
  workflow for repository/auth/schema/publish changes.
- [Documentation file instructions](../.github/instructions/docs.instructions.md) apply only to
  project documentation files.

Agent-to-agent conversation is not the project's memory. If a finding is durable, update its
canonical doc through the documentation workflow and review the diff.

## Current snapshot

GreenDocs is a GitHub-backed static documentation workspace. Current routes include the public
landing page, GitHub sign-in, authenticated documentation home, and an undiscoverable, protected
`/backend` route with an independent header and empty workspace panels. There is no user-facing
authoring or publishing UI. See the
[Product Brief](../docs/PRODUCT_BRIEF.md) and [System Architecture](../docs/ARCHITECTURE.md) for
verified detail.

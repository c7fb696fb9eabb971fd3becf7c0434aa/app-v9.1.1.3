# Repository Structure Snapshot

This snapshot reflects the checked-in workspace as of 2026-10-12. For the system relationships,
responsibilities, and data flow, see the canonical [System Architecture](../ARCHITECTURE.md).

```text
/
|-- apps/web/                    # React/Vite static SPA
|   |-- src/app/                 # Router, providers, route boundaries, styles
|   |-- src/features/auth/       # GitHub identity, permission, in-memory PAT
|   |-- src/features/github/     # Fixed-repository GitHub read/publish client
|   |-- src/features/navigation/ # Header and independent sidebars
|   |-- src/components/          # Shared UI primitives and icon catalog
|   `-- src/pages/               # Public landing, login, repository documentation home
|-- packages/contracts/          # Shared TypeScript and runtime contracts
|-- packages/content-schema/     # Zod schemas, validation, IDs, paths, hierarchy
|-- scripts/                     # Deterministic repository quality checks
|-- docs/                        # Product, architecture, operations, domain docs, ADRs
|-- AGENTIC/                     # Agent onboarding, access, environment, execution rules
|-- .github/                     # Shared Copilot instructions, agents, skills, workflows
|-- .vscode/                     # Development tasks and Chrome launch config
|-- package.json                 # Pinned pnpm workspace scripts and Node engine
`-- pnpm-lock.yaml               # Locked dependencies
```

There is no checked-in `apps/api`, `content/` tree, editor UI, persisted draft store, or current
publish UI. The browser's publish client is a tested implementation building block, not an
available authoring screen. Generated output and installed dependencies are not source files.

Repository content, when present, uses stable-ID paths (`content/pages/`, `content/cards/`, and
`content/media/`). The root package manager workspace is configured by `pnpm-workspace.yaml`.

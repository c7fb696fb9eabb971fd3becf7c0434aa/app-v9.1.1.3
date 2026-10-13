# GreenDocs

GreenDocs is a GitHub-backed documentation workspace. The current web app authenticates a user
against the configured repository and renders its validated pages, nested pages, cards, and
attachments. The repository client also contains a tested atomic publish operation, but the
application does not yet expose a documentation editor or publish UI.

## Start here

- [Product brief](docs/PRODUCT_BRIEF.md): purpose, audience, product constraints, current
  implementation, and authoritative scope source.
- [System architecture](docs/ARCHITECTURE.md): current runtime, ownership boundaries, data flow,
  and security invariants.
- [Operations guide](docs/OPERATIONS.md): setup, checks, release/deployment, support, and security.
- [Documentation index](docs/README.md): canonical docs, ADRs, domain references, and maintainers.
- [Agent onboarding](AGENTIC/README.md): warm-up order, environment, project access, and execution
  guidance.

## Workspace

- `src`: React/TypeScript application source.
- Root `package.json` and Vite configuration: application tooling and workspace scripts.
- `packages/contracts`: shared record, repository, and publish contracts.
- `packages/content-schema`: record validation, content limits, hierarchy, and safe storage paths.

## Local commands

Use the project-pinned package manager with Corepack:

```powershell
corepack pnpm@12.11.2 install --frozen-lockfile
corepack pnpm@12.11.2 dev
corepack pnpm@12.11.2 lint
corepack pnpm@12.11.2 typecheck
corepack pnpm@12.11.2 test
corepack pnpm@12.11.2 build
corepack pnpm@12.11.2 format:check
```

GitHub is the only identity, content, source-control, and deployment platform. The browser sends
the user-entered PAT directly to GitHub and holds it in active-tab memory only. Because JavaScript
in the signed-in page can use that PAT, use a least-privilege credential, sign out after use, and
revoke it if compromise is suspected. Never place credentials in source, environment files, URLs,
browser storage, logs, or build output.

## Deployment

Pull requests and pushes to `main` run CI. Pushes to `main` also build and deploy the root web app
to GitHub Pages. A commit, successful CI run, and successful deployment are separate states;
verify each independently. See the [Operations guide](docs/OPERATIONS.md).

# Proposed File Structure

This is the greenfield target, not a promise to reproduce the legacy `02-hnp-trivia` directory layout. Stable IDs and explicit parent relationships define hierarchy; filenames are storage details only.

```text
/
|-- apps/
|   |-- web/                     # React UI; deployed to GitHub Pages
|   |   |-- src/
|   |   |   |-- app/             # Routes, shell, providers
|   |   |   |-- features/        # auth, workspace, studio, publishing
|   |   |   |-- components/      # shared UI and design primitives
|   |   |   |-- lib/             # API client, runtime validation
|   |   |   `-- styles/          # Tailwind v4 entry and design tokens
|   |   `-- index.html
|   `-- api/                     # Node service; deployed to Cloud Run
|       |-- src/
|       |   |-- routes/          # auth, pages, cards, assets, commits
|       |   |-- github/          # GitHub REST/Git Database adapter
|       |   |-- auth/            # PAT validation and short-lived sessions
|       |   `-- server.ts
|       `-- Dockerfile
|-- packages/
|   |-- contracts/               # Shared request/response types
|   |-- content-schema/          # Page/card/asset schemas and validators
|   `-- test-fixtures/            # deterministic repository fixtures
|-- content/                     # Git source of truth
|   |-- pages/<page-id>.json
|   |-- cards/<card-id>.json
|   `-- media/<asset-id>.<ext>
|-- docs/
|   |-- COLOR_SYSTEM.md          # only retained legacy design source
|   `-- reports/                 # planning and environment reports
|-- .github/workflows/
|   |-- ci.yml
|   |-- deploy-pages.yml
|   `-- deploy-api.yml
|-- .vscode/                      # launch/tasks/settings for repeatable debugging
|-- pnpm-workspace.yaml
|-- package.json
|-- pnpm-lock.yaml
|-- tsconfig.base.json
|-- .editorconfig
|-- .gitignore
`-- README.md
```

## Data Boundaries

A page record has an immutable ID, title, slug, parent ID, ordering value, and optional description. A card has an immutable ID, page ID, ordering value, content fields, and typed attachment references. Slugs are unique among siblings. File paths derive from IDs, never titles, so renames do not move files or break relationships.

Store small assets in `content/media/` with generated IDs and validated MIME/size. Set an explicit repository size threshold; move larger media to a separately managed object store or GitHub Release assets rather than bloating Pages artifacts.

Build output (`apps/web/dist`) and API build output are generated, ignored files. Never commit credentials, generated bundles, caches, or user uploads outside the content workflow.

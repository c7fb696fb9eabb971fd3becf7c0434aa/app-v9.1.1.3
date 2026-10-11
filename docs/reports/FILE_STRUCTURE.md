# Proposed File Structure

```text
/
|-- apps/
|   `-- web/                     # React UI; deployed to GitHub Pages
|       |-- src/
|       |   |-- app/             # Routes, shell, providers
|       |   |-- features/        # auth, github, navigation, studio
|       |   |-- components/      # shared UI and design primitives
|       |   `-- lib/             # browser-only helpers
|       `-- index.html
|-- packages/
|   |-- contracts/               # Shared record/publish types
|   `-- content-schema/          # Page/card/asset schemas and validators
|-- content/                     # Git source of truth
|   |-- pages/<page-id>.json
|   |-- cards/<card-id>.json
|   `-- media/<asset-id>.<ext>
|-- docs/
|-- .github/workflows/
|   |-- ci.yml
|   `-- deploy-pages.yml
|-- .vscode/
|-- pnpm-workspace.yaml
|-- package.json
|-- pnpm-lock.yaml
|-- tsconfig.base.json
|-- .editorconfig
`-- README.md
```

Stable IDs and explicit parent relationships define hierarchy; filenames are storage details only. Titles and slugs are never trusted file paths.

Build output (`apps/web/dist`) is generated and ignored. Never commit credentials, generated bundles, caches, or user uploads outside the content workflow.

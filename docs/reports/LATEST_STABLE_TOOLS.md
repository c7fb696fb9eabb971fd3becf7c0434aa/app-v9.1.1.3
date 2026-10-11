# Latest Stable Tools

Verified on 2026-10-10 against official release pages and npm's `latest` dist-tags. Pin exact versions in the project manifest/lockfile; do not use floating `latest` in CI.

| Tool | Baseline | Basis |
|---|---:|---|
| Node.js | 24.21.0 LTS | Node releases page lists v24.21.0 as latest LTS. Node 26.11.1 is Current, not LTS. |
| React | 19.3.0 | Current stable React release; use matching `react-dom` 19.3.0. Do not use a Canary build. |
| TypeScript | 7.0.2 | npm `typescript/latest` at verification time. |
| Vite | 8.3.4 | npm `vite/latest`; requires Node `^20.19.0 || >=22.12.0`, satisfied by Node 24 LTS. |
| pnpm | 12.11.2 | npm `pnpm/latest`; pin through the root `packageManager` field. |
| Tailwind CSS | 4.3.3 | npm `tailwindcss/latest`; use the v4 CSS-first configuration and supported Vite integration. |
| Oxc lint | 1.87.0 | TypeScript 7-compatible linter selected for the scaffold; `typescript-eslint` 8.71.1 currently requires TypeScript `<6.1.0`. |

## Sources

- Node release status: https://nodejs.org/en/about/previous-releases
- React release announcement: https://react.dev/blog/2026/09/09/react-19-3
- React npm version: https://registry.npmjs.org/react/latest
- TypeScript npm version: https://registry.npmjs.org/typescript/latest
- Vite npm version and engine range: https://registry.npmjs.org/vite/latest
- pnpm installation/version: https://pnpm.io/installation and https://registry.npmjs.org/pnpm/latest
- Tailwind release history: https://tailwindcss.com/blog and https://registry.npmjs.org/tailwindcss/latest

## Pinning Policy

Use exact major/minor/patch versions for the runtime and build toolchain, commit `pnpm-lock.yaml`, and use `pnpm install --frozen-lockfile` in CI. Automated dependency update pull requests should run the full checks before merge. Check release/EOL status when updating Node; never equate "most recent Current" with "recommended production LTS".

JavaScript has no npm-style version pin. Use standard ES modules and set the TypeScript/browser output target from the supported browser matrix rather than blindly compiling to `ESNext`. Resolve compatible `@types/*`, test, lint, and API framework versions during initial scaffolding and lock them exactly; this report intentionally does not guess versions that were not independently verified.

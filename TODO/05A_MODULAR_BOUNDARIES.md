# TODO 05A: Modular Boundaries and Dependency Rules

**Status:** DONE
**Depends on:** TODO 02, TODO 05

## Goal

Make the new codebase modular by capability, with explicit ownership and one-way dependencies instead of a large page component or an all-purpose shared module.

## Work

- Define modules for `app-shell`, `auth`, `public-content`, `studio-pages`, `studio-cards`, `assets`, `publishing`, `github-adapter`, `content-schema`, and `design-system`.
- Record each module's public API, owned state/data, allowed imports, and prohibited imports.
- UI feature modules call typed application/API services; only the server GitHub adapter talks to GitHub write APIs.
- Keep public reader and Secret Studio as isolated route/page feature bundles that share only deliberate design/contracts packages.
- Prevent feature-to-feature imports of private implementation files; expose narrow public barrels only where necessary.
- Add dependency-boundary lint/tests and a module map to the architecture ADR.

## Done When

- Every source folder has a named owner/capability and documented dependency direction.
- There are no cycles between features or imports from the web bundle into server-only modules.
- Shared code is genuinely shared; unrelated feature state is not placed in global context.

## Verification

Run `corepack pnpm@12.11.2 lint` and `corepack pnpm@12.11.2 test`. The shared module-boundary test parses app imports, rejects web dependencies on server source or non-contract workspace packages, rejects cross-feature private imports, and checks local app cycles. CI runs it through both root gates. Current auth and navigation consumers import their public `index.ts` barrels.

**Evidence:** [ADR 0001](../docs/adr/0001-system-architecture.md#module-ownership-and-dependencies), `scripts/check-module-boundaries.mjs`, and passing local lint/test output.

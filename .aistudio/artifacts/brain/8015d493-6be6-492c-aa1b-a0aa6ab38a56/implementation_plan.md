# Deployment Setup Hardening & Zero-Failure Production Plan

A targeted production deployment audit and hardening sweep focused on the 8 files identified in `deploy.png` (`.env.example`, `.gitignore`, `bun.lock`, `index.html`, `metadata.json`, `package.json`, `tsconfig.json`, `vite.config.ts`).

## User Review & Critical Decisions

> [!IMPORTANT]
> - **1. Vite Configuration Hardening (`vite.config.ts`)**:
>   - Replace deprecated `__dirname` with modern `import.meta.dirname` to eliminate the Vite deprecation warning.
>   - Add production Rollup manual chunking (`react`, `react-dom`, `react-router-dom` in a dedicated cached vendor chunk) to reduce main bundle payload.
>   - Add `preview: { port: 3000, host: '0.0.0.0' }` to guarantee production container compatibility on port 3000.
> - **2. Package Manifest & Dependency Optimization (`package.json`)**:
>   - Add `"start": "vite preview --port=3000 --host=0.0.0.0"` script for one-click production container deployment.
>   - Rename `"name"` to `"mintlify-docs-deck"`.
>   - Remove unused dependency (`lucide-react`) to save installation time and disk footprint.
> - **3. TypeScript Strictness Invariant (`tsconfig.json`)**:
>   - Add `"strict": true`, `"noUnusedLocals": true`, `"noUnusedParameters": true`, and `"noFallthroughCasesInSwitch": true`.
>   - Scope compilation with explicit `"include": ["src", "vite.config.ts"]` and `"exclude": ["node_modules", "dist"]`.
> - **4. Prevent 404 Favicon Requests (`index.html`)**:
>   - Embed an inline SVG data-URI favicon displaying the Mintlify emerald leaf badge to eliminate production `/favicon.ico` 404 console errors.
> - **5. Production Git Invariant (`.gitignore`)**:
>   - Add `.vite/`, `.cache/`, `*.tsbuildinfo`, and build caches.
> - **6. Environment Documentation (`.env.example`)**:
>   - Clarify runtime environment variables and production deployment configuration.

---

## 1. Concrete Execution Steps

### Step 1: Update `vite.config.ts`
- Use `import.meta.dirname`.
- Configure Rollup `manualChunks`, `preview` port 3000, and CSS code splitting.

### Step 2: Optimize `package.json`
- Remove unused `lucide-react`.
- Add `"start": "vite preview --port=3000 --host=0.0.0.0"`.
- Update package name.

### Step 3: Harden `tsconfig.json`
- Enable `"strict": true`, unused parameter/variable checks, and explicit includes/excludes.

### Step 4: Add Inline Favicon & Audit `index.html`
- Insert SVG favicon link to prevent browser 404 requests.

### Step 5: Update `.gitignore` & `.env.example`
- Add modern tooling build caches and complete environment docs.

### Step 6: Document Deployment Hardening in `docs/CODEBASE_AUDIT_AND_OPTIMIZATION.md`
- Append Section 9: "Deployment Setup Hardening & Container Invariants".

---

## 2. Verification Plan
- Run `compile_applet` and `lint_applet` to confirm 0 build warnings and 0 TypeScript errors.
- Test production bundle output and vendor chunk generation.

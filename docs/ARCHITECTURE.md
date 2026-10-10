# System Architecture & Technical Topology (v1.0)

> **BIG TECH INTERNAL SPECIFICATION (RFC / TDD)**  
> **Author**: Core Infrastructure Team  
> **Status**: APPROVED & LOCKED  
> **Scope**: High-level application architecture, data pipelines, module boundaries, and reactive rendering flows.

---

## 1. Executive Summary

This application is built as an ultra-high-performance, zero-latency documentation workstation. Unlike conventional documentation platforms that query headless CMS backends over REST/GraphQL or trigger asynchronous network waterfalls for markdown files, this system compiles markdown directories statically into an in-memory prefix tree (trie) at build time.

All route lookups, hierarchical tree traversals, and pagination calculations execute with **$O(1)$ time complexity** in client memory, resulting in instant navigation and zero layout shifts (CLS = 0).

---

## 2. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            BUILD-TIME COMPILATION                           │
│                                                                             │
│  src/content/**/*.md                                                        │
│  (Markdown files, Frontmatter headers, Code blocks, Card decks)             │
│                             │                                               │
│                             ▼ [Vite import.meta.glob (eager: true)]         │
│  Static Ingestion Table (Record<string, string>)                            │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────────────┐
│                     CORE CONTENT ENGINE (src/lib/contentEngine.ts)          │
│                                                                             │
│  1. Forgiving Lexer: Parses YAML fences and un-fenced key:value headers     │
│  2. Path Segment Decomposer: Splits filepaths into hierarchical keys        │
│  3. Prefix Tree / Trie Accumulator: Maps parent -> child relationships       │
│  4. Deterministic Sorter: Order-based & alphanumeric tie-break sorting      │
│                                                                             │
│  OUTPUT: In-Memory Static PageNode Hierarchy (Root Nodes & Path Lookup Map) │
└─────────────────────────────┬───────────────────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────────────────┐
│                       CLIENT REACT RUNTIME (SPA)                            │
│                                                                             │
│  App.tsx (Root Provider & Dot Matrix Backdrop)                              │
│       │                                                                     │
│       ▼                                                                     │
│  DynamicPageView.tsx (Path Resolver via contentEngine.getPageByPath)        │
│       ├── Route Resolution: O(1) in-memory lookup                           │
│       ├── State Manager: URL sync, currentPage, search filtering            │
│       └── Bounded View Windowing: Enforces max 10 DOM elements per page     │
│                                                                             │
│  ┌───────────────────────┬────────────────────────┬──────────────────────┐  │
│  │     Breadcrumbs       │    SubCards (max 10)   │    PaginationBar     │  │
│  │ (BreadcrumbPath.tsx)  │   (ui/SubCard.tsx)     │ (ui/PaginationBar)   │  │
│  └───────────────────────┴────────────────────────┴──────────────────────┘  │
│  OR (if leaf documentation page):                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │         Interactive 3D Card Deck (SwipeableFlipCard.tsx)              │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Module Boundaries & Responsibilities

| Directory / File | Architectural Role | Isolation Invariant |
| :--- | :--- | :--- |
| `src/content/` | **Markdown Source of Truth** | Zero executable logic. Strictly formatted markdown documents containing frontmatter, key rules, and code blocks. |
| `src/lib/contentEngine.ts` | **Compiler & In-Memory Store** | Pure TypeScript module. Contains no React hooks, JSX, or DOM dependencies. Can run in Node, WebWorker, or browser. |
| `src/pages/DynamicPageView.tsx` | **Controller / View Orchestrator** | Bridges route state with `contentEngine`. Slices data into 10-item pages and determines whether to render a sub-page directory or leaf card deck. |
| `src/components/ui/` | **Pure Design System Primitives** | Presentational components (`SubCard`, `PaginationBar`) with strict geometric and stylistic contracts. |
| `src/types/index.ts` | **Domain Type Definitions** | Central repository for data interfaces: `PageNode`, `ComponentCard`, `SearchIndexItem`. |

---

## 4. Reactive State Flow & Navigation Lifecycle

1. **Initial Mount**:
   - `App.tsx` initializes, mounting the static `Header` and the dot-matrix ambient background.
   - `DynamicPageView` inspects `window.location.pathname`.
2. **Route Resolution**:
   - `contentEngine.getPageByPath(pathname)` is called.
   - If pathname is root (`/`), returns a synthetic virtual root containing the 20 primary documentation topics.
   - If pathname matches a directory (e.g. `/opencv`), returns the corresponding `PageNode` with its `children` array.
   - If pathname matches a leaf sub-page (e.g. `/opencv/detection`), returns the `PageNode` with its `cards` array.
3. **Pagination Derivation**:
   - The view checks `node.children.length`.
   - `totalPages = Math.ceil(node.children.length / 10)`.
   - Items are sliced: `currentSlice = node.children.slice((page - 1) * 10, page * 10)`.
   - If `totalPages > 1`, `PaginationBar` is rendered at the bottom.
4. **User Navigation**:
   - Clicking a `SubCard` calls `window.history.pushState(null, '', newPath)` and fires a route transition.
   - Clicking `PaginationBar` page `02` sets local `currentPage` state to `2` with zero network overhead.

---

## 5. Security & Isolation Model

- **No Remote Code Execution (RCE)**: No dynamic `eval` or unsafe markdown HTML injection (`dangerouslySetInnerHTML` is audited and restricted).
- **Client Sandbox**: All content is bundled at build time; no third-party APIs or unauthenticated endpoints are invoked during standard traversal.

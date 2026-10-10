# Engineering & Architecture Documentation

> **CENTRAL DEVELOPER & AGENT CONTRACT**  
> This directory houses the authoritative specifications for the application. Any engineer or AI agent working on this codebase must adhere to the design baselines, component APIs, and internal architectural invariants defined below.

---

## 1. System Documentation Map

```
/docs
├── README.md                          # [YOU ARE HERE] Master navigation & invariant summary
│
├── [EXECUTION FLOW & CODE AUDIT]
│   ├── CODEBASE_MAPPING.md            # End-to-end trace from index.html to terminal components
│   └── CODEBASE_AUDIT_AND_OPTIMIZATION.md # Code quality audit, anti-pattern resolution & bundle savings
│
├── [INTERNAL ARCHITECTURE & ENGINE SPECIFICATIONS]
│   ├── ARCHITECTURE.md                # System topology, data flow, reactive lifecycle, and module boundaries
│   ├── AUTOMATED_FILE_PROCESSING.md   # Autonomous HNP/HNC hierarchy, deterministic sorting, and auto-URLs
│   ├── CONTENT_ENGINE.md              # Static Vite glob, forgiving lexer, Trie algorithm, and sorting rules
│   ├── PAGINATION_AND_STATE.md        # 10-Item windowing math, global index calculation, and state machines
│   └── PERFORMANCE_AND_SCALABILITY.md # Constant O(1) DOM density, GPU 3D compositing, and memory benchmarks
│
└── [DESIGN SYSTEM & PRESENTATION BASELINES]
    ├── DESIGN_BASELINE_V1.md          # Approved Desktop, Tablet, and Mobile visual standards & snapshots
    ├── COLOR_SYSTEM.md                # Obsidian & Emerald palette, surface levels, borders, and lighting
    └── COMPONENTS.md                  # UI Component catalog, TypeScript interfaces, dimensions, and props
```

---

## 2. Document Descriptions & Target Audiences

### Codebase Mapping & Optimization Audits
- [**CODEBASE_MAPPING.md**](./CODEBASE_MAPPING.md): Traces the exact start-to-finish execution journey: `index.html` &rarr; `src/main.tsx` &rarr; `src/App.tsx` &rarr; Router Switchboard &rarr; `contentEngine` data ingestion &rarr; Page Controllers &rarr; Terminal UI components &rarr; Event loop dispatch and unmount cleanup.
- [**CODEBASE_AUDIT_AND_OPTIMIZATION.md**](./CODEBASE_AUDIT_AND_OPTIMIZATION.md): Detailed architectural audit detailing the elimination of 60+ lines of duplicated JSX templates, removal of orphaned dead modules, centralization of pagination constants, and zero-failure guarantees.

### Internal Engineering & Architecture (Big Tech RFC Standards)
- [**ARCHITECTURE.md**](./ARCHITECTURE.md): High-level system design document. Explains compilation vs runtime boundaries, data flow lifecycles, and security sandboxing.
- [**AUTOMATED_FILE_PROCESSING.md**](./AUTOMATED_FILE_PROCESSING.md): Definitive guide to the autonomous file-processing engine. Covers HNP nested pages, HNC card directories, deterministic numerical ordering, automatic clean URL generation, and step-by-step authoring.
- [**CONTENT_ENGINE.md**](./CONTENT_ENGINE.md): Deep mechanical dive into `src/lib/contentEngine.ts`. Covers compile-time ingestion via Vite's static glob, forgiving frontmatter lexing, Trie path accumulation, and alphanumeric sorting.
- [**PAGINATION_AND_STATE.md**](./PAGINATION_AND_STATE.md): Formal mathematical specification of the 10-item windowing engine, global sequence calculation formulas, and URL-driven state machines.
- [**PERFORMANCE_AND_SCALABILITY.md**](./PERFORMANCE_AND_SCALABILITY.md): Performance analysis detailing the constant $O(1)$ DOM density invariant, GPU-accelerated CSS 3D compositing, and memory profiling.

### Design System & Facade Standards
- [**DESIGN_BASELINE_V1.md**](./DESIGN_BASELINE_V1.md): Golden standard visual verification document with approved Desktop, Tablet, and Mobile responsive snapshots.
- [**COLOR_SYSTEM.md**](./COLOR_SYSTEM.md): Complete obsidian and emerald color tokens, alpha borders, contrast ratios, and ambient atmosphere gradients.
- [**COMPONENTS.md**](./COMPONENTS.md): Component catalog and API reference for `SubCard`, `PaginationBar`, `Header`, `BreadcrumbPath`, and `SwipeableFlipCard`.

---

## 3. Top Non-Negotiable Invariants

1. **Strict 10-Item Rendering Ceiling**: No list view may render more than 10 items in the DOM at any time.
2. **Fixed Geometric Rhythm**: All primary interactive items and the pagination bar enforce a uniform `h-10` (40px) height.
3. **Zero Runtime Waterfall**: All content is compiled statically at build time into an in-memory prefix tree; runtime network fetching for markdown files is forbidden.
4. **Global Sequence Preservation**: Sub-items on Page 2 must display their true global sequence indices (`11` through `20`), not local indices (`01` through `10`).
5. **DRY Component Reusability**: Use high-order polymorphic primitives (`<SubCard ... />`, `<PaginatedSubCardList ... />`) with structured props instead of copy-pasting JSX subtrees or pagination logic into page views.

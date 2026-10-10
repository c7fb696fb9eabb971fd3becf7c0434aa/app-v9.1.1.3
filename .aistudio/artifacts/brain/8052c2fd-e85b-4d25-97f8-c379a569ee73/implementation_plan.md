# Autonomous Unlimited Nesting Content Engine (HNP & HNC Architecture)

A fully automated, recursive file-processing engine that transforms arbitrarily nested directories and files into clean, ordered documentation pages and interactive 3D swipable card decks with zero manual code configuration.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> The engine is designed around your exact specification: `[ORDER]-hnp-[SLUG]` for Horizontal Nested Pages, `[ORDER]-hnc-[CARD].md` for Horizontal Nested Cards, and `root/index.md` for page metadata. Please review the confirmed architectural choices below:

- **Confirmed Decision 1: Prefix Pattern & Deterministic Ordering**: Folder segments prefixed with `\d+-hnp-` define page nodes with numeric sorting priority (`01`, `02`, `10`). Card files prefixed with `\d+-hnc-` define ordered swipable cards.
- **Confirmed Decision 2: Clean Public URLs**: All numeric ordering markers and `hnp-` tags are automatically stripped from browser routes (e.g. `01-hnp-opencv/01-hnp-imageprocessing` becomes `/opencv/imageprocessing`).
- **Confirmed Decision 3: Backward Compatibility**: The recursive parser supports both the new `hnp`/`hnc` convention and the existing legacy files (`01-index.md`, `01-card/`, etc.) so the existing knowledge base remains fully operational while transitioning.
- **Confirmed Decision 4: Card Deep-Linking**: Active cards are addressable via URL hash (e.g., `/opencv/imageprocessing#filters`), allowing direct sharing of any individual card at any depth.

---

### 1. Overview & Core Concept

- **What It Does**: Scans the entire `src/content/` directory via Vite's static glob at build/dev time and recursively builds a multi-tier tree (Rose Tree / Trie). It automatically derives clean URLs, creates breadcrumb hierarchies, sorts child pages and cards deterministically, and renders dynamic documentation pages containing primary metadata, swipable 3D flip-card decks, and nested sub-page navigation.
- **Target Audience / Persona**: Developers, educators, and technical writers who want to author documentation and interactive study cards strictly through the file system without touching TypeScript routers, config files, or navigation lists.
- **Key Value**: True zero-configuration scaling. Dropping a folder or card anywhere in the hierarchy automatically creates the routes, updates breadcrumbs, and renders the view.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Root Directory Discovery*: User lands on `/` and views the primary cards for top-level pages (`01-hnp-opencv`, `02-hnp-pytorch`, etc.), sorted strictly by their numeric prefix.
  2. *Deep Recursive Navigation*: Clicking a sub-page smoothly transitions to `/opencv/imageprocessing` or `/opencv/imageprocessing/filters` at arbitrary depth.
  3. *Contextual Breadcrumbs*: Breadcrumb path (`Home > OpenCV > Image Processing > Filters`) allows one-click jumping back to any ancestor level.
  4. *Interactive Card Deck Swiping*: On any page with `hnc` cards, users swipe horizontally or flip cards in 3D to reveal code specifications and key rules, with the current card synced to the URL hash.
  5. *Nested Branch Exploration*: If a page contains both cards and child sub-pages, the cards deck renders above the sub-page grid, maintaining a clear visual hierarchy.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Mintlify Midnight Obsidian & Emerald. Deep space dark background (`#070a0e`) with obsidian structural surfaces (`#0b0f17`), hairline slate borders (`rgba(255, 255, 255, 0.08)`), and luminous emerald accents (`#10b981`).
  - *Color Palette*:
    - Canvas (60%): `#070a0e` with ambient dot matrix overlay
    - Structural Surfaces (30%): `#0b0f17`, `#111827`, border `#1e293b`
    - High-Intent Accents (10%): `#10b981` (emerald-500), `#34d399` (emerald-400), `#059669` (emerald-600)
  - *Typography & Hierarchy*:
    - Display & Titles: `Plus Jakarta Sans` (font-semibold, tracking-tight, balanced headlines)
    - Code & Tabular Figures: `JetBrains Mono` (`tabular-nums` for numeric ordering badges and interfaces)
    - Metadata: Clean unboxed typography with typographic dot separators (`·`), zero static pill cliches.
  - *Component Styling & Layout*:
    - Single-elevation depth: Flat card containers with hairline borders, avoiding nested box-in-box clutter.
    - Full 1440px desktop baseline with responsive 100% mobile touch gestures.

- **Interactive Feedback & Motion**:
  - CSS 3D card flips with `perspective-1000` and `transform-style-3d`.
  - Spring-assisted swipe transitions ($\le 200\text{ms}$) utilizing compositor-only transforms.
  - Keyboard arrow navigation (`ArrowLeft` / `ArrowRight`) and flip shortcut (`Space` / `Enter`).

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Vite Static Glob vs Runtime Fetch**:
  - *Chosen Approach*: Vite `import.meta.glob('/src/content/**/*.{md,markdown}', { eager: true, query: '?raw' })`.
  - *Why*: Compile-time evaluation generates an instant in-memory tree with zero network latency, zero broken 404 links, and total client-side stability.
  - *Alternatives Considered*: Dynamic runtime `fetch()` requests on navigation (rejected due to network latency and offline fragility).

- **Decision 2: Path Stripping Algorithm for URLs**:
  - *Chosen Approach*: Strip `\d+-hnp-` during URL calculation, but retain the integer `order` in the node's data model for sorting.
  - *Why*: Gives human-friendly, SEO-optimized URLs (`/opencv/imageprocessing`) while keeping total ordering power in the folder structure (`01-hnp-opencv/01-hnp-imageprocessing`).

- **Decision 3: Card Placement Flexibility**:
  - *Chosen Approach*: Support both direct files (`01-hnc-name.md` directly in the page folder) and dedicated card folders (`01-card/01-hnc-name.md`).
  - *Why*: Accommodates both compact flat hierarchies and modular folder setups without restricting authoring preferences.

---

### 4. Technical Architecture & Data Strategy (Technical Reference)

- **Architecture & Component Diagram**:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      VITE STATIC GLOB INPUT MAP                        │
 │           Raw content strings from /src/content/**/*.{md,markdown}     │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      PATH TOKENIZER & TREE BUILDER                     │
 │                     (src/lib/contentEngine.ts)                         │
 │                                                                        │
 │  1. Tokenize Segments:                                                 │
 │     "01-hnp-opencv" -> { type: 'page', order: 1, slug: 'opencv' }      │
 │     "root/index.md" -> { type: 'meta', data: Frontmatter }             │
 │     "01-hnc-blur.md" -> { type: 'card', order: 1, id: 'blur' }         │
 │                                                                        │
 │  2. Recursive Node Assembly:                                           │
 │     Root -> PageNode(opencv) -> PageNode(imageprocessing)              │
 │                                                                        │
 │  3. Deterministic Sort:                                                │
 │     Sort children by order ascending, then natural alphanumeric.       │
 │     Sort cards by order ascending, then natural alphanumeric.          │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      CENTRAL REGISTRY & RESOLVER                       │
 │                                                                        │
 │  • getContentRegistry(): PageNode[] (Root nodes)                       │
 │  • resolvePathNode(segments): { node, breadcrumbs, currentPath }       │
 │  • getPageByPath(url): O(1) segment walker                             │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                   ┌─────────────────┴─────────────────┐
                   ▼                                   ▼
 ┌───────────────────────────────────┐ ┌──────────────────────────────────┐
 │      REACT ROUTER & VIEWS         │ │      INTERACTIVE COMPONENTS      │
 │  • App.tsx (/* catch-all)         │ │  • BreadcrumbPath.tsx            │
 │  • HomePage.tsx (Root Cards)      │ │  • PrimaryCardShell.tsx          │
 │  • DynamicPageView.tsx            │ │  • SwipeableFlipCard.tsx         │
 │    - Resolves node at any depth   │ │  • PaginatedSubCardList.tsx      │
 │    - Renders Primary Metadata     │ │  • StraightLineInput.tsx         │
 │    - Renders Card Deck (HNC)      │ │                                  │
 │    - Renders Sub-Pages (HNP)      │ │                                  │
 └───────────────────────────────────┘ └──────────────────────────────────┘
```

- **Data Model & Node Interface**:

```typescript
export interface ComponentCard {
  id: string;
  title: string;
  tag: string;
  definition: string;
  keyRule: string;
  order?: number;
  deepDive: {
    typescriptInterface: string;
  };
}

export interface PageNode {
  id: string;            // Canonical key e.g. "opencv/imageprocessing"
  slug: string;          // Normalized URL slug e.g. "imageprocessing"
  title: string;         // Human display title from metadata or humanized slug
  order?: number;        // Numeric priority (e.g. 1 from "01-hnp-")
  version?: string;      // Metadata version
  category?: string;     // Metadata category
  summary?: string;      // Page overview description
  cards: ComponentCard[]; // Swipable flip cards on this page
  children: PageNode[];  // Nested child pages (arbitrary depth)
}
```

- **Interactive State Transitions**:
  - `activeCardIndex`: Controlled state on `DynamicPageView`, initialized from `#hash` or defaulting to 0.
  - `swipeDirection`: Left/Right gesture transition triggering 3D flip card swap.
  - `searchTerm`: Filter query dynamically pruning both visible sub-pages and cards on the current view with zero reload delay.

- **Verification Plan**:
  1. Update `src/lib/contentEngine.ts` with the robust tokenizer, regex extractors, and recursive tree assembly.
  2. Create test fixture content verifying Depth 1 (`01-hnp-opencv/root/index.md`), Depth 2 (`01-hnp-opencv/01-hnp-imageprocessing/01-hnc-sweappable.md`), and Depth 3 (`01-hnp-filters/01-hnc-gaussian.md`).
  3. Validate clean URL routing (`/opencv`, `/opencv/imageprocessing`) and card navigation.
  4. Run `compile_applet` and verify zero TypeScript or bundler errors.

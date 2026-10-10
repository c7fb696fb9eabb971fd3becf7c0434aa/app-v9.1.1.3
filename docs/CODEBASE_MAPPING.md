# Codebase End-to-End Mapping & Lifecycle Architecture (v1.0)

> **BIG TECH INTERNAL SPECIFICATION (RFC / TDD)**  
> **Topic**: Complete Execution Flow, Module Wiring & Communication Topology  
> **Status**: APPROVED & LOCKED  
> **Purpose**: Trace the exact execution path from browser boot to leaf component rendering, state dispatch, and event destruction.

---

## 1. Executive Summary & Flowchart

The diagram below maps the complete execution journey, showing how data, control flow, and user events traverse the application from entry point to terminal UI components:

```
[ BROWSER ENTRY ]
       │
       ▼
 index.html ──► Loads font stylesheets, defines <div id="root"></div>
       │
       ▼
 src/main.tsx ──► Calls createRoot(document.getElementById('root')!).render(<App />)
       │
       ▼
  src/App.tsx ──► Wraps application in <BrowserRouter>
       │       ├── Injects <DotMatrixBackground /> (Ambient Obsidian Canvas)
       │       ├── Injects <Header /> (Fixed Top Navigation Bar)
       │       └── Declares Route Switchboard:
       │             ├── Path "/"   ──► <HomePage />
       │             └── Path "/*"  ──► <DynamicPageView />
       │
       ├─────────────────────────────────────────────┐
       ▼                                             ▼
 [ ROUTE: "/" ]                              [ ROUTE: "/*" ]
src/pages/HomePage.tsx                  src/pages/DynamicPageView.tsx
       │                                             │
       │                                             ▼
       │                             Query contentEngine.getPageByPath(pathname)
       │                                             │
       ├───► Fetches root topics                     ├────────────────────────┐
       │     contentEngine.getRootPages()            │                        │
       │                                             ▼                        ▼
       │                                    [Has Sub-Pages]          [Leaf Card Deck]
       │                                    (node.children > 0)      (node.cards > 0)
       ▼                                             │                        │
Applies 10-Item Windowing Math                       ▼                        ▼
startIndex = (page - 1) * 10               Renders Directory View     Renders 3D Card Deck
endIndex = min(startIndex + 10, total)               │                        │
       │                                             │                        ▼
       ├──► <BreadcrumbPath />                       ├──► <BreadcrumbPath />  <SwipeableFlipCard />
       ├──► <SubCard /> (x10)                        ├──► <SubCard /> (x10)   ├── Front: Key Rule
       └──► <PaginationBar />                        └──► <PaginationBar />   └── Back: TypeScript
```

---

## 2. Phase 1: Bootstrapping & DOM Ingestion

### Step 1: `index.html` (The Host Document)
- **Role**: Entry point for the browser.
- **Attributes**:
  - `class="dark"`: Enforces dark mode styles at document root.
  - `<div id="root"></div>`: The single mount container for the React tree.
  - `<script type="module" src="/src/main.tsx"></script>`: Hands control to modern ES module execution.
  - Google Fonts preconnect and stylesheets (`JetBrains Mono` and `Plus Jakarta Sans`).

### Step 2: `src/main.tsx` (Hydration & React Bootstrap)
- **Role**: Initializes the React 18 Concurrent Root.
- **Execution Code**:
  ```typescript
  import { createRoot } from 'react-dom/client';
  import App from './App.tsx';
  import './index.css';

  createRoot(document.getElementById('root')!).render(<App />);
  ```
- **Side Effects**: Imports `index.css`, which imports Tailwind CSS (`@import "tailwindcss";`) and configures global reset styles.

---

## 3. Phase 2: Application Shell & Router Switchboard

### Step 3: `src/App.tsx` (Global Shell)
- **Role**: Coordinates routing, atmospheric backdrops, and global chrome.
- **Wiring & Children**:
  1. `<BrowserRouter>`: Initializes HTML5 History API tracking (`popstate` listener).
  2. `<DotMatrixBackground />`: Renders the full-screen non-scrolling SVG dot pattern and emerald radial glow.
  3. `<Header />`: Renders the fixed `h-12` header with obsidian glass styling and centered hexagonal glyph.
  4. `<main>`: Centers content with max width constraints (`max-w-xl mx-auto`).
  5. `<Routes>`:
     - Route `/` &rarr; `<HomePage />`
     - Route `/*` &rarr; `<DynamicPageView />`

---

## 4. Phase 3: The In-Memory Data Backbone (`src/lib/contentEngine.ts`)

Before any view mounts, `contentEngine.ts` executes at module initialization:

```
src/content/**/*.md
       │
       ▼ [Compile-time static globbing]
import.meta.glob('/src/content/**/*.{md,markdown}', { eager: true, query: '?raw' })
       │
       ▼ [Forgiving Lexer & Trie Accumulator]
NodeAccumulator Table (Sets of childSlugs and node metadata)
       │
       ▼ [Hierarchical Tree Builder & Sorter]
pageTreeMap (Map<string, PageNode>) & rootPages (PageNode[])
```

### Communication Contract
Views communicate with `contentEngine` strictly through pure, side-effect-free methods:
- `contentEngine.getRootPages()`: Returns the 20 primary root documentation topics.
- `contentEngine.getPageByPath(pathname)`: Resolves any nested URL path into a populated `PageNode` in $O(1)$ time.
- `contentEngine.getSearchIndex()`: Provides pre-tokenized items for search matching.

---

## 5. Phase 4: Page Controllers & Rendering Logic

### Case A: Root Route (`/`) &rarr; `src/pages/HomePage.tsx`
1. Calls `contentEngine.getRootPages()`.
2. Computes 10-item pagination:
   - `totalPages = Math.ceil(topics.length / 10)` (20 topics = 2 pages).
   - `visibleTopics = topics.slice((currentPage - 1) * 10, currentPage * 10)`.
3. Renders list of `<SubCard>` items:
   - Formats global sequence: `01` through `10` on Page 1, `11` through `20` on Page 2.
   - On click, invokes `navigate(topic.path)`.
4. Renders `<PaginationBar>` centered at bottom when `totalPages > 1`.

### Case B: Dynamic Nested Route (`/*`) &rarr; `src/pages/DynamicPageView.tsx`
1. Extracts `location.pathname` via `useLocation()`.
2. Calls `contentEngine.getPageByPath(location.pathname)`.
3. **Branch 1: Category Directory (`node.children.length > 0`)**:
   - Renders `<BreadcrumbPath />` with step-up navigation.
   - Slices child pages into 10-item pages.
   - Renders list of `<SubCard>` elements.
   - Renders `<PaginationBar />` if children exceed 10.
4. **Branch 2: Leaf Card Deck (`node.cards.length > 0`)**:
   - Renders `<BreadcrumbPath />`.
   - Renders `<SwipeableFlipCard />` loaded with slide cards.
   - Enables 3D perspective flip interactions and touch swipe gestures.
5. **Branch 3: 404 Missing Route (`node === null`)**:
   - Renders an obsidian fallback container with a button linking back to `/`.

---

## 6. Phase 5: Terminal UI Component Primitives

| Component | Upstream Parent | Downstream Children | Incoming Props | Outgoing Events |
| :--- | :--- | :--- | :--- | :--- |
| **`Header`** | `App.tsx` | Brand SVG icon | None | Internal navigation click |
| **`DotMatrixBackground`** | `App.tsx` | SVG Canvas | None | None (inert presentation) |
| **`BreadcrumbPath`** | `HomePage`, `DynamicPageView` | Breadcrumb links, Back button | `currentPath: string`, `title?: string` | `onBack()` / `navigate()` |
| **`SubCard`** | `HomePage`, `DynamicPageView` | Chevron, index, title, arrow | `children`, `onClick`, `className` | `onClick()` |
| **`PaginationBar`** | `HomePage`, `DynamicPageView` | Page buttons, `<` and `>` arrows | `currentPage`, `totalPages`, `onPageChange` | `onPageChange(newPage)` |
| **`SwipeableFlipCard`** | `DynamicPageView` | Front face, back face, code well | `cards: ComponentCard[]` | Flip triggers, touch events |

---

## 7. Phase 6: User Event Loop & Lifecycle Cleanups

```
User Action: Press 'Escape'
  └──► BreadcrumbPath listener triggers:
         └──► window.history.back() or navigate(parentPath)

User Action: Click SubCard
  └──► SubCard.onClick() triggers:
         └──► navigate(targetPath)
                └──► React Router updates location.pathname
                       └──► DynamicPageView re-evaluates getPageByPath()
                              └──► Reset currentPage = 1, flipped = false
                                     └──► Paint new 10-item slice

User Action: Click Pagination '<' or '>'
  └──► PaginationBar.onPageChange(newPage) triggers:
         └──► DynamicPageView.setCurrentPage(newPage)
                └──► Re-computes slice indices
                       └──► Instant re-render of 10 SubCards (Zero network request)

User Action: Click Flip Card or Press 'Space' / 'F'
  └──► SwipeableFlipCard.setFlipped(!flipped) triggers:
         └──► CSS 3D transform: rotateY(180deg)
                └──► GPU Compositor animates card flip at 60 FPS
```

### Component Unmount & Cleanup Lifecycle
- Global keyboard event listeners (`keydown` for `Escape`, `Space`, `F`) register in `useEffect` hooks and return precise teardown cleanup functions (`removeEventListener`), preventing memory leaks during route transitions.
- Touch gesture listeners track `clientX` on `touchstart` and calculate horizontal velocity on `touchend`, resetting tracking state upon touch cancellation.

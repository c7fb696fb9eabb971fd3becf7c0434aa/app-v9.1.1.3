# Content Engine Internal Mechanics & Specifications (v1.0)

> **BIG TECH INTERNAL SPECIFICATION (RFC / TDD)**  
> **Source Module**: `src/lib/contentEngine.ts`  
> **Status**: APPROVED & LOCKED  
> **Purpose**: In-depth mechanical explanation of the static file ingestion, lexing, hierarchy construction, and tree lookup algorithms.

---

## 1. Problem Statement & Design Objectives

In standard web applications, rendering hundreds of nested markdown files typically requires either:
1. Dynamic `fetch()` requests at runtime (introduces latency waterfalls, loading spinners, and network failures).
2. Heavy headless CMS libraries (bloats bundle size, introduces external dependencies).

`contentEngine.ts` was engineered to solve this with three hard guarantees:
- **Zero Runtime Latency**: All markdown files are bundled at compile time into an in-memory prefix tree.
- **Fault-Tolerant Lexing**: Parses valid YAML frontmatter, plain key-value headers, or completely un-fenced markdown without crashing.
- **Deterministic Hierarchical Ordering**: Strictly respects numerical step prefixes (`01-index.md` ... `20-index.md`), `order` frontmatter fields, and natural language collation.

---

## 2. Ingestion Pipeline: Vite Static Glob

At the top of `src/lib/contentEngine.ts`:

```typescript
const rawMarkdownFiles = import.meta.glob('/src/content/**/*.{md,markdown}', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;
```

### How It Operates Under the Hood
- `eager: true` tells Vite to bundle all matching markdown files directly into the module bundle rather than creating dynamic chunk imports.
- `query: '?raw'` instructs Vite to import the raw string contents of each file instead of attempting to compile it as code.
- Result: An immutable in-memory dictionary mapping absolute virtual paths (e.g. `/src/content/opencv/detection/01-index.md`) to raw string buffers.

---

## 3. The Forgiving Header & Frontmatter Lexer

The function `parseForgivingHeaders(rawContent: string)` accepts any markdown string and robustly extracts metadata:

```
Raw Markdown Buffer
       │
       ▼
Does content begin with `---`?
       ├── YES ──► Extract fenced block between `---` markers
       │
       └── NO  ──► Scan line-by-line from top until an empty line, '#', '```', or '>' is encountered
       │
       ▼
Extract key:value pairs (supporting strings, numbers, booleans)
       │
       ▼
Discard deprecated fields (e.g. summary)
       │
       ▼
Return { data: Record<string, any>, body: string }
```

### Parser Robustness Guarantees
- Handles Windows CRLF (`\r\n`) and Unix LF (`\n`) identically.
- Automatically coerces numeric strings (`"order: 1"`) into primitive numbers (`1`).
- Coerces boolean flags (`"true"`, `"false"`) into JavaScript booleans.
- Strips single and double quotes cleanly.
- Falls back to body text seamlessly if no headers exist.

---

## 4. Trie & Prefix Tree Construction Algorithm

The content engine organizes directories into a prefix tree using `registerHierarchy(segments)` and `NodeAccumulator`:

### Step-by-Step Hierarchy Registration
1. **Path Segmentation**:
   Given `/src/content/cuda/shared-memory/02-index.md`, the path segments are:
   `["cuda", "shared-memory"]` with leaf filename `02-index.md`.
2. **Segment Traversal**:
   For every prefix length $i \in [1, \dots, \text{length}]$:
   - Level 1: `["cuda"]` &rarr; Parent root node.
   - Level 2: `["cuda", "shared-memory"]` &rarr; Registered as child slug of `["cuda"]`.
3. **Child Linkage**:
   `getNode(["cuda"]).childSlugs.add("shared-memory")`.

### Deduplication Invariant
Because `childSlugs` is backed by a native JavaScript `Set<string>`, duplicate entries from multiple files inside the same folder (e.g. index file + card slides) never generate duplicate child records.

---

## 5. Deck & Card Extraction Pipeline

Cards are swipable slides housed within topic sub-pages. Two structures are supported:
1. **Dedicated Card Folders**: E.g. `src/content/opencv/vision/01-card/01-sweappable.md`.
2. **Numbered Flat Cards**: E.g. `src/content/python/01-cyclic-gc.md`.

When parsed:
- `parseSwipableSlide()` extracts the slide's title, version, and category.
- Extracts Key Rules via regex:
  ```typescript
  /(?:^|\r?\n)(?:#{1,6}\s*)?(?:Key\s+Rules?|Rules?):?\s*?\r?\n([\s\S]*?)(?=(?:\r?\n#{1,6}\s)|(?:\r?\n```)|$)/i
  ```
- Extracts TypeScript code blocks between <code>```typescript ... ```</code> fences.
- Slides are sorted numerically by filename (`01-sweappable`, `02-sweappable`) and stored in `node.cards`.

---

## 6. Tree Resolution & Deterministic Sorting

When `buildSubTree(segments)` runs to finalize the tree:

```typescript
const children: PageNode[] = Array.from(nodeAcc.childSlugs)
  .map((childSlug) => buildSubTree([...segments, childSlug]))
  .sort((a, b) => {
    const orderA = a.order ?? 999999;
    const orderB = b.order ?? 999999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.title.localeCompare(b.title, undefined, { numeric: true });
  });
```

### Sorting Priority
1. **Primary Sort**: Explicit `order` integer (extracted from numeric prefixes like `01-index.md` &rarr; `order: 1`, or frontmatter `order: 1`).
2. **Secondary Sort**: Alphanumeric collation using `localeCompare` with `{ numeric: true }` (ensuring `"2"` comes before `"10"`).

---

## 7. Public API Methods

| Method | Signature | Time Complexity | Description |
| :--- | :--- | :--- | :--- |
| `getRootPages()` | `(): PageNode[]` | $O(1)$ | Returns all 20 primary root documentation topics. |
| `getPageByPath(path)` | `(path: string): PageNode \| null` | $O(1)$ | Instant lookup of any page by URL pathname (e.g. `"/opencv/detection"`). |
| `getAllPages()` | `(): PageNode[]` | $O(1)$ cached | Returns a flat array of all indexed `PageNode` objects in the system. |
| `getSearchIndex()` | `(): SearchIndexItem[]` | $O(1)$ cached | Pre-indexed search tokens for instant title, category, and code queries. |

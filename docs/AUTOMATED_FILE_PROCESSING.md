# Automated File Processing & Autonomous Hierarchy Architecture

> **SYSTEM ARCHITECTURAL SPECIFICATION & AUTHORING GUIDE**  
> **Source Engine**: `src/lib/contentEngine.ts`  
> **Routing Engine**: `src/pages/DynamicPageView.tsx`  
> **Status**: ACTIVE & VERIFIED  
> **Purpose**: Complete reference for the autonomous file-processing machine that transforms arbitrary directory structures into clean, ordered documentation decks and navigation hierarchies without code changes.

---

## 1. Core Architecture & Philosophy

The application uses an **Autonomous File-Driven Architecture**. Instead of manually registering routes, updating configuration dictionaries, or wiring up navigation menus in TypeScript, **the file system is the single source of truth**.

Whenever you add, delete, rename, or reorder files or folders in `src/content/`:
1. Vite's compile-time glob (`import.meta.glob`) captures the new file layout.
2. The tokenizer breaks each path into semantic tokens (Pages, Cards, Metadata).
3. The recursive engine builds an in-memory Rose Tree (N-ary Tree) of `PageNode` and `ComponentCard` objects.
4. Ordering numbers (`01-`, `02-`) dictate UI positioning and badges everywhere.
5. URL routes and breadcrumb paths are automatically derived and sanitized.

```
 Physical File on Disk:
 src/content/ [01]-hnp-[opencv] / [01]-hnp-[imageprocessing] / [01]-hnc / [01]-hnc-[filter2d].md
                 │                              │                  │              │
                 ▼ Strip prefix                 ▼ Strip prefix     ▼ Group Deck   ▼ Card #1
 Browser Route:  /opencv                        /imageprocessing                  #filter2d
 UI Badge:       "01 OpenCV"                    "01 Image Proc."                  "01 cv::filter2D"
```

---

## 2. Directory & Naming Conventions

### A. Horizontal Nested Page (`HNP`)
- **Syntax**: `[ORDER]-hnp-[SLUG]`
- **Examples**:
  - `01-hnp-opencv`
  - `01-hnp-imageprocessing`
  - `02-hnp-featuredetection`
- **Behavior**:
  - The leading integer `[ORDER]` dictates its sequence number (`01`, `02`) in UI lists.
  - The `hnp` marker signals to the parser: *"This directory is a navigational page node."*
  - The `[SLUG]` becomes the URL segment (e.g., `imageprocessing` $\rightarrow$ `/imageprocessing`).

### B. Page Metadata Isolation (`root/index.md`)
- **Syntax**: `root/index.md` inside any `hnp` folder
- **Examples**:
  - `01-hnp-opencv/root/index.md`
  - `01-hnp-imageprocessing/root/index.md`
- **Behavior**:
  - Contains frontmatter defining the page's metadata: `title`, `version`, `category`, `summary`.
  - Is **never** rendered as a `/root` route segment. It directly defines the parent page.
  - If a page has no cards, this metadata renders on its overview card and in parent lists.

### C. Horizontal Nested Card Holder (`HNC Directory`)
- **Syntax**: `[ORDER]-hnc`
- **Examples**:
  - `01-hnc/` $\rightarrow$ Card Holder #1 on the page
  - `02-hnc/` $\rightarrow$ Card Holder #2 on the page
- **Behavior**:
  - Each `[ORDER]-hnc` folder renders as a **discrete, separate Card Component** on the page.
  - The leading `[ORDER]` dictates the card's position on the page (Card 01 on top, Card 02 below it).
  - Holds its own independent set of swipable slides with its own slide indicator dots.

### D. Swipable Card Slide File (`HNC Slide File`)
- **Syntax**: `[ORDER]-hnc-[SLUG].md` (or `[ORDER]-[SLUG].md` inside an `hnc` folder)
- **Examples**:
  - `01-hnc-sweappable.md` $\rightarrow$ Slide #1 in this card holder
  - `02-hnc-geometric-warp.md` $\rightarrow$ Slide #2 in this card holder
- **Behavior**:
  - Represents a swipable slide inside its parent `hnc` card holder.
  - Swiping or clicking indicator dots transitions between slides within that specific card.
  - The number `[ORDER]` dictates the slide index and appears on the card header badge (`01`, `02`).

---

## 3. Current Live File Tree Reference

```
src/content/
└── 01-hnp-opencv/                          <-- Root Page #01 (URL: /opencv)
    ├── root/
    │   └── index.md                        <-- Metadata for OpenCV
    │
    ├── 01-hnp-imageprocessing/             <-- Nested Page #01 (URL: /opencv/imageprocessing)
    │   ├── root/
    │   │   └── index.md                    <-- Metadata for Image Processing
    │   └── 01-hnc/                         <-- Card Container #01
    │       ├── 01-hnc-sweappable.md        <-- Card #01 (filter2D)
    │       └── 02-hnc-geometric-warp.md    <-- Card #02 (warpAffine)
    │
    └── 02-hnp-featuredetection/            <-- Nested Page #02 (URL: /opencv/featuredetection)
        ├── root/
        │   └── index.md                    <-- Metadata for Feature Detection
        └── 01-hnc/                         <-- Card Container #01
            ├── 01-hnc-orb-detector.md      <-- Card #01 (ORB Detector)
            └── 02-hnc-flann-matcher.md     <-- Card #02 (FLANN Matcher)
```

---

## 4. Deterministic Ordering System

### The Law of Numbers in UI
Numbers prefixed to folders and files are **never ignored in computation**—they are strictly used for display ordering and visual badges:

| Path on Disk | Parsed Order | UI Badge Display |
| :--- | :---: | :---: |
| `01-hnp-opencv` | `1` | `> 01 OpenCV Vision Engine` |
| `01-hnp-imageprocessing` | `1` | `> 01 Image Processing` |
| `02-hnp-featuredetection` | `2` | `> 02 Feature Detection & Matching` |
| `01-hnc-sweappable.md` | `1` | `01 cv::filter2D Linear Kernel...` |
| `02-hnc-geometric-warp.md` | `2` | `02 cv::warpAffine Matrix...` |

### How Reordering Works:
To reorder pages, nested pages, or cards, simply rename the leading number:
- Rename `01-hnp-imageprocessing` $\rightarrow$ `02-hnp-imageprocessing`
- Rename `02-hnp-featuredetection` $\rightarrow$ `01-hnp-featuredetection`
- **Result**: Feature Detection instantly becomes #1, Image Processing becomes #2. Zero code changes required.

---

## 5. Automatic URL & Route Resolution

The router utilizes a single catch-all route `<Route path="/*" element={<DynamicPageView />} />`.

When a URL request arrives at `resolvePathNode(pathSegments)`:
1. `pathSegments` are sanitized and lower-cased.
2. The tree is walked segment-by-segment against node `slug` properties.
3. If found, returns the node, full breadcrumbs, and canonical route.

```
URL: /opencv/imageprocessing
  │
  ├── 1. Match Root: node.slug == "opencv"
  │
  └── 2. Match Child: child.slug == "imageprocessing"
        │
        └── Found! Returns:
            - Breadcrumbs: Home > OpenCV Vision Engine > Image Processing
            - Node Cards: [Card 01, Card 02]
            - Node Children: []
```

### Deep-Linking to Individual Cards
Cards can be deep-linked using the card title or slug as a URL hash:
- `/opencv/imageprocessing#cv-filter2d-linear-kernel-convolution`
- On page load, `DynamicPageView` detects the hash and automatically sets `activeCardIndex` to that card.
- Swiping cards updates the hash in real-time, allowing users to copy and share direct links to any specific card.

---

## 6. How to Author Content (Step-by-Step)

### Step 1: Add a New Root Page
Create directory `src/content/02-hnp-pytorch/root/index.md`:
```markdown
---
title: PyTorch Deep Learning
version: v2.4.0
category: Tensor Computation & Autograd
summary: Optimized tensor library for deep learning using GPUs and CPUs.
---
```
*Result*: Instantly appears on the Home page as Card #02 with URL `/pytorch`.

### Step 2: Add a Nested Page
Create directory `src/content/02-hnp-pytorch/01-hnp-tensors/root/index.md`:
```markdown
---
title: Tensor Architecture
version: v2.4.0
category: Core Primitives
summary: N-dimensional strided array allocation, memory layout, and strides.
---
```
*Result*: Instantly appears inside `/pytorch` as nested sub-page #01 with URL `/pytorch/tensors`.

### Step 3: Add Cards to the Nested Page
Create directory `src/content/02-hnp-pytorch/01-hnp-tensors/01-hnc/`:
Add `01-hnc-tensor-strides.md`:
```markdown
title: torch.Tensor Strided Storage Layout
tag: Memory Layout
Tensors represent views over a 1D contiguous storage buffer defined by shape, strides, and byte offsets.
Key Rule
Storage layout copies are shallow by default; call .contiguous() before reshaping non-contiguous memory.
```typescript
interface TensorStorageSpec {
  size: number[];
  stride: number[];
  dtype: torch.dtype;
  device: torch.device;
}
```
```
*Result*: Instantly appears inside `/pytorch/tensors` as Card #01 in the 3D swipe deck.

---

## 7. Architectural Guarantees & Invariants

1. **Zero Hardcoded Paths**: No component or library references specific topic names (`opencv`, `imageprocessing`, etc.). The entire structure is generated dynamically from the filesystem.
2. **Infinite Depth Support**: The engine supports arbitrary nesting depth ($1, 2, 3, \dots, N$) with recursive breadcrumb construction and page resolution.
3. **No Empty Ghost Cards**: If a page has no cards, zero card shells are rendered; it cleanly displays only its sub-page list and breadcrumbs.
4. **Deterministic Sort**: Ascending numerical order (`01`, `02`, `03`...) governs all lists, decks, and badges.

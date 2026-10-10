# Pagination & State Architecture (v1.0)

> **BIG TECH INTERNAL SPECIFICATION (RFC / TDD)**  
> **Source Modules**: `src/pages/DynamicPageView.tsx`, `src/components/ui/PaginationBar.tsx`  
> **Status**: APPROVED & LOCKED  
> **Purpose**: Formal mathematical and mechanical documentation of the 10-item pagination windowing system and reactive state synchronization.

---

## 1. Architectural Philosophy: URL-First Reactive State

The application intentionally rejects heavyweight global state stores (Redux, MobX, Zustand) for page navigation. Instead, it relies on a **Deterministic Route-Driven Reactive Model**:

1. **URL as Ground Truth**: The route pathname (`window.location.pathname`) uniquely determines the target node in `contentEngine`.
2. **Local Component State**: Ephemeral view states (active card index in a flip deck, current pagination page) reside in local component hooks (`useState`).
3. **Route Boundary Cleanups**: Whenever the route changes (`pathname` dependency in `useEffect`), view states automatically reset to their deterministic base state (`currentPage = 1`, `flipped = false`).

---

## 2. The 10-Item Windowing Algorithm

To guarantee fixed-cost DOM rendering and zero layout thrashing, the system enforces a strict **10-item windowing algorithm**:

### Mathematical Formulation

Given a collection of $N$ child nodes $C = [c_0, c_1, \dots, c_{N-1}]$ and a fixed page size $K = 10$:

$$\text{totalPages} = \max\left(1, \left\lceil \frac{N}{K} \right\rceil\right)$$

For any active page $P \in \{1, 2, \dots, \text{totalPages}\}$:

$$\text{startIndex} = (P - 1) \times K$$

$$\text{endIndex} = \min(\text{startIndex} + K, N)$$

$$\text{visibleItems} = C[\text{startIndex} : \text{endIndex}]$$

### TypeScript Implementation
```typescript
const ITEMS_PER_PAGE = 10;
const totalPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);

// Guard against out-of-range pagination state
const safePage = Math.min(Math.max(currentPage, 1), totalPages);

const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
const visibleItems = allItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
```

---

## 3. Global Index Sequence Preservation

A critical UX requirement is that sub-items must never display "relative" local numbering that resets on every page (e.g. showing `01`–`10` on Page 2). Instead, each item must display its **True Global Sequence Number**.

### Calculation Formula

For an item at index $i \in [0, \dots, \text{visibleItems.length} - 1]$ within the current slice:

$$\text{globalIndex} = (P - 1) \times K + i + 1$$

$$\text{stepNumber} = \text{globalIndex} < 10 \;?\; \text{"0" + globalIndex} \;:\; \text{String(globalIndex)}$$

### Concrete Sequence Mapping Table

| Active Page ($P$) | Local Slice Index ($i$) | Global Index | Displayed Step Number |
| :--- | :--- | :--- | :--- |
| **Page 1** | `0` | `1` | `01` |
| **Page 1** | `9` | `10` | `10` |
| **Page 2** | `0` | `11` | `11` |
| **Page 2** | `9` | `20` | `20` |

---

## 4. `PaginationBar` State Machine & Edge Cases

The pagination bar operates as a deterministic finite-state automaton:

```
                      [User clicks page button K]
                           ┌──────────────┐
                           ▼              │
    ┌──────────────────────────────┐      │
    │   Page P (1 < P < totalPages)│◄─────┘
    └──────┬────────────────┬──────┘
           │                │
[User clicks '<']   [User clicks '>']
           │                │
           ▼                ▼
┌────────────────────┐   ┌───────────────────────────┐
│ Page 1 (Boundary)  │   │ Page totalPages (Boundary)│
│  - '<' is disabled │   │  - '>' is disabled        │
└────────────────────┘   └───────────────────────────┘
```

### Boundary Guarantees
- **Case 1: $N \le 10$**:
  `totalPages === 1`. The component conditionally unmounts (`totalPages > 1 && <PaginationBar ... />`). No empty or redundant controls are rendered.
- **Case 2: Current Page is 1**:
  The previous button (`<`) has `disabled={true}`, applying `opacity-50 text-zinc-600 cursor-not-allowed` and ignoring click events.
- **Case 3: Current Page is `totalPages`**:
  The next button (`>`) has `disabled={true}`, applying `opacity-50 text-zinc-600 cursor-not-allowed` and ignoring click events.
- **Case 4: Navigation to New Route**:
  Whenever the user enters a different category, `currentPage` is automatically reset to `1`.

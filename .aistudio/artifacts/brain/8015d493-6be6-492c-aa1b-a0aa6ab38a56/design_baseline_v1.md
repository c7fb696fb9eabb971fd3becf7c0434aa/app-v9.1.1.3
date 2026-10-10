# Design Baseline & Golden Standard Specification (v1.0)

> **IMMUTABLE DESIGN CONTRACT**  
> This document records and locks the approved visual design, responsive layout, component dimensions, and rendering rules for the application. No future backend processing, file reorganization, or script execution should deviate from these established standards.

---

## 1. Visual Verification Snapshots

The visual design is approved across all three primary form factors:

### Desktop Viewport
![Desktop Viewport](desktop.png)

- **Container Constraint**: `w-full max-w-xl mx-auto` centered horizontally in viewport.
- **Card Metrics**: `h-10` (40px) height per sub-card with `gap-2.5 sm:gap-3`.
- **Pagination Bar**: Centered compact obsidian capsule `h-10 w-fit mx-auto mt-2`.

---

### Tablet Viewport
![Tablet Viewport](tablet.png)

- **Touch Ergonomics**: All sub-cards and pagination buttons maintain minimum 40px touch targets.
- **Typography Rhythm**: Monospace labels and categories stay aligned with clean negative space.

---

### Mobile Viewport
![Mobile Viewport](mobile.png)

- **Narrow Form Factor Handling**:
  - Version tags hide on narrow viewports (`hidden sm:inline`) to prevent text wrapping.
  - Category tags truncate cleanly (`truncate max-w-[140px] sm:max-w-none`).
  - Pagination controls remain centered with zero horizontal spillover.

---

## 2. Core Rendering Rules & Performance Invariants

1. **Strict 10-Item Rendering Ceiling**:
   - Primary homepage lists exactly 10 top-level topics at a time (`(currentPage - 1) * 10` to `currentPage * 10`).
   - Secondary topic pages list exactly 10 sub-pages at a time.
   - Caps DOM node count to a strict ceiling of 10 items, preventing render degradation even as documentation scales to hundreds of pages.

2. **Global Monospace Sequential Numbering**:
   - Each item retains its true global sequence index:
     - Page 1: `01` through `10`
     - Page 2: `11` through `20`
   - Formatted as zero-padded two digits (`01`, `02`...).

3. **Universal Pagination Bar (`PaginationBar.tsx`)**:
   - **Height**: Fixed `h-10` matching the SubCard height.
   - **Width**: `w-fit mx-auto` centered at bottom.
   - **Visibility**: Automatically appears only when `totalPages > 1` (items > 10). When total items are 10 or fewer, it stays cleanly hidden.
   - **Style**:
     - Container: `bg-[#070a0e]/90`, `border-white/[0.08]`, `backdrop-blur-md`, `shadow-lg shadow-black/50`, `rounded-md`.
     - Active Page: `text-emerald-400 bg-emerald-500/15 border-emerald-500/30 font-semibold font-mono text-xs`.
     - Inactive Pages: `text-zinc-400 hover:text-slate-200 hover:bg-white/5 font-mono text-xs`.
     - Navigation Arrows: `<` and `>` with disabled states (`opacity-50 text-zinc-600 cursor-not-allowed`) on list boundaries.

---

## 3. Component Hierarchy & Styling Specs

| Component | Dimensions | Colors / Classes | Behavior |
| :--- | :--- | :--- | :--- |
| **Header** | `h-12`, fixed top | `bg-[#070a0e]/90`, `backdrop-blur-md`, `border-b border-white/[0.06]` | Centered brand icon |
| **BreadcrumbPath** | Dynamic `w-full` | Monospace text, `text-zinc-400`, emerald current page | `← Back` button right-aligned |
| **SubCard** | `h-10`, `w-full` | `bg-[#070a0e]/90`, `border-white/[0.08]`, `backdrop-blur-md` | Hover border `emerald-500/40`, slide arrow `→` |
| **PaginationBar** | `h-10`, `w-fit` | `bg-[#070a0e]/90`, `border-white/[0.08]`, `rounded-md` | Paginated 10-item windowing |
| **Background** | Full viewport | Dot Matrix SVG + Radial Emerald Ambient Glow | Fixed, non-scrolling, high contrast |

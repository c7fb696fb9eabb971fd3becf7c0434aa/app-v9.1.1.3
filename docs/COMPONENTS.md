# UI Components Architecture & Specification (v1.0)

> **DEVELOPER & AGENT NOTICE**  
> This specification documents all UI components, their TypeScript interfaces, layout contracts, interaction behavior, responsive styling, and accessibility requirements. Always review this before adding or editing UI components.

---

## Component Index

1. [`SubCard`](#1-subcard) — The primary `h-10` obsidian item container
2. [`PaginationBar`](#2-paginationbar) — Centered `h-10` 10-item windowing controller
3. [`Header`](#3-header) — Fixed top navigation bar with brand badge
4. [`BreadcrumbPath`](#4-breadcrumbpath) — Hierarchical route navigator with step-up back button
5. [`SwipeableFlipCard`](#5-swipeableflipcard) — 3D flipping interactive documentation deck
6. [`DynamicPageView`](#6-dynamicpageview) — Universal content router and view layout

---

## 1. `SubCard`

### Purpose & Architecture
`SubCard` is the fundamental list element of the application. It represents both top-level topics on the homepage and secondary sub-pages inside category folders. It guarantees a uniform vertical rhythm with a strict `h-10` height.

- **File Path**: `src/components/ui/SubCard.tsx`
- **Default Height**: `h-10` (40px) fixed
- **Default Width**: `w-full`
- **Surface**: `bg-[#070a0e]/90`, `border border-white/[0.08]`, `backdrop-blur-md`, `rounded-md`
- **Hover State**: `hover:border-emerald-500/40 hover:bg-[#0c121a]/95`

### TypeScript Interface
```typescript
export interface SubCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  role?: string;
  ariaLabel?: string;
}
```

### Usage Pattern
```tsx
<SubCard
  key={topic.id}
  onClick={() => navigate(targetPath)}
  role="button"
  ariaLabel={`Navigate into ${topic.title}`}
  className="h-10 shrink-0 w-full px-3.5 sm:px-4 flex items-center justify-between cursor-pointer select-none transition-all duration-200 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 group"
>
  <div className="flex items-center gap-2.5 min-w-0">
    <span className="font-mono text-xs select-none font-bold text-zinc-400 group-hover:text-emerald-400">
      &gt;
    </span>
    <span className="font-mono text-[11px] text-emerald-400/90 font-semibold shrink-0">
      {stepNumber}
    </span>
    <span className="text-xs sm:text-[13px] text-slate-200 font-mono font-medium truncate group-hover:text-white">
      {topic.title}
    </span>
    {topic.version && (
      <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
        {topic.version}
      </span>
    )}
  </div>

  <div className="flex items-center gap-2 shrink-0">
    {topic.category && (
      <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 group-hover:text-slate-300 truncate max-w-[140px] sm:max-w-none">
        {topic.category}
      </span>
    )}
    <span className="text-[11px] font-mono text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
      &rarr;
    </span>
  </div>
</SubCard>
```

### Responsive Invariants
- `hidden sm:inline`: Version badges are hidden on mobile viewports (< 640px) to prevent layout overflow.
- `truncate max-w-[140px] sm:max-w-none`: Category badges truncate gracefully on narrow screens.
- `truncate`: Title truncates with ellipsis if screen width is constrained.

---

## 2. `PaginationBar`

### Purpose & Architecture
Provides universal 10-item pagination windowing. Automatically remains unrendered if `totalPages <= 1`. When active, it displays a centered obsidian capsule with left arrow (`<`), two-digit page numbers (`01`, `02`), and right arrow (`>`).

- **File Path**: `src/components/ui/PaginationBar.tsx`
- **Height**: `h-10` (40px) — exactly matches `SubCard` height
- **Width**: `w-fit mx-auto` — centered horizontally at bottom
- **Styling**: `bg-[#070a0e]/90`, `border border-white/[0.08]`, `backdrop-blur-md`, `shadow-lg shadow-black/50`, `rounded-md`

### TypeScript Interface
```typescript
export interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  className?: string;
}
```

### Usage Pattern
```tsx
{totalPages > 1 && (
  <PaginationBar
    currentPage={currentPage}
    totalPages={totalPages}
    onPageChange={(page) => setCurrentPage(page)}
  />
)}
```

### Functional Rules
- When on the first page (`currentPage === 1`), `<` arrow is disabled (`opacity-50 text-zinc-600 cursor-not-allowed`).
- When on the last page (`currentPage === totalPages`), `>` arrow is disabled.
- Page numbers are zero-padded to 2 digits (`01`, `02`...).
- Active page button receives `text-emerald-400 bg-emerald-500/15 border border-emerald-500/30`.

---

## 3. `Header`, `LeftDrawerNavigation`, and `RightDrawerNavigation`

### Purpose & Architecture
Sticky top navigation bar (`h-14`) housing dual independent 80% drawer trigger buttons flanking the centered `BrandLogo`.

- **File Path**: `src/components/Header.tsx`, `src/components/navigation/LeftNavbarIcon.tsx`, `src/components/navigation/RightNavbarIcon.tsx`, `src/components/navigation/LeftDrawerNavigation.tsx`, `src/components/navigation/RightDrawerNavigation.tsx`
- **Height**: `h-14` (56px) with `border-b border-white/[0.08]` and `bg-[#070a0e]/90 backdrop-blur-md`
- **Line Continuity**: The bottom divider line of both drawer headers sits on the exact same vertical coordinate (`h-14`) as the main header line.
- **Button Sizing**: Full button `38px` (`w-[38px] h-[38px]`), glyph container `33px` (`w-[33px] h-[33px]`), styled with obsidian glassmorphic button tokens (`border border-white/[0.08] bg-[#070a0e]/90`).
- **Trigger Icons**: Dedicated `LeftNavbarIcon` and `RightNavbarIcon` components featuring 3 full linear lines without middle cuts.
- **Left Drawer**: Slides out covering 80% of viewport width towards the right with green dot-matrix background, h-14 header (Logo + X button), calculated content area, and footer divider.
- **Right Drawer**: Slides out covering 80% of viewport width towards the left with green dot-matrix background, h-14 header (X button + Logo), calculated content area, and dedicated authentication footer with clean obsidian **Sign Up** (emerald border/text) and **Log In** buttons without heavy background gradients or shadows.
- **Independence Guarantee**: Both drawer components and their trigger icons are isolated in distinct files with zero shared UI state or components other than `BrandLogo`.

---

## 4. `GlobalPathBar` (formerly `BreadcrumbPath`)

### Purpose & Architecture
Permanent GitHub-style navigation grid positioned immediately beneath the global Header across all routes (including the Homepage).
Guarantees zero layout shift across views and keeps the central UI geometry invariant.

- **File Path**: `src/components/GlobalPathBar.tsx` (aliased via `src/components/BreadcrumbPath.tsx`)
- **Height**: `h-10` (40px) matching the design system's geometric rhythm
- **Position**: `sticky top-14 z-40` directly beneath the `sticky top-0` Header
- **Surface**: `bg-[#070a0e]/90`, `border-b border-white/[0.08]`, `backdrop-blur-md` matching Header aesthetics
- **Typography**: Monospace (`font-mono text-xs`)
- **Separator**: `/` with `text-slate-600 font-sans`
- **Active Leaf**: Highlighted with `text-emerald-400 font-medium`
- **Homepage Behavior**: Displays "Home" perfectly centered horizontally in the card container (`justify-center text-center`) with zero clutter for high professionalism.
- **Tunnel Navigation**: On nested pages, paths never wrap or expand card height (`overflow-x-auto flex-nowrap`).
- **Auto-Scroll**: Automatically scrolls right on navigation to present the active terminal crumb immediately.
- **Touch & Mouse Sliding**: Bi-directional finger sliding (`touch-pan-x`) and mouse drag with edge gradient mask.
- **Pinned Back Button**: Pinned on the right (`shrink-0 pl-2`) with `Escape` key shortcut support.

---

## 5. `SwipeableFlipCard`

### Purpose & Architecture
Interactive 3D card deck for sub-page documentation. Features:
- Front face displaying title, category, and Key Rule block.
- Back face displaying syntax-highlighted TypeScript code block.
- Interactive 3D flip animation triggered by clicking the card, clicking the `Flip (F)` button, or pressing `Space` / `F`.
- Touch swipe left/right gestures for multi-slide card decks.

- **File Path**: `src/components/SwipeableFlipCard.tsx`
- **Perspective**: `perspective: 1200px` with `transform-style: preserve-3d`
- **Dimensions**: Responsive aspect ratio container with minimum height constraints.

---

## 6. `DynamicPageView`

### Purpose & Architecture
The universal content router. Resolves routes via `contentEngine.getPageByPath(pathname)`:
1. If the route contains child nodes, renders the child sub-pages list with 10-item pagination.
2. If the route contains component cards, renders the swipable card flip deck.
3. If neither, renders a clean obsidian empty state.

- **File Path**: `src/pages/DynamicPageView.tsx`
- **Container**: `w-full max-w-xl mx-auto px-4 sm:px-6 pt-16 pb-8 flex flex-col items-center gap-4`
- **Pagination Rule**: Strictly slices items using `ITEMS_PER_PAGE = 10`.

---

## 7. `LoginPage`, `SignupPage`, and `AuthContext`

### Purpose & Architecture
Dedicated Vercel-style authentication routes styled in the application's obsidian and emerald aesthetic, providing social login cards and GitHub popup OAuth authentication.

- **File Paths**: `src/pages/LoginPage.tsx`, `src/pages/SignupPage.tsx`, `src/pages/OAuthCallbackPage.tsx`, `src/context/AuthContext.tsx`
- **Routes**: `/login`, `/signup`, `/auth/callback`
- **Surface**: Centered `max-w-md` card with `bg-[#070a0e]/90`, `border border-white/[0.08]`, `backdrop-blur-md` on full `DotMatrixBackground`
- **GitHub OAuth**: Initiates direct OAuth popup window; listens for `OAUTH_AUTH_SUCCESS` via cross-window `postMessage`
- **Dashboard Transition**: Automatically sets authenticated session and redirects users to the documentation dashboard (`/`)
- **Secondary Providers**: Displays Google, ChatGPT, Apple, Passkey, and SAML SSO with sleek obsidian styling and `Coming Soon` badges.


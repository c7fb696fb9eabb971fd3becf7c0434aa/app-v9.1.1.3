# Obsidian & Emerald Color System (v1.0)

> **DEVELOPER & AGENT NOTICE**  
> This specification defines the official design tokens, color palette, border alpha tiers, text contrast scales, and atmospheric lighting effects for the application. Any agent modifying styling, creating new components, or updating views must strictly adhere to these values.

---

## 1. Design Philosophy

The application utilizes a **Cybernetic Obsidian & Emerald** theme designed for maximum legibility, zero eye fatigue, and high information density.

- **Base Canvas**: Absolute dark obsidian surfaces that recede into the background.
- **Glassmorphism**: Translucent panels with subtle border lines (`rgba(255, 255, 255, 0.08)`) and high backdrop blur (`backdrop-blur-md`).
- **Emerald Accents**: Laser-sharp emerald (`#10b981`) used with discipline for active states, sequence numbering, and focus indicators.

---

## 2. Background Layers & Surface Tiers

| Surface Level           | Hex / RGB / Alpha          | Tailwind Equivalent | Primary Usage                                               |
| :---------------------- | :------------------------- | :------------------ | :---------------------------------------------------------- |
| **Canvas Base**         | `#070a0e`                  | `bg-[#070a0e]`      | Global document body background                             |
| **Obsidian Glass**      | `rgba(7, 10, 14, 0.90)`    | `bg-[#070a0e]/90`   | SubCards, PaginationBar, global/sidebar headers and footers |
| **Raised Surface**      | `rgba(12, 18, 26, 0.95)`   | `bg-[#0c121a]/95`   | Selected and raised surfaces; not a hover effect            |
| **Empty State Surface** | `rgba(7, 10, 14, 0.40)`    | `bg-[#070a0e]/40`   | Empty placeholders, muted wells                             |
| **Active Button Pill**  | `rgba(16, 185, 129, 0.15)` | `bg-emerald-500/15` | Selected pagination number pill                             |
| **Code Block Well**     | `rgba(15, 23, 42, 0.60)`   | `bg-slate-900/60`   | Interactive TypeScript code display                         |

### Main Header: Obsidian Frosted-Glass Triad

The global header is a full-width, sticky frosted-glass surface with a centered, max-1280px inner container. The container uses three balanced 33px elements: a leading navigation button, a centered clickable brand mark, and a trailing navigation button. Both navigation buttons and both sidebar close buttons use one shared 33px control-size token. The leading button opens the independent left sidebar; the trailing button opens the independent right drawer. The two sidebars have separate components, state, markup, and behavior. They share no sidebar implementation or content; the existing icon catalog is used for their glyphs. The leading and trailing controls expose `data-header-slot` hooks for layout inspection.

| Header Element                  | Geometry / Surface                                                                                                                                  |
| :------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Header surface**              | 56px high; sticky at top; `z-index: 50`; `rgba(7, 10, 14, 0.90)` with 12px backdrop blur                                                            |
| **Bottom border**               | Standard white border at 8% opacity                                                                                                                 |
| **Inner container**             | Centered, maximum width 1280px; responsive horizontal padding                                                                                       |
| **Leading / trailing controls** | 33px square, equal flex weight, accessible labels, visible focus; each manages only its own sidebar                                                 |
| **Brand mark**                  | 33px square shared size token; all three marks use the same clickable home link, routing signed-in users to `/#/home` and signed-out users to `/#/` |
| **Navigation overlay**          | Backdrop and drawer stack above the sticky header; both drawers use identical geometry                                                              |

### Independent Sidebars

The left and right sidebars are separate `LeftSidebar` and `RightSidebar` feature components. Each opens from its own edge and independently owns its trigger, open state, focus behavior, Escape handling, focus restoration, backdrop, markup, and authentication/content responsibilities. The left sidebar has no sign-in or login actions; the right sidebar owns its authentication-aware login/logout actions. The sidebars may consume the same documented design tokens and generic icon/button styles, but must not share sidebar-specific components, state, markup, or behavior.

| Sidebar Element              | Required Geometry / Surface                                                                                                                                                                                                                                                                            |
| :--------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Drawer width**             | Both drawers: `min(380px, 88vw)`                                                                                                                                                                                                                                                                       |
| **Header row**               | 56px high with 16px horizontal padding; bottom divider aligns with the global header’s 56px divider                                                                                                                                                                                                    |
| **Brand / close control**    | Shared 33px clickable home link and 33px close button on both drawers; activating the logo navigates home and closes that drawer                                                                                                                                                                       |
| **Content area**             | Both sidebars use the Obsidian canvas, emerald dot matrix, opacity, grid, elliptical mask, and centered top glow fitted inside drawer bounds; no background layer may create overflow or scrollbars                                                                                                    |
| **Footer**                   | Both sidebars use a dedicated 73px footer region with the Obsidian Glass surface, 12px backdrop blur, standard top divider, and 16px inset; the left footer stays empty, while the right footer contains its authentication action                                                                     |
| **Side-specific content**    | Left has no sign-in actions; right owns its signed-in identity/sign-out or signed-out login content                                                                                                                                                                                                    |
| **Right login action**       | Match the navigation controls' obsidian surface (`--surface`), standard border (`--line`), text (`--text`), and white-glass hover; keep its full-width footer layout and height with a 4px radius                                                                                                      |
| **PAT login form**           | Use the Obsidian Glass card surface; the token field and full-width verify action use a 4px radius, with the verify action matching the obsidian login-button surface, border, and text. Use a 33px eye icon control for password visibility                                                           |
| **Login route**              | Use a dedicated full-viewport Obsidian/Emerald shell without the shared site header; center the login card and a full-width secondary-style “Return to Home Page” button with its leading 33px obsidian arrow control matching the eye control, including white-glass tint on hover and keyboard focus |
| **Additional login methods** | Provider buttons use the global secondary button surface, border, and text. They remain visibly disabled until those authentication methods are implemented.                                                                                                                                           |

---

## 3. Border Opacity & Stroke Hierarchy

To avoid harsh visual lines, all borders use precise white and emerald alpha values:

| Token Name             | Value                       | Tailwind Class          | Application                          |
| :--------------------- | :-------------------------- | :---------------------- | :----------------------------------- |
| **Standard Border**    | `rgba(255, 255, 255, 0.08)` | `border-white/[0.08]`   | SubCards, PaginationBar, Card deck   |
| **Subtle Divider**     | `rgba(255, 255, 255, 0.06)` | `border-white/[0.06]`   | Header bottom divider, section edges |
| **Muted Outer**        | `rgba(255, 255, 255, 0.04)` | `border-white/[0.04]`   | Muted outer strokes                  |
| **Active Pill Border** | `rgba(16, 185, 129, 0.30)`  | `border-emerald-500/30` | Active pagination number border      |

---

## 4. Emerald Accent Palette

Emerald is the singular brand and interaction accent:

| Role                | Color Value                | Tailwind Class                        | Context                                |
| :------------------ | :------------------------- | :------------------------------------ | :------------------------------------- |
| **Primary Accent**  | `#10b981` (Emerald 500)    | `text-emerald-500` / `bg-emerald-500` | Hex brand icon badge                   |
| **Light Glow Text** | `#34d399` (Emerald 400)    | `text-emerald-400`                    | Active page number, breadcrumb leaf    |
| **Sequence Number** | `rgba(52, 211, 153, 0.90)` | `text-emerald-400/90`                 | Monospace step indices (`01`, `02`...) |
| **Pill Background** | `rgba(16, 185, 129, 0.15)` | `bg-emerald-500/15`                   | Active pagination pill background      |

---

## 5. Typography & Text Hierarchy

All text uses system monospace (`font-mono`) or modern sans-serif (`font-sans`):

| Level                | Tailwind Classes                                                | Sample Text         | Target                      |
| :------------------- | :-------------------------------------------------------------- | :------------------ | :-------------------------- |
| **Primary Title**    | `text-slate-200 font-mono font-medium text-xs sm:text-[13px]`   | `OpenCV`, `CUDA`    | Card title                  |
| **Step Index**       | `text-emerald-400/90 font-mono font-semibold text-[11px]`       | `01`, `10`, `20`    | Two-digit sequential prefix |
| **Chevron Prefix**   | `text-zinc-400 font-mono text-xs font-bold`                     | `>`                 | Left prompt glyph           |
| **Version Badge**    | `text-slate-500 font-mono text-[11px]`                          | `v4.10.0`, `v2.5.0` | Software version tag        |
| **Category Tag**     | `text-slate-400 font-mono text-[10px] sm:text-[11px]`           | `Deep Learning`     | Sub-topic domain label      |
| **Disabled Control** | `text-zinc-600 font-mono text-xs cursor-not-allowed opacity-50` | `<`, `>`            | Pagination boundary arrows  |
| **Breadcrumb Trail** | `text-zinc-400 font-mono text-xs`                               | `Home / OpenCV`     | Route breadcrumbs           |

---

## 6. Atmosphere & Background Tokens

The global background uses three layers: a solid obsidian canvas, a masked fixed emerald dot matrix, and a soft blurred emerald aurora centered at the top. The layers are non-blocking and remain behind application content.

| Layer               | Token / Value                                            | Geometry                                                                                                                             |
| :------------------ | :------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **Canvas**          | `#070a0e`                                                | Global root and body background                                                                                                      |
| **Dot Matrix**      | `rgba(16, 185, 129, 0.38)` at 0.45 opacity               | 1.2px dots on a 24px grid; fixed to viewport; elliptical mask `90% 70% at 50% 35%`, opaque from 45% and fading to transparent at 95% |
| **Top Aurora Glow** | `rgba(16, 185, 129, 0.12)` to `rgba(16, 185, 129, 0.05)` | Centered at top; 1000px wide (viewport-capped), 380px high, fading to transparent and blurred by 64px                                |

### Layering

1. **Base canvas:** `#070a0e` on the document root and body.
2. **Dot matrix:** a fixed CSS radial-gradient grid, `24px 24px`, with emerald `rgba(16, 185, 129, 0.38)` dots and `opacity: 0.45`. Apply the same radial elliptical mask with both standard and WebKit mask properties.
3. **Aurora:** a centered top element, `width: min(1000px, 100vw)` and `height: 380px`, with a vertical gradient from emerald 12% through 5% to transparent and `filter: blur(64px)`.

The dot layer sits above the aurora; both are fixed, non-interactive, and behind app content. The radial mask keeps the dot field strongest around the central viewport and fades its perimeter.

### Selection and Scrollbars

- Text selection uses `rgba(16, 185, 129, 0.30)` with emerald-300 text.
- Scrollbar track: `#0b0f17`; thumb: `#1e293b`.

### Accent Hierarchy

Use emerald 500 (`#10b981`) for brand and primary accents, emerald 400 (`#34d399`) for keyboard focus or active text and controls, and translucent emerald surfaces for explicitly selected states.

---

## 7. Interactive State Rules

1. **Glass Hover**: Use `--interaction-glass-tint` (`rgba(255, 255, 255, 0.06)`) as a translucent white overlay across the full button surface. Do not use emerald-fill blends, edge-only treatments, or inset highlights; keep the control's border, text, width, height, and spacing unchanged on hover.
2. **Keyboard Focus**: Preserve the visible focus ring; hover styling must not replace or obscure keyboard focus feedback.
3. **Disabled State**: Disabled controls remain visually distinct and use `cursor-not-allowed`.
4. **Backdrop Blur**: Floating glass surfaces use the documented `#070a0e` surface and blur treatment.
5. **Cursor Semantics**: Interactive elements use `cursor-pointer`; disabled controls use `cursor-not-allowed`.

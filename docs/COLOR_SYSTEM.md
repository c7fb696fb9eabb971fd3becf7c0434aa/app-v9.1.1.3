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

| Surface Level | Hex / RGB / Alpha | Tailwind Equivalent | Primary Usage |
| :--- | :--- | :--- | :--- |
| **Canvas Base** | `#000000` / `#05080c` | `bg-[#05080c]` / `bg-black` | Global document body background |
| **Obsidian Glass** | `rgba(7, 10, 14, 0.90)` | `bg-[#070a0e]/90` | SubCards, PaginationBar, Header |
| **Card Active / Hover** | `rgba(12, 18, 26, 0.95)` | `hover:bg-[#0c121a]/95` | Interactive card hover state |
| **Empty State Surface** | `rgba(7, 10, 14, 0.40)` | `bg-[#070a0e]/40` | Empty placeholders, muted wells |
| **Active Button Pill** | `rgba(16, 185, 129, 0.15)` | `bg-emerald-500/15` | Selected pagination number pill |
| **Code Block Well** | `rgba(15, 23, 42, 0.60)` | `bg-slate-900/60` | Interactive TypeScript code display |

---

## 3. Border Opacity & Stroke Hierarchy

To avoid harsh visual lines, all borders use precise white and emerald alpha values:

| Token Name | Value | Tailwind Class | Application |
| :--- | :--- | :--- | :--- |
| **Standard Border** | `rgba(255, 255, 255, 0.08)` | `border-white/[0.08]` | SubCards, PaginationBar, Card deck |
| **Subtle Divider** | `rgba(255, 255, 255, 0.06)` | `border-white/[0.06]` | Header bottom divider, section edges |
| **Muted Outer** | `rgba(255, 255, 255, 0.04)` | `border-white/[0.04]` | Background dot pattern grid lines |
| **Card Hover Border** | `rgba(16, 185, 129, 0.40)` | `hover:border-emerald-500/40` | Hover state on SubCards |
| **Active Pill Border**| `rgba(16, 185, 129, 0.30)` | `border-emerald-500/30` | Active pagination number border |

---

## 4. Emerald Accent Palette

Emerald is the singular brand and interaction accent:

| Role | Color Value | Tailwind Class | Context |
| :--- | :--- | :--- | :--- |
| **Primary Accent** | `#10b981` (Emerald 500) | `text-emerald-500` / `bg-emerald-500` | Hex brand icon badge |
| **Light Glow Text** | `#34d399` (Emerald 400) | `text-emerald-400` | Active page number, breadcrumb leaf |
| **Sequence Number** | `rgba(52, 211, 153, 0.90)` | `text-emerald-400/90` | Monospace step indices (`01`, `02`...) |
| **Pill Background** | `rgba(16, 185, 129, 0.15)` | `bg-emerald-500/15` | Active pagination pill background |
| **Ambient Radial** | `rgba(16, 185, 129, 0.06)` | Custom radial gradient | Atmospheric overhead glow |

---

## 5. Typography & Text Hierarchy

All text uses system monospace (`font-mono`) or modern sans-serif (`font-sans`):

| Level | Tailwind Classes | Sample Text | Target |
| :--- | :--- | :--- | :--- |
| **Primary Title** | `text-slate-200 group-hover:text-white font-mono font-medium text-xs sm:text-[13px]` | `OpenCV`, `CUDA` | Card title |
| **Step Index** | `text-emerald-400/90 font-mono font-semibold text-[11px]` | `01`, `10`, `20` | Two-digit sequential prefix |
| **Chevron Prefix** | `text-zinc-400 group-hover:text-emerald-400 font-mono text-xs font-bold` | `>` | Left prompt glyph |
| **Version Badge** | `text-slate-500 font-mono text-[11px]` | `v4.10.0`, `v2.5.0` | Software version tag |
| **Category Tag** | `text-slate-400 group-hover:text-slate-300 font-mono text-[10px] sm:text-[11px]` | `Deep Learning` | Sub-topic domain label |
| **Disabled Control** | `text-zinc-600 font-mono text-xs cursor-not-allowed opacity-50` | `<`, `>` | Pagination boundary arrows |
| **Breadcrumb Trail** | `text-zinc-400 hover:text-slate-200 font-mono text-xs` | `Home / OpenCV` | Route breadcrumbs |

---

## 6. Atmosphere & Background Tokens

### Dot Matrix Pattern
```svg
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="1" cy="1" r="0.75" fill="rgba(255, 255, 255, 0.06)" />
</svg>
```

### Ambient Radial Overhead Glow
```css
background: radial-gradient(
  ellipse 60% 40% at 50% 0%,
  rgba(16, 185, 129, 0.06) 0%,
  transparent 70%
);
```

---

## 7. Interactive State Rules

1. **Hover State Transition**: Always use `transition-all duration-200` or `transition-colors duration-150`.
2. **Backdrop Blur**: Every floating or card surface uses `backdrop-blur-md` with `bg-[#070a0e]/90`.
3. **Cursor Semantics**: Interactive elements must define `cursor-pointer select-none`. Disabled controls must define `cursor-not-allowed select-none`.

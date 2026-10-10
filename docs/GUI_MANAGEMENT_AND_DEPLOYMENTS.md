# GUI Management, Deployments & Action Buttons Architecture

This document explains the recent updates, architectural design, and operational workflows for the core modules: **GUI Management Portal**, **Deployments Portal**, and the **Action Buttons Tunnel**.

---

## 1. GUI Management Portal (`/secret-studio`)
- **File**: `src/pages/SecretStudioPage.tsx`
- **What Changed**: 
  - Restyled to match the Header obsidian/slate dark theme (`bg-[#070a0e]`, `bg-[#0c121a]`, `border-white/[0.08]`, zero fancy colors).
  - Removed dev elements and positioned the "Go to Home" button on the left and the "Deployments" button on the right.
- **How It Works**:
  - **Destination Tree Selection**: Clicking the folder input opens an interactive tree pop-up (`HierarchyTree.tsx`) to assign cards to any directory or page path.
  - **Card Authoring**: Form fields capture metadata, title, order, definition, key rules, TypeScript interfaces, and media attachments.
  - **Save & Deploy**: Clicking "Save & Deploy Card" validates and queues the card into the Deployments Portal for review.

---

## 2. Deployments Portal (`/deployments`)
- **File**: `src/pages/DeploymentsPage.tsx`
- **What Changed**: 
  - Converted into a special, independent full-page portal (no longer a pop-up).
- **How It Works**:
  - **Review Queue**: Lists pending cards submitted from the GUI Management Portal.
  - **Final Publish Call**: Clicking "Publish to Production" executes `saveCustomCard`, deploying the card to live production and clearing it from the pending review queue.

---

## 3. Action Buttons & Tunnel (`CardActionGrid.tsx`)
- **File**: `src/components/card/CardActionGrid.tsx` & 12 custom icon components in `src/components/card/icons/`
- **What Changed**:
  - Replaced text buttons and generic/hardcoded icons with 12 fully custom unique SVG icon components (`PlayIcon`, `PdfIcon`, `VideoIcon`, `DocIcon`, `TerminalIcon`, `GitIcon`, `BookmarkIcon`, `CopyIcon`, `ShareIcon`, `JsonIcon`, `PrintIcon`, `SettingsIcon`).
  - Removed the "Action Deck" label entirely to maximize space.
  - Built a horizontal scrollable tunnel (`overflow-x-auto scrollbar-none touch-pan-x`) supporting mobile swipe and computer mouse click-and-drag sliding (`onMouseDown`, `onMouseMove`, `onMouseUp`).
  - Added `justify-between` distribution so all 12 buttons stretch and space evenly across tablet and desktop views without right-side gaps.
- **How It Works**:
  - **Mobile & Desktop Navigation**: Users can swipe on mobile or click-and-drag with the mouse on computers to navigate through the horizontal action tunnel.
  - **Interactive Features**: Each button triggers its respective modal (Audio player, PDF viewer, Video player, Docs spec viewer, Terminal CLI sandbox, Git commit history) or action (Bookmark toggle, Copy spec, Share link, Export JSON, Print, Settings).

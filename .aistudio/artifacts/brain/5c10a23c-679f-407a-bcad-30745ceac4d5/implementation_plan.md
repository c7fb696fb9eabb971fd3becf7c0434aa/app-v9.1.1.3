# Full GitHub Integration for File Tree Explorer & Deployment Lifecycle

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed in Phase 1:
> - **Tree Operations Flow**: Queue changes in the Deployments Portal with an immediate direct-push option for quick publishing.
> - **Deletion Safety**: Queue file deletions (cards and pages) in Deployments for review before executing GitHub repository file deletions.

---

## 1. Overview & Core Concept

Currently, the **Save & Deploy** workflow in Secret Studio commits newly authored cards directly to the GitHub repository (`main` branch) and triggers GitHub Actions. However, actions performed within the **Hierarchy Tree Explorer** (`HierarchyTree.tsx`) — such as reordering cards (Move Up/Down), deleting cards, creating sub-pages, renaming pages, and deleting pages — only update local browser state.

This plan wires all Hierarchy Tree operations directly into GitHub-backed deployment operations:
- Every tree modification (create, reorder, rename, delete) generates a typed **Deployment Action** (`create`, `update`, `delete`).
- Users can choose to **"Commit & Push Immediately"** or **"Queue in Deployments Review"**.
- The **Deployments Portal** (`/deployments`) is expanded to support file deletions, updates, and batch push operations via the GitHub Contents REST API, triggering automatic GitHub Actions deployments on push.

---

## 2. User Experience & Visual Design

### 2.1 File Tree Explorer Interactions (`HierarchyTree.tsx`)
1. **Move Up / Down (Reordering)**:
   - When a user moves a card or page up or down, the updated order frontmatter is generated.
   - An interactive action badge displays: *"Order updated: [Queue in Deployments] or [Push to GitHub Now]"*.
2. **Delete Card / Page**:
   - Deleting opens the custom in-app confirmation modal with a clear GitHub warning: *"Queue deletion of `src/content/...` for GitHub removal?"*.
   - Confirmed deletions are added to the Deployments queue as red `DELETE` actions.
3. **Create Sub-Page / Page**:
   - Creating a sub-page generates a page index file (`01-index.md` or `root/index.md`) with metadata and queues it as a green `CREATE` action.
4. **Rename Page**:
   - Renaming updates the page title metadata in its index markdown and queues an `UPDATE` action.

### 2.2 Deployments Portal Queue View (`DeploymentsPage.tsx`)
- The queue is organized with color-coded action badges:
  - 🟢 **`CREATE`**: New card or page file ready to commit.
  - 🟡 **`UPDATE / REORDER`**: Modified order frontmatter or title.
  - 🔴 **`DELETE`**: Markdown file to be permanently deleted from GitHub `main`.
- Each item shows:
  - Exact GitHub destination file path (e.g., `src/content/russia/moscow/bugulin/01-hnc/01-hnc-bogolan.md`).
  - Target route and action description.
  - Single-item **"⚡ Commit / Delete on GitHub"** button.
  - Batch **"✓ Publish All (X Operations) to GitHub"** button.

---

## 3. Key Architectural Decisions & Trade-Offs

- **Typed Deployment Item Structure**:
  Extend `PendingDeployment` to include `actionType: 'create' | 'update' | 'delete'`, target `filePath`, and optional `fileSha`.
- **Safe File Deletion via GitHub API**:
  Implement `deleteFileFromGitHub(filePath, commitMessage)` in `githubSync.ts`, retrieving the file SHA first via `GET /repos/:owner/:repo/contents/:path` and then executing `DELETE /repos/:owner/:repo/contents/:path`.
- **Immediate Local Hydration + Remote Queue**:
  Keep client navigation smooth by immediately updating local state for instant rendering, while queuing the corresponding git action so nothing is lost if the tab reloads before publishing.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│              Hierarchy Tree Explorer                    │
│   (Move Up/Down, Delete Card, Rename, Create Sub-Page)  │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌─────────────────────────┐ ┌─────────────────────────────┐
│  Instant Direct Push    │ │  Queue in Deployments       │
│  (commit/delete GitHub) │ │  (Pending Review Queue)     │
└────────────┬────────────┘ └─────────────┬───────────────┘
             │                            │
             │                            ▼
             │              ┌─────────────────────────────┐
             │              │     Deployments Portal      │
             │              │  - Batch Commit & Push      │
             │              │  - Individual Push/Delete   │
             │              └─────────────┬───────────────┘
             │                            │
             └─────────────┬──────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│              GitHub REST API Engine                     │
│   PUT /contents/:path  (Create / Update with SHA)      │
│   DELETE /contents/:path (Delete with SHA)              │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│           GitHub Actions Pipeline (`deploy.yml`)        │
│   Automatic build & deploy on every push               │
└──────────────────────────┘
```

### Proposed Action Items:
1. **GitHub API Client Expansion (`src/lib/githubSync.ts`)**:
   - Add `deleteFileFromGitHub(filePath, commitMessage)`.
   - Update `PendingDeployment` interface to support `actionType: 'create' | 'update' | 'delete'`, `filePath`, and `commitMessage`.
2. **Deployments Portal Overhaul (`src/pages/DeploymentsPage.tsx`)**:
   - Handle execution of `create`, `update`, and `delete` actions.
   - Add UI badges and differentiated buttons for file removals vs additions.
   - Update batch publishing to process mixed creations and deletions sequentially.
3. **Hierarchy Tree Wiring (`src/components/studio/HierarchyTree.tsx`)**:
   - Wire `handleMoveCard`, `handleDeleteCard`, `handleMovePage`, `handleDeletePage`, `handleSaveRename`, and `handleSaveSubPage` to generate queued deployment items with the option to push directly.
4. **End-to-End Verification**:
   - Test creating a sub-page, reordering cards, and deleting a card through the tree.
   - Verify commits, file deletions, and GitHub Actions deployments on GitHub repository `main`.

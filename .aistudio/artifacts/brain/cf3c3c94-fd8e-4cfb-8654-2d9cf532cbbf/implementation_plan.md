# Implementation Plan - GitHub Direct Commit Integration via REST API

1. **Objective**:
   - Enable direct GitHub repository commits via the GitHub Contents REST API when a user clicks "Save & Deploy Card" or creates pages/cards in the Secret Studio.
   - This ensures that every created page, sub-page, and card is permanently committed as source markdown files (`src/content/...`) to your GitHub repository, triggering GitHub Actions automatically and making them instantly visible across all mobile and desktop devices.

2. **Key Components**:
   - **GitHub API Service (`src/lib/githubSync.ts`)**: Handles REST API requests to `https://api.github.com/repos/{owner}/{repo}/contents/{path}` using user-provided OAuth tokens or personal access tokens (PAT).
   - **Settings & Auth Modal**: Allows configuring the GitHub repository (`owner/repo`), branch (`main`), and personal access token (securely stored in localStorage).
   - **Automatic Deployment Bridge**: When deploying cards in `SecretStudioPage.tsx` or `DeploymentsPage.tsx`, in addition to queueing locally, it generates the exact markdown content and pushes a commit directly to GitHub.

3. **Verification**:
   - Run `compile_applet` and `lint_applet` to verify build integrity.

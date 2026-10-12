# Project Information

**Purpose:** GreenDocs is a Git-backed documentation editor and publisher. GitHub is the only identity provider, repository, source-control host, and deployment platform.

## Canonical Endpoints

- Git repository: https://github.com/c7fb696fb9eabb971fd3becf7c0434aa/app-v9.1.1.3.git
- Public site: https://c7fb696fb9eabb971fd3becf7c0434aa.github.io/app-v9.1.1.3/
- Production branch: `main`
- GitHub REST API: https://api.github.com

## Operating Rules

1. Git is authoritative for pages, cards, attachments, and history.
2. The browser verifies the real GitHub identity and repository push permission before entering the application.
3. The browser holds the user's PAT in active-tab memory only and calls GitHub directly. No separate application API or external service is used.
4. Publish validates the full change set and creates one non-force Git commit against the expected branch head.
5. GitHub Actions builds and deploys the static app to GitHub Pages. The commit SHA and workflow result identify publication/deployment state.

## Security Note

GitHub Pages cannot hide a PAT from JavaScript executing in the page. Sign-in discloses that residual risk. Never place a PAT in source, environment/build variables, local storage, URL, analytics, logs, or Git history. Use a least-privilege token and sign out after use.

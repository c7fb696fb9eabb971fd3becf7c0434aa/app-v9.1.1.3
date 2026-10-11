# GreenDocs Build Backlog

**Total:** 24 ordered work items. **Current status:** 4 `DONE`, 3 `IN PROGRESS`, 17 `NOT STARTED`.

The backlog follows public Google Engineering Practices where useful: write the design/acceptance context first, keep changes small and reviewable, include tests, and make commit descriptions explain what and why. This is not a claim about Google's private internal process.

## User Journey to Deliver

`https://c7fb696fb9eabb971fd3becf7c0434aa.github.io/app-v9.1.1.3/#/` -> public home -> right-side navigation -> GitHub PAT sign-in -> verified user/repository write access -> directly enter the protected Secret Studio URL (no Studio link in the right sidebar) -> create/edit/move/delete pages, sub-pages, cards, and attachments -> review draft -> commit to the exact repo -> CI validation/build -> GitHub Pages deployment -> visible commit/workflow/site status.

## Work Items

| # | Work item | Depends on | Status |
|---:|---|---|---|
| 01 | Product requirements and journey contract | None | DONE |
| 02 | Architecture and decision records | 01 | DONE |
| 03 | Security and PAT threat model | 01 | DONE |
| 04 | Repository, GitHub, and cloud prerequisites | 02, 03 | IN PROGRESS |
| 05 | Reproducible pnpm workspace scaffold | 02, local part of 04 | IN PROGRESS |
| 05A | Modular boundaries | 02, 05 | DONE |
| 05B | Typed configuration and no scattered magic values | 02, 04, 05 | IN PROGRESS |
| 06 | Content schemas and Git storage contract | 02, 05, 05A, 05B | NOT STARTED |
| 07 | GitHub repository adapter and atomic commits | 03, 04, 06 | NOT STARTED |
| 08 | PAT verification and API sessions | 03, 04, 07 | NOT STARTED |
| 09 | Shared visual system and accessible primitives | 01, 05 | NOT STARTED |
| 09A | Reusable component contracts | 05A, 09 | NOT STARTED |
| 09B | Unique governed icon system | 09, 09A | NOT STARTED |
| 09C | Direct protected Secret Studio route isolation | 01, 02, 08, 09 | NOT STARTED |
| 10 | Public home, navigation, and login experience | 08, 09, 09C | NOT STARTED |
| 10A | Lazy loading and intent prefetch | 02, 05A, 09B, 09C | NOT STARTED |
| 10B | Cache and freshness policy | 02, 03, 06, 07, 08, 10A | NOT STARTED |
| 10C | Page boundaries and observability | 05A, 09A, 09C, 10 | NOT STARTED |
| 11 | Git-backed hierarchy explorer and page CRUD | 06, 07, 09A, 09C, 10, 10A, 10B, 10C | NOT STARTED |
| 12 | Card editor, media attachments, and preview | 06, 07, 09A, 09B, 10B, 11 | NOT STARTED |
| 13 | Review, commit, and deployment status flow | 07, 08, 11, 12 | NOT STARTED |
| 14 | CI, Pages deployment, and API deployment | 04, 05, 06, 13 | NOT STARTED |
| 15 | End-to-end quality, security, and operations gates | 05-14, 05A-05B, 09A-09C, 10A-10C | NOT STARTED |
| 16 | Staging acceptance, production cutover, and rollback | 14, 15 | NOT STARTED |

## Execution Rules

1. TODOs 01-03 define the approved product, architecture, and security baseline before feature code.
2. Local scaffold may proceed after local tools and Git remote are verified. Cloud Run/Firestore/KMS provisioning remains a deployment gate in TODO 04/14; never substitute fake auth or an insecure local-secret fallback.
3. Work in dependency order. Mark a task `IN PROGRESS` only when actively implementing it; mark it `DONE` only with evidence linked in its task file.
4. Keep each code change small, tested, and reviewable. Each task should result in one or more focused commits with informative imperative summaries.
5. GitHub remains the persistent authority. The browser may hold transient draft/session state in memory only; no content or PAT is saved to localStorage, IndexedDB, or client files.
6. Never write PATs into source, reports, commits, logs, command history, build output, or URLs. Only a test account/token is used in automated tests.
7. Do not force-push. Production writes require an explicit publish action, current-head check, and a reviewed change summary.
8. Do not start TODO 16 until staging tests pass and the owner confirms the production cutover.

## External Process Reference

- Google Engineering Practices: https://google.github.io/eng-practices/
- Change-author guidance: https://google.github.io/eng-practices/review/developer/
- Reviewer guidance: https://google.github.io/eng-practices/review/reviewer/
- Good change descriptions: https://google.github.io/eng-practices/review/developer/cl-descriptions.html

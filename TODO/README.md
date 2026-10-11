# GreenDocs Build Backlog

**Total:** 24 ordered work items. Statuses below track implementation and acceptance evidence; previously written API/cloud-oriented work has been superseded by the accepted GitHub-only architecture in TODO 01/02 and ADRs 0001/0002.

## User Journey to Deliver

`/#/` public landing -> GitHub PAT sign-in -> verified identity/repository permission -> `/#/home` displays Git-backed pages, sub-pages, and cards -> developer manually enters protected `/#/studio` -> edit drafts -> review -> commit -> Actions and Pages deployment. Authenticated users are redirected from `/` to `/home`; signed-out visits to `/home` and `/studio` return to `/`.

## Work Items

|   # | Work item                                            | Depends on                          | Status      |
| --: | ---------------------------------------------------- | ----------------------------------- | ----------- |
|  01 | Product requirements and journey contract            | None                                | DONE        |
|  02 | Architecture and decision records                    | 01                                  | DONE        |
|  03 | Security and PAT threat model                        | 01                                  | DONE        |
|  04 | Repository and GitHub prerequisites                  | 02, 03                              | IN PROGRESS |
|  05 | Reproducible pnpm workspace scaffold                 | 02, 04                              | IN PROGRESS |
| 05A | Modular boundaries                                   | 02, 05                              | DONE        |
| 05B | Typed configuration and no scattered magic values    | 02, 04, 05                          | IN PROGRESS |
|  06 | Content schemas and Git storage contract             | 02, 05, 05A, 05B                    | IN PROGRESS |
|  07 | Browser GitHub repository adapter and atomic commits | 03, 04, 06                          | IN PROGRESS |
|  08 | GitHub PAT verification and memory auth              | 03, 04, 07                          | IN PROGRESS |
|  09 | Shared visual system and accessible primitives       | 01, 05                              | NOT STARTED |
| 09A | Reusable component contracts                         | 05A, 09                             | NOT STARTED |
| 09B | Unique governed icon system                          | 09, 09A                             | NOT STARTED |
| 09C | Direct protected Secret Studio route isolation       | 01, 02, 08, 09                      | IN PROGRESS |
|  10 | Public home, navigation, and login experience        | 08, 09, 09C                         | IN PROGRESS |
| 10A | Lazy loading and intent prefetch                     | 02, 05A, 09B, 09C                   | NOT STARTED |
| 10B | Cache and freshness policy                           | 02, 03, 06, 07, 08, 10A             | NOT STARTED |
| 10C | Page boundaries and observability                    | 05A, 09A, 09C, 10                   | NOT STARTED |
|  11 | Git-backed hierarchy explorer and page CRUD          | 06, 07, 09A, 09C, 10, 10A, 10B, 10C | IN PROGRESS |
|  12 | Card editor, media attachments, and preview          | 06, 07, 09A, 09B, 10B, 11           | IN PROGRESS |
|  13 | Review, commit, and deployment status flow           | 07, 08, 11, 12                      | IN PROGRESS |
|  14 | CI and Pages deployment                              | 04, 05, 06, 13                      | IN PROGRESS |
|  15 | End-to-end quality, security, and operations gates   | 05-14, 05A-05B, 09A-09C, 10A-10C    | NOT STARTED |
|  16 | Live acceptance and production release verification  | 14, 15                              | NOT STARTED |

## Execution Rules

1. TODOs 01-03 define the approved product, architecture, and security baseline before feature code.
2. The selected architecture uses GitHub only. Never restore the removed app API or introduce an external runtime as a workaround.
3. Work in dependency order. Mark a task `IN PROGRESS` only when actively implementing it; mark it `DONE` only with evidence linked in its task file.
4. Keep each code change small, tested, and reviewable. Record the actual verification result in its task.
5. GitHub remains the persistent authority. The browser may hold transient draft/session state in memory only; no content or PAT is saved to localStorage, IndexedDB, or client files.
6. Never write PATs into source, reports, commits, logs, command history, build output, or URLs. Only a test account/token is used in automated tests.
7. Do not force-push. Production writes require an explicit publish action, current-head check, and a reviewed change summary.
8. Do not start TODO 16 until staging tests pass and the owner confirms the production cutover.

---
name: github-content-change
description: 'Use when changing GreenDocs GitHub authentication, repository reads/writes, content schemas, attachments, publish logic, cache behavior, or related security/tests.'
---

# GitHub and Content Change Workflow

## Procedure

1. Read `docs/ARCHITECTURE.md`, `docs/PRODUCT_BRIEF.md`, the relevant ADRs,
   `AGENTIC/PROJECT_ACCESS.md`, `docs/OPERATIONS.md`, and the applicable contract/schema/tests.
2. Confirm whether the requested behavior exists in the UI, only as a library capability, or is
   new. Do not describe the tested publish client as a user-facing editor.
3. Preserve these invariants:
   - GitHub is the configured identity/API/content/deployment platform.
   - PATs are entered only in the approved UI and held in active-tab memory only.
   - Never retrieve, print, persist, or request a token in chat, terminal, source, test data, URLs,
     logs, screenshots, or build output.
   - API origin and repository target remain fixed and caller paths stay constrained.
   - Validate untrusted records, MIME/size, hierarchy, relationships, and stable-ID storage paths.
   - Validate the complete resulting mutation set, compare the expected branch head, and never
     force-update a ref.
   - Never test writes against production without approval of the exact operation.
4. Make the smallest complete change and update/add tests for successful behavior and relevant
   rejection/failure cases.
5. Run the smallest relevant tests and typecheck/lint. Use browser acceptance only when the actual
   browser and an approved target are available; do not claim it from unit tests.
6. Update the canonical architecture, security, schema, or operations document if a lasting
   contract or behavior changes.
7. Report changed paths, verification, unverified behavior, and mismatches between docs and
   implementation.

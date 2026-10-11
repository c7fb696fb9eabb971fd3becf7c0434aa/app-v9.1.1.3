# TODO 03: Security and PAT Threat Model

**Status:** DONE
**Depends on:** TODO 01

## Goal

Specify controls for a user-supplied classic PAT and every operation it authorizes before implementing login or GitHub writes.

## Work

- Define PAT validation via GitHub `/user`; display the verified login and account ID, not a fabricated user.
- Check access to the fixed repository and effective write permission; reject valid-but-unauthorized accounts.
- Decide session storage/TTL/revocation. If PATs are retained server-side, encrypt them with managed keys and expire them; never put PATs in browser persistence or logs.
- Keep only the short-lived app session in browser memory; require re-authentication on reload unless an approved secure same-site session arrangement is available.
- Add strict origin/CORS allowlists, CSRF protection where cookies are used, request rate/payload limits, safe error responses, and audit event redaction.
- Define XSS/CSP protections; any script execution on the static site can compromise an in-memory session.
- Threat-model unauthorized repository writes, arbitrary-path writes, stale concurrent commits, malicious filenames/media, and leaked CI secrets.

## Done When

- Threat model lists assets, trust boundaries, attacker capabilities, mitigations, and residual risk.
- Secret-handling policy is testable and has no client-side PAT persistence.
- Owner authorized the server-side encrypted, TTL-bounded PAT session design in ADR 0002; cloud IAM/TTL validation remains TODO 04.

## Verification

Evidence: [ADR 0002](../docs/adr/0002-pat-auth-and-session-security.md). TODOs 08 and 15 implement and execute the listed negative security tests using synthetic credentials only.

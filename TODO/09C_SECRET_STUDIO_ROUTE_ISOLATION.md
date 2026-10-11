# TODO 09C: Direct Secret Studio Route and Isolation

**Status:** IN PROGRESS  
**Depends on:** TODO 01, TODO 02, TODO 08, TODO 09

## Goal

Make Secret Studio a separate, directly addressable application route without exposing a Studio link in the right sidebar or ordinary public navigation.

## Work

- Select and document a stable hash route (candidate `#/studio`) and return-path behavior.
- Do not render Secret Studio links, labels, or actions in the right drawer/global navigation.
- Load Studio only when the user directly visits the route or follows an explicit authenticated deep link.
- Enforce verified server session and repository authorization on the route and every API operation. Route secrecy is not a security control.
- Isolate Studio layout/state/error boundaries and avoid global shell state leaking into the editor.
- Ensure the public page/nav can render without loading Studio chunks or requesting private Studio data.

## Done When

- Right sidebar has only public navigation/auth actions and no Studio entry.
- Direct `#/studio` while signed out redirects to PAT login; after verified auth it returns to Studio.
- Direct `#/studio` for a valid GitHub user without repo write access remains blocked.
- Public home and public content continue to work when Studio code/API is unavailable.

## Verification

Browser E2E asserts no Studio link in drawer, direct route behavior, signed-out/unauthorized guard, deep link return, and independent route error/loading boundaries.

**Local evidence:** The Studio route is direct-only, lazy-loaded, guarded by in-memory verified-session state, and has an independent route boundary. The drawer omits Studio, and login return paths are restricted to Studio paths. Synthetic route tests cover drawer isolation and signed-out/authorized navigation; web tests pass.

**Not verified:** Live repository authorization and browser network traces require provisioned API/cloud infrastructure; the full cross-browser E2E matrix remains outstanding.

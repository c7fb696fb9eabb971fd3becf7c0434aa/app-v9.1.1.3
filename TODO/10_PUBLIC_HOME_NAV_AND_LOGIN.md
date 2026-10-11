# TODO 10: Public Home, Navigation, and Login Experience

**Status:** IN PROGRESS  
**Depends on:** TODO 08, TODO 09

## Goal

Implement `/` public landing -> GitHub sign-in -> protected `/home` documentation listing. Studio is a secret direct URL entered manually; it is not linked from the landing page, documentation home, header, or drawer.

## Work

- Set public route at the exact GitHub Pages base with hash routes compatible with static hosting.
- `/` is public while signed out; authenticated navigation to `/` redirects to `/home`.
- After successful GitHub verification, always navigate to `/home`.
- `/home` reads GitHub and renders all pages, nested sub-pages, and cards in hierarchy.
- The header home link targets `/` when signed out and `/home` when authenticated. No authenticated UI links back to `/`.
- Do not include a Studio link or button anywhere; reach Studio only by manually entering `/#/studio`.
- Implement PAT login form with show/hide, submit progress, validation, accessible errors, and verified GitHub identity/permission result.
- Render `/login` as a clean independent page without the shared site header, app shell, or shared UI input/icon components; center its return-home link.
- Protect `/home` and Studio routes by verified GitHub memory auth and return signed-out direct visits to `/`.
- Remove signup/email/instant-developer fake access and ensure the OAuth client ID is not mistaken for PAT verification.

## Done When

- Signed-out user visits `/`, enters login, and successful authentication always lands on `/home`.
- While authenticated, attempts to visit `/` are redirected to `/home`; no visible navigation returns to `/`.
- `/home` displays repository-backed pages, nested pages, and cards.
- The sidebar/header and `/home` never expose a Studio link.
- Sign-in only succeeds after GitHub verifies the real user and repository push permission.
- The authorized user can manually enter the direct Studio URL; a signed-out visit returns to `/` without rendering Studio.
- Refresh/logout/revocation return to a signed-out state; unauthorized routes never flash protected content.

## Verification

Browser tests for public home, drawer navigation, successful and rejected login, deep link to Studio, expiry, logout, refresh re-auth, keyboard, and mobile layout.

**Local evidence:** `/` public landing, mocked login-to-`/home`, `/home` GitHub snapshot rendering for pages/sub-pages/cards, signed-out home/Studio redirects, PAT show/hide, and drawer isolation are implemented and tested. Live sign-in/read worked against deployed commit `fd72311`; draft CRUD was exercised, but no publish was made.

**Local login-route evidence:** `/login` uses an independent full-viewport layout and form controls without shared site chrome; its return-home link is centered, and authenticated users redirect to `/home`.

**Not verified:** An authenticated attempt to navigate back to `/` needs an explicit browser test. Publish/cleanup on production remains pending and requires the approved signed-in state.

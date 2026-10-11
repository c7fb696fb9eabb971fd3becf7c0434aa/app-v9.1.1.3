# TODO 10: Public Home, Navigation, and Login Experience

**Status:** IN PROGRESS  
**Depends on:** TODO 08, TODO 09

## Goal

Implement the requested public-home -> right drawer -> login -> verified session journey. Secret Studio is entered by direct URL, not by a right-drawer link.

## Work

- Set public route at the exact GitHub Pages base with hash routes compatible with static hosting.
- Implement public home and right sidebar with public navigation, Login action, signed-in identity, and sign-out. Do not include a Secret Studio link or button.
- Implement PAT login form with show/hide, submit progress, validation, accessible errors, and verified GitHub identity/permission result.
- Protect Studio routes by verified GitHub memory auth and return signed-out direct visits to public home.
- Remove signup/email/instant-developer fake access and ensure the OAuth client ID is not mistaken for PAT verification.

## Done When

- Signed-out user can visit public home and enter login from the right sidebar; the sidebar never exposes Secret Studio.
- Sign-in only succeeds after GitHub verifies the real user and repository push permission.
- The authorized user can open the documented direct Studio URL; a signed-out visit returns home without rendering Studio.
- Refresh/logout/revocation return to a signed-out state; unauthorized routes never flash protected content.

## Verification

Browser tests for public home, drawer navigation, successful and rejected login, deep link to Studio, expiry, logout, refresh re-auth, keyboard, and mobile layout.

**Local evidence:** Public home, PAT show/hide, mocked successful GitHub verification, direct Studio home redirect, memory-only auth, sign-out/401 clearing, and drawer interactions are implemented. Workspace tests pass, but they do not constitute live GitHub acceptance.

**Not verified:** Live PAT sign-in and Studio CRUD remain to be verified against the direct GitHub implementation.

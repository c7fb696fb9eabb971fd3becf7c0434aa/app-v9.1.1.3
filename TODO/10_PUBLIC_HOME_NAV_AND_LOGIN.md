# TODO 10: Public Home, Navigation, and Login Experience

**Status:** IN PROGRESS  
**Depends on:** TODO 08, TODO 09

## Goal

Implement the requested public-home -> right drawer -> login -> verified session journey. Secret Studio is entered by direct URL, not by a right-drawer link.

## Work

- Set public route at the exact GitHub Pages base with hash routes compatible with static hosting.
- Implement public home and right sidebar with public navigation, Login action, signed-in identity, and sign-out. Do not include a Secret Studio link or button.
- Implement PAT login form with show/hide, submit progress, validation, accessible errors, and server-auth result.
- After verified login, preserve an authorized requested return path so a user who opened the direct Studio URL can continue there.
- Protect Studio routes by verified API session and redirect to login with a safe return path.
- Remove signup/email/instant-developer fake access and ensure the OAuth client ID is not mistaken for PAT verification.

## Done When

- Signed-out user can visit public home and enter login from the right sidebar; the sidebar never exposes Secret Studio.
- Sign-in only succeeds when backend verifies the real user and repo write access.
- The authorized user can open the documented direct Studio URL; an unauthenticated or unauthorized user cannot access it or its API.
- Refresh/logout/expiry return to a correct signed-out state; unauthorized routes never flash protected content.

## Verification

Browser tests for public home, drawer navigation, successful and rejected login, deep link to Studio, expiry, logout, refresh re-auth, keyboard, and mobile layout.

**Local evidence:** Public home/navigation, PAT show/hide and submission states, direct Studio deep-link return, in-memory session handling, logout, expiry/401 behavior, and accessible drawer interactions are implemented. Synthetic web/API tests pass (14 web, 19 API).

**Not verified:** No live PAT or staging account was used. Full browser mobile/refresh behavior against a deployed API remains outstanding.

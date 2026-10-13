# UI Component Contracts

These contracts describe shared presentation primitives and the authenticated documentation home, which reads the GitHub repository.

## Shared primitives

| Component         | Owner and API                                                                         | State and behavior                                                  | Render/accessibility                                                                 | Persistence and verification                                                                       |
| ----------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `Button`          | Design primitives; `variant`, `type`, `disabled`, children, `onClick`                 | Parent-controlled; disabled prevents activation                     | Native button, visible focus, disabled cursor/state; high-impact actions keep text   | No persistence. Test keyboard activation and disabled behavior.                                    |
| `IconButton`      | Design primitives; required `IconName`, visible action `label`, `disabled`, `onClick` | Parent-controlled                                                   | Native button with `aria-label`, catalog icon hidden from assistive tech, focus ring | No persistence. Test name, focus, callback, and disabled state.                                    |
| `TextInput`       | Design primitives; `id`, label, value, `onChange`, type, error                        | Controlled; parent clears sensitive values after submission         | Associated visible label; error via `aria-describedby` and alert/status semantics    | No persistence. Test labels, validation, and controlled updates.                                   |
| `Dialog`          | Design primitives; title, children, close callback                                    | Parent owns open/closed state; Escape and close action dismiss      | Dialog role, labelled title, initial focus, focus containment and restoration        | No persistence. Test Escape, focus movement/restoration, and keyboard controls.                    |
| `RightSidebar`    | Navigation feature; auth context and login-intent callback                            | Auth provider owns identity; sidebar owns only temporary open state | Right-side modal dialog, Escape, focus containment/restoration, backdrop close       | Logout calls the auth feature; no other persistence. Test signed-out/in states and focus behavior. |
| `StatusIndicator` | Shared status primitive; finite status enum, optional non-sensitive detail            | Controlled by feature state                                         | Status/live region with text and icon; never color-only                              | No persistence. Test all finite states and accessible text.                                        |
| `RoutePageShell`  | App route; route ID and page content                                                  | Route-local loading/error state                                     | Main landmark and route-specific error boundary; stable Suspense status              | No persistence. Test each route failure independently.                                             |

## Route flow and documentation home

- `/backend` is an undiscoverable authenticated route protected by the same existing GitHub session
  guard; omitting it from navigation is not an access-control boundary. It renders its own
  independent header, not `SiteHeader`, the app shell, or Home content. The header matches the
  global Home header's 56px sticky Obsidian Glass surface, standard divider, 12px blur, and centered
  1280px inner geometry (16px inline padding). Its Back to home button navigates to `/home`;
  Deployments has no action wired. The header contains no logo or brand.
  Its workspace has two sibling panels. Each uses bordered header, flexible content, and footer
  regions with a 4px inset and gaps; desktop rows are 41px / flexible / 41px. The left panel
  contains GitHub Sync and Select controls and their respective overlays; the right contains the
  Live Preview / Card Editor / Real-Time-Sync header and a nested card-editor scaffold. See the
  [Backend Workspace Visual Map](./BACKEND_WORKSPACE_MAP.md) for the exact visual hierarchy,
  dimensions, responsive rules, overlay bounds, and current nonfunctional controls.
- `SiteHeader` is sticky with a centered maximum-1280px container and a symmetrical 33px navigation / 33px brand / 33px navigation triad. Both header navigation controls and both sidebar close controls use the shared 33px control-size token. The centered brand link and both sidebar brand links use the shared `NavigationBrandLink` component and 33px navigation-brand design token. It routes to `/home` for an authenticated user and `/` otherwise.
- `LeftSidebar` owns its left-opening overlay, close control, background, focus containment, Escape handling, and focus restoration. Its shared brand home link closes the left overlay on navigation. It contains no login/logout actions. Its footer uses the same Obsidian Glass surface and 12px blur as its header.
- `RightSidebar` independently owns its right-opening overlay, auth-aware content/actions, close control, background, focus containment, Escape handling, and focus restoration. Its shared brand home link closes the right overlay on navigation. Sidebar state, overlay markup, and behavior remain independent; both follow the same geometry and background tokens in `docs/COLOR_SYSTEM.md`. Its footer matches the same Obsidian Glass surface and blur as its header.
- Signed-out `/#/` is the public landing page; successful sign-in always redirects to `/#/home`.
- The PAT login is a dedicated route shell with its own page markup and field controls: no shared site header, app content shell, or shared input/icon components. It retains global color tokens, the Obsidian Glass panel, 4px field/action radii, an accessible icon-only eye/eye-off control positioned inside the input, and a full-width secondary-style “Return to Home Page” button with a 33px obsidian arrow control matching the eye control, including white-glass tint on hover and keyboard focus. Its heading is “Authenticate,” its field label is “Personal Access Token,” its submit action is “Authenticate,” and its supporting copy explains account authentication for pushing and committing to the configured repository. No key badge or redundant token-storage paragraph is displayed. Authenticated users are redirected to `/home`.
- The login page lists Google, GitHub, ChatGPT, SAML SSO, and Passkey as disabled secondary-style buttons. They have no handlers and must not navigate, authenticate, or display a message until those methods are implemented.
- `/home` reads the validated repository snapshot and renders every page, nested sub-page, and card in repository order, including its supported attachments.
- The authenticated Home route replaces the old in-content Home title bar with a full-width location bar directly below the global header. The bar matches the header's 56px height and Obsidian Glass surface; its centered, keyboard-focusable breadcrumb track is capped at 680px, has 4px corners, currently displays only the current “Home” location, and supports horizontal drag/scroll as the hierarchy gains deeper destinations.
- An empty `/home` remains a clean content canvas; it does not show an account welcome, repository banner, refresh control, or empty-repository notice. Loading and GitHub errors remain visible and actionable.
- While authenticated, visiting `/` redirects back to `/home`. The header's home control also points to `/home`.
- Unknown routes redirect to `/` while signed out and `/home` while authenticated.

## State ownership

- URL: `/` is public before sign-in; `/home` is protected documentation; `/backend` is a protected
  independent workspace route and deliberately absent from visible navigation.
- Auth feature: verified identity and PAT in active-tab memory and tab-scoped `sessionStorage`;
  revalidates with GitHub after refresh and clears the PAT on sign-out/invalid-token response.
- GitHub/Git: committed records, content history, and authoritative branch head.
- Backend route: independent header and two-panel visual scaffold; no repository reads, drafts, or
  publishing. Back to home navigates to `/home`; the panel hierarchy and overlay behavior are
  documented in the [Backend Workspace Visual Map](./BACKEND_WORKSPACE_MAP.md).

## Current verification

- Icon registry tests cover action-to-icon keys, icon accessibility, focus, click, and disabled-state API behavior.
- Route tests cover public access, login-to-home flow, repository page/sub-page/card rendering, drawer isolation, unknown-route fallback, signed-out protected redirects, and refusal to stay on public root while authenticated.
- Backend route tests cover its signed-in guard and workspace scaffold. Their GitHub Sync content
  assertions need reconciliation with the current component markup; see the
  [Backend Workspace Visual Map](./BACKEND_WORKSPACE_MAP.md).
- Real authenticated browser acceptance has not yet been run against the direct GitHub implementation. The former deployment had no API and could not authenticate; that API dependency has been removed.

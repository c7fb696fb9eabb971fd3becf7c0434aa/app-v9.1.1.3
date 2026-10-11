import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import { APP_ROUTES } from '../../../config';
import { Icon } from '../../components/Icon';

export function SiteHeader({ onLoginIntent }: { onLoginIntent: () => void }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (!isDrawerOpen) return;
    closeButton.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false);
        menuButton.current?.focus();
      }
      if (event.key !== 'Tab') return;
      const controls = document.querySelectorAll<HTMLElement>(
        '#right-navigation-dialog button, #right-navigation-dialog a',
      );
      const first = controls.item(0);
      const last = controls.item(controls.length - 1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  return (
    <>
      <header className="site-header">
        <div className="header-leading" />
        <Link className="header-home" to={APP_ROUTES.home} aria-label="GreenDocs home">
          <span className="brand-mark">
            <Icon name="brand" />
          </span>
        </Link>
        <div className="header-trailing">
          <button
            ref={menuButton}
            className="icon-button"
            type="button"
            aria-label="Open right navigation"
            aria-controls="right-navigation-dialog"
            aria-expanded={isDrawerOpen}
            onClick={() => setIsDrawerOpen(true)}
          >
            <Icon name="navigationOpen" />
          </button>
        </div>
      </header>

      {isDrawerOpen && (
        <>
          <button
            className="drawer-backdrop"
            type="button"
            aria-label="Close navigation overlay"
            tabIndex={-1}
            onClick={() => {
              setIsDrawerOpen(false);
              menuButton.current?.focus();
            }}
          />
          <aside
            id="right-navigation-dialog"
            className="right-drawer"
            aria-label="Right navigation"
            aria-modal="true"
            role="dialog"
          >
            <div className="drawer-header">
              <span className="brand-mark">
                <Icon name="brand" />
              </span>
              <button
                ref={closeButton}
                className="icon-button"
                type="button"
                aria-label="Close navigation"
                onClick={() => {
                  setIsDrawerOpen(false);
                  menuButton.current?.focus();
                }}
              >
                <Icon name="navigationClose" />
              </button>
            </div>
            <div className="drawer-content">
              {user ? (
                <p className="drawer-note">
                  Signed in as <strong>{user.login}</strong>.
                </p>
              ) : (
                <p className="drawer-note">
                  Sign in with GitHub to access your documentation workspace.
                </p>
              )}
            </div>
            <div className="drawer-footer">
              {user ? (
                <>
                  <button
                    className="action-button"
                    type="button"
                    onClick={async () => {
                      logout();
                      setIsDrawerOpen(false);
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  className="action-button action-button-primary"
                  to={APP_ROUTES.login}
                  onFocus={onLoginIntent}
                  onMouseEnter={onLoginIntent}
                  onClick={() => setIsDrawerOpen(false)}
                >
                  Log in with GitHub
                </Link>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}

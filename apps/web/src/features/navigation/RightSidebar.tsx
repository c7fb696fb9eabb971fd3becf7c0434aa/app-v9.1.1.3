import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { APP_ROUTES } from '../../../config';
import { Icon } from '../../components/Icon';
import { useAuth } from '../auth';
import { NavigationBrandLink } from './NavigationBrandLink';

export function RightSidebar({ onLoginIntent }: { onLoginIntent: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const { user, logout } = useAuth();

  function openSidebar(event: MouseEvent<HTMLButtonElement>) {
    trigger.current = event.currentTarget;
    setIsOpen(true);
  }

  function closeSidebar() {
    setIsOpen(false);
    trigger.current?.focus();
  }

  useEffect(() => {
    if (!isOpen) return;
    closeButton.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        trigger.current?.focus();
        return;
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
  }, [isOpen]);

  return (
    <>
      <button
        ref={trigger}
        className="icon-button header-icon-button"
        type="button"
        aria-label="Open right navigation"
        aria-controls="right-navigation-dialog"
        aria-expanded={isOpen}
        onClick={openSidebar}
      >
        <Icon name="navigationOpen" />
      </button>
      {isOpen &&
        createPortal(
          <>
            <button
              className="right-sidebar-backdrop"
              type="button"
              aria-label="Close right sidebar overlay"
              tabIndex={-1}
              onClick={closeSidebar}
            />
            <aside
              id="right-navigation-dialog"
              className="right-sidebar"
              aria-label="Right navigation"
              aria-modal="true"
              role="dialog"
            >
              <header className="right-sidebar-header">
                <NavigationBrandLink
                  className="right-sidebar-brand"
                  onClick={() => setIsOpen(false)}
                />
                <button
                  ref={closeButton}
                  className="icon-button right-sidebar-close"
                  type="button"
                  aria-label="Close right navigation"
                  onClick={closeSidebar}
                >
                  <Icon name="navigationClose" />
                </button>
              </header>
              <div className="right-sidebar-content">
                {user ? (
                  <p className="right-sidebar-note">
                    Signed in as <strong>{user.login}</strong>.
                  </p>
                ) : (
                  <p className="right-sidebar-note">
                    Sign in with GitHub to access your documentation workspace.
                  </p>
                )}
              </div>
              <footer className="right-sidebar-footer">
                {user ? (
                  <button
                    className="action-button"
                    type="button"
                    onClick={async () => {
                      logout();
                      closeSidebar();
                    }}
                  >
                    Sign out
                  </button>
                ) : (
                  <Link
                    className="action-button action-button-secondary right-sidebar-login"
                    to={APP_ROUTES.login}
                    onFocus={onLoginIntent}
                    onMouseEnter={onLoginIntent}
                    onClick={() => setIsOpen(false)}
                  >
                    Log in with GitHub
                  </Link>
                )}
              </footer>
            </aside>
          </>,
          document.body,
        )}
    </>
  );
}

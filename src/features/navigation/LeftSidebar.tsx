import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../../components/Icon';
import { NavigationBrandLink } from './NavigationBrandLink';

export function LeftSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  function openSidebar(event: MouseEvent<HTMLButtonElement>) {
    trigger.current = event.currentTarget;
    setIsOpen(true);
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
        '#left-navigation-dialog button, #left-navigation-dialog a',
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

  function closeSidebar() {
    setIsOpen(false);
    trigger.current?.focus();
  }

  return (
    <>
      <button
        ref={trigger}
        className="icon-button header-icon-button"
        type="button"
        aria-label="Open left sidebar"
        aria-controls="left-navigation-dialog"
        aria-expanded={isOpen}
        onClick={openSidebar}
      >
        <Icon name="navigationOpen" />
      </button>
      {isOpen &&
        createPortal(
          <>
            <button
              className="left-sidebar-backdrop"
              type="button"
              aria-label="Close left sidebar overlay"
              tabIndex={-1}
              onClick={closeSidebar}
            />
            <aside
              id="left-navigation-dialog"
              className="left-sidebar"
              role="dialog"
              aria-label="Left sidebar"
              aria-modal="true"
            >
              <header className="left-sidebar-header">
                <NavigationBrandLink
                  className="left-sidebar-brand"
                  onClick={() => setIsOpen(false)}
                />
                <button
                  ref={closeButton}
                  className="icon-button left-sidebar-close"
                  type="button"
                  aria-label="Close left sidebar"
                  onClick={closeSidebar}
                >
                  <Icon name="navigationClose" />
                </button>
              </header>
              <div className="left-sidebar-content" />
              <footer className="left-sidebar-footer" aria-hidden="true" />
            </aside>
          </>,
          document.body,
        )}
    </>
  );
}

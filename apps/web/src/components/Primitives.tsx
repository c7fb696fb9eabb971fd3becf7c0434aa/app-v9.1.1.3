import {
  forwardRef,
  useEffect,
  useRef,
  useId,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: 'primary' | 'secondary' | 'danger';
  }
>(function Button({ variant = 'secondary', className = '', ...props }, ref) {
  return (
    <button
      {...props}
      ref={ref}
      className={`action-button action-button-${variant} ${className}`.trim()}
    />
  );
});

export function TextInput({
  id,
  label,
  error,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
}) {
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="input-field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <input
        {...props}
        id={id}
        className={`text-field ${className}`.trim()}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
      />
      {error && (
        <p className="status-message status-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function StatusBanner({
  children,
  variant = 'status',
}: {
  children: ReactNode;
  variant?: 'status' | 'error';
}) {
  return (
    <p
      className={`status-message${variant === 'error' ? 'status-error' : ''}`}
      role={variant === 'error' ? 'alert' : 'status'}
    >
      {children}
    </p>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <span className="spinner" role="status" aria-label={label} />;
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="empty-state" aria-label={title}>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </section>
  );
}

export function TreeRow({
  label,
  level,
  selected = false,
  expanded,
  onSelect,
}: {
  label: string;
  level: number;
  selected?: boolean;
  expanded?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      className="tree-row"
      type="button"
      role="treeitem"
      aria-level={Number.isFinite(level) ? Math.max(1, Math.trunc(level)) : 1}
      aria-selected={selected}
      aria-expanded={expanded}
      onClick={onSelect}
    >
      {label}
    </button>
  );
}

export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: readonly { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const tabList = useRef<HTMLDivElement>(null);
  function moveFocus(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (tabs.length === 0) return;
    const selectedIndex = tabs.findIndex((tab) => tab.id === value);
    const currentIndex = Math.max(0, selectedIndex);
    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = tabs.length - 1;
    else return;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    onChange(nextTab.id);
    tabList.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]').item(nextIndex)?.focus();
  }

  return (
    <div className="tabs" ref={tabList} role="tablist" aria-label="Content sections">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          id={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          tabIndex={value === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={moveFocus}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function Dialog({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const previousFocus = document.activeElement;
    const controls = dialog.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex="0"]',
    );
    if (controls?.length) controls.item(0)?.focus();
    else dialog.current?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        ref={dialog}
        className="dialog-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
          if (event.key !== 'Tab') return;
          const controls = dialog.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex="0"]',
          );
          if (!controls?.length) {
            event.preventDefault();
            dialog.current?.focus();
            return;
          }
          const first = controls.item(0);
          const last = controls.item(controls.length - 1);
          const focusIsInside = dialog.current?.contains(document.activeElement) ?? false;
          if (!focusIsInside) {
            event.preventDefault();
            first?.focus();
          } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="dialog-heading">
          <h2 id={titleId}>{title}</h2>
          <button className="action-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

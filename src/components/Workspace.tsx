import {
  forwardRef,
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type ButtonHTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react';
import { Icon, type IconName } from './Icon';
import { Button } from './Primitives';

export function WorkspacePageHeader({
  title,
  start,
  actions,
  ariaLabel,
  inert = false,
  classNames = {},
}: {
  title: string;
  start: ReactNode;
  actions: ReactNode;
  ariaLabel: string;
  inert?: boolean;
  classNames?: Partial<{
    root: string;
    inner: string;
    start: string;
    actions: string;
    title: string;
  }>;
}) {
  return (
    <header className={classNames.root} aria-label={ariaLabel} inert={inert}>
      <div className={classNames.inner}>
        <div className={classNames.start}>{start}</div>
        <h1 className={classNames.title}>{title}</h1>
        <div className={classNames.actions}>{actions}</div>
      </div>
    </header>
  );
}

export function WorkspaceFrame({
  ariaLabel,
  panelsInert = false,
  children,
  overlay,
  classNames = {},
}: {
  ariaLabel: string;
  panelsInert?: boolean;
  children: ReactNode;
  overlay?: ReactNode;
  classNames?: Partial<{ root: string; panels: string }>;
}) {
  return (
    <section className={classNames.root} aria-label={ariaLabel}>
      <div className={classNames.panels} inert={panelsInert}>
        {children}
      </div>
      {overlay}
    </section>
  );
}

export function WorkspacePanel({
  ariaLabel,
  header,
  content,
  footer,
  overlay,
  layoutInert = false,
  headerLayout = 'centered',
  classNames = {},
}: {
  ariaLabel: string;
  header: ReactNode;
  content: ReactNode;
  footer?: ReactNode;
  overlay?: ReactNode;
  layoutInert?: boolean;
  headerLayout?: 'centered' | 'spread';
  classNames?: Partial<{
    root: string;
    layout: string;
    header: string;
    content: string;
    footer: string;
    spreadHeader: string;
  }>;
}) {
  return (
    <section className={classNames.root} aria-label={ariaLabel}>
      <div className={classNames.layout} inert={layoutInert}>
        <header
          className={`${classNames.header ?? ''}${headerLayout === 'spread' ? ` ${classNames.spreadHeader ?? ''}` : ''}`.trim()}
          aria-label={`${ariaLabel} header`}
        >
          {header}
        </header>
        <section className={classNames.content} aria-label={`${ariaLabel} content`}>
          {content}
        </section>
        <footer className={classNames.footer} aria-label={`${ariaLabel} footer`}>
          {footer}
        </footer>
      </div>
      {overlay}
    </section>
  );
}

export function WorkspacePanelTitle({
  children,
  className,
}: {
  children: ReactNode;
  className: string;
}) {
  return <h2 className={className}>{children}</h2>;
}

export function WorkspaceModeIndicator({
  'aria-label': ariaLabel,
  children,
  className,
}: {
  'aria-label': string;
  children: ReactNode;
  className: string;
}) {
  return (
    <div className={className} aria-label={ariaLabel}>
      {children}
    </div>
  );
}

export function AnchoredDialog({
  id,
  ariaLabel,
  onClose,
  children,
  initialFocusRef,
  returnFocusRef,
  modal = false,
  className,
}: {
  id?: string;
  ariaLabel: string;
  onClose: () => void;
  children: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  modal?: boolean;
  className: string;
}) {
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const dialog = dialogRef.current;
    const firstControl = dialog?.querySelector<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex="0"]',
    );
    const initialFocus = initialFocusRef?.current ?? firstControl ?? dialog;
    initialFocus?.focus();

    return () => {
      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected &&
        previousFocus !== document.body
      ) {
        previousFocus.focus();
      } else {
        returnFocusRef?.current?.focus();
      }
    };
  }, [initialFocusRef, returnFocusRef]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') {
      onClose();
      return;
    }
    if (!modal || event.key !== 'Tab') return;

    const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [contenteditable="true"], [tabindex="0"]',
    );
    if (!controls?.length) {
      event.preventDefault();
      dialogRef.current?.focus();
      return;
    }

    const first = controls.item(0);
    const last = controls.item(controls.length - 1);
    if (!dialogRef.current?.contains(document.activeElement)) {
      event.preventDefault();
      first?.focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <section
      ref={dialogRef}
      id={id}
      className={className}
      role="dialog"
      aria-modal={modal || undefined}
      aria-label={ariaLabel}
      tabIndex={-1}
      onKeyDown={handleKeyDown}
    >
      {children}
    </section>
  );
}

export function StatusDot({ className }: { className: string }) {
  return <span className={className} aria-hidden="true" />;
}

export const WorkspaceActionButton = forwardRef<
  HTMLButtonElement,
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
    label: string;
    icon?: IconName;
    iconSize?: number;
    statusIndicator?: boolean;
    statusIndicatorClassName?: string;
  }
>(function WorkspaceActionButton(
  {
    label,
    icon,
    iconSize = 14,
    statusIndicator = false,
    statusIndicatorClassName = '',
    className = '',
    ...props
  },
  ref,
) {
  return (
    <Button {...props} ref={ref} type="button" className={className}>
      {statusIndicator && <StatusDot className={statusIndicatorClassName} />}
      {icon && <Icon name={icon} size={iconSize} />}
      {label}
    </Button>
  );
});

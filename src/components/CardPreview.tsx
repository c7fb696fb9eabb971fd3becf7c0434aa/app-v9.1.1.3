import { useState, type ChangeEvent, type ReactNode } from 'react';
import { ActionToolbar, type ToolbarAction } from './ActionToolbar';
import { Icon, type IconName } from './Icon';
import { Button } from './Primitives';

export function CardConnector({ className }: { className: string }) {
  return <div className={className} aria-hidden="true" />;
}

export function CardSummary({
  title,
  titleIcon,
  updatedLabel,
  updatedAt,
  formattedDate,
  category,
  className = '',
  classNames = {},
  onClick,
}: {
  title: string;
  titleIcon: IconName;
  updatedLabel: string;
  updatedAt: string;
  formattedDate: string;
  category: string;
  className?: string;
  classNames?: Partial<{
    title: string;
    updated: string;
    status: string;
    updatedCopy: string;
    tag: string;
  }>;
  onClick?: () => void;
}) {
  return (
    <Button type="button" className={className} onClick={onClick}>
      <span className={classNames.title}>
        <Icon name={titleIcon} size={14} />
        <span>{title}</span>
      </span>
      <span className={classNames.updated}>
        <span className={classNames.status} aria-hidden="true" />
        <span className={classNames.updatedCopy}>
          <span>{updatedLabel}</span>
          <time dateTime={updatedAt}>{formattedDate}</time>
        </span>
      </span>
      <span className={classNames.tag}>{category}</span>
    </Button>
  );
}

export function CardPreview({
  ariaLabel,
  contentLabel,
  title,
  category,
  description,
  carousel,
  titleIcon,
  actions,
  toolbarLabel,
  notesLabel,
  notesPlaceholder,
  classNames = {},
}: {
  ariaLabel: string;
  contentLabel: string;
  title: string;
  category: string;
  description?: string;
  carousel?: ReactNode;
  titleIcon: IconName;
  actions: readonly ToolbarAction[];
  toolbarLabel: string;
  notesLabel: string;
  notesPlaceholder: string;
  classNames?: Partial<{
    root: string;
    content: string;
    contentHeader: string;
    contentTitle: string;
    toolbar: string;
    toolbarTrack: string;
    toolbarItem: string;
    notes: string;
  }>;
}) {
  const [notes, setNotes] = useState('');

  function handleNotesChange(event: ChangeEvent<HTMLInputElement>) {
    setNotes(event.currentTarget.value);
  }

  return (
    <article className={classNames.root} aria-label={ariaLabel}>
      <section className={classNames.content} aria-label={contentLabel}>
        <header className={classNames.contentHeader} aria-label={`${title} heading`}>
          <div className={classNames.contentTitle}>
            <Icon name={titleIcon} size={14} />
            <h3>{title}</h3>
          </div>
          <span>{category}</span>
        </header>
        {(description || carousel) && (
          <div className="backend-card-editor-content-body">
            {description && <p className="backend-card-editor-description">{description}</p>}
            {carousel}
          </div>
        )}
      </section>
      <ActionToolbar
        actions={actions}
        ariaLabel={toolbarLabel}
        {...(classNames.toolbar !== undefined && { className: classNames.toolbar })}
        {...(classNames.toolbarTrack !== undefined && {
          trackClassName: classNames.toolbarTrack,
        })}
        {...(classNames.toolbarItem !== undefined && {
          itemClassName: classNames.toolbarItem,
        })}
      />
      <label className={classNames.notes}>
        <Icon name={titleIcon} size={14} />
        <input
          type="text"
          aria-label={notesLabel}
          placeholder={notesPlaceholder}
          value={notes}
          onChange={handleNotesChange}
        />
      </label>
    </article>
  );
}

import { useState, type ChangeEvent, type ReactNode } from 'react';
import { ActionToolbar, type ToolbarAction } from './ActionToolbar';
import { Icon, type IconName } from './Icon';
import { Button } from './Primitives';
import { assetExtensionForMimeType, type Attachment } from '../lib/content';

function mediaUrl(
  repository: { owner: string; name: string; branch: string },
  assetId: string,
  mimeType: Extract<Attachment, { assetId: string }>['mimeType'],
): string {
  return `https://raw.githubusercontent.com/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/${repository.branch
    .split('/')
    .map(encodeURIComponent)
    .join('/')}/content/media/${assetId}.${assetExtensionForMimeType(mimeType)}`;
}

export function CardAttachments({
  attachments,
  repository,
  previewUrlForAsset,
}: {
  attachments: readonly Attachment[];
  repository?: { owner: string; name: string; branch: string } | undefined;
  previewUrlForAsset?: ((assetId: string) => string | undefined) | undefined;
}) {
  if (attachments.length === 0) return null;

  return (
    <ul className="published-attachments">
      {attachments.map((attachment) => {
        if (attachment.kind === 'link') {
          return (
            <li key={attachment.id}>
              <a href={attachment.url} target="_blank" rel="noreferrer">
                {attachment.label}
              </a>
            </li>
          );
        }
        let src: string;
        if ('url' in attachment) {
          src = attachment.url;
        } else {
          const previewUrl = previewUrlForAsset?.(attachment.assetId);
          if (previewUrl) src = previewUrl;
          else if (repository) {
            src = mediaUrl(repository, attachment.assetId, attachment.mimeType);
          } else throw new Error('attachment_repository_missing');
        }
        if (attachment.kind === 'image') {
          return (
            <li key={attachment.id}>
              <a href={src} target="_blank" rel="noreferrer">
                <img src={src} alt={attachment.label} loading="lazy" />
                <span>{attachment.label}</span>
              </a>
            </li>
          );
        }
        if (attachment.kind === 'audio') {
          return (
            <li key={attachment.id}>
              <div>
                <p>{attachment.label}</p>
                <audio controls preload="none">
                  <source src={src} type={attachment.mimeType} />
                </audio>
              </div>
            </li>
          );
        }
        if (attachment.kind === 'video') {
          return (
            <li key={attachment.id}>
              <div>
                <p>{attachment.label}</p>
                <video controls preload="none">
                  <source src={src} type={attachment.mimeType} />
                </video>
              </div>
            </li>
          );
        }
        return (
          <li key={attachment.id}>
            <a href={src} target="_blank" rel="noreferrer">
              {attachment.label} (PDF)
            </a>
          </li>
        );
      })}
    </ul>
  );
}

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
  keyRule,
  code,
  spec,
  attachments = [],
  repository,
  previewUrlForAsset,
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
  keyRule?: string;
  code?: string;
  spec?: string;
  attachments?: readonly Attachment[];
  repository?: { owner: string; name: string; branch: string } | undefined;
  previewUrlForAsset?: ((assetId: string) => string | undefined) | undefined;
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
        {(description || keyRule || code || spec || attachments.length > 0 || carousel) && (
          <div className="backend-card-editor-content-body">
            {description && <p className="backend-card-editor-description">{description}</p>}
            {keyRule && (
              <section className="backend-card-editor-key-rule">
                <h4>Key rule</h4>
                <p>{keyRule}</p>
              </section>
            )}
            {code && <pre className="published-card-code">{code}</pre>}
            {spec && (
              <p className="published-card-spec">
                <strong>Specification:</strong> {spec}
              </p>
            )}
            <CardAttachments
              attachments={attachments}
              repository={repository}
              previewUrlForAsset={previewUrlForAsset}
            />
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

import { useState } from 'react';
import {
  CONTENT_LIMITS,
  SUPPORTED_ASSET_TYPES,
  type Attachment,
  type StoredAttachment,
  type StoredAttachmentKind,
  type StoredAttachmentMimeType,
} from '../lib/content';
import { Button } from './Primitives';

type AttachmentKind = StoredAttachmentKind | 'link';
type AttachmentSource = 'file' | 'url';

function createAttachmentId(): string {
  if (typeof crypto.randomUUID !== 'function')
    throw new Error('attachment_id_generation_unavailable');
  return crypto.randomUUID();
}

export function AttachmentEditor({
  attachments,
  onChange,
  onAddFile,
  onRemove,
}: {
  attachments: readonly Attachment[];
  onChange: (attachments: Attachment[]) => void;
  onAddFile: (attachment: StoredAttachment, file: File) => void;
  onRemove: (attachment: Attachment) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [kind, setKind] = useState<AttachmentKind>('image');
  const [source, setSource] = useState<AttachmentSource>('file');
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [mimeType, setMimeType] = useState<StoredAttachmentMimeType>('image/png');
  const [error, setError] = useState<string | null>(null);
  const activeAttachment = attachments[activeIndex] ?? null;

  function updateAttachment(updated: Attachment) {
    onChange(
      attachments.map((attachment) => (attachment.id === updated.id ? updated : attachment)),
    );
  }

  function handleKindChange(nextKind: AttachmentKind) {
    setKind(nextKind);
    setError(null);
    if (nextKind !== 'link') setMimeType(SUPPORTED_ASSET_TYPES[nextKind][0]);
    if (nextKind === 'link') setSource('url');
  }

  function appendAttachment(attachment: Attachment) {
    if (attachments.length >= CONTENT_LIMITS.attachmentsPerCard) {
      setError(`A card can have at most ${CONTENT_LIMITS.attachmentsPerCard} attachments.`);
      return;
    }
    onChange([...attachments, attachment]);
    setActiveIndex(attachments.length);
    setLabel('');
    setUrl('');
    setError(null);
  }

  async function handleFileChange(file: File | undefined) {
    if (!file || kind === 'link') return;
    if (attachments.length >= CONTENT_LIMITS.attachmentsPerCard) {
      setError(`A card can have at most ${CONTENT_LIMITS.attachmentsPerCard} attachments.`);
      return;
    }
    const acceptedTypes = SUPPORTED_ASSET_TYPES[kind] as readonly string[];
    if (!acceptedTypes.includes(file.type)) {
      setError(`Choose a supported ${kind} file (${acceptedTypes.join(', ')}).`);
      return;
    }
    if (file.size < 1 || file.size > CONTENT_LIMITS.assetBytes) {
      setError('Each uploaded attachment must be between 1 byte and 10 MiB.');
      return;
    }
    const cleanLabel = label.trim() || file.name;
    if (cleanLabel.length > CONTENT_LIMITS.attachmentLabelCharacters) {
      setError(
        `Attachment labels must be ${CONTENT_LIMITS.attachmentLabelCharacters} characters or fewer.`,
      );
      return;
    }
    try {
      const attachment: StoredAttachment = {
        id: createAttachmentId(),
        assetId: createAttachmentId(),
        kind,
        label: cleanLabel,
        mimeType: file.type as StoredAttachmentMimeType,
        sizeBytes: file.size,
      };
      onAddFile(attachment, file);
      appendAttachment(attachment);
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : 'unknown_error';
      setError(`Could not prepare this file (${code}).`);
    }
  }

  function handleAddUrl() {
    if (attachments.length >= CONTENT_LIMITS.attachmentsPerCard) {
      setError(`A card can have at most ${CONTENT_LIMITS.attachmentsPerCard} attachments.`);
      return;
    }
    const cleanLabel = label.trim();
    if (!cleanLabel || cleanLabel.length > CONTENT_LIMITS.attachmentLabelCharacters) {
      setError(
        `Enter a label between 1 and ${CONTENT_LIMITS.attachmentLabelCharacters} characters.`,
      );
      return;
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      setError('Enter a valid HTTP or HTTPS URL.');
      return;
    }
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      setError('Only HTTP and HTTPS URLs are supported.');
      return;
    }
    if (kind !== 'link' && parsedUrl.protocol !== 'https:') {
      setError('Remote media URLs must use HTTPS so they can load in the published app.');
      return;
    }
    let id: string;
    try {
      id = createAttachmentId();
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : 'unknown_error';
      setError(`Could not create an attachment (${code}).`);
      return;
    }
    if (kind === 'link') {
      appendAttachment({ id, kind, label: cleanLabel, url: parsedUrl.toString() });
      return;
    }
    appendAttachment({
      id,
      kind,
      label: cleanLabel,
      url: parsedUrl.toString(),
      mimeType,
    });
  }

  return (
    <section className="backend-attachment-editor" aria-label="Card attachments">
      <h3>Attachments</h3>
      {activeAttachment ? (
        <div className="backend-attachment-carousel" aria-label="Attachment carousel">
          <div className="backend-attachment-carousel-controls">
            <Button
              type="button"
              aria-label="Previous attachment"
              disabled={attachments.length < 2}
              onClick={() =>
                setActiveIndex((index) => (index - 1 + attachments.length) % attachments.length)
              }
            >
              Previous
            </Button>
            <span>
              {activeIndex + 1} of {attachments.length}
            </span>
            <Button
              type="button"
              aria-label="Next attachment"
              disabled={attachments.length < 2}
              onClick={() => setActiveIndex((index) => (index + 1) % attachments.length)}
            >
              Next
            </Button>
          </div>
          <label className="backend-editor-field">
            <span>Attachment label</span>
            <input
              aria-label="Edit attachment label"
              value={activeAttachment.label}
              onChange={(event) =>
                updateAttachment({ ...activeAttachment, label: event.currentTarget.value })
              }
            />
          </label>
          {'url' in activeAttachment && (
            <label className="backend-editor-field">
              <span>{activeAttachment.kind === 'link' ? 'External link URL' : 'Media URL'}</span>
              <input
                aria-label="Edit attachment URL"
                type="url"
                value={activeAttachment.url}
                onChange={(event) =>
                  updateAttachment({ ...activeAttachment, url: event.currentTarget.value })
                }
              />
            </label>
          )}
          <p className="backend-attachment-kind">
            {activeAttachment.kind}
            {'mimeType' in activeAttachment ? ` · ${activeAttachment.mimeType}` : ''}
          </p>
          <Button
            type="button"
            onClick={() => {
              onRemove(activeAttachment);
              const next = attachments.filter(({ id }) => id !== activeAttachment.id);
              onChange(next);
              setActiveIndex(Math.max(0, Math.min(activeIndex, next.length - 1)));
            }}
          >
            Remove attachment
          </Button>
          <div className="backend-attachment-indicators" aria-label="Choose attachment">
            {attachments.map((attachment, index) => (
              <Button
                key={attachment.id}
                type="button"
                aria-label={`Show attachment ${index + 1}: ${attachment.label}`}
                aria-pressed={index === activeIndex}
                onClick={() => setActiveIndex(index)}
              >
                {index + 1}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <p>No attachments yet. Add a file or a typed URL below.</p>
      )}
      <div className="backend-attachment-add">
        <label className="backend-editor-field">
          <span>Attachment format</span>
          <select
            aria-label="Attachment format"
            value={kind}
            onChange={(event) => handleKindChange(event.currentTarget.value as AttachmentKind)}
          >
            <option value="image">Image</option>
            <option value="audio">Audio</option>
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
            <option value="link">External link</option>
          </select>
        </label>
        {kind !== 'link' && (
          <label className="backend-editor-field">
            <span>Source</span>
            <select
              aria-label="Attachment source"
              value={source}
              onChange={(event) => {
                setSource(event.currentTarget.value as AttachmentSource);
                setError(null);
              }}
            >
              <option value="file">Upload file</option>
              <option value="url">Use URL</option>
            </select>
          </label>
        )}
        <label className="backend-editor-field">
          <span>New attachment label</span>
          <input
            aria-label="New attachment label"
            value={label}
            maxLength={CONTENT_LIMITS.attachmentLabelCharacters}
            onChange={(event) => setLabel(event.currentTarget.value)}
          />
        </label>
        {source === 'file' && kind !== 'link' ? (
          <label className="backend-editor-field">
            <span>Upload {kind}</span>
            <input
              aria-label={`Upload ${kind} file`}
              type="file"
              accept={SUPPORTED_ASSET_TYPES[kind].join(',')}
              onChange={(event) => void handleFileChange(event.currentTarget.files?.[0])}
            />
          </label>
        ) : (
          <>
            {kind !== 'link' && (
              <label className="backend-editor-field">
                <span>Media MIME type</span>
                <select
                  aria-label="Media MIME type"
                  value={mimeType}
                  onChange={(event) =>
                    setMimeType(event.currentTarget.value as StoredAttachmentMimeType)
                  }
                >
                  {SUPPORTED_ASSET_TYPES[kind].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="backend-editor-field">
              <span>{kind === 'link' ? 'External URL' : 'Media URL'}</span>
              <input
                aria-label="New attachment URL"
                type="url"
                value={url}
                onChange={(event) => setUrl(event.currentTarget.value)}
              />
              {kind !== 'link' && (
                <span className="backend-editor-field-hint">
                  Enter a direct HTTPS URL to a {kind} file.
                </span>
              )}
            </label>
            <Button type="button" onClick={handleAddUrl}>
              Add {kind === 'link' ? 'external link' : `${kind} URL`}
            </Button>
          </>
        )}
        {error && (
          <p className="status-message status-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

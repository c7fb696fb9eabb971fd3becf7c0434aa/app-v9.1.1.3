import { createElement, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import type {
  CardRecord,
  PageRecord,
  RepositorySnapshotResponse,
  StoredAttachmentMimeType,
} from '@greendocs/contracts';
import { assetExtensionForMimeType } from '@greendocs/contracts/content-policy';
import { useAuth } from '../features/auth';
import { createGitHubRepositoryClient } from '../features/github';
import { Button } from '../components/Primitives';

interface PageNode extends PageRecord {
  children: PageNode[];
}

function buildPageTree(pages: readonly PageRecord[]): PageNode[] {
  const nodes = new Map(pages.map((page) => [page.id, { ...page, children: [] as PageNode[] }]));
  const roots: PageNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId) nodes.get(node.parentId)?.children.push(node);
    else roots.push(node);
  }
  const sort = (items: PageNode[]) => {
    items.sort((left, right) => left.order - right.order || left.slug.localeCompare(right.slug));
    items.forEach((item) => sort(item.children));
  };
  sort(roots);
  return roots;
}

function orderedCards(cards: readonly CardRecord[], pageId: string): CardRecord[] {
  return cards
    .filter((card) => card.pageId === pageId)
    .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
}

function mediaUrl(
  snapshot: RepositorySnapshotResponse,
  assetId: string,
  mimeType: StoredAttachmentMimeType,
): string {
  const extension = assetExtensionForMimeType(mimeType);
  if (!extension) throw new Error(`unsupported_asset_mime_type:${mimeType}`);
  const { owner, name, branch } = snapshot.repository;
  return `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/${branch
    .split('/')
    .map(encodeURIComponent)
    .join('/')}/content/media/${assetId}.${extension}`;
}

function CardView({ card, snapshot }: { card: CardRecord; snapshot: RepositorySnapshotResponse }) {
  return (
    <article className="published-card">
      <header className="published-card-header">
        <h3>{card.title}</h3>
        {card.tag && <span className="published-card-tag">{card.tag}</span>}
      </header>
      <p>{card.definition}</p>
      {card.keyRule && (
        <p>
          <strong>Key rule:</strong> {card.keyRule}
        </p>
      )}
      {card.code && <pre className="published-card-code">{card.code}</pre>}
      {card.spec && (
        <p>
          <strong>Specification:</strong> {card.spec}
        </p>
      )}
      {card.attachments.length > 0 && (
        <ul className="published-attachments">
          {card.attachments.map((attachment) => {
            if (attachment.kind === 'link') {
              return (
                <li key={attachment.id}>
                  <a href={attachment.url} target="_blank" rel="noreferrer">
                    {attachment.label}
                  </a>
                </li>
              );
            }
            const url = mediaUrl(snapshot, attachment.assetId, attachment.mimeType);
            return (
              <li key={attachment.id}>
                {attachment.kind === 'image' && (
                  <a href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={attachment.label} loading="lazy" />
                    <span>{attachment.label}</span>
                  </a>
                )}
                {attachment.kind === 'audio' && (
                  <div>
                    <p>{attachment.label}</p>
                    <audio controls preload="none" src={url} />
                  </div>
                )}
                {attachment.kind === 'video' && (
                  <div>
                    <p>{attachment.label}</p>
                    <video controls preload="none" src={url} />
                  </div>
                )}
                {attachment.kind === 'pdf' && (
                  <a href={url} target="_blank" rel="noreferrer">
                    {attachment.label} (PDF)
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

function PageView({
  page,
  cards,
  snapshot,
  level,
}: {
  page: PageNode;
  cards: readonly CardRecord[];
  snapshot: RepositorySnapshotResponse;
  level: number;
}) {
  const heading = createElement(
    `h${Math.min(level + 1, 6)}`,
    { id: `page-${page.id}` },
    page.title,
  );
  return (
    <section className="published-page" aria-labelledby={`page-${page.id}`}>
      {heading}
      {page.description && <p className="published-page-description">{page.description}</p>}
      <div className="published-card-list">
        {orderedCards(cards, page.id).map((card) => (
          <CardView key={card.id} card={card} snapshot={snapshot} />
        ))}
      </div>
      {page.children.map((child) => (
        <PageView key={child.id} page={child} cards={cards} snapshot={snapshot} level={level + 1} />
      ))}
    </section>
  );
}

function errorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : 'unknown_error';
  if (code === 'github_token_invalid' || code === 'authentication_required') {
    return 'Your GitHub sign-in expired. Sign in again to view the documentation.';
  }
  if (code === 'github_rate_limited') return 'GitHub is rate-limiting requests. Try again shortly.';
  if (code === 'github_permission_denied') {
    return 'This account can no longer read the configured repository.';
  }
  return `Could not load the documentation (${code}).`;
}

function HomeLocationTrail() {
  const viewport = useRef<HTMLDivElement>(null);
  const activeDrag = useRef<{ pointerId: number; startX: number; scrollLeft: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function startDrag(event: PointerEvent<HTMLDivElement>) {
    const element = event.currentTarget;
    if (
      event.pointerType !== 'mouse' ||
      event.button !== 0 ||
      element.scrollWidth <= element.clientWidth
    ) {
      return;
    }
    activeDrag.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: element.scrollLeft,
    };
    setIsDragging(true);
    element.setPointerCapture?.(event.pointerId);
  }

  function moveTrail(event: PointerEvent<HTMLDivElement>) {
    const drag = activeDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    event.currentTarget.scrollLeft = drag.scrollLeft - (event.clientX - drag.startX);
  }

  function stopDrag(event: PointerEvent<HTMLDivElement>) {
    if (activeDrag.current?.pointerId !== event.pointerId) return;
    activeDrag.current = null;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture?.(event.pointerId);
  }

  return (
    <nav className="home-location-bar" aria-label="Current location">
      <div
        ref={viewport}
        className={`home-location-track${isDragging ? 'is-dragging' : ''}`}
        tabIndex={0}
        onPointerDown={startDrag}
        onPointerMove={moveTrail}
        onPointerUp={stopDrag}
        onPointerCancel={stopDrag}
      >
        <ol>
          <li aria-current="page">
            <h1 id="home-title">Home</h1>
          </li>
        </ol>
      </div>
    </nav>
  );
}

export function HomePage() {
  const { githubRequest } = useAuth();
  const client = useMemo(() => createGitHubRepositoryClient(githubRequest), [githubRequest]);
  const [snapshot, setSnapshot] = useState<RepositorySnapshotResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    void client
      .readSnapshot()
      .then((result) => {
        if (active) setSnapshot(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(errorMessage(cause));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [client, reload]);

  const pageTree = useMemo(() => buildPageTree(snapshot?.pages ?? []), [snapshot]);
  return (
    <section className="documentation-home" aria-labelledby="home-title">
      <HomeLocationTrail />
      <div className="documentation-home-content">
        {loading && (
          <p className="status-message" role="status">
            Loading pages and cards from GitHub…
          </p>
        )}
        {error && (
          <div className="status-message status-error" role="alert">
            <p>{error}</p>
            <Button type="button" onClick={() => setReload((value) => value + 1)}>
              Try again
            </Button>
          </div>
        )}
        {!loading && !error && snapshot && (
          <div className="published-page-tree">
            {pageTree.map((page) => (
              <PageView
                key={page.id}
                page={page}
                cards={snapshot.cards}
                snapshot={snapshot}
                level={1}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

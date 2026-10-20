import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { type PageRecordV2, type RepositorySnapshotResponse } from '../lib/content';
import { useAuth } from '../features/auth';
import { createGitHubRepositoryClient } from '../features/github';
import { Button, CardConnector, CardPreview, CardSummary, CarouselControls } from '../components';
import { resolveRepositoryPagePreviews } from '../lib/content-resolution';
import { backendWorkspaceCopy, cardToolbarActions } from './backendWorkspaceConfig';

type RepositoryPageRecord = PageRecordV2;

type PageNode = RepositoryPageRecord & {
  children: PageNode[];
};

function buildPageTree(pages: readonly RepositoryPageRecord[]): PageNode[] {
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

function PageView({
  page,
  snapshot,
  level,
}: {
  page: PageNode;
  snapshot: RepositorySnapshotResponse;
  level: number;
}) {
  const [selectedCardIds, setSelectedCardIds] = useState<Record<string, string>>({});
  const activeCardIds = Object.fromEntries(
    Object.entries(selectedCardIds).filter(([containerId, cardId]) =>
      snapshot.cards.some((card) => card.containerId === containerId && card.id === cardId),
    ),
  );
  const previews = resolveRepositoryPagePreviews(snapshot, page.id, activeCardIds);
  const parentPage = page.parentId
    ? snapshot.pages.find((candidate) => candidate.id === page.parentId)
    : null;
  return (
    <section className="published-page" aria-labelledby={`page-${page.id}`}>
      <CardSummary
        title={page.title}
        titleIcon="promptContinue"
        category={parentPage?.title ?? 'Documentation'}
        interactive={false}
        titleLevel={Math.min(level + 1, 6)}
        titleId={`page-${page.id}`}
        className="published-record-summary"
        classNames={{
          title: 'published-record-summary-title',
          tag: 'published-record-summary-category',
        }}
      />
      {page.description && <p className="published-page-description">{page.description}</p>}
      {previews.length === 0 ? (
        <p className="published-card-empty">No card containers on this page.</p>
      ) : (
        previews.map((preview) => {
          const activeCard = preview.activeCard;
          const containerLabel = preview.container.title;
          return (
            <div
              key={preview.container.id}
              className="published-card-list"
              role="group"
              aria-label={`Cards for ${page.title}: ${preview.container.title}`}
            >
              <CardSummary
                title={preview.container.title}
                titleIcon="promptContinue"
                category={page.title}
                interactive={false}
                className="published-record-summary published-container-summary"
                classNames={{
                  title: 'published-record-summary-title',
                  tag: 'published-record-summary-category',
                }}
              />
              <CardConnector className="backend-card-editor-connector published-card-connector" />
              <CardPreview
                {...backendWorkspaceCopy.cardPreview}
                title={activeCard?.title ?? 'This container has no cards'}
                category={page.title}
                description={
                  activeCard?.definition ?? 'Add a card to this container to begin the preview.'
                }
                {...(activeCard?.keyRule !== undefined ? { keyRule: activeCard.keyRule } : {})}
                {...(activeCard?.code !== undefined ? { code: activeCard.code } : {})}
                {...(activeCard?.spec !== undefined ? { spec: activeCard.spec } : {})}
                attachments={activeCard?.attachments ?? []}
                repository={snapshot.repository}
                carousel={
                  <CarouselControls
                    items={preview.cards}
                    activeItemId={activeCard?.id ?? null}
                    onSelect={(cardId) =>
                      setSelectedCardIds((current) => ({
                        ...current,
                        [preview.container.id]: cardId,
                      }))
                    }
                    ariaLabel={`Card carousel for ${containerLabel}`}
                    previousLabel={`Previous card in ${containerLabel}`}
                    nextLabel={`Next card in ${containerLabel}`}
                    indicatorLabel={(card, index) =>
                      `Show card ${index + 1} in ${containerLabel}: ${card.title}`
                    }
                    className="backend-card-carousel"
                  />
                }
                actions={cardToolbarActions}
                classNames={{
                  root: 'published-card-preview',
                  content: 'backend-card-editor-content',
                  contentHeader: 'backend-card-editor-content-header',
                  contentTitle: 'backend-card-editor-content-title',
                  toolbar: 'backend-card-editor-toolbar',
                  toolbarTrack: 'backend-card-editor-toolbar-track',
                  toolbarItem: 'backend-card-editor-tool',
                  notes: 'backend-card-editor-input',
                }}
              />
            </div>
          );
        })
      )}
      {page.children.map((child) => (
        <PageView key={child.id} page={child} snapshot={snapshot} level={level + 1} />
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
              <PageView key={page.id} page={page} snapshot={snapshot} level={1} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

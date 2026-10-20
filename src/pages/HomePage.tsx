import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  assetExtensionForMimeType,
  type Attachment,
  type CardContainerRecordV2,
  type CardRecordV2,
  type PageRecordV2,
  type RepositorySnapshotResponse,
} from '../lib/content';
import { useAuth } from '../features/auth';
import { createGitHubRepositoryClient } from '../features/github';
import { Button } from '../components/Primitives';
import { Icon, type IconName } from '../components/Icon';

type PageBreadcrumb = {
  title: string;
  path: string;
};

type PublishedContainer = {
  record: CardContainerRecordV2;
  cards: CardRecordV2[];
};

const PUBLIC_CARD_TOOL_ICONS: readonly IconName[] = [
  'cardPreview',
  'cardFiles',
  'cardVideo',
  'cardLayout',
  'cardTerminal',
  'cardWorkflow',
  'cardBookmark',
  'cardDuplicate',
  'cardShare',
  'cardCode',
  'cardPrint',
  'cardSettings',
  'publish',
  'verified',
  'attachPdf',
];

function getPagePath(page: PageRecordV2, pages: readonly PageRecordV2[]): string {
  const segments = [page.slug];
  let current = page;
  while (current.parentId) {
    const parent = pages.find((candidate) => candidate.id === current.parentId);
    if (!parent) throw new Error('page_parent_missing');
    segments.unshift(parent.slug);
    current = parent;
  }
  return `/home/${segments.map(encodeURIComponent).join('/')}`;
}

function resolvePublicRoute(
  pathname: string,
  snapshot: RepositorySnapshotResponse,
): { page: PageRecordV2 | null; breadcrumbs: PageBreadcrumb[] } {
  let segments: string[];
  try {
    segments = pathname
      .replace(/^\/home\/?/, '')
      .split('/')
      .filter(Boolean)
      .map((segment) => decodeURIComponent(segment));
  } catch {
    return { page: null, breadcrumbs: [] };
  }
  if (segments.length === 0) return { page: null, breadcrumbs: [] };

  let parentId: string | null = null;
  const matchedPages: PageRecordV2[] = [];
  for (const segment of segments) {
    const nextPage = snapshot.pages.find(
      (candidate) => candidate.parentId === parentId && candidate.slug === segment,
    );
    if (!nextPage) break;
    matchedPages.push(nextPage);
    parentId = nextPage.id;
  }
  const breadcrumbs = matchedPages.map((page) => ({
    title: page.title,
    path: getPagePath(page, snapshot.pages),
  }));

  if (matchedPages.length === segments.length) {
    return { page: matchedPages.at(-1) ?? null, breadcrumbs };
  }
  return { page: null, breadcrumbs: [] };
}

function cardsForPage(
  page: PageRecordV2,
  snapshot: RepositorySnapshotResponse,
): PublishedContainer[] {
  return snapshot.containers
    .filter((container) => container.pageId === page.id)
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    .map((container) => ({
      record: container,
      cards: snapshot.cards
        .filter((card) => card.containerId === container.id)
        .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id)),
    }));
}

function childPagesForPage(
  page: PageRecordV2,
  snapshot: RepositorySnapshotResponse,
): PageRecordV2[] {
  return snapshot.pages
    .filter((candidate) => candidate.parentId === page.id)
    .sort((left, right) => left.order - right.order || left.slug.localeCompare(right.slug));
}

function PublishedAttachments({
  attachments,
  repository,
}: {
  attachments: readonly Attachment[];
  repository: RepositorySnapshotResponse['repository'];
}) {
  if (attachments.length === 0) return null;
  return (
    <ul className="public-card-attachments">
      {attachments.map((attachment) => {
        const source =
          'url' in attachment
            ? attachment.url
            : `https://raw.githubusercontent.com/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.name)}/${repository.branch
                .split('/')
                .map(encodeURIComponent)
                .join(
                  '/',
                )}/content/media/${attachment.assetId}.${assetExtensionForMimeType(attachment.mimeType)}`;
        if (attachment.kind === 'image') {
          return (
            <li key={attachment.id}>
              <a href={source} target="_blank" rel="noreferrer">
                <img src={source} alt={attachment.label} loading="lazy" />
                <span>{attachment.label}</span>
              </a>
            </li>
          );
        }
        if (attachment.kind === 'audio' || attachment.kind === 'video') {
          const Player = attachment.kind;
          return (
            <li key={attachment.id}>
              <p>{attachment.label}</p>
              <Player controls preload="none">
                <source src={source} type={attachment.mimeType} />
              </Player>
            </li>
          );
        }
        return (
          <li key={attachment.id}>
            <a href={source} target="_blank" rel="noreferrer">
              {attachment.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function PublishedCard({
  card,
  snapshot,
}: {
  card: CardRecordV2;
  snapshot: RepositorySnapshotResponse;
}) {
  return (
    <article className="public-card">
      <header className="public-card-content">
        <div className="public-card-heading">
          <Icon name="promptContinue" size={14} />
          <h2>{card.title}</h2>
        </div>
        <div className="public-card-body">
          <p>{card.definition}</p>
          {card.keyRule && (
            <section className="public-card-key-rule">
              <h3>Key rule</h3>
              <p>{card.keyRule}</p>
            </section>
          )}
          {card.code && <pre className="public-card-code">{card.code}</pre>}
          {card.spec && (
            <p>
              <strong>Specification:</strong> {card.spec}
            </p>
          )}
          <PublishedAttachments attachments={card.attachments} repository={snapshot.repository} />
        </div>
      </header>
      <div className="public-card-toolbar" aria-hidden="true">
        {PUBLIC_CARD_TOOL_ICONS.map((name) => (
          <span className="public-card-tool" key={name}>
            <Icon name={name} size={18} />
          </span>
        ))}
      </div>
      <div className="public-card-notes" aria-hidden="true">
        <Icon name="promptContinue" size={14} />
        <span>Type notes or commands on a straight line...</span>
      </div>
    </article>
  );
}

function PageLink({ page, pages }: { page: PageRecordV2; pages: readonly PageRecordV2[] }) {
  return (
    <Link className="public-page-link" to={getPagePath(page, pages)}>
      <span className="public-page-link-heading">
        <Icon name="promptContinue" size={14} />
        <strong>{page.title}</strong>
      </span>
    </Link>
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

function LocationBreadcrumbs({ breadcrumbs }: { breadcrumbs: readonly PageBreadcrumb[] }) {
  return (
    <nav className="home-location-bar" aria-label="Current location">
      <ol className="home-location-track">
        <li>
          <Link to="/home">Home</Link>
        </li>
        {breadcrumbs.map((item, index) => (
          <li key={item.path} aria-current={index === breadcrumbs.length - 1 ? 'page' : undefined}>
            {index === breadcrumbs.length - 1 ? (
              <span>{item.title}</span>
            ) : (
              <Link to={item.path}>{item.title}</Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function HomePage() {
  const { githubRequest } = useAuth();
  const { pathname } = useLocation();
  const normalizedPathname = pathname.replace(/\/+$/, '') || '/home';
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

  const rootPages = useMemo(
    () =>
      (snapshot?.pages ?? [])
        .filter((page) => page.parentId === null)
        .sort((left, right) => left.order - right.order || left.slug.localeCompare(right.slug)),
    [snapshot],
  );
  const route = useMemo(
    () => (snapshot ? resolvePublicRoute(normalizedPathname, snapshot) : null),
    [normalizedPathname, snapshot],
  );
  const selectedPage = route?.page ?? null;
  const containers = selectedPage && snapshot ? cardsForPage(selectedPage, snapshot) : [];
  const childPages = selectedPage && snapshot ? childPagesForPage(selectedPage, snapshot) : [];
  const invalidRoute = Boolean(snapshot && normalizedPathname !== '/home' && !selectedPage);

  return (
    <section className="documentation-home" aria-label="Documentation">
      <LocationBreadcrumbs breadcrumbs={route?.breadcrumbs ?? []} />
      <div className="documentation-home-content">
        {error && (
          <div className="status-message status-error" role="alert">
            <p>{error}</p>
            <Button type="button" onClick={() => setReload((value) => value + 1)}>
              Try again
            </Button>
          </div>
        )}
        {!loading && !error && snapshot && normalizedPathname === '/home' && (
          <div className="public-page-index" aria-label="Documentation pages">
            {rootPages.map((page) => (
              <PageLink key={page.id} page={page} pages={snapshot.pages} />
            ))}
          </div>
        )}
        {!loading && !error && snapshot && selectedPage && !invalidRoute && (
          <article className="public-page" aria-label={selectedPage.title}>
            {childPages.length > 0 && (
              <nav className="public-page-index" aria-label={`Pages under ${selectedPage.title}`}>
                {childPages.map((page) => (
                  <PageLink key={page.id} page={page} pages={snapshot.pages} />
                ))}
              </nav>
            )}
            {containers.map(({ record, cards }) => (
              <section
                className="public-container"
                key={record.id}
                aria-label={`Cards on ${selectedPage.title}`}
              >
                {cards.length === 0 ? (
                  <p className="public-card-empty">No cards in this container yet.</p>
                ) : (
                  cards.map((card) => (
                    <PublishedCard key={card.id} card={card} snapshot={snapshot} />
                  ))
                )}
              </section>
            ))}
          </article>
        )}
        {!loading && !error && snapshot && invalidRoute && (
          <div className="public-not-found" role="status">
            <h1>Page not found</h1>
            <p>This documentation page does not exist.</p>
            <Link to="/home">Browse documentation</Link>
          </div>
        )}
      </div>
    </section>
  );
}

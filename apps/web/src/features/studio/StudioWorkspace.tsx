import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type {
  Attachment,
  CardRecord,
  PageRecord,
  PublishResponse,
  RepositorySnapshotResponse,
  StoredAttachment,
} from '@greendocs/contracts';
import { CONTENT_LIMITS } from '@greendocs/contracts/content-policy';
import { useAuth } from '../auth';
import { createGitHubRepositoryClient } from '../github';
import { Button, Dialog, EmptyState, TextInput } from '../../components/Primitives';
import {
  attachmentAssetKey,
  attachmentType,
  buildPageTree,
  buildPublishRequest,
  cardRecordFromDraft,
  cleanupUnusedAssets,
  collectDescendantIds,
  countMutationKinds,
  createCardDraft,
  createPageDraft,
  fileBytesToBase64,
  filterPageTree,
  normalizeSlug,
  pageRecordFromDraft,
  validateDraft,
  type AssetMutation,
  type CardDraft,
  type PageDraft,
  type PageNode,
} from './model';

function mutationCandidates(mutations: readonly AssetMutation[]): Set<string> {
  return new Set(mutations.map((mutation) => `${mutation.id}:${mutation.mimeType}`));
}

function friendlyError(error: unknown): string {
  const code = error instanceof Error ? error.message : 'unknown_error';
  const messages: Record<string, string> = {
    authentication_required: 'Sign in with GitHub to continue.',
    github_unavailable: 'GitHub could not be reached. Your draft remains in this browser.',
    repository_head_changed:
      'The repository changed after this draft was loaded. Your draft is preserved; reload the repository and reconcile before publishing.',
    github_token_invalid: 'GitHub rejected the token. Sign in again.',
    github_rate_limited: 'GitHub is rate-limiting requests. Wait before trying again.',
    github_permission_denied: 'The connected GitHub account cannot access this repository.',
    invalid_content_relationships: 'The draft has invalid page, card, or asset references.',
    invalid_mutation_count: 'This publish batch contains an unsupported number of changes.',
  };
  return messages[code] ?? `The request failed (${code}). Your unsaved draft has been preserved.`;
}

function asPageDraft(page: PageRecord): PageDraft {
  return {
    id: page.id,
    title: page.title,
    slug: page.slug,
    parentId: page.parentId ?? '',
    description: page.description ?? '',
  };
}

function asCardDraft(card: CardRecord): CardDraft {
  return {
    id: card.id,
    pageId: card.pageId,
    title: card.title,
    tag: card.tag ?? '',
    definition: card.definition,
    keyRule: card.keyRule ?? '',
    code: card.code ?? '',
    spec: card.spec ?? '',
    attachments: [...card.attachments],
  };
}

function attachmentCandidates(cards: readonly CardRecord[]): Set<string> {
  return new Set(
    cards.flatMap((card) =>
      card.attachments.flatMap((attachment) =>
        attachment.kind === 'link' ? [] : [attachmentAssetKey(attachment)],
      ),
    ),
  );
}

function attachmentUrl(
  attachment: StoredAttachment,
  snapshot: RepositorySnapshotResponse,
  mutations: readonly AssetMutation[],
): string {
  const staged = mutations.find(
    (mutation) =>
      mutation.type === 'upsert-asset' &&
      mutation.id === attachment.assetId &&
      mutation.mimeType === attachment.mimeType,
  );
  if (staged?.type === 'upsert-asset') {
    return `data:${attachment.mimeType};base64,${staged.bytes}`;
  }
  const extension =
    attachment.mimeType === 'image/jpeg' ? 'jpg' : attachment.mimeType.split('/')[1];
  const branchPath = snapshot.repository.branch.split('/').map(encodeURIComponent).join('/');
  return `https://raw.githubusercontent.com/${encodeURIComponent(snapshot.repository.owner)}/${encodeURIComponent(snapshot.repository.name)}/${branchPath}/content/media/${attachment.assetId}.${extension}`;
}

function AttachmentPreview({
  attachment,
  snapshot,
  mutations,
}: {
  attachment: Attachment;
  snapshot: RepositorySnapshotResponse;
  mutations: readonly AssetMutation[];
}) {
  if (attachment.kind === 'link') {
    return (
      <a href={attachment.url} target="_blank" rel="noreferrer">
        {attachment.label}
      </a>
    );
  }
  const src = attachmentUrl(attachment, snapshot, mutations);
  if (attachment.kind === 'image') {
    return <img className="studio-preview-image" src={src} alt={attachment.label} loading="lazy" />;
  }
  if (attachment.kind === 'audio') {
    return (
      <audio controls preload="none" src={src}>
        {attachment.label}
      </audio>
    );
  }
  if (attachment.kind === 'video') {
    return (
      <video controls preload="none" src={src}>
        {attachment.label}
      </video>
    );
  }
  return (
    <a href={src} target="_blank" rel="noreferrer">
      {attachment.label} (PDF)
    </a>
  );
}

function PageTree({
  nodes,
  cards,
  level,
  selectedId,
  selectedCardId,
  onSelect,
  onEdit,
  onAddChild,
  onMove,
  onDelete,
  onSelectCard,
  onEditCard,
  onMoveCard,
  onDeleteCard,
  collapsedIds,
  onToggle,
  forceExpanded,
}: {
  nodes: PageNode[];
  cards: readonly CardRecord[];
  level?: number;
  selectedId: string | null;
  selectedCardId: string | null;
  onSelect: (page: PageNode) => void;
  onEdit: (page: PageNode) => void;
  onAddChild: (page: PageNode) => void;
  onMove: (page: PageNode, direction: -1 | 1) => void;
  onDelete: (page: PageNode) => void;
  onSelectCard: (card: CardRecord) => void;
  onEditCard: (card: CardRecord) => void;
  onMoveCard: (card: CardRecord, direction: -1 | 1) => void;
  onDeleteCard: (card: CardRecord) => void;
  collapsedIds: ReadonlySet<string>;
  onToggle: (pageId: string) => void;
  forceExpanded: boolean;
}) {
  if (nodes.length === 0) {
    return <p className="studio-muted">No pages yet. Create a root page to begin.</p>;
  }
  return (
    <ul className="studio-tree-list" role={level === 1 || level === undefined ? 'tree' : 'group'}>
      {nodes.map((page) => (
        <li key={page.id} role="none">
          <div className={`studio-tree-item${selectedId === page.id ? 'is-selected' : ''}`}>
            <button
              className="studio-tree-select"
              type="button"
              role="treeitem"
              aria-level={level ?? 1}
              aria-selected={selectedId === page.id}
              aria-expanded={page.children.length ? !collapsedIds.has(page.id) : undefined}
              aria-label={`Select page ${page.title}`}
              onClick={() => onSelect(page)}
            >
              <span>{page.title}</span>
              <small>/{page.slug}</small>
            </button>
            <div className="studio-tree-actions">
              {page.children.length > 0 && (
                <button
                  type="button"
                  aria-label={`${collapsedIds.has(page.id) ? 'Expand' : 'Collapse'} ${page.title}`}
                  onClick={() => onToggle(page.id)}
                >
                  {collapsedIds.has(page.id) ? 'Expand' : 'Collapse'}
                </button>
              )}
              <button
                type="button"
                aria-label={`Edit page ${page.title}`}
                onClick={() => onEdit(page)}
              >
                Edit
              </button>
              <button
                type="button"
                aria-label={`Add sub-page to ${page.title}`}
                onClick={() => onAddChild(page)}
              >
                + Child
              </button>
              <button
                type="button"
                aria-label={`Move ${page.title} up`}
                onClick={() => onMove(page, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={`Move ${page.title} down`}
                onClick={() => onMove(page, 1)}
              >
                ↓
              </button>
              <button
                className="studio-danger-link"
                type="button"
                aria-label={`Delete page ${page.title}`}
                onClick={() => onDelete(page)}
              >
                Delete
              </button>
            </div>
          </div>
          <ul className="studio-explorer-cards" aria-label={`${page.title} cards`}>
            {cards
              .filter((card) => card.pageId === page.id)
              .sort(
                (left, right) => left.order - right.order || left.title.localeCompare(right.title),
              )
              .map((card) => (
                <li
                  className={`studio-explorer-card${selectedCardId === card.id ? 'is-selected' : ''}`}
                  key={card.id}
                >
                  <button type="button" onClick={() => onSelectCard(card)}>
                    <span>{card.title}</span>
                    {card.tag && <small>{card.tag}</small>}
                  </button>
                  <div className="studio-tree-actions">
                    <button
                      type="button"
                      aria-label={`Edit card ${card.title}`}
                      onClick={() => onEditCard(card)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      aria-label={`Move card ${card.title} up`}
                      onClick={() => onMoveCard(card, -1)}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      aria-label={`Move card ${card.title} down`}
                      onClick={() => onMoveCard(card, 1)}
                    >
                      ↓
                    </button>
                    <button
                      className="studio-danger-link"
                      type="button"
                      aria-label={`Delete card ${card.title}`}
                      onClick={() => onDeleteCard(card)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
          </ul>
          {page.children.length > 0 && (forceExpanded || !collapsedIds.has(page.id)) && (
            <div className="studio-tree-children">
              <PageTree
                nodes={page.children}
                cards={cards}
                level={(level ?? 1) + 1}
                selectedId={selectedId}
                selectedCardId={selectedCardId}
                onSelect={onSelect}
                onEdit={onEdit}
                onAddChild={onAddChild}
                onMove={onMove}
                onDelete={onDelete}
                onSelectCard={onSelectCard}
                onEditCard={onEditCard}
                onMoveCard={onMoveCard}
                onDeleteCard={onDeleteCard}
                collapsedIds={collapsedIds}
                onToggle={onToggle}
                forceExpanded={forceExpanded}
              />
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export function StudioWorkspace() {
  const { githubRequest, user } = useAuth();
  const [baseSnapshot, setBaseSnapshot] = useState<RepositorySnapshotResponse | null>(null);
  const [pages, setPages] = useState<PageRecord[]>([]);
  const [cards, setCards] = useState<CardRecord[]>([]);
  const [assetMutations, setAssetMutations] = useState<AssetMutation[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [pageSearch, setPageSearch] = useState('');
  const [collapsedPageIds, setCollapsedPageIds] = useState<Set<string>>(() => new Set());
  const [pageForm, setPageForm] = useState<PageDraft | null>(null);
  const [cardForm, setCardForm] = useState<CardDraft | null>(null);
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [hierarchyOpen, setHierarchyOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [syncTesting, setSyncTesting] = useState(false);
  const [syncTestResult, setSyncTestResult] = useState<string | null>(null);
  const [syncTestError, setSyncTestError] = useState(false);
  const [deletePage, setDeletePage] = useState<PageNode | null>(null);
  const [deleteCard, setDeleteCard] = useState<CardRecord | null>(null);
  const [commitMessage, setCommitMessage] = useState('Update GreenDocs content');
  const [pendingDeleteMessage, setPendingDeleteMessage] = useState('');
  const [lastCommit, setLastCommit] = useState<PublishResponse | null>(null);
  const repositoryClient = useMemo(
    () => createGitHubRepositoryClient(githubRequest),
    [githubRequest],
  );

  const refreshSnapshot = useCallback(async () => {
    return repositoryClient.readSnapshot();
  }, [repositoryClient]);

  const loadSnapshot = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const snapshot = await refreshSnapshot();
      setBaseSnapshot(snapshot);
      setPages(snapshot.pages);
      setCards(snapshot.cards);
      setAssetMutations([]);
      setSelectedPageId((current) =>
        current && snapshot.pages.some((page) => page.id === current)
          ? current
          : (snapshot.pages[0]?.id ?? null),
      );
      setSelectedCardId(null);
      setPageForm(null);
      setCardForm(null);
      setNotice(null);
    } catch (cause) {
      setError(friendlyError(cause));
    } finally {
      setLoading(false);
    }
  }, [refreshSnapshot]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  const pageTree = useMemo(() => buildPageTree(pages), [pages]);
  const visiblePageTree = useMemo(
    () => filterPageTree(pageTree, pageSearch),
    [pageSearch, pageTree],
  );
  const selectedPage = pages.find((page) => page.id === selectedPageId) ?? null;
  const pageCards = cards
    .filter((card) => card.pageId === selectedPageId)
    .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
  const request = useMemo(
    () => (baseSnapshot ? buildPublishRequest(baseSnapshot, pages, cards, assetMutations) : null),
    [assetMutations, baseSnapshot, cards, pages],
  );
  const draftIssues = useMemo(
    () =>
      baseSnapshot ? validateDraft(pages, cards, baseSnapshot.assetPaths, assetMutations) : [],
    [assetMutations, baseSnapshot, cards, pages],
  );

  function editorIsClosed(): boolean {
    if (pageForm || cardForm) {
      setError('Save or cancel the open editor before switching to another record.');
      return false;
    }
    return true;
  }

  function choosePage(page: PageRecord) {
    if (!editorIsClosed()) return;
    setSelectedPageId(page.id);
    setSelectedCardId(null);
    setPageForm(null);
    setCardForm(null);
  }

  function chooseCard(card: CardRecord) {
    if (!editorIsClosed()) return;
    setSelectedPageId(card.pageId);
    setSelectedCardId(card.id);
    setPageForm(null);
    setCardForm(null);
  }

  function editPage(page: PageRecord) {
    if (!editorIsClosed()) return;
    setSelectedPageId(page.id);
    setSelectedCardId(null);
    setCardForm(null);
    setPageForm(asPageDraft(page));
  }

  function startNewPage(parentId = '') {
    if (!editorIsClosed()) return;
    if (parentId) {
      setCollapsedPageIds((current) => {
        const next = new Set(current);
        next.delete(parentId);
        return next;
      });
    }
    setSelectedPageId(parentId || null);
    setSelectedCardId(null);
    setCardForm(null);
    setPageForm(createPageDraft(parentId));
  }

  function applyPageForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pageForm) return;
    const record = pageRecordFromDraft(
      {
        ...pageForm,
        title: pageForm.title.trim(),
        slug: pageForm.slug.trim() || normalizeSlug(pageForm.title),
      },
      pages,
    );
    const parent = pages.find((page) => page.id === record.parentId);
    if (record.parentId && !parent) {
      setError('Choose an existing parent page.');
      return;
    }
    if (record.parentId && collectDescendantIds(record.id, pages).has(record.parentId)) {
      setError('A page cannot be moved beneath itself or one of its descendants.');
      return;
    }
    if (
      pages.some(
        (page) =>
          page.id !== record.id && page.parentId === record.parentId && page.slug === record.slug,
      )
    ) {
      setError(`A sibling page already uses the slug "${record.slug}".`);
      return;
    }
    if (!record.title || !record.slug) {
      setError('Page title and slug are required.');
      return;
    }
    setPages((current) => {
      const index = current.findIndex((page) => page.id === record.id);
      if (index < 0) return [...current, record];
      return current.map((page) => (page.id === record.id ? record : page));
    });
    setSelectedPageId(record.id);
    setPageForm(null);
    setError(null);
    setNotice(`Page "${record.title}" is saved in this draft. It is not published yet.`);
  }

  function startNewCard() {
    if (!editorIsClosed()) return;
    if (!selectedPageId) return;
    setSelectedCardId(null);
    setPageForm(null);
    setCardForm(createCardDraft(selectedPageId));
  }

  function editCard(card: CardRecord) {
    if (!editorIsClosed()) return;
    setSelectedPageId(card.pageId);
    setSelectedCardId(card.id);
    setPageForm(null);
    setCardForm(asCardDraft(card));
  }

  function updateCardForm(update: (current: CardDraft) => CardDraft) {
    setCardForm((current) => (current ? update(current) : current));
  }

  function applyCardForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cardForm) return;
    const record = cardRecordFromDraft(cardForm, cards);
    if (!pages.some((page) => page.id === record.pageId)) {
      setError('Choose an existing page for the card.');
      return;
    }
    if (!record.title || !record.definition) {
      setError('Card title and definition are required.');
      return;
    }
    setCards((current) => {
      const index = current.findIndex((card) => card.id === record.id);
      if (index < 0) return [...current, record];
      return current.map((card) => (card.id === record.id ? record : card));
    });
    setSelectedPageId(record.pageId);
    setSelectedCardId(record.id);
    setCardForm(null);
    setError(null);
    setNotice(`Card "${record.title}" is saved in this draft. It is not published yet.`);
  }

  function removePage(page: PageNode) {
    const removedPageIds = collectDescendantIds(page.id, pages);
    const removedCards = cards.filter((card) => removedPageIds.has(card.pageId));
    const candidates = attachmentCandidates(removedCards);
    const nextPages = pages.filter((record) => !removedPageIds.has(record.id));
    const nextCards = cards.filter((card) => !removedPageIds.has(card.pageId));
    setPages(nextPages);
    setCards(nextCards);
    setAssetMutations((current) =>
      cleanupUnusedAssets(candidates, nextCards, baseSnapshot?.assetPaths ?? [], current),
    );
    setSelectedPageId(nextPages[0]?.id ?? null);
    setSelectedCardId(null);
    setPageForm(null);
    setCardForm(null);
    setDeletePage(null);
    setNotice(
      `Draft deletion includes ${removedPageIds.size} page${removedPageIds.size === 1 ? '' : 's'} and ${removedCards.length} card${removedCards.length === 1 ? '' : 's'}.`,
    );
  }

  function requestPageDeletion(page: PageNode) {
    if (!editorIsClosed()) return;
    setDeletePage(page);
  }

  function movePage(page: PageRecord, direction: -1 | 1) {
    const siblings = pages
      .filter((item) => item.parentId === page.parentId)
      .sort((left, right) => left.order - right.order || left.slug.localeCompare(right.slug));
    const index = siblings.findIndex((item) => item.id === page.id);
    const adjacent = siblings[index + direction];
    if (!adjacent) return;
    const ordered = [...siblings];
    [ordered[index], ordered[index + direction]] = [ordered[index + direction]!, ordered[index]!];
    const orderById = new Map(ordered.map((item, itemIndex) => [item.id, itemIndex * 10]));
    setPages((current) =>
      current.map((item) =>
        orderById.has(item.id) ? { ...item, order: orderById.get(item.id)! } : item,
      ),
    );
  }

  function moveCard(card: CardRecord, direction: -1 | 1) {
    const siblings = cards
      .filter((item) => item.pageId === card.pageId)
      .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title));
    const index = siblings.findIndex((item) => item.id === card.id);
    const adjacent = siblings[index + direction];
    if (!adjacent) return;
    [siblings[index], siblings[index + direction]] = [
      siblings[index + direction]!,
      siblings[index]!,
    ];
    const orderById = new Map(siblings.map((item, itemIndex) => [item.id, itemIndex * 10]));
    setCards((current) =>
      current.map((item) =>
        orderById.has(item.id) ? { ...item, order: orderById.get(item.id)! } : item,
      ),
    );
  }

  function moveAttachment(index: number, direction: -1 | 1) {
    updateCardForm((current) => {
      const next = [...current.attachments];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return { ...current, attachments: next };
    });
  }

  function removeCard(card: CardRecord) {
    const candidates = attachmentCandidates([card]);
    const nextCards = cards.filter((item) => item.id !== card.id);
    setCards(nextCards);
    setAssetMutations((current) =>
      cleanupUnusedAssets(candidates, nextCards, baseSnapshot?.assetPaths ?? [], current),
    );
    if (selectedCardId === card.id) setSelectedCardId(null);
    if (cardForm?.id === card.id) setCardForm(null);
    setDeleteCard(null);
    setNotice(`Card "${card.title}" is marked for deletion in this draft.`);
  }

  function stageAttachmentRemoval(attachment: Attachment) {
    if (attachment.kind === 'link') return;
    const remainingAttachments =
      cardForm?.attachments.filter((item) => item.id !== attachment.id) ?? [];
    const nextCards = cards.map((card) =>
      card.id === cardForm?.id ? { ...card, attachments: remainingAttachments } : card,
    );
    const candidates = new Set([attachmentAssetKey(attachment)]);
    setAssetMutations((current) =>
      cleanupUnusedAssets(candidates, nextCards, baseSnapshot?.assetPaths ?? [], current),
    );
    updateCardForm((current) => ({
      ...current,
      attachments: current.attachments.filter((item) => item.id !== attachment.id),
    }));
  }

  async function addAssetFile(file: File | undefined) {
    if (!file || !cardForm) return;
    if (cardForm.attachments.length >= CONTENT_LIMITS.attachmentsPerCard) {
      setError(`Cards can have at most ${CONTENT_LIMITS.attachmentsPerCard} attachments.`);
      return;
    }
    const attachmentInfo = attachmentType(file.type);
    if (!attachmentInfo) {
      setError('Choose a supported image, audio, video, or PDF file.');
      return;
    }
    if (file.size <= 0 || file.size > CONTENT_LIMITS.assetBytes) {
      setError('Attachments must be between 1 byte and 10 MiB.');
      return;
    }
    try {
      const id = crypto.randomUUID();
      const attachment: StoredAttachment = {
        id: crypto.randomUUID(),
        kind: attachmentInfo.kind,
        label: file.name.slice(0, 160),
        assetId: id,
        mimeType: attachmentInfo.mimeType,
        sizeBytes: file.size,
      };
      const bytes = fileBytesToBase64(new Uint8Array(await file.arrayBuffer()));
      const mutation: AssetMutation = {
        type: 'upsert-asset',
        id,
        mimeType: attachmentInfo.mimeType,
        bytes,
      };
      setAssetMutations((current) => [...current, mutation]);
      updateCardForm((current) => ({
        ...current,
        attachments: [...current.attachments, attachment],
      }));
      setError(null);
    } catch {
      setError('The selected file could not be read. Choose it again.');
    }
  }

  function removeDraftCard() {
    if (!cardForm) return;
    const stagedRecord = cardRecordFromDraft(cardForm, cards);
    const candidates = attachmentCandidates([stagedRecord]);
    const nextCards = cards.filter((card) => card.id !== cardForm.id);
    setAssetMutations((current) =>
      cleanupUnusedAssets(candidates, nextCards, baseSnapshot?.assetPaths ?? [], current),
    );
    setCardForm(null);
    setSelectedCardId(null);
    setCollapsedPageIds(new Set());
  }

  function cancelCardForm() {
    if (!cardForm) return;
    if (baseSnapshot?.cards.some((card) => card.id === cardForm.id)) {
      const candidates = mutationCandidates(assetMutations);
      setAssetMutations((current) =>
        cleanupUnusedAssets(candidates, cards, baseSnapshot?.assetPaths ?? [], current),
      );
      setCardForm(null);
      return;
    }
    removeDraftCard();
  }

  async function publishChanges(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!baseSnapshot || !request || saving) return;
    if (!commitMessage.trim() || commitMessage.trim().length > 200) {
      setError('Commit message must contain 1–200 characters.');
      return;
    }
    if (draftIssues.length) {
      setError('Resolve the validation issues before publishing.');
      return;
    }
    const body = { ...request, message: commitMessage.trim() };
    setSaving(true);
    setError(null);
    try {
      const committed = await repositoryClient.publish(body);
      setLastCommit(committed);
      setReviewOpen(false);
      setNotice(
        `Commit ${committed.commitSha} was created. Deployment status is not yet confirmed.`,
      );
      try {
        const fresh = await refreshSnapshot();
        setBaseSnapshot(fresh);
        setPages(fresh.pages);
        setCards(fresh.cards);
        setAssetMutations([]);
        setSelectedPageId(fresh.pages[0]?.id ?? null);
        setSelectedCardId(null);
        setPageForm(null);
        setCardForm(null);
        setNotice(
          `Repository reloaded at commit ${fresh.sourceCommit}. Deployment is not yet confirmed.`,
        );
      } catch {
        setError(
          'The commit succeeded, but the repository reload failed. Use Reload repository before making another change.',
        );
      }
    } catch (cause) {
      setError(friendlyError(cause));
    } finally {
      setSaving(false);
    }
  }

  function openReview() {
    if (pageForm || cardForm) {
      setError('Save or cancel the open editor before reviewing repository changes.');
      return;
    }
    if (draftIssues.length) {
      setError(
        `Resolve ${draftIssues.length} validation issue${draftIssues.length === 1 ? '' : 's'} first.`,
      );
      return;
    }
    setError(null);
    setReviewOpen(true);
  }

  function reloadRepository() {
    const hasDraft = !!request || !!pageForm || !!cardForm;
    if (hasDraft) {
      setPendingDeleteMessage('Reloading replaces all unsaved page, card, and asset changes.');
      return;
    }
    void loadSnapshot();
  }

  function confirmReload() {
    setPendingDeleteMessage('');
    setDeletePage(null);
    setReviewOpen(false);
    setNotice(null);
    void loadSnapshot();
  }

  async function testRepositoryConnection() {
    if (syncTesting) return;
    setSyncTesting(true);
    setSyncTestResult(null);
    setSyncTestError(false);
    try {
      const snapshot = await refreshSnapshot();
      setSyncTestResult(`Connected. Repository content is readable at ${snapshot.sourceCommit}.`);
    } catch (cause) {
      setSyncTestResult(friendlyError(cause));
      setSyncTestError(true);
    } finally {
      setSyncTesting(false);
    }
  }

  const currentPageDraft = pageForm
    ? pageRecordFromDraft(
        { ...pageForm, slug: pageForm.slug || normalizeSlug(pageForm.title) },
        pages,
      )
    : null;
  const reviewCounts = request ? countMutationKinds(request.mutations) : [];
  const deletePageIds = deletePage ? collectDescendantIds(deletePage.id, pages) : new Set<string>();
  const deletePageCards = cards.filter((card) => deletePageIds.has(card.pageId));
  const deleteAssetCount = attachmentCandidates(deletePageCards).size;

  return (
    <section className="studio-workspace" aria-labelledby="studio-title">
      <header className="studio-management-header">
        <Link className="studio-home-link" to="/home">
          Go to /home
        </Link>
        <h1 id="studio-title">GUI Management Portal</h1>
        <nav className="studio-management-actions" aria-label="Studio tools">
          <Button
            type="button"
            onClick={() => setHierarchyOpen(true)}
            disabled={loading || !baseSnapshot}
          >
            Hierarchy Explorer
          </Button>
          <Button
            type="button"
            onClick={() => {
              setSyncTestResult(null);
              setSyncOpen(true);
            }}
            disabled={loading || !baseSnapshot}
          >
            GitHub Sync
          </Button>
          <Link className="action-button action-button-secondary" to="/studio/deployments">
            Deployments
          </Link>
        </nav>
      </header>

      <header className="studio-heading">
        <div>
          <p className="studio-eyebrow">Content workspace</p>
          <p className="studio-muted">
            Signed in as {user?.login}. Drafts stay in memory until you publish.
          </p>
        </div>
        <div className="studio-heading-actions">
          <Button type="button" onClick={reloadRepository} disabled={loading || saving}>
            Reload repository
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={openReview}
            disabled={
              !request || loading || saving || draftIssues.length > 0 || !!pageForm || !!cardForm
            }
          >
            Review {request ? `${request.mutations.length} changes` : 'changes'}
          </Button>
        </div>
      </header>

      {baseSnapshot && (
        <div className="studio-repository" aria-label="Repository source">
          <span>
            {baseSnapshot.repository.owner}/{baseSnapshot.repository.name}
          </span>
          <span>branch: {baseSnapshot.repository.branch}</span>
          <span>
            base commit <code>{baseSnapshot.sourceCommit.slice(0, 12)}</code>
          </span>
          <span>
            {request
              ? `${request.mutations.length} unpublished changes`
              : pageForm || cardForm
                ? 'Unsaved editor changes'
                : 'Clean'}
          </span>
        </div>
      )}
      {loading && (
        <p className="status-message" role="status">
          Loading repository snapshot…
        </p>
      )}
      {error && (
        <p className="status-message status-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="status-message" role="status">
          {notice}
        </p>
      )}
      {draftIssues.length > 0 && (
        <div className="studio-validation" role="status" aria-label="Draft validation issues">
          <strong>
            {draftIssues.length} draft validation issue{draftIssues.length === 1 ? '' : 's'}:
          </strong>
          <ul>
            {draftIssues.map((issue) => (
              <li key={issue}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
      {lastCommit && (
        <p className="studio-commit-notice">
          Latest commit:{' '}
          <a href={lastCommit.commitUrl} target="_blank" rel="noreferrer">
            {lastCommit.commitSha}
          </a>{' '}
          — Git commit only; deployment is tracked separately.
        </p>
      )}

      {hierarchyOpen && (
        <Dialog title="Page & card hierarchy explorer" onClose={() => setHierarchyOpen(false)}>
          <p className="studio-muted">
            Select a page to edit its content, or use the actions to organize the draft hierarchy.
          </p>
          <TextInput
            id="explorer-page-search"
            label="Search pages"
            type="search"
            value={pageSearch}
            onChange={(event) => setPageSearch(event.target.value)}
          />
          <div className="studio-tree-controls">
            <Button
              type="button"
              onClick={() => {
                setHierarchyOpen(false);
                startNewPage();
              }}
            >
              Create page
            </Button>
            <Button
              type="button"
              disabled={!selectedPageId}
              onClick={() => {
                setHierarchyOpen(false);
                startNewCard();
              }}
            >
              Create card
            </Button>
            <Button type="button" onClick={() => setCollapsedPageIds(new Set())}>
              Expand all
            </Button>
            <Button
              type="button"
              onClick={() => setCollapsedPageIds(new Set(pages.map((page) => page.id)))}
            >
              Collapse all
            </Button>
          </div>
          <PageTree
            nodes={visiblePageTree}
            cards={cards}
            selectedId={selectedPageId}
            selectedCardId={selectedCardId}
            onSelect={(page) => {
              choosePage(page);
              setHierarchyOpen(false);
            }}
            onEdit={(page) => {
              setHierarchyOpen(false);
              editPage(page);
            }}
            onAddChild={(page) => {
              setHierarchyOpen(false);
              startNewPage(page.id);
            }}
            onMove={movePage}
            onDelete={(page) => {
              setHierarchyOpen(false);
              requestPageDeletion(page);
            }}
            onSelectCard={(card) => {
              chooseCard(card);
              setHierarchyOpen(false);
            }}
            onEditCard={(card) => {
              setHierarchyOpen(false);
              editCard(card);
            }}
            onMoveCard={moveCard}
            onDeleteCard={(card) => {
              setHierarchyOpen(false);
              setDeleteCard(card);
            }}
            collapsedIds={collapsedPageIds}
            forceExpanded={pageSearch.trim().length > 0}
            onToggle={(pageId) =>
              setCollapsedPageIds((current) => {
                const next = new Set(current);
                if (next.has(pageId)) next.delete(pageId);
                else next.add(pageId);
                return next;
              })
            }
          />
        </Dialog>
      )}

      {syncOpen && baseSnapshot && (
        <Dialog title="GitHub repository sync" onClose={() => setSyncOpen(false)}>
          <div className="sync-settings">
            <p>
              <strong>Owner</strong>
              <span>{baseSnapshot.repository.owner}</span>
            </p>
            <p>
              <strong>Repository</strong>
              <span>{baseSnapshot.repository.name}</span>
            </p>
            <p>
              <strong>Branch</strong>
              <span>{baseSnapshot.repository.branch}</span>
            </p>
            <p>
              <strong>GitHub account</strong>
              <span>{user?.login ?? 'Not signed in'}</span>
            </p>
            <p>
              <strong>Authentication</strong>
              <span>Current session only; token is not displayed or stored in this page.</span>
            </p>
            <p>
              <strong>Source commit</strong>
              <code>{baseSnapshot.sourceCommit}</code>
            </p>
          </div>
          <p className="studio-muted">
            The repository target is fixed for this workspace. Use the active GitHub sign-in to
            verify access; credentials are never requested or saved here.
          </p>
          {syncTestResult && (
            <p
              className={`status-message${syncTestError ? 'status-error' : ''}`}
              role={syncTestError ? 'alert' : 'status'}
            >
              {syncTestResult}
            </p>
          )}
          <div className="studio-inline-actions">
            <Button
              type="button"
              onClick={() => void testRepositoryConnection()}
              disabled={syncTesting}
            >
              {syncTesting ? 'Testing…' : 'Test connection'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setSyncOpen(false);
                reloadRepository();
              }}
              disabled={loading || saving}
            >
              {loading ? 'Syncing…' : 'Sync repository'}
            </Button>
          </div>
        </Dialog>
      )}

      {!loading && baseSnapshot && (
        <div className={cardForm ? 'studio-columns has-card-editor' : 'studio-columns'}>
          <section className="studio-card studio-hierarchy" aria-labelledby="hierarchy-title">
            <div className="studio-section-heading">
              <div>
                <h2 id="hierarchy-title">Pages</h2>
                <p className="studio-muted">{pages.length} pages in this draft</p>
              </div>
              <Button type="button" onClick={() => startNewPage()}>
                Create page
              </Button>
            </div>
            <TextInput
              id="page-search"
              label="Search pages"
              type="search"
              value={pageSearch}
              onChange={(event) => setPageSearch(event.target.value)}
            />
            <div className="studio-tree-controls">
              <Button type="button" onClick={() => setCollapsedPageIds(new Set())}>
                Expand all
              </Button>
              <Button
                type="button"
                onClick={() => setCollapsedPageIds(new Set(pages.map((page) => page.id)))}
              >
                Collapse all
              </Button>
            </div>
            <PageTree
              nodes={visiblePageTree}
              cards={cards}
              selectedId={selectedPageId}
              selectedCardId={selectedCardId}
              onSelect={choosePage}
              onEdit={editPage}
              onAddChild={(page) => startNewPage(page.id)}
              onMove={movePage}
              onDelete={requestPageDeletion}
              onSelectCard={chooseCard}
              onEditCard={editCard}
              onMoveCard={moveCard}
              onDeleteCard={setDeleteCard}
              collapsedIds={collapsedPageIds}
              forceExpanded={pageSearch.trim().length > 0}
              onToggle={(pageId) =>
                setCollapsedPageIds((current) => {
                  const next = new Set(current);
                  if (next.has(pageId)) next.delete(pageId);
                  else next.add(pageId);
                  return next;
                })
              }
            />
            {pageSearch.trim() && visiblePageTree.length === 0 && (
              <p className="studio-muted" role="status">
                No pages match “{pageSearch}”.
              </p>
            )}
          </section>

          <section className="studio-card studio-editor" aria-label="Page and card editor">
            {pageForm ? (
              <form className="studio-form" onSubmit={applyPageForm}>
                <div className="studio-section-heading">
                  <h2>
                    {baseSnapshot.pages.some((page) => page.id === pageForm.id)
                      ? 'Edit page'
                      : 'Create page'}
                  </h2>
                  <Button type="button" onClick={() => setPageForm(null)}>
                    Cancel
                  </Button>
                </div>
                <TextInput
                  id="page-title"
                  label="Page title"
                  maxLength={160}
                  required
                  value={pageForm.title}
                  onChange={(event) => {
                    const title = event.target.value;
                    setPageForm((current) =>
                      current
                        ? {
                            ...current,
                            title,
                            slug:
                              !current.slug || current.slug === normalizeSlug(current.title)
                                ? normalizeSlug(title)
                                : current.slug,
                          }
                        : current,
                    );
                  }}
                />
                <TextInput
                  id="page-slug"
                  label="URL slug"
                  maxLength={160}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  required
                  value={pageForm.slug}
                  onChange={(event) =>
                    setPageForm((current) =>
                      current ? { ...current, slug: event.target.value } : current,
                    )
                  }
                />
                <label className="field-label" htmlFor="page-parent">
                  Parent page
                </label>
                <select
                  id="page-parent"
                  className="text-field"
                  value={pageForm.parentId}
                  onChange={(event) =>
                    setPageForm((current) =>
                      current ? { ...current, parentId: event.target.value } : current,
                    )
                  }
                >
                  <option value="">Root page</option>
                  {pages
                    .filter(
                      (page) =>
                        page.id !== pageForm.id &&
                        !collectDescendantIds(pageForm.id, pages).has(page.id),
                    )
                    .map((page) => (
                      <option value={page.id} key={page.id}>
                        {page.title}
                      </option>
                    ))}
                </select>
                <label className="field-label" htmlFor="page-description">
                  Description
                </label>
                <textarea
                  id="page-description"
                  className="text-field studio-textarea"
                  maxLength={2000}
                  value={pageForm.description}
                  onChange={(event) =>
                    setPageForm((current) =>
                      current ? { ...current, description: event.target.value } : current,
                    )
                  }
                />
                {currentPageDraft && pageForm.parentId === currentPageDraft.id && (
                  <p className="status-message status-error" role="alert">
                    A page cannot be its own parent.
                  </p>
                )}
                <Button variant="primary" type="submit">
                  Save page draft
                </Button>
              </form>
            ) : cardForm ? (
              <form className="studio-form studio-card-edit-form" onSubmit={applyCardForm}>
                <div className="studio-section-heading">
                  <h2>
                    {baseSnapshot.cards.some((card) => card.id === cardForm.id)
                      ? 'Edit card'
                      : 'Create new card'}
                  </h2>
                  <Button type="button" onClick={cancelCardForm}>
                    Cancel
                  </Button>
                </div>
                <div className="studio-card-editor-fields">
                  <TextInput
                    id="card-title"
                    label="Card title"
                    maxLength={160}
                    required
                    value={cardForm.title}
                    onChange={(event) =>
                      updateCardForm((current) => ({ ...current, title: event.target.value }))
                    }
                  />
                  <TextInput
                    id="card-tag"
                    label="Tag"
                    maxLength={80}
                    value={cardForm.tag}
                    onChange={(event) =>
                      updateCardForm((current) => ({ ...current, tag: event.target.value }))
                    }
                  />
                  <label className="field-label" htmlFor="card-page">
                    Page
                  </label>
                  <select
                    id="card-page"
                    className="text-field"
                    value={cardForm.pageId}
                    onChange={(event) =>
                      updateCardForm((current) => ({ ...current, pageId: event.target.value }))
                    }
                  >
                    {pages.map((page) => (
                      <option value={page.id} key={page.id}>
                        {page.title}
                      </option>
                    ))}
                  </select>
                  <label className="field-label" htmlFor="card-definition">
                    Definition
                  </label>
                  <textarea
                    id="card-definition"
                    className="text-field studio-textarea"
                    maxLength={10000}
                    required
                    value={cardForm.definition}
                    onChange={(event) =>
                      updateCardForm((current) => ({ ...current, definition: event.target.value }))
                    }
                  />
                  <label className="field-label" htmlFor="card-key-rule">
                    Key rule
                  </label>
                  <textarea
                    id="card-key-rule"
                    className="text-field studio-textarea"
                    maxLength={5000}
                    value={cardForm.keyRule}
                    onChange={(event) =>
                      updateCardForm((current) => ({ ...current, keyRule: event.target.value }))
                    }
                  />
                  <label className="field-label" htmlFor="card-code">
                    Code
                  </label>
                  <textarea
                    id="card-code"
                    className="text-field studio-textarea"
                    maxLength={20000}
                    value={cardForm.code}
                    onChange={(event) =>
                      updateCardForm((current) => ({ ...current, code: event.target.value }))
                    }
                  />
                  <label className="field-label" htmlFor="card-spec">
                    Specification
                  </label>
                  <textarea
                    id="card-spec"
                    className="text-field studio-textarea"
                    maxLength={20000}
                    value={cardForm.spec}
                    onChange={(event) =>
                      updateCardForm((current) => ({ ...current, spec: event.target.value }))
                    }
                  />
                  <fieldset className="studio-attachments">
                    <legend>Attachments</legend>
                    <label className="field-label" htmlFor="attachment-file">
                      Upload image, audio, video, or PDF (10 MiB max)
                    </label>
                    <input
                      id="attachment-file"
                      className="text-field"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,audio/mpeg,audio/ogg,audio/wav,video/mp4,video/webm,application/pdf"
                      onChange={(event) => {
                        void addAssetFile(event.target.files?.[0]);
                        event.currentTarget.value = '';
                      }}
                    />
                    <div className="studio-link-fields">
                      <TextInput
                        id="attachment-link-label"
                        label="External link label"
                        value={linkLabel}
                        onChange={(event) => setLinkLabel(event.target.value)}
                      />
                      <TextInput
                        id="attachment-link-url"
                        label="External link URL"
                        type="url"
                        value={linkUrl}
                        onChange={(event) => setLinkUrl(event.target.value)}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (cardForm.attachments.length >= CONTENT_LIMITS.attachmentsPerCard) {
                            setError(
                              `Cards can have at most ${CONTENT_LIMITS.attachmentsPerCard} attachments.`,
                            );
                            return;
                          }
                          if (!linkLabel.trim() || !linkUrl.trim()) {
                            setError('Enter both a label and URL before adding an external link.');
                            return;
                          }
                          let parsed: URL;
                          try {
                            parsed = new URL(linkUrl);
                          } catch {
                            setError('Enter a valid http or https URL.');
                            return;
                          }
                          if (!['http:', 'https:'].includes(parsed.protocol)) {
                            setError('External links must use http or https.');
                            return;
                          }
                          updateCardForm((current) => ({
                            ...current,
                            attachments: [
                              ...current.attachments,
                              {
                                id: crypto.randomUUID(),
                                kind: 'link',
                                label: linkLabel.trim().slice(0, 160),
                                url: parsed.href,
                              },
                            ],
                          }));
                          setLinkLabel('');
                          setLinkUrl('');
                          setError(null);
                        }}
                      >
                        Add link
                      </Button>
                    </div>
                    {cardForm.attachments.length > 0 && (
                      <ul className="studio-attachment-list">
                        {cardForm.attachments.map((attachment) => (
                          <li key={attachment.id}>
                            <span>
                              {attachment.label} <small>{attachment.kind}</small>
                            </span>
                            <div className="studio-inline-actions">
                              <Button
                                type="button"
                                aria-label={`Move attachment ${attachment.label} up`}
                                onClick={() =>
                                  moveAttachment(cardForm.attachments.indexOf(attachment), -1)
                                }
                              >
                                ↑
                              </Button>
                              <Button
                                type="button"
                                aria-label={`Move attachment ${attachment.label} down`}
                                onClick={() =>
                                  moveAttachment(cardForm.attachments.indexOf(attachment), 1)
                                }
                              >
                                ↓
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                onClick={() => stageAttachmentRemoval(attachment)}
                              >
                                Remove {attachment.label}
                              </Button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </fieldset>
                </div>
                <section className="studio-preview" aria-label="Card draft preview">
                  <h3>Live preview</h3>
                  <h4>{cardForm.title || 'Untitled card'}</h4>
                  {cardForm.tag && <span className="studio-tag">{cardForm.tag}</span>}
                  <p>{cardForm.definition || 'Definition preview'}</p>
                  {cardForm.keyRule && (
                    <p>
                      <strong>Key rule:</strong> {cardForm.keyRule}
                    </p>
                  )}
                  {cardForm.code && <pre>{cardForm.code}</pre>}
                  {cardForm.spec && (
                    <p>
                      <strong>Specification:</strong> {cardForm.spec}
                    </p>
                  )}
                  {cardForm.attachments.length > 0 && baseSnapshot && (
                    <ul className="studio-preview-attachments">
                      {cardForm.attachments.map((attachment) => (
                        <li key={attachment.id}>
                          <AttachmentPreview
                            attachment={attachment}
                            snapshot={baseSnapshot}
                            mutations={assetMutations}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
                <Button type="submit" variant="primary">
                  Save card draft
                </Button>
              </form>
            ) : selectedPage ? (
              <>
                <div className="studio-section-heading">
                  <div>
                    <p className="studio-eyebrow">Selected page</p>
                    <h2>{selectedPage.title}</h2>
                  </div>
                  <div className="studio-inline-actions">
                    <Button type="button" onClick={() => editPage(selectedPage)}>
                      Edit page
                    </Button>
                    <Button type="button" onClick={startNewCard}>
                      Create card
                    </Button>
                  </div>
                </div>
                <p className="studio-muted">
                  /{selectedPage.slug}
                  {selectedPage.description ? ` — ${selectedPage.description}` : ''}
                </p>
                {pageCards.length === 0 ? (
                  <EmptyState title="No cards on this page">
                    Create a card to start documenting this topic.
                  </EmptyState>
                ) : (
                  <div className="studio-card-list">
                    {pageCards.map((card) => (
                      <article className="studio-content-card" key={card.id}>
                        <div>
                          <h3>{card.title}</h3>
                          {card.tag && <span className="studio-tag">{card.tag}</span>}
                          <p>{card.definition}</p>
                          {card.attachments.length > 0 && (
                            <ul className="studio-preview-attachments">
                              {card.attachments.map((attachment) => (
                                <li key={attachment.id}>
                                  <AttachmentPreview
                                    attachment={attachment}
                                    snapshot={baseSnapshot}
                                    mutations={assetMutations}
                                  />
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="studio-inline-actions">
                          <Button type="button" onClick={() => editCard(card)}>
                            Edit
                          </Button>
                          <Button
                            type="button"
                            aria-label={`Move card ${card.title} up`}
                            onClick={() => moveCard(card, -1)}
                          >
                            ↑
                          </Button>
                          <Button
                            type="button"
                            aria-label={`Move card ${card.title} down`}
                            onClick={() => moveCard(card, 1)}
                          >
                            ↓
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => setDeleteCard(card)}
                          >
                            Delete
                          </Button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <EmptyState title="Select or create a page">
                Page and card drafts are not sent to GitHub until you review and publish.
              </EmptyState>
            )}
          </section>
        </div>
      )}

      {reviewOpen && request && baseSnapshot && (
        <Dialog title="Review repository changes" onClose={() => !saving && setReviewOpen(false)}>
          <form className="studio-form" onSubmit={publishChanges}>
            <p>
              Target:{' '}
              <strong>
                {baseSnapshot.repository.owner}/{baseSnapshot.repository.name}
              </strong>{' '}
              on <strong>{baseSnapshot.repository.branch}</strong>.
            </p>
            <p>
              Base commit: <code>{baseSnapshot.sourceCommit}</code>
            </p>
            <ul className="studio-review-list">
              {reviewCounts.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <ul className="studio-review-list">
              {request.mutations.map((mutation, index) => (
                <li key={`${mutation.type}-${'id' in mutation ? mutation.id : index}`}>
                  {mutation.type === 'upsert-page' || mutation.type === 'upsert-card'
                    ? `${mutation.type.replace('-', ' ')}: ${mutation.record.title}`
                    : `${mutation.type.replace('-', ' ')}: ${'id' in mutation ? mutation.id : ''}`}
                </li>
              ))}
            </ul>
            {draftIssues.length > 0 && (
              <div className="status-message status-error" role="alert">
                {draftIssues.map((issue) => (
                  <p key={issue}>{issue}</p>
                ))}
              </div>
            )}
            <TextInput
              id="publish-commit-message"
              label="Commit message"
              maxLength={200}
              required
              value={commitMessage}
              onChange={(event) => setCommitMessage(event.target.value)}
            />
            <p className="studio-muted">
              Publish creates one atomic repository commit. A commit does not mean the Pages
              deployment has completed.
            </p>
            <div className="studio-inline-actions">
              <Button type="button" disabled={saving} onClick={() => setReviewOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={saving || draftIssues.length > 0}>
                {saving ? 'Publishing…' : 'Confirm publish'}
              </Button>
            </div>
          </form>
        </Dialog>
      )}

      {deletePage && (
        <Dialog title={`Delete "${deletePage.title}"?`} onClose={() => setDeletePage(null)}>
          <p>
            This draft change removes the page, all descendant pages, and cards attached to them. It
            affects {deletePageIds.size} page{deletePageIds.size === 1 ? '' : 's'},{' '}
            {deletePageCards.length} card{deletePageCards.length === 1 ? '' : 's'}, and up to{' '}
            {deleteAssetCount} referenced asset{deleteAssetCount === 1 ? '' : 's'}. No GitHub write
            occurs until you review and publish.
          </p>
          <div className="studio-inline-actions">
            <Button type="button" onClick={() => setDeletePage(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={() => removePage(deletePage)}>
              Delete draft subtree
            </Button>
          </div>
        </Dialog>
      )}

      {deleteCard && (
        <Dialog title={`Delete "${deleteCard.title}"?`} onClose={() => setDeleteCard(null)}>
          <p>
            This card and any assets no longer referenced by other cards will be removed from the
            publish draft.
          </p>
          <div className="studio-inline-actions">
            <Button type="button" onClick={() => setDeleteCard(null)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" onClick={() => removeCard(deleteCard)}>
              Delete card draft
            </Button>
          </div>
        </Dialog>
      )}

      {pendingDeleteMessage && (
        <Dialog title="Discard unsaved changes?" onClose={() => setPendingDeleteMessage('')}>
          <p>{pendingDeleteMessage}</p>
          <div className="studio-inline-actions">
            <Button type="button" onClick={() => setPendingDeleteMessage('')}>
              Keep draft
            </Button>
            <Button type="button" variant="danger" onClick={confirmReload}>
              Discard and reload
            </Button>
          </div>
        </Dialog>
      )}
    </section>
  );
}

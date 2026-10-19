import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AnchoredDialog,
  AttachmentEditor,
  CardConnector,
  CardPreview,
  CardSummary,
  CarouselControls,
  Button,
  GitHubSyncDialog,
  WorkspaceActionButton,
  WorkspaceFrame,
  WorkspaceModeIndicator,
  WorkspacePageHeader,
  WorkspacePanel,
  WorkspacePanelTitle,
} from '../components';
import { APP_ROUTES, GITHUB_REPOSITORY } from '../../config';
import { useAuth } from '../features/auth';
import { createGitHubRepositoryClient } from '../features/github';
import type { Attachment, RepositorySnapshotResponse, StoredAttachment } from '../lib/content';
import { resolveCardContainer } from '../lib/content-resolution';
import { backendWorkspaceCopy, cardToolbarActions, gitHubSyncCopy } from './backendWorkspaceConfig';
import { BackendTree, type ExplorerRecord } from './BackendTree';
import { explorerRecordsToV2Content } from './backendRepositoryContent';
import {
  defaultExplorerSelection,
  repositorySnapshotToExplorerRecords,
} from './backendRepositoryRecords';

type RecordDraft = {
  title: string;
  category: string;
  summary: string;
  tag?: string;
  keyRule?: string;
  code?: string;
  spec?: string;
  attachments?: Attachment[];
};

type PendingMedia = {
  file: File;
  previewUrl: string;
};

async function encodeFileBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

export function BackendPage() {
  const navigate = useNavigate();
  const { githubRequest, loginWithPat, user, verifyGitHubPat } = useAuth();
  const repositoryClient = useMemo(
    () => createGitHubRepositoryClient(githubRequest),
    [githubRequest],
  );
  const [openPanel, setOpenPanel] = useState<'explorer' | 'github-sync' | null>(null);
  const [sourceRecords, setSourceRecords] = useState<ExplorerRecord[]>([]);
  const [records, setRecords] = useState<ExplorerRecord[]>([]);
  const [repositorySnapshot, setRepositorySnapshot] = useState<RepositorySnapshotResponse | null>(
    null,
  );
  const [selectedId, setSelectedId] = useState('');
  const [drafts, setDrafts] = useState<Record<string, RecordDraft>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const stableIds = useRef(new Map<string, string>());
  const pendingMedia = useRef(new Map<string, PendingMedia>());
  const selectButtonRef = useRef<HTMLButtonElement>(null);
  const githubSyncButtonRef = useRef<HTMLButtonElement>(null);
  const copy = backendWorkspaceCopy;
  const isExplorerOpen = openPanel === 'explorer';

  function clearPendingMedia() {
    for (const { previewUrl } of pendingMedia.current.values()) URL.revokeObjectURL(previewUrl);
    pendingMedia.current.clear();
  }

  useEffect(() => () => clearPendingMedia(), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);
    setSourceRecords([]);
    setRecords([]);
    setRepositorySnapshot(null);
    setSelectedId('');
    setDrafts({});
    clearPendingMedia();
    stableIds.current.clear();
    void repositoryClient
      .readSnapshot()
      .then((snapshot) => {
        if (!active) return;
        setRepositorySnapshot(snapshot);
        const loadedRecords = repositorySnapshotToExplorerRecords(snapshot);
        setSourceRecords(loadedRecords);
        setRecords(loadedRecords);
        setSelectedId(defaultExplorerSelection(loadedRecords));
      })
      .catch((cause: unknown) => {
        if (!active) return;
        const code = cause instanceof Error ? cause.message.split(':', 1)[0]! : 'unknown_error';
        if (code === 'github_token_invalid' || code === 'authentication_required') {
          setLoadError('Your GitHub sign-in expired. Sign in again to view the documentation.');
        } else if (code === 'github_rate_limited') {
          setLoadError('GitHub is rate-limiting requests. Try again shortly.');
        } else if (code === 'github_permission_denied') {
          setLoadError('This account can no longer read the configured repository.');
        } else {
          setLoadError(`Could not load the repository content (${code}).`);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [repositoryClient, reload]);

  const visibleRecords = records.map((record) => ({
    ...record,
    ...drafts[record.id],
  })) as ExplorerRecord[];
  useEffect(() => {
    const referencedAssets = new Set(
      visibleRecords.flatMap((record) =>
        record.kind === 'card'
          ? (record.attachments ?? []).flatMap((attachment) =>
              'assetId' in attachment ? [attachment.assetId] : [],
            )
          : [],
      ),
    );
    for (const [assetId, pending] of pendingMedia.current) {
      if (referencedAssets.has(assetId)) continue;
      URL.revokeObjectURL(pending.previewUrl);
      pendingMedia.current.delete(assetId);
    }
  }, [visibleRecords]);
  const selectedRecord = visibleRecords.find((record) => record.id === selectedId) ?? null;
  const activeContainerId =
    selectedRecord?.kind === 'container'
      ? selectedRecord.id
      : selectedRecord?.kind === 'card'
        ? selectedRecord.parentId
        : null;
  const preview =
    activeContainerId === null
      ? null
      : resolveCardContainer(
          visibleRecords.filter(
            (record): record is Extract<ExplorerRecord, { kind: 'container' }> =>
              record.kind === 'container',
          ),
          visibleRecords
            .filter(
              (record): record is Extract<ExplorerRecord, { kind: 'card' }> =>
                record.kind === 'card',
            )
            .map((card) => ({ ...card, containerId: card.parentId })),
          activeContainerId,
          selectedRecord?.kind === 'card' && selectedRecord.parentId === activeContainerId
            ? selectedRecord.id
            : null,
        );
  const activeContainer = preview?.container ?? null;
  const previewCards = preview?.cards ?? [];
  const activeCard = preview?.activeCard ?? null;
  const editorRecord =
    selectedRecord?.kind === 'container' ? (activeCard ?? activeContainer) : selectedRecord;
  const hasUnsavedChanges =
    JSON.stringify(records) !== JSON.stringify(sourceRecords) || Object.keys(drafts).length > 0;

  function handleRecordsChange(nextRecords: ExplorerRecord[]) {
    setRecords(nextRecords);
    if (nextRecords === sourceRecords) {
      setDrafts({});
      setSelectedId(defaultExplorerSelection(sourceRecords));
      return;
    }
    const retainedIds = new Set(nextRecords.map((record) => record.id));
    setDrafts((current) =>
      Object.fromEntries(Object.entries(current).filter(([id]) => retainedIds.has(id))),
    );
    if (selectedId && !retainedIds.has(selectedId)) {
      setSelectedId(defaultExplorerSelection(nextRecords));
    }
  }

  function updateDraft(field: keyof RecordDraft, value: string) {
    if (!editorRecord) return;
    setDrafts((current) => {
      const existing = current[editorRecord.id] ?? {
        title: editorRecord.title,
        category: editorRecord.category,
        summary: editorRecord.summary,
        ...(editorRecord.kind === 'card'
          ? {
              tag: editorRecord.tag ?? '',
              keyRule: editorRecord.keyRule ?? '',
              code: editorRecord.code ?? '',
              spec: editorRecord.spec ?? '',
              attachments: editorRecord.attachments ?? [],
            }
          : {}),
      };
      return {
        ...current,
        [editorRecord.id]: {
          ...existing,
          [field]: value,
        },
      };
    });
  }

  function updateAttachments(attachments: Attachment[]) {
    if (!editorRecord || editorRecord.kind !== 'card') return;
    setDrafts((current) => {
      const existing = current[editorRecord.id] ?? {
        title: editorRecord.title,
        category: editorRecord.category,
        summary: editorRecord.summary,
        tag: editorRecord.tag ?? '',
        keyRule: editorRecord.keyRule ?? '',
        code: editorRecord.code ?? '',
        spec: editorRecord.spec ?? '',
        attachments: editorRecord.attachments ?? [],
      };
      return { ...current, [editorRecord.id]: { ...existing, attachments } };
    });
  }

  async function saveChanges() {
    if (!repositorySnapshot || !hasUnsavedChanges || isSaving) return;
    setSaveError(null);
    setSaveStatus(null);
    setIsSaving(true);
    try {
      const contentToPublish = explorerRecordsToV2Content(
        visibleRecords,
        repositorySnapshot,
        stableIds.current,
      );
      const mediaUploads = [];
      for (const card of contentToPublish.cards) {
        for (const attachment of card.attachments) {
          if (!('assetId' in attachment)) continue;
          const pending = pendingMedia.current.get(attachment.assetId);
          if (!pending) continue;
          mediaUploads.push({
            assetId: attachment.assetId,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
            contentBase64: await encodeFileBase64(pending.file),
          });
        }
      }
      const { commitSha } = await repositoryClient.publishV2Snapshot(
        contentToPublish,
        repositorySnapshot.sourceCommit,
        undefined,
        mediaUploads,
      );
      setSaveStatus(`Saved as commit ${commitSha.slice(0, 7)}. Reloading repository content…`);
      setDrafts({});
      clearPendingMedia();
      setOpenPanel(null);
      setReload((value) => value + 1);
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : 'unknown_error';
      const code = detail.split(':', 1)[0]!;
      if (code === 'repository_head_changed') {
        setSaveError(
          'The repository changed since it was loaded. Your draft is still here; reload and reconcile before saving again.',
        );
      } else if (code === 'invalid_content_relationships') {
        setSaveError('Some edits are invalid or incomplete. Correct them before saving.');
      } else if (code === 'github_token_invalid' || code === 'authentication_required') {
        setSaveError('Your GitHub sign-in expired. Sign in again before saving.');
      } else {
        setSaveError(`Could not save repository content (${detail}). Your draft is still here.`);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function testGitHubConnection(token: string): Promise<string> {
    if (!user) {
      await verifyGitHubPat(token);
      return gitHubSyncCopy.testSuccessMessage;
    }
    const snapshot = await repositoryClient.readSnapshot();
    return `Connection test passed. Read ${snapshot.pages.length} pages and ${snapshot.cards.length} cards from ${GITHUB_REPOSITORY.branch}.`;
  }

  return (
    <div className="backend-shell">
      <WorkspacePageHeader
        title={copy.header.title}
        ariaLabel={copy.header.ariaLabel}
        inert={openPanel !== null}
        classNames={{
          root: 'backend-header',
          inner: 'backend-header-inner',
          start: 'backend-header-start',
          title: 'backend-header-title',
          actions: 'backend-header-actions',
        }}
        start={
          <WorkspaceActionButton
            label={copy.header.backLabel}
            icon="navigationBack"
            className="backend-header-button"
            onClick={() => navigate(APP_ROUTES.home)}
          />
        }
        actions={
          <WorkspaceActionButton
            label={copy.header.deploymentsLabel}
            className="backend-header-button"
          />
        }
      />
      <main className="backend-main">
        <WorkspaceFrame
          ariaLabel={copy.workspaceLabel}
          panelsInert={openPanel === 'explorer'}
          classNames={{
            root: 'backend-workspace-container',
            panels: 'backend-workspace-panels',
          }}
          overlay={
            isExplorerOpen ? (
              <AnchoredDialog
                id={copy.panelIds.explorer}
                className="backend-page-explorer"
                ariaLabel={copy.explorer.ariaLabel}
                modal
                onClose={() => setOpenPanel(null)}
                returnFocusRef={selectButtonRef}
              >
                <BackendTree
                  records={visibleRecords}
                  initialRecords={sourceRecords}
                  onRecordsChange={handleRecordsChange}
                  selectedRecord={selectedRecord}
                  onSelectionChange={(record) => setSelectedId(record?.id ?? '')}
                  onClose={() => setOpenPanel(null)}
                  closeLabel={copy.explorer.closeLabel}
                />
              </AnchoredDialog>
            ) : null
          }
        >
          <WorkspacePanel
            ariaLabel={copy.panelLabels.selection}
            headerLayout="spread"
            layoutInert={openPanel === 'github-sync'}
            classNames={{
              root: 'backend-workspace-panel',
              layout: 'backend-workspace-panel-layout',
              header: 'backend-workspace-panel-header',
              spreadHeader: 'backend-workspace-panel-header--spread',
              content: 'backend-workspace-panel-content',
              footer: 'backend-workspace-panel-footer',
            }}
            header={
              <>
                <WorkspaceActionButton
                  ref={githubSyncButtonRef}
                  label={copy.syncTriggerLabel}
                  statusIndicator
                  statusIndicatorClassName="backend-live-preview-dot"
                  className="backend-header-button"
                  aria-haspopup="dialog"
                  aria-expanded={openPanel === 'github-sync'}
                  aria-controls={copy.panelIds.sync}
                  onClick={() => setOpenPanel('github-sync')}
                />
                <WorkspaceModeIndicator
                  className="backend-workspace-selection-mode"
                  aria-label={copy.selectionModeLabel}
                >
                  {copy.selectionModeText}
                </WorkspaceModeIndicator>
                <WorkspaceActionButton
                  ref={selectButtonRef}
                  label={copy.selectTriggerLabel}
                  icon="selectTool"
                  className="backend-header-button"
                  aria-haspopup="dialog"
                  disabled={loading || loadError !== null}
                  aria-expanded={isExplorerOpen}
                  aria-controls={copy.panelIds.explorer}
                  onClick={() => setOpenPanel('explorer')}
                />
              </>
            }
            content={
              loading ? (
                <p className="backend-editor-empty" role="status">
                  Loading repository content…
                </p>
              ) : loadError ? (
                <div className="backend-editor-empty" role="alert">
                  <p>{loadError}</p>
                  <Button type="button" onClick={() => setReload((value) => value + 1)}>
                    Retry repository read
                  </Button>
                </div>
              ) : records.length === 0 ? (
                <div className="backend-editor-empty">
                  This repository has no pages yet. Use Select to create a local draft page.
                </div>
              ) : editorRecord ? (
                <form
                  className="backend-card-editor-form"
                  aria-label="Selected record editor"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void saveChanges();
                  }}
                >
                  <p className="backend-editor-draft-status" role="status">
                    Draft edits stay in this browser session until saved as one repository commit.
                  </p>
                  <div className="backend-editor-identity-fields">
                    <label className="backend-editor-field">
                      <span>Name</span>
                      <input
                        aria-label="Edit name"
                        value={editorRecord.title}
                        onChange={(event) => updateDraft('title', event.currentTarget.value)}
                      />
                    </label>
                    <label className="backend-editor-field">
                      <span>Category</span>
                      <input aria-label="Edit category" value={editorRecord.category} readOnly />
                    </label>
                  </div>
                  {editorRecord.kind === 'card' && (
                    <>
                      <label className="backend-editor-field">
                        <span>Tag</span>
                        <input
                          aria-label="Edit tag"
                          value={editorRecord.tag ?? ''}
                          onChange={(event) => updateDraft('tag', event.currentTarget.value)}
                        />
                      </label>
                      <label className="backend-editor-field">
                        <span>Key rule</span>
                        <textarea
                          aria-label="Edit key rule"
                          value={editorRecord.keyRule ?? ''}
                          onChange={(event) => updateDraft('keyRule', event.currentTarget.value)}
                          rows={3}
                        />
                      </label>
                      <label className="backend-editor-field">
                        <span>Code</span>
                        <textarea
                          aria-label="Edit code"
                          value={editorRecord.code ?? ''}
                          onChange={(event) => updateDraft('code', event.currentTarget.value)}
                          rows={5}
                          spellCheck={false}
                        />
                      </label>
                      <label className="backend-editor-field">
                        <span>Specification</span>
                        <textarea
                          aria-label="Edit specification"
                          value={editorRecord.spec ?? ''}
                          onChange={(event) => updateDraft('spec', event.currentTarget.value)}
                          rows={5}
                        />
                      </label>
                    </>
                  )}
                  <label className="backend-editor-field backend-editor-field-content">
                    <span>{editorRecord.kind === 'card' ? 'Card content' : 'Description'}</span>
                    <textarea
                      aria-label="Edit content"
                      value={editorRecord.summary}
                      onChange={(event) => updateDraft('summary', event.currentTarget.value)}
                      rows={8}
                      disabled={editorRecord.kind === 'container'}
                    />
                    {editorRecord.kind === 'container' && (
                      <span className="backend-editor-field-hint">
                        Container descriptions are not part of the current repository schema.
                      </span>
                    )}
                  </label>
                  {editorRecord.kind === 'card' && (
                    <AttachmentEditor
                      key={editorRecord.id}
                      attachments={editorRecord.attachments ?? []}
                      onChange={updateAttachments}
                      onAddFile={(attachment: StoredAttachment, file) => {
                        const previewUrl = URL.createObjectURL(file);
                        pendingMedia.current.set(attachment.assetId, { file, previewUrl });
                      }}
                      onRemove={(attachment) => {
                        if (!('assetId' in attachment)) return;
                        const pending = pendingMedia.current.get(attachment.assetId);
                        if (pending) URL.revokeObjectURL(pending.previewUrl);
                        pendingMedia.current.delete(attachment.assetId);
                      }}
                    />
                  )}
                  {saveError && (
                    <p className="status-message status-error" role="alert">
                      {saveError}
                    </p>
                  )}
                  {saveStatus && <p role="status">{saveStatus}</p>}
                  <Button
                    type="button"
                    variant="primary"
                    onClick={() => void saveChanges()}
                    disabled={!hasUnsavedChanges || isSaving || loading}
                  >
                    {isSaving ? 'Saving…' : 'Save changes'}
                  </Button>
                </form>
              ) : (
                <div className="backend-editor-empty" role="status">
                  Select a page, card container, or card to edit its content.
                </div>
              )
            }
            overlay={
              openPanel === 'github-sync' ? (
                <GitHubSyncDialog
                  id={copy.panelIds.sync}
                  repository={GITHUB_REPOSITORY}
                  copy={gitHubSyncCopy}
                  connected={user !== null}
                  onClose={() => setOpenPanel(null)}
                  onTest={testGitHubConnection}
                  onSave={async (token) => {
                    await loginWithPat(token);
                    setReload((value) => value + 1);
                  }}
                  returnFocusRef={githubSyncButtonRef}
                  classNames={{
                    root: 'backend-github-sync-panel',
                    header: 'backend-github-sync-header',
                    close: 'backend-github-sync-close',
                    content: 'backend-github-sync-content',
                    field: 'backend-github-sync-field',
                    results: 'backend-github-sync-results',
                    footer: 'backend-github-sync-footer',
                  }}
                />
              ) : null
            }
          />
          <WorkspacePanel
            ariaLabel={copy.panelLabels.preview}
            classNames={{
              root: 'backend-workspace-panel',
              layout: 'backend-workspace-panel-layout',
              header: 'backend-workspace-panel-header',
              content:
                'backend-workspace-panel-content backend-workspace-panel-content--home-background',
              footer: 'backend-workspace-panel-footer',
            }}
            header={
              <>
                <WorkspaceActionButton
                  label={copy.cardEditorLabel}
                  statusIndicator
                  statusIndicatorClassName="backend-live-preview-dot"
                  className="backend-header-button"
                />
                <WorkspacePanelTitle className="backend-workspace-panel-title">
                  {copy.livePreviewLabel}
                </WorkspacePanelTitle>
                <WorkspaceActionButton
                  label={copy.realtimeSyncLabel}
                  statusIndicator
                  statusIndicatorClassName="backend-live-preview-dot"
                  className="backend-header-button"
                />
              </>
            }
            content={
              <div className="backend-card-editor-stack">
                <CardSummary
                  {...copy.modelSummary}
                  title={activeContainer?.title ?? 'No card container selected'}
                  category={activeContainer?.category ?? 'Documentation'}
                  className="backend-header-button backend-card-editor-card-button"
                  classNames={{
                    title: 'backend-card-editor-card-title',
                    updated: 'backend-card-editor-card-updated',
                    status: 'backend-card-editor-card-status-dot',
                    updatedCopy: 'backend-card-editor-card-updated-copy',
                    tag: 'backend-card-editor-card-tag',
                  }}
                />
                <CardConnector className="backend-card-editor-connector" />
                <CardPreview
                  {...copy.cardPreview}
                  title={
                    activeCard?.title ??
                    (activeContainer ? 'This container has no cards' : 'Select a card container')
                  }
                  category={activeCard?.category ?? activeContainer?.title ?? 'Card preview'}
                  description={
                    activeCard?.summary ??
                    (activeContainer
                      ? 'Add a card to this container to begin the preview.'
                      : 'Select a card container from the workspace explorer.')
                  }
                  {...(activeCard?.keyRule !== undefined ? { keyRule: activeCard.keyRule } : {})}
                  {...(activeCard?.code !== undefined ? { code: activeCard.code } : {})}
                  {...(activeCard?.spec !== undefined ? { spec: activeCard.spec } : {})}
                  attachments={activeCard?.attachments ?? []}
                  repository={repositorySnapshot?.repository}
                  previewUrlForAsset={(assetId) => pendingMedia.current.get(assetId)?.previewUrl}
                  carousel={
                    <CarouselControls
                      items={previewCards}
                      activeItemId={activeCard?.id ?? null}
                      onSelect={setSelectedId}
                      ariaLabel="Card carousel"
                      previousLabel="Previous card"
                      nextLabel="Next card"
                      indicatorLabel={(card, index) => `Show card ${index + 1}: ${card.title}`}
                      className="backend-card-carousel"
                    />
                  }
                  actions={cardToolbarActions}
                  classNames={{
                    root: 'backend-card-editor',
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
            }
          />
        </WorkspaceFrame>
      </main>
    </div>
  );
}

import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AnchoredDialog,
  CardConnector,
  CardPreview,
  CardSummary,
  GitHubSyncDialog,
  IconButton,
  WorkspaceActionButton,
  WorkspaceFrame,
  WorkspaceModeIndicator,
  WorkspacePageHeader,
  WorkspacePanel,
  WorkspacePanelTitle,
} from '../components';
import { APP_ROUTES, GITHUB_REPOSITORY } from '../../config';
import { backendWorkspaceCopy, cardToolbarActions, gitHubSyncCopy } from './backendWorkspaceConfig';

export function BackendPage() {
  const navigate = useNavigate();
  const [openPanel, setOpenPanel] = useState<'explorer' | 'github-sync' | null>(null);
  const selectButtonRef = useRef<HTMLButtonElement>(null);
  const githubSyncButtonRef = useRef<HTMLButtonElement>(null);
  const copy = backendWorkspaceCopy;
  const isExplorerOpen = openPanel === 'explorer';

  return (
    <div className="backend-shell">
      <WorkspacePageHeader
        title={copy.header.title}
        ariaLabel={copy.header.ariaLabel}
        inert={isExplorerOpen}
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
          panelsInert={isExplorerOpen}
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
                <IconButton
                  className="backend-page-explorer-close"
                  name="navigationClose"
                  label={copy.explorer.closeLabel}
                  onClick={() => setOpenPanel(null)}
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
                  aria-expanded={isExplorerOpen}
                  aria-controls={copy.panelIds.explorer}
                  onClick={() => setOpenPanel('explorer')}
                />
              </>
            }
            content={null}
            overlay={
              openPanel === 'github-sync' ? (
                <GitHubSyncDialog
                  id={copy.panelIds.sync}
                  repository={GITHUB_REPOSITORY}
                  copy={gitHubSyncCopy}
                  onClose={() => setOpenPanel(null)}
                  onTest={() => setOpenPanel(null)}
                  saveDisabled
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
                  label={copy.livePreviewLabel}
                  statusIndicator
                  statusIndicatorClassName="backend-live-preview-dot"
                  className="backend-header-button"
                />
                <WorkspacePanelTitle className="backend-workspace-panel-title">
                  {copy.cardEditorLabel}
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

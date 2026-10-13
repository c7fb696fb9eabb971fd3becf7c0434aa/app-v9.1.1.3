import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Primitives';
import { Icon, type IconName } from '../components/Icon';
import { APP_ROUTES, GITHUB_REPOSITORY } from '../../config';

const cardToolbarActions: { icon: IconName; label: string }[] = [
  { icon: 'cardPreview', label: 'Preview card' },
  { icon: 'cardFiles', label: 'Card files' },
  { icon: 'cardVideo', label: 'Video preview' },
  { icon: 'cardLayout', label: 'Card layout' },
  { icon: 'cardTerminal', label: 'Terminal' },
  { icon: 'cardWorkflow', label: 'Card workflow' },
  { icon: 'cardBookmark', label: 'Bookmark card' },
  { icon: 'cardDuplicate', label: 'Duplicate card' },
  { icon: 'cardShare', label: 'Share card' },
  { icon: 'cardCode', label: 'Card source' },
  { icon: 'cardPrint', label: 'Print card' },
  { icon: 'cardSettings', label: 'Card settings' },
  { icon: 'publish', label: 'Export card' },
  { icon: 'verified', label: 'Validate card' },
  { icon: 'attachPdf', label: 'Card document' },
];

export function BackendPage() {
  const navigate = useNavigate();
  const [openPanel, setOpenPanel] = useState<'explorer' | 'github-sync' | null>(null);
  const [toolbarOffset, setToolbarOffset] = useState(0);
  const selectButtonRef = useRef<HTMLButtonElement>(null);
  const closeExplorerButtonRef = useRef<HTMLButtonElement>(null);
  const githubSyncButtonRef = useRef<HTMLButtonElement>(null);
  const closeGithubSyncButtonRef = useRef<HTMLButtonElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const toolbarTrackRef = useRef<HTMLDivElement>(null);
  const toolbarDragRef = useRef<{
    pointerId: number;
    startX: number;
    startOffset: number;
    moved: boolean;
  } | null>(null);
  const suppressToolbarClickRef = useRef(false);

  const handleToolbarPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    toolbarDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startOffset: toolbarOffset,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleToolbarPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = toolbarDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const delta = event.clientX - drag.startX;
    if (Math.abs(delta) > 3) drag.moved = true;

    const viewportWidth = toolbarRef.current?.clientWidth ?? 0;
    const trackWidth = toolbarTrackRef.current?.scrollWidth ?? 0;
    const maxOffset = Math.max(0, trackWidth - viewportWidth);
    setToolbarOffset(Math.max(-maxOffset, Math.min(0, drag.startOffset + delta)));
  };

  const handleToolbarPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = toolbarDragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    suppressToolbarClickRef.current = drag.moved;
    toolbarDragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleToolbarPointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    if (toolbarDragRef.current?.pointerId !== event.pointerId) return;

    toolbarDragRef.current = null;
    suppressToolbarClickRef.current = false;
  };

  const handleToolbarClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!suppressToolbarClickRef.current) return;

    suppressToolbarClickRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  };

  useEffect(() => {
    if (!openPanel) return;

    const previousFocus = document.activeElement;
    const closeButton =
      openPanel === 'explorer' ? closeExplorerButtonRef : closeGithubSyncButtonRef;
    const trigger = openPanel === 'explorer' ? selectButtonRef : githubSyncButtonRef;
    closeButton.current?.focus();
    return () => {
      if (previousFocus instanceof HTMLElement && previousFocus !== document.body) {
        previousFocus.focus();
      } else {
        trigger.current?.focus();
      }
    };
  }, [openPanel]);

  return (
    <div className="backend-shell">
      <header
        className="backend-header"
        aria-label="Backend header"
        inert={openPanel === 'explorer'}
      >
        <div className="backend-header-inner">
          <div className="backend-header-start">
            <Button
              type="button"
              className="backend-header-button"
              onClick={() => navigate(APP_ROUTES.home)}
            >
              <Icon name="navigationBack" size={14} />
              Back to home
            </Button>
          </div>
          <h1 className="backend-header-title">Backend</h1>
          <div className="backend-header-actions">
            <Button type="button" className="backend-header-button">
              Deployments
            </Button>
          </div>
        </div>
      </header>
      <main className="backend-main">
        <section className="backend-workspace-container" aria-label="Backend workspace">
          <div className="backend-workspace-panels" inert={openPanel === 'explorer'}>
            <section className="backend-workspace-panel" aria-label="Workspace panel 1">
              <div
                className="backend-workspace-panel-layout"
                inert={openPanel === 'github-sync'}
              >
                <header
                  className="backend-workspace-panel-header backend-workspace-panel-header--spread"
                  aria-label="Workspace panel 1 header"
                >
                  <Button
                    ref={githubSyncButtonRef}
                    type="button"
                    className="backend-header-button"
                    aria-haspopup="dialog"
                    aria-expanded={openPanel === 'github-sync'}
                    aria-controls="backend-github-sync-panel"
                    onClick={() => setOpenPanel('github-sync')}
                  >
                    <span className="backend-live-preview-dot" aria-hidden="true" />
                    Github Sync
                  </Button>
                  <div className="backend-workspace-selection-mode" aria-label="Selection mode">
                    Select Page, Sub Page or Card
                  </div>
                  <Button
                    ref={selectButtonRef}
                    type="button"
                    className="backend-header-button backend-select-button"
                    aria-haspopup="dialog"
                    aria-expanded={openPanel === 'explorer'}
                    aria-controls="backend-page-explorer"
                    onClick={() => setOpenPanel('explorer')}
                  >
                    <Icon name="selectTool" size={14} />
                    Select
                  </Button>
                </header>
                <section
                  className="backend-workspace-panel-content"
                  aria-label="Workspace panel 1 content"
                />
                <footer
                  className="backend-workspace-panel-footer"
                  aria-label="Workspace panel 1 footer"
                />
              </div>
              {openPanel === 'github-sync' && (
                <section
                  id="backend-github-sync-panel"
                  className="backend-github-sync-panel"
                  role="dialog"
                  aria-labelledby="backend-github-sync-title"
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setOpenPanel(null);
                  }}
                >
                  <header className="backend-github-sync-header">
                    <h2 id="backend-github-sync-title">
                      GitHub Repository Sync Settings
                    </h2>
                    <Button
                      ref={closeGithubSyncButtonRef}
                      type="button"
                      className="backend-github-sync-close"
                      aria-label="Close GitHub sync"
                      onClick={() => setOpenPanel(null)}
                    >
                      <Icon name="navigationClose" size={16} />
                    </Button>
                  </header>
                  <div className="backend-github-sync-content">
                    <label className="backend-github-sync-field" htmlFor="github-sync-owner">
                      GitHub Owner / Organization
                      <input
                        id="github-sync-owner"
                        name="github-owner"
                        type="text"
                        value={GITHUB_REPOSITORY.owner}
                        readOnly
                      />
                    </label>
                    <label className="backend-github-sync-field" htmlFor="github-sync-repository">
                      Repository Name
                      <input
                        id="github-sync-repository"
                        name="github-repository"
                        type="text"
                        value={GITHUB_REPOSITORY.name}
                        readOnly
                      />
                    </label>
                    <label className="backend-github-sync-field" htmlFor="github-sync-branch">
                      Branch
                      <input
                        id="github-sync-branch"
                        name="github-branch"
                        type="text"
                        value={GITHUB_REPOSITORY.branch}
                        readOnly
                      />
                    </label>
                    <label className="backend-github-sync-field" htmlFor="github-sync-token">
                      GitHub Personal Access Token (PAT)
                      <input
                        id="github-sync-token"
                        name="github-token"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Enter a personal access token"
                      />
                    </label>
                    <section
                      className="backend-github-sync-results"
                      aria-labelledby="backend-github-sync-results-title"
                    >
                      <h3 id="backend-github-sync-results-title">Connection Test Results</h3>
                      <p>Connection status and branch details will appear here after a test.</p>
                    </section>
                  </div>
                  <footer className="backend-github-sync-footer">
                    <Button type="button" onClick={() => setOpenPanel(null)}>
                      Connection Test
                    </Button>
                    <Button type="button" disabled>
                      Save &amp; Connect
                    </Button>
                  </footer>
                </section>
              )}
            </section>
            <section className="backend-workspace-panel" aria-label="Workspace panel 2">
              <div className="backend-workspace-panel-layout">
                <header
                  className="backend-workspace-panel-header"
                  aria-label="Workspace panel header"
                >
                  <Button type="button" className="backend-header-button">
                    <span className="backend-live-preview-dot" aria-hidden="true" />
                    Live Preview
                  </Button>
                  <h2 className="backend-workspace-panel-title">Card Editor</h2>
                  <Button type="button" className="backend-header-button">
                    <span className="backend-live-preview-dot" aria-hidden="true" />
                    Real-Time-Sync
                  </Button>
                </header>
                <section
                  className="backend-workspace-panel-content backend-workspace-panel-content--home-background"
                  aria-label="Workspace panel content"
                >
                  <div className="backend-card-editor-stack">
                    <Button
                      type="button"
                      className="backend-header-button backend-card-editor-card-button"
                    >
                      <span className="backend-card-editor-card-title">
                        <Icon name="promptContinue" size={14} />
                        <span>Model Training</span>
                      </span>
                      <span className="backend-card-editor-card-updated">
                        <span className="backend-card-editor-card-status-dot" aria-hidden="true" />
                        <span className="backend-card-editor-card-updated-copy">
                          <span>Last Updated</span>
                          <time dateTime="2026-01-01">01/01/2026</time>
                        </span>
                      </span>
                      <span className="backend-card-editor-card-tag">Machine Learning</span>
                    </Button>
                    <div className="backend-card-editor-connector" aria-hidden="true" />
                    <article className="backend-card-editor" aria-label="Card preview">
                      <section className="backend-card-editor-content" aria-label="Card content">
                        <header
                          className="backend-card-editor-content-header"
                          aria-label="Card content header"
                        >
                          <div className="backend-card-editor-content-title">
                            <Icon name="promptContinue" size={14} />
                            <h3>Tensor Flow</h3>
                          </div>
                          <span>Neural Networks</span>
                        </header>
                      </section>
                      <div
                        ref={toolbarRef}
                        className="backend-card-editor-toolbar"
                        role="toolbar"
                        aria-label="Card actions"
                        onPointerDown={handleToolbarPointerDown}
                        onPointerMove={handleToolbarPointerMove}
                        onPointerUp={handleToolbarPointerUp}
                        onPointerCancel={handleToolbarPointerCancel}
                        onClickCapture={handleToolbarClickCapture}
                      >
                        <div
                          ref={toolbarTrackRef}
                          className="backend-card-editor-toolbar-track"
                          style={{ transform: `translateX(${toolbarOffset}px)` }}
                        >
                          {cardToolbarActions.map(({ icon, label }) => (
                            <button
                              key={icon}
                              type="button"
                              className="backend-card-editor-tool"
                              aria-label={label}
                              title={label}
                            >
                              <Icon name={icon} size={15} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <label className="backend-card-editor-input">
                        <Icon name="promptContinue" size={14} />
                        <input
                          type="text"
                          aria-label="Card notes or commands"
                          placeholder="Type notes or commands on a straight line..."
                        />
                      </label>
                    </article>
                  </div>
                </section>
                <footer
                  className="backend-workspace-panel-footer"
                  aria-label="Workspace panel footer"
                />
              </div>
            </section>
          </div>
          {openPanel === 'explorer' && (
            <section
              id="backend-page-explorer"
              className="backend-page-explorer"
              role="dialog"
              aria-modal="true"
              aria-label="Page, sub page or card explorer"
              onKeyDown={(event) => {
                if (event.key === 'Escape') setOpenPanel(null);
                if (event.key === 'Tab') {
                  event.preventDefault();
                  closeExplorerButtonRef.current?.focus();
                }
              }}
            >
              <Button
                ref={closeExplorerButtonRef}
                type="button"
                className="backend-page-explorer-close"
                aria-label="Close explorer"
                onClick={() => setOpenPanel(null)}
              >
                <Icon name="navigationClose" size={16} />
              </Button>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

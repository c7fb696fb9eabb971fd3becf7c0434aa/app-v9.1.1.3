import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveCustomCard, deleteCard } from '../lib/contentEngine';
import {
  getGitHubConfig,
  resetGitHubConfigToDefault,
  executeDeploymentItem,
  triggerGitHubPagesDeploy,
  getPendingDeployments,
  savePendingDeployments,
  removePendingDeployment,
  PendingDeployment,
  CommitResult,
} from '../lib/githubSync';
import { DeploymentsIcon } from '../components/studio/DeploymentsIcon';
import { GitHubSettingsModal } from '../components/studio/GitHubSettingsModal';

interface PublishedCommitLog {
  id: string;
  title: string;
  actionType: string;
  targetPath: string;
  filePath: string;
  commitSha?: string;
  commitUrl?: string;
  timestamp: string;
}

const PUBLISHED_COMMITS_KEY = 'greendocs_published_commits_v1';

export const DeploymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const ghConfig = getGitHubConfig();

  const [pendingDeployments, setPendingDeployments] = useState<PendingDeployment[]>(() => {
    return getPendingDeployments();
  });

  const [publishedCommits, setPublishedCommits] = useState<PublishedCommitLog[]>(() => {
    try {
      const raw = localStorage.getItem(PUBLISHED_COMMITS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore
    }
    return [];
  });

  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [publishingAll, setPublishingAll] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isTriggeringWorkflow, setIsTriggeringWorkflow] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    commitUrl?: string;
  } | null>(null);

  // Sync with storage and window events
  useEffect(() => {
    savePendingDeployments(pendingDeployments);
  }, [pendingDeployments]);

  useEffect(() => {
    const handleSync = () => {
      setPendingDeployments(getPendingDeployments());
    };
    window.addEventListener('greendocs:deployments-updated', handleSync);
    return () => window.removeEventListener('greendocs:deployments-updated', handleSync);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PUBLISHED_COMMITS_KEY, JSON.stringify(publishedCommits));
    } catch (e) {
      // ignore
    }
  }, [publishedCommits]);

  const handleResetToken = () => {
    resetGitHubConfigToDefault();
    setStatusMessage({
      type: 'success',
      text: 'GitHub credentials successfully reset to default verified token! You can now commit directly.',
    });
  };

  // Execute Direct Push / Delete on GitHub for an individual item
  const handlePublish = async (item: PendingDeployment): Promise<CommitResult> => {
    setPublishingId(item.id);
    const actionLabel =
      item.actionType === 'delete' ? 'Deleting' : item.actionType === 'update' ? 'Updating' : 'Creating';

    setStatusMessage({
      type: 'info',
      text: `${actionLabel} "${item.title}" directly on GitHub repository (${ghConfig.owner}/${ghConfig.repo})...`,
    });

    try {
      const result = await executeDeploymentItem(item);

      if (result.success) {
        // Sync local runtime state
        if (item.actionType === 'delete' && item.cardData?.id) {
          deleteCard(item.cardData.id);
        } else if (item.cardData) {
          saveCustomCard(item.cardData, item.targetPath, '01-hnc');
        }

        // Remove from pending queue
        removePendingDeployment(item.id);
        setPendingDeployments((prev) => prev.filter((d) => d.id !== item.id));

        // Record in published commits history
        const newLog: PublishedCommitLog = {
          id: item.id,
          title: item.title,
          actionType: item.actionType,
          targetPath: item.targetPath,
          filePath: result.filePath || item.filePath,
          commitSha: result.commitSha,
          commitUrl: result.commitUrl,
          timestamp: new Date().toLocaleTimeString(),
        };
        setPublishedCommits((prev) => [newLog, ...prev.slice(0, 19)]);

        const successText =
          item.actionType === 'delete'
            ? `Successfully removed "${item.title}" from GitHub repository!`
            : `Successfully committed "${item.title}" to GitHub main!`;

        setStatusMessage({
          type: 'success',
          text: successText,
          commitUrl: result.commitUrl,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `GitHub Operation Failed: ${result.error || 'Unknown error'}`,
        });
      }

      setPublishingId(null);
      return result;
    } catch (err: any) {
      setPublishingId(null);
      setStatusMessage({
        type: 'error',
        text: `Error during publishing: ${err?.message || 'Network exception'}`,
      });
      return { success: false, error: err?.message };
    }
  };

  // Batch publish all pending items (creates, updates, and deletes) sequentially to GitHub
  const handlePublishAll = async () => {
    if (pendingDeployments.length === 0) return;
    setPublishingAll(true);

    let successCount = 0;
    for (const item of [...pendingDeployments]) {
      const res = await handlePublish(item);
      if (res.success) successCount++;
    }

    setPublishingAll(false);
    setStatusMessage({
      type: 'success',
      text: `Batch processing complete: ${successCount} of ${pendingDeployments.length} operations successfully pushed to GitHub!`,
    });
  };

  const handleTriggerRebuild = async () => {
    setIsTriggeringWorkflow(true);
    setStatusMessage({
      type: 'info',
      text: 'Triggering GitHub Pages deployment workflow on GitHub Actions...',
    });
    const res = await triggerGitHubPagesDeploy();
    setIsTriggeringWorkflow(false);
    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: 'Deploy to GitHub Pages workflow dispatched successfully! Check Actions pipeline below.',
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: `Workflow trigger note: ${res.error || 'Failed to trigger workflow. Verify token permissions.'}`,
      });
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Clear local commit log history?')) {
      setPublishedCommits([]);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 text-left text-slate-200 animate-fadeIn py-4">
      {/* Header Bar */}
      <div className="w-full rounded-xl border border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md p-4 sm:p-5 flex items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/secret-studio')}
            className="h-10 px-3.5 rounded-md border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-200 hover:text-white font-mono text-xs sm:text-[13px] font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
            title="Return to Secret Studio Portal"
          >
            <span>&larr;</span>
            <span>Secret Studio</span>
          </button>
        </div>

        <div className="flex-1 text-center">
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-wide font-mono flex items-center justify-center gap-2">
            <DeploymentsIcon size={18} className="text-emerald-400" />
            <span>Deployments &amp; GitHub Sync Portal</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/home')}
            className="h-10 px-3.5 rounded-md border border-white/[0.08] bg-[#070a0e]/90 hover:border-emerald-500/40 hover:bg-[#0c121a]/95 backdrop-blur-md text-slate-200 hover:text-white font-mono text-xs sm:text-[13px] font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
            title="Return to Documentation /home"
          >
            <span>/home</span>
            <span>&rarr;</span>
          </button>
        </div>
      </div>

      {/* Global Status Message Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl border font-mono text-xs flex items-center justify-between gap-3 shadow-lg ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : statusMessage.type === 'error'
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              : 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-sm shrink-0">
              {statusMessage.type === 'success' ? '✓' : statusMessage.type === 'error' ? '✕' : '⚡'}
            </span>
            <span className="truncate">{statusMessage.text}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {statusMessage.type === 'error' && (
              <button
                type="button"
                onClick={handleResetToken}
                className="px-2.5 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:text-white text-[11px] font-semibold cursor-pointer shrink-0"
              >
                ⚡ Reset Token
              </button>
            )}
            {statusMessage.commitUrl && (
              <a
                href={statusMessage.commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 hover:text-white text-[11px] underline flex items-center gap-1 shrink-0"
              >
                <span>View GitHub Commit</span>
                <span>&rarr;</span>
              </a>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Cards Awaiting Review & Production Push */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                <h2 className="text-sm font-bold text-white font-mono">
                  Pending Production Deployments ({pendingDeployments.length})
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {pendingDeployments.length > 1 && (
                  <button
                    type="button"
                    onClick={handlePublishAll}
                    disabled={publishingAll || publishingId !== null}
                    className="text-[11px] font-mono text-emerald-300 bg-emerald-500/20 hover:bg-emerald-500/30 px-3 py-1 rounded border border-emerald-500/40 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {publishingAll ? 'Processing All...' : `✓ Push All (${pendingDeployments.length}) to GitHub`}
                  </button>
                )}
                <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                  Staging Queue
                </span>
              </div>
            </div>

            {pendingDeployments.length === 0 ? (
              <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0c121a]/40 text-center flex flex-col items-center justify-center gap-3">
                <span className="text-2xl">✨</span>
                <div className="text-xs font-mono text-slate-400">
                  No files or operations pending review. Modify cards or tree hierarchy in Secret Studio to queue changes for GitHub.
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/secret-studio')}
                  className="mt-2 px-4 py-2 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-semibold transition-all cursor-pointer"
                >
                  Go to Secret Studio &amp; Tree Explorer &rarr;
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 font-mono">
                {pendingDeployments.map((item) => {
                  const isPublishingThis = publishingId === item.id;
                  const isDelete = item.actionType === 'delete';
                  const isUpdate = item.actionType === 'update';

                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border flex flex-col gap-3 transition-all ${
                        isDelete
                          ? 'border-rose-500/40 bg-rose-950/15 hover:border-rose-500/60'
                          : isUpdate
                          ? 'border-amber-500/40 bg-amber-950/15 hover:border-amber-500/60'
                          : 'border-emerald-500/30 bg-emerald-950/10 hover:border-emerald-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isDelete ? 'bg-rose-400' : isUpdate ? 'bg-amber-400' : 'bg-emerald-400'
                            }`}
                          ></span>
                          <span className="text-xs font-semibold text-white">{item.title}</span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${
                              isDelete
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                                : isUpdate
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {item.actionType}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.submittedAt}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex flex-col gap-1 bg-[#0c121a]/50 p-2.5 rounded-lg border border-white/[0.04]">
                        <div>
                          Target Route: <span className="text-emerald-300 font-semibold">{item.targetPath}</span>
                        </div>
                        <div>
                          Repository File:{' '}
                          <code className="text-amber-200 text-[10px]">{item.filePath}</code>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Discard "${item.title}" from deployment queue?`)) {
                              removePendingDeployment(item.id);
                              setPendingDeployments((prev) => prev.filter((d) => d.id !== item.id));
                            }
                          }}
                          className="px-2.5 py-1.5 rounded text-[11px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          Discard
                        </button>

                        <button
                          type="button"
                          disabled={isPublishingThis || publishingAll}
                          onClick={() => handlePublish(item)}
                          className={`px-4 py-2 rounded text-black font-semibold text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50 ${
                            isDelete
                              ? 'bg-rose-500 hover:bg-rose-400 text-white'
                              : isUpdate
                              ? 'bg-amber-400 hover:bg-amber-300 text-black'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                          }`}
                        >
                          {isPublishingThis ? (
                            <>
                              <span className="animate-spin text-sm">⏳</span>
                              <span>Processing on GitHub...</span>
                            </>
                          ) : isDelete ? (
                            <>
                              <span>🗑️ Delete File on GitHub</span>
                            </>
                          ) : isUpdate ? (
                            <>
                              <span>⚡ Commit Update to GitHub</span>
                            </>
                          ) : (
                            <>
                              <span>⚡ Commit &amp; Push to GitHub</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Published Commits Log */}
          {publishedCommits.length > 0 && (
            <div className="rounded-xl border border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md p-5 flex flex-col gap-3 shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 font-mono text-xs">✓ Recent GitHub Production Operations</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  Clear Log
                </button>
              </div>

              <div className="flex flex-col gap-2 font-mono text-xs">
                {publishedCommits.map((log) => (
                  <div
                    key={log.id + log.timestamp}
                    className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-950/10 flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold truncate">{log.title}</span>
                        <span className="text-[9px] uppercase px-1 rounded bg-white/[0.06] text-slate-400 border border-white/[0.08]">
                          {log.actionType}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate">{log.filePath}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                      {log.commitUrl && (
                        <a
                          href={log.commitUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2 py-1 rounded bg-white/[0.06] hover:bg-emerald-500/20 text-emerald-300 text-[10px] border border-white/[0.08] transition-colors"
                        >
                          View Commit &rarr;
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: GitHub Repository & Environment Details */}
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="text-xs font-bold text-white font-mono">GitHub Repository Wiring</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Connected
              </span>
            </div>

            <div className="flex flex-col gap-3 font-mono text-xs">
              <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 flex flex-col gap-2">
                <div className="flex items-center justify-between text-white font-semibold">
                  <span>Target Repo</span>
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                    {ghConfig.branch || 'main'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 flex flex-col gap-1">
                  <div>
                    Owner: <span className="text-emerald-400">{ghConfig.owner}</span>
                  </div>
                  <div>
                    Repository: <span className="text-emerald-400">{ghConfig.repo}</span>
                  </div>
                  <div>
                    Token: <span className="text-slate-400 font-mono">ghp_...{ghConfig.token.slice(-4)}</span>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#0c121a]/60 flex flex-col gap-2">
                <div className="text-white font-semibold text-xs">Production Deployment Links</div>
                <div className="flex flex-col gap-1.5 text-[11px]">
                  <a
                    href={`https://github.com/${ghConfig.owner}/${ghConfig.repo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <span>📁 GitHub Repository</span>
                    <span>&nearr;</span>
                  </a>
                  <a
                    href={`https://github.com/${ghConfig.owner}/${ghConfig.repo}/actions`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1"
                  >
                    <span>⚡ GitHub Actions Workflows</span>
                    <span>&nearr;</span>
                  </a>
                  <a
                    href={`https://${ghConfig.owner}.github.io/${ghConfig.repo}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-300 hover:text-emerald-200 transition-colors flex items-center gap-1 font-semibold"
                  >
                    <span>🌐 Live GitHub Pages Site</span>
                    <span>&nearr;</span>
                  </a>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="w-full h-10 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white font-mono text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <span>⚙️</span>
                <span>Configure GitHub Credentials</span>
              </button>

              <button
                type="button"
                disabled={isTriggeringWorkflow}
                onClick={handleTriggerRebuild}
                className="w-full h-10 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 font-mono text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isTriggeringWorkflow ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Triggering Workflow...</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Trigger GitHub Pages Deployment</span>
                  </>
                )}
              </button>

              <a
                href={`https://github.com/${ghConfig.owner}/${ghConfig.repo}/actions`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-slate-300 hover:text-white font-mono text-[11px] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <span>📁</span>
                <span>Open GitHub Actions Pipeline &rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <GitHubSettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </div>
  );
};

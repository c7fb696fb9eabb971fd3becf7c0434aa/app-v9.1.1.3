import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComponentCard } from '../types';
import { saveCustomCard } from '../lib/contentEngine';
import {
  getGitHubConfig,
  commitMarkdownToGitHub,
  serializeCardToMarkdown,
  resolveRepositoryFilePath,
  CommitResult,
} from '../lib/githubSync';
import { DeploymentsIcon } from '../components/studio/DeploymentsIcon';

interface PendingDeployment {
  id: string;
  title: string;
  targetPath: string;
  cardData: ComponentCard;
  submittedAt: string;
}

interface PublishedCommitLog {
  id: string;
  title: string;
  targetPath: string;
  filePath: string;
  commitSha?: string;
  commitUrl?: string;
  timestamp: string;
}

const PENDING_DEPLOYMENTS_KEY = 'greendocs_pending_deployments_v1';
const PUBLISHED_COMMITS_KEY = 'greendocs_published_commits_v1';

export const DeploymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const ghConfig = getGitHubConfig();

  const [pendingDeployments, setPendingDeployments] = useState<PendingDeployment[]>(() => {
    try {
      const raw = localStorage.getItem(PENDING_DEPLOYMENTS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore
    }
    return [];
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
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    commitUrl?: string;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(PENDING_DEPLOYMENTS_KEY, JSON.stringify(pendingDeployments));
    } catch (e) {
      // ignore
    }
  }, [pendingDeployments]);

  useEffect(() => {
    try {
      localStorage.setItem(PUBLISHED_COMMITS_KEY, JSON.stringify(publishedCommits));
    } catch (e) {
      // ignore
    }
  }, [publishedCommits]);

  // Execute Direct Push & Commit to GitHub for an individual card
  const handlePublish = async (item: PendingDeployment): Promise<CommitResult> => {
    setPublishingId(item.id);
    setStatusMessage({
      type: 'info',
      text: `Committing "${item.title}" directly to GitHub repository (${ghConfig.owner}/${ghConfig.repo})...`,
    });

    try {
      const filePath = resolveRepositoryFilePath(
        item.targetPath,
        item.title,
        item.cardData.order || 1
      );
      const markdownContent = serializeCardToMarkdown(item.cardData);
      const commitMessage = `docs(gui): publish "${item.title}" to ${item.targetPath} [skip ci]`;

      const result = await commitMarkdownToGitHub(filePath, markdownContent, commitMessage);

      if (result.success) {
        // Also save to runtime store for instant client hydration
        saveCustomCard(item.cardData, item.targetPath, '01-hnc');

        // Remove from pending review queue
        const updatedPending = pendingDeployments.filter((d) => d.id !== item.id);
        setPendingDeployments(updatedPending);

        // Record in published commits history
        const newLog: PublishedCommitLog = {
          id: item.id,
          title: item.title,
          targetPath: item.targetPath,
          filePath: result.filePath || filePath,
          commitSha: result.commitSha,
          commitUrl: result.commitUrl,
          timestamp: new Date().toLocaleTimeString(),
        };
        setPublishedCommits((prev) => [newLog, ...prev.slice(0, 19)]);

        setStatusMessage({
          type: 'success',
          text: `Successfully pushed & committed "${item.title}" to GitHub main!`,
          commitUrl: result.commitUrl,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `GitHub Commit Failed: ${result.error || 'Unknown error'}`,
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

  // Publish all pending cards sequentially to GitHub
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
      text: `Batch publish complete: ${successCount} of ${pendingDeployments.length} files committed to GitHub!`,
    });
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
          <div className="flex items-center gap-2.5">
            <span className="text-sm">
              {statusMessage.type === 'success' ? '✓' : statusMessage.type === 'error' ? '✕' : '⚡'}
            </span>
            <span>{statusMessage.text}</span>
          </div>
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
                    {publishingAll ? 'Publishing All...' : '✓ Publish All to GitHub'}
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
                  No cards pending deployment. Author new cards in Secret Studio to push them to GitHub.
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/secret-studio')}
                  className="mt-2 px-4 py-2 rounded bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-semibold transition-all cursor-pointer"
                >
                  Go to Secret Studio Editor &rarr;
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3 font-mono">
                {pendingDeployments.map((item) => {
                  const isPublishingThis = publishingId === item.id;
                  const targetFilePath = resolveRepositoryFilePath(
                    item.targetPath,
                    item.title,
                    item.cardData.order || 1
                  );

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/10 flex flex-col gap-3 transition-all hover:border-amber-500/50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                          <span className="text-xs font-semibold text-white">{item.title}</span>
                          <span className="text-[10px] text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded border border-white/[0.08]">
                            {item.cardData.tag || 'Spec'}
                          </span>
                        </div>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                          Ready to Commit
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 flex flex-col gap-1 bg-[#0c121a]/50 p-2.5 rounded-lg border border-white/[0.04]">
                        <div>
                          Target Route: <span className="text-emerald-300 font-semibold">{item.targetPath}</span>
                        </div>
                        <div>
                          Repository Destination:{' '}
                          <code className="text-amber-200 text-[10px]">{targetFilePath}</code>
                        </div>
                        <div className="text-slate-500 text-[10px]">Submitted: {item.submittedAt}</div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Discard card "${item.title}" from deployment queue?`)) {
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
                          className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 shadow-md disabled:opacity-50"
                        >
                          {isPublishingThis ? (
                            <>
                              <span className="animate-spin text-sm">⏳</span>
                              <span>Pushing to GitHub...</span>
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
                  <span className="text-emerald-400 font-mono text-xs">✓ Recent GitHub Production Commits</span>
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
                      <span className="text-white font-semibold truncate">{log.title}</span>
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

            <div className="pt-2">
              <a
                href={`https://github.com/${ghConfig.owner}/${ghConfig.repo}/actions`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-10 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 font-mono text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                <span>Open GitHub Actions Pipeline</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComponentCard } from '../types';
import { saveCustomCard } from '../lib/contentEngine';
import { DeploymentsIcon } from '../components/studio/DeploymentsIcon';

interface PendingDeployment {
  id: string;
  title: string;
  targetPath: string;
  cardData: ComponentCard;
  submittedAt: string;
}

const PENDING_DEPLOYMENTS_KEY = 'greendocs_pending_deployments_v1';

export const DeploymentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [pendingDeployments, setPendingDeployments] = useState<PendingDeployment[]>(() => {
    try {
      const raw = localStorage.getItem(PENDING_DEPLOYMENTS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      // ignore
    }
    return [
      {
        id: 'card-sample-1',
        title: 'Global Invariant Guard',
        targetPath: '/architecture',
        cardData: {
          id: 'card-sample-1',
          title: 'Global Invariant Guard',
          tag: 'Architecture',
          definition: 'Ensures system state consistency across distributed nodes.',
          keyRule: 'Never bypass invariant validation.',
          order: 1,
          pagePath: '/architecture',
          deepDive: { typescriptInterface: 'interface Config {}' },
        },
        submittedAt: '10 mins ago',
      },
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem(PENDING_DEPLOYMENTS_KEY, JSON.stringify(pendingDeployments));
    } catch (e) {
      // ignore
    }
  }, [pendingDeployments]);

  const handlePublish = (item: PendingDeployment) => {
    try {
      saveCustomCard(item.cardData, item.targetPath, '01-hnc');
      const updated = pendingDeployments.filter((d) => d.id !== item.id);
      setPendingDeployments(updated);
      alert(`Card "${item.title}" successfully published to production at ${item.targetPath}!`);
    } catch (e) {
      console.error('Failed to publish deployment', e);
    }
  };

  const handleTriggerRebuild = () => {
    alert('Production build & deployment successfully triggered across global edge CDN clusters!');
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 text-left text-slate-200 animate-fadeIn py-4">
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
            <span>Deployments Portal</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                <h2 className="text-sm font-bold text-white font-mono">
                  Cards Under Review ({pendingDeployments.length})
                </h2>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20">
                Review Queue
              </span>
            </div>

            {pendingDeployments.length === 0 ? (
              <div className="p-8 rounded-xl border border-white/[0.08] bg-[#0c121a]/40 text-center flex flex-col items-center justify-center gap-3">
                <span className="text-2xl">✨</span>
                <div className="text-xs font-mono text-slate-400">
                  No cards pending review. Use <span className="text-emerald-400 font-semibold">Save & Deploy Card</span> in Secret Studio to submit new cards for review.
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
                {pendingDeployments.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/10 flex flex-col gap-3 transition-all hover:border-amber-500/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                        <span className="text-xs font-semibold text-white">{item.title}</span>
                      </div>
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                        Awaiting Final Publish
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex flex-col gap-1">
                      <div>
                        Target Path: <span className="text-amber-300 font-semibold">{item.targetPath}</span>
                      </div>
                      <div>Submitted: {item.submittedAt}</div>
                      <div className="text-slate-500 text-[10px] truncate">Card ID: {item.id}</div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => handlePublish(item)}
                        className="px-4 py-2 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
                      >
                        <span>✓ Publish to Production</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-white/[0.08] bg-[#070a0e]/90 backdrop-blur-md p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <h3 className="text-xs font-bold text-white font-mono">Environment Status</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Operational
              </span>
            </div>

            <div className="flex flex-col gap-3.5 font-mono text-xs">
              <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-950/20 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-white font-semibold">
                  <span>Production Edge</span>
                  <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">v2.4.9-stable</span>
                </div>
                <div className="text-[11px] text-slate-400 flex flex-col gap-0.5">
                  <div>Endpoint: <span className="text-emerald-300">Global CDN</span></div>
                  <div>Latency: 14ms (Edge Cached)</div>
                </div>
              </div>

              <div className="p-3.5 rounded-lg border border-white/[0.08] bg-[#0c121a]/60 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-white font-semibold">
                  <span>Staging Preview</span>
                  <span className="text-[10px] text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded">v2.5.0-beta</span>
                </div>
                <div className="text-[11px] text-slate-400 flex flex-col gap-0.5">
                  <div>Status: Synchronized</div>
                  <div>Last Updated: Just now</div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTriggerRebuild}
                className="w-full h-10 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:text-emerald-200 font-mono text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                <span>Trigger Global Rebuild</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

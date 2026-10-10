import React, { useState } from 'react';
import { getGitHubConfig, saveGitHubConfig, GitHubConfig } from '../../lib/githubSync';

export const GitHubSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const [config, setConfig] = useState<GitHubConfig>(() => {
    return getGitHubConfig() || { owner: '', repo: '', branch: 'main', token: '' };
  });
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveGitHubConfig(config);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-xl border border-white/[0.08] bg-[#070a0e]/95 backdrop-blur-md p-5 shadow-2xl flex flex-col gap-4 text-left font-mono text-slate-200">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <span className="text-sm font-semibold text-white flex items-center gap-2">
            <span>⚡ GitHub Repository Sync Settings</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded border border-white/[0.08] bg-[#070a0e]/90 text-slate-300 hover:text-white flex items-center justify-center cursor-pointer"
          >
            ✕
          </button>
        </div>

        {saved && (
          <div className="p-2 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs text-center">
            GitHub settings saved successfully!
          </div>
        )}

        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">GitHub Owner / Organization *</label>
            <input
              type="text"
              required
              placeholder="e.g. username or organization"
              value={config.owner}
              onChange={(e) => setConfig({ ...config, owner: e.target.value })}
              className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Repository Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. greendocs"
              value={config.repo}
              onChange={(e) => setConfig({ ...config, repo: e.target.value })}
              className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">Branch</label>
            <input
              type="text"
              value={config.branch}
              onChange={(e) => setConfig({ ...config, branch: e.target.value })}
              className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-slate-300">GitHub Personal Access Token (PAT) *</label>
            <input
              type="password"
              required
              placeholder="ghp_xxxxxxxxxxxx"
              value={config.token}
              onChange={(e) => setConfig({ ...config, token: e.target.value })}
              className="bg-[#070a0e]/90 backdrop-blur-md border border-white/[0.08] rounded-md px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-emerald-500/50"
            />
            <span className="text-[10px] text-slate-500 mt-0.5">
              Requires repo scope permission to commit markdown files directly to your repository.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-md border border-white/[0.08] bg-[#070a0e]/90 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-md border border-emerald-500/40 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold text-xs cursor-pointer shadow-sm"
            >
              Save & Connect
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

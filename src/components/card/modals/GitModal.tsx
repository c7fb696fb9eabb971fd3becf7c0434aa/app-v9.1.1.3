import React from 'react';
import { ComponentCard } from '../../../types';

interface GitModalProps {
  card: ComponentCard;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Interactive Git Version History Modal for tracking component evolution and commits.
 */
export const GitModal: React.FC<GitModalProps> = ({ card, isOpen, onClose }) => {
  if (!isOpen) return null;

  const commits = [
    { hash: 'a1b2c3d', author: 'Senior Architect', message: `feat(${card.title}): update specification and type definitions`, time: '2 hours ago' },
    { hash: 'f4e3d2c', author: 'Core Engine', message: `refactor(core): optimize evaluation loop for ${card.tag || 'component'}`, time: 'Yesterday' },
    { hash: '7b8c9d0', author: 'Security Bot', message: `security(guard): enforce strict runtime invariant checks`, time: '3 days ago' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-xl rounded-xl border border-white/[0.08] bg-[#070a0e] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0c121a]">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Git Version History — {card.title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white font-mono text-xs cursor-pointer px-2 py-1 rounded hover:bg-white/[0.06]"
          >
            [ESC]
          </button>
        </div>

        {/* Commit List */}
        <div className="p-4 flex flex-col gap-3 font-mono text-xs max-h-80 overflow-y-auto">
          {commits.map((c, idx) => (
            <div key={idx} className="p-3 rounded-lg border border-white/[0.06] bg-[#0c121a]/60 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-emerald-400 font-semibold">{c.hash}</span>
                <span className="text-slate-500">{c.time}</span>
              </div>
              <div className="text-white font-sans text-xs">{c.message}</div>
              <div className="text-[10px] text-slate-400">Author: {c.author}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-[#0c121a] border-t border-white/[0.08] flex items-center justify-between font-mono text-xs text-slate-400">
          <span>Branch: main (production)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded bg-white/[0.06] hover:bg-white/[0.1] text-white cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

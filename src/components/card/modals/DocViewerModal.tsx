import React, { useEffect, useState } from 'react';
import { ComponentCard } from '../../../types';

interface DocViewerModalProps {
  card: ComponentCard;
  isOpen: boolean;
  onClose: () => void;
}

export const DocViewerModal: React.FC<DocViewerModalProps> = ({
  card,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    const code = card.deepDive?.typescriptInterface || '';
    if (code) {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[88vh] rounded-xl border border-white/[0.1] bg-[#0c121a] shadow-2xl flex flex-col relative text-left overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] p-4 bg-[#070a0e]/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Documentation & Spec</div>
              <h2 id="doc-modal-title" className="text-sm font-semibold text-white truncate">
                {card.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="px-2.5 py-1.5 rounded-lg border border-white/[0.08] hover:border-emerald-500/40 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copy TS</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg border border-white/[0.08] hover:border-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close documentation modal"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable Doc Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-sm text-slate-200">
          {/* Metadata Bar */}
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 border-b border-white/[0.06] pb-3">
            <span className="text-emerald-400 font-semibold">{card.tag}</span>
            <span>&bull;</span>
            <span>ID: {card.id}</span>
            {card.order !== undefined && (
              <>
                <span>&bull;</span>
                <span>Sequence: #{card.order}</span>
              </>
            )}
          </div>

          {/* Definition */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Architectural Concept
            </h3>
            <p className="text-slate-200 bg-white/[0.02] p-3.5 rounded border border-white/[0.04] leading-relaxed">
              {card.definition}
            </p>
          </div>

          {/* Key Rule */}
          {card.keyRule && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-1.5">
                Core Operational Rule
              </h3>
              <div className="p-3.5 rounded bg-emerald-950/20 border border-emerald-500/25 text-emerald-200 font-mono text-xs leading-relaxed">
                {card.keyRule}
              </div>
            </div>
          )}

          {/* TypeScript Signature */}
          <div>
            <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Type Interface Contract
            </h3>
            <pre className="p-3.5 rounded bg-black/60 border border-white/[0.08] font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre leading-relaxed">
              <code>{card.deepDive?.typescriptInterface || '// Standard component interface verified'}</code>
            </pre>
          </div>

          {/* Extended Notes if provided */}
          {card.media?.extendedNotes && (
            <div>
              <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                Detailed Implementation Notes
              </h3>
              <div className="p-3.5 rounded bg-white/[0.02] border border-white/[0.04] text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {card.media.extendedNotes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

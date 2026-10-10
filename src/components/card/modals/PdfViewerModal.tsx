import React, { useEffect } from 'react';
import { ComponentCard } from '../../../types';

interface PdfViewerModalProps {
  card: ComponentCard;
  isOpen: boolean;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  card,
  isOpen,
  onClose,
}) => {
  const media = card.media;
  const pdfUrl = media?.pdfUrl;
  const pdfTitle = media?.pdfTitle || `${card.title} - Reference Sheet`;

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pdf-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl h-[85vh] rounded-xl border border-white/[0.1] bg-[#0c121a] shadow-2xl flex flex-col relative text-left overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] p-4 bg-[#070a0e]/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">PDF Documentation</div>
              <h2 id="pdf-modal-title" className="text-sm font-semibold text-white truncate">
                {pdfTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 rounded-lg border border-white/[0.08] hover:border-emerald-500/40 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print / Save PDF"
            >
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>Print / Export</span>
            </button>

            {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Download</span>
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg border border-white/[0.08] hover:border-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close PDF viewer"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* PDF Body Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-[#05080c] flex justify-center">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              title={pdfTitle}
              className="w-full h-full rounded border border-white/[0.08] bg-white"
            />
          ) : (
            /* High-fidelity printable document view representing the card PDF sheet */
            <div className="w-full max-w-2xl bg-[#0e1622] border border-white/[0.1] rounded-lg p-6 sm:p-10 shadow-xl flex flex-col gap-6 text-slate-200">
              {/* Document Header */}
              <div className="border-b border-white/[0.1] pb-4 flex justify-between items-start">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400">
                    Official Reference Sheet &bull; {card.tag}
                  </span>
                  <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
                    {card.title}
                  </h1>
                </div>
                <div className="text-right text-xs font-mono text-slate-400">
                  <div>Page 1 of 1</div>
                  <div className="text-[10px] text-emerald-400/80">STANDARDIZED SPEC</div>
                </div>
              </div>

              {/* Architectural Definition */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                  Overview & Objective
                </h3>
                <p className="text-sm leading-relaxed text-slate-200 bg-white/[0.02] p-4 rounded border border-white/[0.04]">
                  {card.definition}
                </p>
              </div>

              {/* Key Invariant Rule */}
              {card.keyRule && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                    Key Execution Rule
                  </h3>
                  <div className="text-xs font-mono p-4 rounded bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 leading-relaxed">
                    {card.keyRule}
                  </div>
                </div>
              )}

              {/* TypeScript Interface Specification */}
              <div className="flex flex-col gap-2">
                <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                  TypeScript Signature & Interface
                </h3>
                <pre className="p-4 rounded bg-black/60 border border-white/[0.08] font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre">
                  <code>{card.deepDive?.typescriptInterface || '// Standard component interface verified'}</code>
                </pre>
              </div>

              {/* Extended Notes if attached */}
              {media?.extendedNotes && (
                <div className="flex flex-col gap-2">
                  <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
                    Implementation Notes
                  </h3>
                  <div className="text-xs text-slate-300 whitespace-pre-wrap bg-white/[0.02] p-4 rounded border border-white/[0.04]">
                    {media.extendedNotes}
                  </div>
                </div>
              )}

              {/* Document Footer */}
              <div className="border-t border-white/[0.08] pt-4 flex justify-between items-center text-[11px] font-mono text-slate-500">
                <span>GreenDocs Specification Framework</span>
                <span>Ready for PDF / Print Output</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

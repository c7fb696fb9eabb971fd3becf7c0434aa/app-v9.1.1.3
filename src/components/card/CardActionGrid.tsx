import React, { useState, useRef, useEffect } from 'react';
import { ComponentCard } from '../../types';
import { PlayIcon } from './icons/PlayIcon';
import { PdfIcon } from './icons/PdfIcon';
import { VideoIcon } from './icons/VideoIcon';
import { DocIcon } from './icons/DocIcon';
import { TerminalIcon } from './icons/TerminalIcon';
import { GitIcon } from './icons/GitIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { CopyIcon } from './icons/CopyIcon';
import { ShareIcon } from './icons/ShareIcon';
import { JsonIcon } from './icons/JsonIcon';
import { PrintIcon } from './icons/PrintIcon';
import { SettingsIcon } from './icons/SettingsIcon';

import { AudioPlayerModal } from './modals/AudioPlayerModal';
import { PdfViewerModal } from './modals/PdfViewerModal';
import { VideoPlayerModal } from './modals/VideoPlayerModal';
import { DocViewerModal } from './modals/DocViewerModal';
import { TerminalModal } from './modals/TerminalModal';
import { GitModal } from './modals/GitModal';

interface CardActionGridProps {
  card: ComponentCard;
  className?: string;
}

/**
 * Fully packed productivity Action Grid featuring a horizontal scrollable tunnel ("action tunnel")
 * holding all 12 custom buttons smoothly swipable on mobile and distributed evenly on tablet and desktop.
 */
export const CardActionGrid: React.FC<CardActionGridProps> = ({
  card,
  className = '',
}) => {
  const [activeModal, setActiveModal] = useState<'audio' | 'pdf' | 'video' | 'doc' | 'terminal' | 'git' | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftStartRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const media = card.media;
  const hasAudio = Boolean(media?.audioUrl);
  const hasPdf = Boolean(media?.pdfUrl);
  const hasVideo = Boolean(media?.videoUrl);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleCopySpec = () => {
    const textToCopy = `Component: ${card.title}\nDefinition: ${card.definition}\nKey Rule: ${card.keyRule}\nTypeScript: ${card.deepDive?.typescriptInterface || 'None'}`;
    navigator.clipboard.writeText(textToCopy);
    showToast('Copied component spec & TypeScript interface!');
  };

  const handleToggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    showToast(!isBookmarked ? 'Added component to personal bookmarks!' : 'Removed component from personal bookmarks.');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Component link copied to clipboard for sharing!');
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(card, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${card.id || 'component'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported component card as JSON file!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSettings = () => {
    showToast(`Opening configuration panel for ${card.title}...`);
  };

  // Mouse Drag Handlers for Computer Tunnel Navigation (identical to GlobalPathBar)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!scrollContainerRef.current) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftStartRef.current = scrollContainerRef.current.scrollLeft;
    hasDraggedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(x - startXRef.current) > 5) {
      hasDraggedRef.current = true;
    }
    scrollContainerRef.current.scrollLeft = scrollLeftStartRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  // Suppress button click if user was dragging
  const handleClickCapture = (e: React.MouseEvent) => {
    if (hasDraggedRef.current) {
      e.stopPropagation();
      e.preventDefault();
      hasDraggedRef.current = false;
    }
  };

  // Enable mouse wheel horizontal slide on desktop computer
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 && !e.shiftKey) {
        if (el.scrollWidth > el.clientWidth) {
          e.preventDefault();
          el.scrollLeft += e.deltaY;
        }
      }
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <>
      <div
        className={`h-10 shrink-0 w-full px-2 sm:px-2.5 flex items-center justify-between rounded-md border border-white/[0.08] bg-[#070a0e]/90 shadow-lg shadow-black/50 backdrop-blur-md relative overflow-hidden select-none transition-all duration-200 ${className}`}
        role="toolbar"
        aria-label="Card productivity actions"
      >
        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="absolute -top-9 left-0 right-0 z-20 px-3 py-1 rounded bg-emerald-500/95 text-slate-950 font-mono text-[11px] font-bold text-center shadow-lg animate-fadeIn">
            {toastMessage}
          </div>
        )}

        {/* Horizontal Scrollable Tunnel matching GlobalPathBar sliding & desktop mouse drag */}
        <div
          ref={scrollContainerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onClickCapture={handleClickCapture}
          className="min-w-0 flex-1 flex items-center justify-between gap-1 sm:gap-1.5 overflow-x-auto scrollbar-none whitespace-nowrap w-full h-full py-0 px-0.5 relative touch-pan-x cursor-grab active:cursor-grabbing select-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* 1. Play MP3 Audio Narration */}
          <button
            type="button"
            onClick={() => setActiveModal('audio')}
            aria-label={`Play MP3 audio for ${card.title}`}
            className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] shrink-0 rounded border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50 relative"
            title="Play MP3 Audio"
          >
            <div className="w-[18px] h-[18px] flex items-center justify-center pointer-events-none">
              <PlayIcon size={13} className={hasAudio ? 'text-emerald-400' : ''} />
            </div>
            {hasAudio && (
              <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-400" title="Custom audio attached" />
            )}
          </button>

          {/* 2. PDF Reference Sheet */}
          <button
            type="button"
            onClick={() => setActiveModal('pdf')}
            aria-label={`View ${card.title} PDF reference sheet`}
            className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] shrink-0 rounded border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50 relative"
            title="PDF Reference"
          >
            <div className="w-[18px] h-[18px] flex items-center justify-center pointer-events-none">
              <PdfIcon size={13} className={hasPdf ? 'text-emerald-400' : ''} />
            </div>
            {hasPdf && (
              <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-400" title="Custom PDF attached" />
            )}
          </button>

          {/* 3. Video Walkthrough */}
          <button
            type="button"
            onClick={() => setActiveModal('video')}
            aria-label={`Watch ${card.title} video walkthrough`}
            className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] shrink-0 rounded border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50 relative"
            title="Video Walkthrough"
          >
            <div className="w-[18px] h-[18px] flex items-center justify-center pointer-events-none">
              <VideoIcon size={13} className={hasVideo ? 'text-emerald-400' : ''} />
            </div>
            {hasVideo && (
              <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-400" title="Custom video attached" />
            )}
          </button>

          {/* 4. Documentation & Spec */}
          <button
            type="button"
            onClick={() => setActiveModal('doc')}
            aria-label={`Open full ${card.title} documentation spec`}
            className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] shrink-0 rounded border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50 relative"
            title="Documentation & Spec"
          >
            <div className="w-[18px] h-[18px] flex items-center justify-center pointer-events-none">
              <DocIcon size={13} />
            </div>
          </button>

          {/* 5. Terminal & CLI Test Runner */}
          <button
            type="button"
            onClick={() => setActiveModal('terminal')}
            aria-label={`Run CLI tests and commands for ${card.title}`}
            className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] shrink-0 rounded border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50 relative"
            title="CLI Terminal & Sandbox"
          >
            <div className="w-[18px] h-[18px] flex items-center justify-center pointer-events-none">
              <TerminalIcon size={13} />
            </div>
          </button>

          {/* 6. Git Version History */}
          <button
            type="button"
            onClick={() => setActiveModal('git')}
            aria-label={`View git commit history for ${card.title}`}
            className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] shrink-0 rounded border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50 relative"
            title="Git Version History"
          >
            <div className="w-[18px] h-[18px] flex items-center justify-center pointer-events-none">
              <GitIcon size={13} />
            </div>
          </button>

          {/* 7. Bookmark / Favorite Toggle */}
          <button
            type="button"
            onClick={handleToggleBookmark}
            aria-label={`Bookmark ${card.title}`}
            className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] shrink-0 rounded border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50 relative"
            title="Bookmark Component"
          >
            <div className="w-[18px] h-[18px] flex items-center justify-center pointer-events-none">
              <BookmarkIcon size={13} className={isBookmarked ? 'text-emerald-400 fill-emerald-400/20' : ''} />
            </div>
            {isBookmarked && (
              <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-emerald-400" />
            )}
          </button>

          {/* 8. Copy Spec to Clipboard */}
          <button
            type="button"
            onClick={handleCopySpec}
            aria-label={`Copy spec and TypeScript interface for ${card.title}`}
            className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] shrink-0 rounded border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50 relative"
            title="Copy Spec & TypeScript"
          >
            <div className="w-[18px] h-[18px] flex items-center justify-center pointer-events-none">
              <CopyIcon size={13} />
            </div>
          </button>

          {/* 9. Share Component Link */}
          <button
            type="button"
            onClick={handleShare}
            aria-label={`Share link for ${card.title}`}
            className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] shrink-0 rounded border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50 relative"
            title="Share Link"
          >
            <div className="w-[18px] h-[18px] flex items-center justify-center pointer-events-none">
              <ShareIcon size={13} />
            </div>
          </button>

          {/* 10. Export JSON */}
          <button
            type="button"
            onClick={handleExportJson}
            aria-label={`Export JSON for ${card.title}`}
            className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] shrink-0 rounded border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50 relative"
            title="Export JSON"
          >
            <div className="w-[18px] h-[18px] flex items-center justify-center pointer-events-none">
              <JsonIcon size={13} />
            </div>
          </button>

          {/* 11. Print / PDF Export */}
          <button
            type="button"
            onClick={handlePrint}
            aria-label={`Print ${card.title}`}
            className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] shrink-0 rounded border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50 relative"
            title="Print Document"
          >
            <div className="w-[18px] h-[18px] flex items-center justify-center pointer-events-none">
              <PrintIcon size={13} />
            </div>
          </button>

          {/* 12. Component Settings */}
          <button
            type="button"
            onClick={handleSettings}
            aria-label={`Settings for ${card.title}`}
            className="w-[26px] h-[26px] sm:w-[28px] sm:h-[28px] shrink-0 rounded border border-white/[0.08] bg-[#070a0e]/90 shadow-sm backdrop-blur-md hover:border-emerald-500/40 hover:bg-[#0c121a]/95 text-slate-300 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-1 focus:ring-emerald-500/50 relative"
            title="Component Settings"
          >
            <div className="w-[18px] h-[18px] flex items-center justify-center pointer-events-none">
              <SettingsIcon size={13} />
            </div>
          </button>
        </div>
      </div>

      {/* Interactive Modal Portals */}
      <AudioPlayerModal
        card={card}
        isOpen={activeModal === 'audio'}
        onClose={() => setActiveModal(null)}
      />

      <PdfViewerModal
        card={card}
        isOpen={activeModal === 'pdf'}
        onClose={() => setActiveModal(null)}
      />

      <VideoPlayerModal
        card={card}
        isOpen={activeModal === 'video'}
        onClose={() => setActiveModal(null)}
      />

      <DocViewerModal
        card={card}
        isOpen={activeModal === 'doc'}
        onClose={() => setActiveModal(null)}
      />

      <TerminalModal
        card={card}
        isOpen={activeModal === 'terminal'}
        onClose={() => setActiveModal(null)}
      />

      <GitModal
        card={card}
        isOpen={activeModal === 'git'}
        onClose={() => setActiveModal(null)}
      />
    </>
  );
};

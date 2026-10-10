import React, { useEffect, useState } from 'react';
import { ComponentCard } from '../../../types';

interface VideoPlayerModalProps {
  card: ComponentCard;
  isOpen: boolean;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  card,
  isOpen,
  onClose,
}) => {
  const [isPlayingStep, setIsPlayingStep] = useState(0);
  const media = card.media;
  const videoUrl = media?.videoUrl;
  const videoTitle = media?.videoTitle || `${card.title} - Video Walkthrough`;

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

  // Determine if it's YouTube / external embed
  const isYouTube = videoUrl && (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be'));
  const getEmbedUrl = (url: string) => {
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/');
    }
    if (url.includes('youtu.be/')) {
      return url.replace('youtu.be/', 'youtube.com/embed/');
    }
    return url;
  };

  const interactiveSteps = [
    { title: 'Initialization & Input Acquisition', desc: 'Load memory buffers and validate structuring element dimensions.' },
    { title: 'Kernel Execution Pipeline', desc: 'Perform morphologic transform adhering to boundary clamping invariants.' },
    { title: 'Output Extraction & Verification', desc: 'Verify noise suppression thresholds and return output matrix.' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="video-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-xl border border-white/[0.1] bg-[#0c121a] shadow-2xl flex flex-col relative text-left overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] p-4 bg-[#070a0e]/90">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Video Walkthrough</div>
              <h2 id="video-modal-title" className="text-sm font-semibold text-white truncate">
                {videoTitle}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-white/[0.08] hover:border-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close video player"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Video Viewport */}
        <div className="w-full aspect-video bg-black relative flex items-center justify-center overflow-hidden">
          {videoUrl ? (
            isYouTube ? (
              <iframe
                src={getEmbedUrl(videoUrl)}
                title={videoTitle}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={videoUrl}
                controls
                className="w-full h-full object-contain"
                autoPlay
              />
            )
          ) : (
            /* Animated walkthrough simulation if no raw video file provided */
            <div className="w-full h-full flex flex-col justify-between p-6 bg-gradient-to-br from-[#070a0e] via-[#09111c] to-[#040609] relative">
              <div className="flex items-center justify-between text-xs font-mono text-emerald-400">
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  Visual Algorithm Walkthrough
                </span>
                <span>Step {isPlayingStep + 1} of {interactiveSteps.length}</span>
              </div>

              {/* Animated Canvas Demonstration */}
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4 animate-pulse">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-white mb-1">
                  {interactiveSteps[isPlayingStep].title}
                </h3>
                <p className="text-xs text-slate-300 max-w-md">
                  {interactiveSteps[isPlayingStep].desc}
                </p>
              </div>

              {/* Step Navigation Bar */}
              <div className="flex items-center justify-between border-t border-white/[0.08] pt-3">
                <button
                  type="button"
                  onClick={() => setIsPlayingStep((prev) => Math.max(0, prev - 1))}
                  disabled={isPlayingStep === 0}
                  className="px-3 py-1.5 rounded text-xs font-mono border border-white/[0.08] disabled:opacity-40 hover:border-emerald-500/40 text-slate-300"
                >
                  &larr; Prev Step
                </button>
                <div className="flex gap-1.5">
                  {interactiveSteps.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setIsPlayingStep(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        isPlayingStep === i ? 'w-6 bg-emerald-400' : 'w-2 bg-white/20'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlayingStep((prev) => Math.min(interactiveSteps.length - 1, prev + 1))}
                  disabled={isPlayingStep === interactiveSteps.length - 1}
                  className="px-3 py-1.5 rounded text-xs font-mono border border-white/[0.08] disabled:opacity-40 hover:border-emerald-500/40 text-emerald-400"
                >
                  Next Step &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Video Footer info */}
        <div className="p-3 bg-[#070a0e] border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="truncate max-w-sm">Category: {card.tag}</span>
          <span className="text-[11px] text-slate-500">Attach MP4/YouTube in Developer Studio</span>
        </div>
      </div>
    </div>
  );
};

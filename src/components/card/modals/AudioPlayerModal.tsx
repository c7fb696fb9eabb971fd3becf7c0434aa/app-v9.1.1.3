import React, { useState, useEffect, useRef } from 'react';
import { ComponentCard } from '../../../types';

interface AudioPlayerModalProps {
  card: ComponentCard;
  isOpen: boolean;
  onClose: () => void;
}

export const AudioPlayerModal: React.FC<AudioPlayerModalProps> = ({
  card,
  isOpen,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(90); // default simulated 1m30s
  const [isSpeakingSynth, setIsSpeakingSynth] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const media = card.media;
  const audioUrl = media?.audioUrl;
  const audioTitle = media?.audioTitle || `${card.title} Audio Overview`;

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Clean up Web Speech API on unmount or close
  useEffect(() => {
    if (!isOpen) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeakingSynth(false);
      setIsPlaying(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle playback: if real audioUrl, use HTMLAudio; otherwise, use Web Speech API
  const handleTogglePlay = () => {
    if (audioUrl) {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    } else {
      // Use Web Speech API for instant voice narration
      if ('speechSynthesis' in window) {
        if (isSpeakingSynth) {
          window.speechSynthesis.cancel();
          setIsSpeakingSynth(false);
          setIsPlaying(false);
        } else {
          window.speechSynthesis.cancel();
          const textToSpeak = `${card.title}. Category: ${card.tag}. Definition: ${card.definition}. Key rule: ${card.keyRule}`;
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.rate = playbackRate;
          utterance.onend = () => {
            setIsSpeakingSynth(false);
            setIsPlaying(false);
            setCurrentTime(0);
          };
          utterance.onerror = () => {
            setIsSpeakingSynth(false);
            setIsPlaying(false);
          };
          window.speechSynthesis.speak(utterance);
          setIsSpeakingSynth(true);
          setIsPlaying(true);
        }
      } else {
        setIsPlaying(!isPlaying);
      }
    }
  };

  const handleSpeedToggle = () => {
    const speeds = [1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const newRate = speeds[nextIdx];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
    if (isSpeakingSynth && 'speechSynthesis' in window) {
      // restart synth with new rate
      window.speechSynthesis.cancel();
      const textToSpeak = `${card.title}. Definition: ${card.definition}. Key rule: ${card.keyRule}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = newRate;
      utterance.onend = () => {
        setIsSpeakingSynth(false);
        setIsPlaying(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-white/[0.1] bg-[#0c121a] p-5 sm:p-6 shadow-2xl relative text-left overflow-hidden select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 100-6 3 3 0 000 6z" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-400">Audio Narration</div>
              <h2 id="audio-modal-title" className="text-sm font-semibold text-white truncate">
                {audioTitle}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-white/[0.08] hover:border-white/20 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close audio player"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Real Audio Element if url provided */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            onTimeUpdate={() => {
              if (audioRef.current) {
                setCurrentTime(audioRef.current.currentTime);
                setDuration(audioRef.current.duration || 90);
              }
            }}
            onEnded={() => {
              setIsPlaying(false);
              setCurrentTime(0);
            }}
          />
        )}

        {/* Audio Visualizer Wave Bars (Simulated / Reactive) */}
        <div className="bg-[#070a0e] rounded-lg border border-white/[0.06] p-4 mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
              {audioUrl ? 'Attached Audio File' : 'Neural Voice Narrator'}
            </span>
            <span className="tabular-nums">
              {formatTime(currentTime)} / {media?.audioDuration || formatTime(duration)}
            </span>
          </div>

          {/* Animated Waveform equalizer bars */}
          <div className="flex items-end justify-between gap-1 h-12 py-1 px-2 bg-black/40 rounded border border-white/[0.04]">
            {Array.from({ length: 28 }).map((_, i) => {
              const heightPercent = isPlaying
                ? Math.min(100, Math.max(15, (Math.sin(i * 0.8 + Date.now() / 200) * 0.5 + 0.5) * 100))
                : 20 + ((i % 5) * 12);
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isPlaying ? 'bg-gradient-to-t from-emerald-500 to-emerald-300' : 'bg-slate-700'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
              );
            })}
          </div>

          {/* Transcript / Content Preview */}
          <div className="text-xs text-slate-300 bg-white/[0.02] p-2.5 rounded border border-white/[0.04] leading-relaxed max-h-24 overflow-y-auto">
            <span className="text-emerald-400 font-mono text-[11px] block mb-0.5">Spoken Summary:</span>
            {card.definition}
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleSpeedToggle}
            className="px-2.5 py-1.5 rounded-md border border-white/[0.08] hover:border-emerald-500/40 bg-white/[0.04] hover:bg-white/[0.08] text-xs font-mono text-slate-300 transition-colors cursor-pointer"
            title="Toggle playback speed"
          >
            {playbackRate}x Speed
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all duration-200 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              {isPlaying ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Play Narration</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
              }
              setCurrentTime(0);
            }}
            className="px-2.5 py-1.5 rounded-md border border-white/[0.08] hover:border-white/20 text-xs font-mono text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Replay from start"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

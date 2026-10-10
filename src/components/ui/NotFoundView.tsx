import React from 'react';
import { Link } from 'react-router-dom';

export interface NotFoundViewProps {
  /** The attempted route or path that could not be resolved */
  attemptedPath?: string;
  /** Optional custom CSS classes */
  className?: string;
}

/**
 * Reusable, accessible 404 Not Found fallback view matching the obsidian aesthetic.
 */
export const NotFoundView: React.FC<NotFoundViewProps> = ({
  attemptedPath,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`w-full max-w-xl mx-auto flex flex-col items-center justify-center gap-4 py-16 text-center animate-fadeIn ${className}`}
    >
      <span className="text-xs font-mono text-emerald-400 font-semibold tracking-wider">
        404 · PAGE NOT FOUND
      </span>
      <p className="text-sm text-slate-400 font-sans max-w-md">
        The requested path {attemptedPath ? <code className="text-slate-200 font-mono px-1 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">{attemptedPath}</code> : 'location'} does not exist in the documentation registry.
      </p>
      <Link
        to="/home"
        className="text-xs font-mono text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors"
      >
        &larr; Return to Home
      </Link>
    </div>
  );
};

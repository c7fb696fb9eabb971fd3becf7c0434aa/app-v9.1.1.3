import React, { useState } from 'react';
import { ComponentCard } from '../types';
import { PrimaryCardShell } from './ui/PrimaryCardShell';
import { SubCard } from './ui/SubCard';
import { StraightLineInput } from './ui/StraightLineInput';
import { CardActionGrid } from './card/CardActionGrid';
import { formatStepNumber } from '../constants/pagination';

export interface ContentCardProps {
  /** The component card data to display */
  card: ComponentCard;
  /** Value of the note/command input */
  inputValue?: string;
  /** Callback fired when note input value changes */
  onInputChange?: (value: string) => void;
  /** Callback fired when note command is submitted with Enter key */
  onInputSubmit?: (value: string) => void;
  /** Optional custom CSS classes */
  className?: string;
}

/**
 * Clean, composable documentation card combining the PrimaryCardShell,
 * the reading SubCard (with Specification / TypeScript tabs) on top,
 * the productivity action grid (Audio, PDF, Video, Docs) in the middle,
 * and the lower StraightLineInput subcard at the bottom.
 */
export const ContentCard: React.FC<ContentCardProps> = ({
  card,
  inputValue,
  onInputChange,
  onInputSubmit,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'spec' | 'ts'>('spec');
  const hasTsInterface = Boolean(card.deepDive?.typescriptInterface);

  return (
    <PrimaryCardShell className={className}>
      {/* 1. Primary Top Reading Sub-Card (Content on top) */}
      <SubCard
        role="region"
        ariaLabel={`${card.title} definition and architectural guidelines`}
        className="flex-1 w-full p-3.5 sm:p-4 flex flex-col justify-between overflow-hidden"
      >
        <div className="relative z-10 flex flex-col justify-start gap-2.5 sm:gap-3 text-left h-full">
          {/* Top Bar: Title & Category / Tab Switcher */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
            <div className="flex items-center gap-2 min-w-0">
              {card.order !== undefined && (
                <span className="font-mono text-xs font-semibold text-emerald-400/90 shrink-0">
                  {formatStepNumber(card.order)}
                </span>
              )}
              <span className="font-mono text-xs font-semibold text-emerald-400 truncate">
                {card.title}
              </span>
              {card.tag && (
                <span className="text-[10px] font-mono text-slate-400 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06] shrink-0">
                  {card.tag}
                </span>
              )}
            </div>

            {/* Specification vs TypeScript Switcher */}
            {hasTsInterface && (
              <div className="flex items-center gap-1 font-mono text-[10px] shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTab('spec')}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    activeTab === 'spec'
                      ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Rule
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('ts')}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    activeTab === 'ts'
                      ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  TypeScript
                </button>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto pr-1 text-left text-white text-xs sm:text-[13px] leading-relaxed">
            {activeTab === 'spec' ? (
              <div className="flex flex-col gap-2.5">
                <p className="tracking-normal text-white/95 font-sans">
                  {card.definition}
                </p>
                {card.keyRule && (
                  <div className="rounded border border-emerald-500/20 bg-emerald-950/20 p-2 text-emerald-200/90 font-mono text-[11px] sm:text-xs">
                    <span className="text-emerald-400 font-bold block mb-1">KEY RULE:</span>
                    {card.keyRule}
                  </div>
                )}
              </div>
            ) : (
              <pre className="p-2 rounded bg-black/40 border border-white/[0.06] font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre leading-normal">
                <code>{card.deepDive?.typescriptInterface || '// No TypeScript interface provided for this component'}</code>
              </pre>
            )}
          </div>
        </div>
      </SubCard>

      {/* 2. Middle Productivity Action Grid (Audio/Play, PDF, Video, Docs) */}
      <CardActionGrid card={card} />

      {/* 3. Lower Straight-Line Typing Sub-Card (Search or type grid at the bottom) */}
      <StraightLineInput
        value={inputValue}
        onChange={onInputChange}
        onSubmit={onInputSubmit}
        placeholder="Type notes or commands on a straight line..."
        ariaLabel="Input field for quick notes or commands"
      />
    </PrimaryCardShell>
  );
};

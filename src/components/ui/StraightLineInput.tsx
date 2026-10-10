import React, { useState } from 'react';
import { SubCard } from './SubCard';
import { MAX_NOTE_INPUT_LENGTH, DEFAULT_PROMPT_GLYPH } from '../../constants/interaction';

export interface StraightLineInputProps {
  /** Current controlled value (optional) */
  value?: string;
  /** Initial default value for uncontrolled mode */
  defaultValue?: string;
  /** Change callback */
  onChange?: (value: string) => void;
  /** Submit callback fired on Enter key */
  onSubmit?: (value: string) => void;
  /** Placeholder text. Default: "Type notes or commands on a straight line..." */
  placeholder?: string;
  /** Prompt glyph symbol. Default: ">" */
  promptGlyph?: string;
  /** Maximum character length for safety. Default: 300 */
  maxLength?: number;
  /** Optional custom CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
}

/**
 * Reusable straight-line typing sub-card component.
 * Features secure input handling, keyboard shortcuts (Enter to submit, Escape to clear),
 * gesture event isolation, and matching obsidian glassmorphism.
 */
export const StraightLineInput: React.FC<StraightLineInputProps> = ({
  value: controlledValue,
  defaultValue = '',
  onChange,
  onSubmit,
  placeholder = 'Type notes or commands on a straight line...',
  promptGlyph = DEFAULT_PROMPT_GLYPH,
  maxLength = MAX_NOTE_INPUT_LENGTH,
  className = '',
  ariaLabel = 'Terminal note command input',
}) => {
  const [internalValue, setInternalValue] = useState<string>(defaultValue);
  const isControlled = controlledValue !== undefined;
  const currentValue = isControlled ? controlledValue : internalValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Sanitize and slice to max length
    const sanitized = e.target.value.slice(0, maxLength);
    if (!isControlled) {
      setInternalValue(sanitized);
    }
    onChange?.(sanitized);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent typing events from bubbling to gesture or card listeners
    e.stopPropagation();

    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit?.(currentValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (!isControlled) {
        setInternalValue('');
      }
      onChange?.('');
    }
  };

  return (
    <SubCard
      onClick={(e) => e.stopPropagation()}
      className={`h-10 shrink-0 w-full px-3.5 sm:px-4 flex items-center gap-2.5 ${className}`}
    >
      <span
        aria-hidden="true"
        className="text-zinc-400 font-mono text-xs select-none font-bold"
      >
        {promptGlyph}
      </span>
      <input
        type="text"
        value={currentValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        maxLength={maxLength}
        aria-label={ariaLabel}
        className="w-full bg-transparent text-xs sm:text-[13px] text-slate-200 placeholder:text-slate-500 font-mono outline-none border-none focus:outline-none focus:ring-0 leading-relaxed"
      />
    </SubCard>
  );
};

import React, { useState } from 'react';
import { ComponentCard } from '../../../types';

interface TerminalModalProps {
  card: ComponentCard;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Interactive Terminal Modal for running CLI commands & tests for this component spec.
 */
export const TerminalModal: React.FC<TerminalModalProps> = ({ card, isOpen, onClose }) => {
  const [commandInput, setCommandInput] = useState(`npm test -- --filter="${card.title}"`);
  const [logs, setLogs] = useState<string[]>([
    `[GREEN_CLI v2.4.0] Initialized sandbox session for "${card.title}"`,
    `[INFO] Loading invariant rules and TypeScript definitions...`,
    `[READY] Type a CLI command or press Enter to execute.`
  ]);
  const [isRunning, setIsRunning] = useState(false);

  if (!isOpen) return null;

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    const cmd = commandInput;
    setLogs((prev) => [...prev, `$ ${cmd}`, `[EXEC] Running simulation...`]);
    setIsRunning(true);
    setCommandInput('');

    setTimeout(() => {
      setLogs((prev) => [
        ...prev,
        `[SUCCESS] Command executed with exit code 0.`,
        `[OUTPUT] Component "${card.title}" verified successfully against architecture rulebook.`
      ]);
      setIsRunning(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl rounded-xl border border-white/[0.08] bg-[#070a0e] shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08] bg-[#0c121a]">
          <div className="flex items-center gap-2 font-mono text-xs text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>CLI Terminal & Sandbox — {card.title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white font-mono text-xs cursor-pointer px-2 py-1 rounded hover:bg-white/[0.06]"
          >
            [ESC]
          </button>
        </div>

        {/* Terminal Output Logs */}
        <div className="p-4 bg-[#030508] font-mono text-xs text-emerald-300 h-64 overflow-y-auto flex flex-col gap-1.5 select-text">
          {logs.map((log, idx) => (
            <div key={idx} className={log.startsWith('$') ? 'text-white font-semibold' : ''}>
              {log}
            </div>
          ))}
          {isRunning && <div className="text-amber-400 animate-pulse">[RUNNING...]</div>}
        </div>

        {/* Terminal Input Form */}
        <form onSubmit={handleRunCommand} className="flex items-center gap-2 p-3 bg-[#0c121a] border-t border-white/[0.08]">
          <span className="font-mono text-xs text-emerald-400 font-bold">$</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type command (e.g. npm test, build, verify)..."
            className="flex-1 bg-transparent border-none outline-none font-mono text-xs text-white placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={isRunning}
            className="px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-mono text-xs cursor-pointer font-semibold disabled:opacity-50"
          >
            Run
          </button>
        </form>
      </div>
    </div>
  );
};

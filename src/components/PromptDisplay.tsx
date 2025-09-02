import { useAppSelector } from "../app/hooks";
import { StaticTerminal } from "./StaticTerminal";

interface PromptDisplayProps {
  fallback?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PromptDisplay({
  fallback = "$",
  className = "",
  children,
}: PromptDisplayProps) {
  // Pull latest prompt from terminalHistory; fallback to provided prop
  const latestPrompt = useAppSelector((state) => {
    const latest = state.terminalHistory?.latestPrompt;
    if (latest && latest.trim().length > 0) return latest;
    const entries = state.terminalHistory?.entries ?? [];
    if (entries.length === 0) return undefined;
    return entries[entries.length - 1]?.prompt;
  });
  const displayPrompt = (latestPrompt?.trim()) || fallback;

  return (
    <div className={`not-prose border rounded-xl overflow-hidden bg-ctp-base border-ctp-surface1 ${className}`}>
      <div className="relative bg-ctp-mantle mocha p-4">
        <StaticTerminal
          content={displayPrompt}
          className="text-sm font-mono text-ctp-text"
        />
      </div>
      {children}
    </div>
  );
}

import { ReactNode } from "react";
import { XCircle, CheckCircle, Sparkles, RotateCcw } from "lucide-react";
import { Button } from "../DesignSystem/Button";
import { Link } from "@tanstack/react-router";
import { useOllamaHelp } from "../../features/Terminal/useOllamaHelp";

import { ExecutionResult } from "./commandUtils";
import { CommandBlock } from "./CommandBlock";

interface CommandWithAIProps {
  command: string;
  title: string;
  icon?: ReactNode;
  borderColor?: string;
  headerButtons?: ReactNode;
  statusBar?: ReactNode;
  className?: string;
  copied: boolean;
  onCopy?: () => void;
  result?: ExecutionResult | null;
  onDismissResult?: () => void;
  cwd?: string;
}

export function CommandWithAI({
  command,
  title,
  icon,
  borderColor,
  headerButtons,
  statusBar,
  className = "",
  copied,
  onCopy,
  result,
  onDismissResult,
  cwd = "",
}: CommandWithAIProps) {
  const {
    getSuggestion,
    suggestion,
    isLoading: isGettingSuggestion,
    error: suggestionError,
    clearSuggestion,
    lastPrompt,
  } = useOllamaHelp();

  const handleAskForHelp = async () => {
    if (!result || result.exitCode === 0) return;
    await getSuggestion(command, result.output, result.exitCode, cwd);
  };

  const handleRetryAiHelp = async () => {
    if (!result || result.exitCode === 0) return;
    clearSuggestion();
    await getSuggestion(command, result.output, result.exitCode, cwd);
  };

  // Determine border color based on result
  // Format duration for display
  const formatDuration = (ms: number): string => {
    if (ms < 1000) {
      return `${Math.round(ms)}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(1);
      return `${minutes}m ${seconds}s`;
    }
  };

  let computedBorderColor = borderColor;
  if (result) {
    computedBorderColor =
      result.exitCode !== -1
        ? result.exitCode === 0
          ? "border-ctp-green"
          : "border-ctp-red"
        : "border-ctp-surface0";
  }

  // Enhanced status bar with result info
  let enhancedStatusBar = statusBar;
  // -1 => command still running
  if (result && result.exitCode !== -1) {
    const resultStatusBar = (
      <div className="flex items-center justify-between ml-2">
        <div
          className={`flex items-center gap-2 text-xs font-mono ${
            result.exitCode === 0 ? "text-ctp-green" : "text-ctp-red"
          }`}
        >
          {result.exitCode === 0 ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <XCircle className="w-4 h-4" />
          )}
          <span>Exit: {result.exitCode}</span>
          <span className="text-ctp-subtext0">
            at {result.timestamp.toLocaleTimeString()} • took{" "}
            {formatDuration(result.duration)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Show Ask for Help button only for failed commands and when no suggestion exists and no suggestion error */}
          {result.exitCode !== 0 && !suggestion && !suggestionError && (
            <Button
              variant="secondary"
              onPress={handleAskForHelp}
              isDisabled={isGettingSuggestion}
              className={`flex items-center gap-2 ${isGettingSuggestion ? "animate-pulse" : ""}`}
              aria-label="Ask AI for help"
            >
              <Sparkles className="w-4 h-4" />
              {isGettingSuggestion ? "Generating..." : "Ask for help"}
            </Button>
          )}
          {onDismissResult && (
            <Button
              variant="secondary"
              onPress={onDismissResult}
              className="flex items-center gap-1"
              aria-label="Dismiss result"
            >
              <XCircle className="w-4 h-4" /> Dismiss
            </Button>
          )}
        </div>
      </div>
    );
    enhancedStatusBar = statusBar || resultStatusBar;
  }

  return (
    <>
      <CommandBlock
        command={command}
        title={title}
        icon={icon}
        borderColor={computedBorderColor}
        headerButtons={headerButtons}
        statusBar={enhancedStatusBar}
        className={className}
        copied={copied}
        onCopy={onCopy}
      >
        {/* AI Suggestion */}
        {suggestion && (
          <div className="not-prose p-4 bg-ctp-base">
            <div className="flex items-start gap-4">
              {/* AI icon */}
              <div className="flex-shrink-0 mt-1">
                <div className="bg-ctp-mauve-900 p-2 rounded-full shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-ctp-mauve">
                    {suggestion.model}
                  </h4>
                  <div className="flex-1 h-px bg-gradient-to-r from-ctp-mauve/30 to-transparent" />
                </div>

                {/* Show the prompt that was sent to AI as a learning tool */}
                {lastPrompt && (
                  <details className="my-2 group">
                    <summary className="cursor-pointer text-xs text-ctp-subtext0 hover:text-ctp-subtext1 transition-colors select-none">
                      <span className="inline-flex items-center gap-1">
                        View prompt sent to Ollama
                      </span>
                    </summary>
                    <div className="mt-2 p-3 bg-ctp-surface0/50 rounded-lg border border-ctp-lavender/10 shadow-sm">
                      <pre className="text-xs text-ctp-text whitespace-pre-wrap font-mono leading-relaxed overflow-x-auto">
                        {lastPrompt.trim()}
                      </pre>
                    </div>
                  </details>
                )}
                <div className="prose prose-sm max-w-none">
                  <div className="text-sm text-ctp-text leading-relaxed whitespace-pre-wrap p-3 bg-ctp-surface0/50 rounded-lg border border-ctp-lavender/10 shadow-sm">
                    {suggestion.suggestion}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2 text-xs text-ctp-subtext0">
                    <span>
                      Generated at {suggestion.timestamp.toLocaleTimeString()}
                      {suggestion.generationTime && (
                        <span className="ml-2">
                          • took {formatDuration(suggestion.generationTime)}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      onPress={handleAskForHelp}
                      isDisabled={isGettingSuggestion}
                      className={`flex items-center gap-1 text-xs px-2 py-1 opacity-70 hover:opacity-100 transition-opacity ${isGettingSuggestion ? "animate-pulse" : ""}`}
                      aria-label="Get new suggestion"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>
                        {isGettingSuggestion ? "Generating..." : "Reroll"}
                      </span>
                    </Button>
                    <Button
                      variant="secondary"
                      onPress={clearSuggestion}
                      className="flex items-center gap-1 text-xs px-2 py-1 opacity-70 hover:opacity-100 transition-opacity"
                      aria-label="Clear suggestion"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Dismiss</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* AI Error */}
        {suggestionError && (
          <div className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <div className="bg-ctp-red p-2 rounded-full shadow-lg">
                  <XCircle className="w-4 h-4 text-white" />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-3">
                  <h4 className="text-sm font-semibold text-ctp-red">
                    ⚠️ AI Assistant Unavailable
                  </h4>
                  <div className="flex-1 h-px bg-gradient-to-r from-ctp-red/30 to-transparent" />
                </div>

                <div className="text-sm text-ctp-text p-3 bg-ctp-surface0/50 rounded-lg border border-ctp-red/10">
                  {suggestionError.includes("404") ? (
                    <>
                      The AI model isn't available. You can download it by
                      running{" "}
                      <code className="text-ctp-text bg-ctp-surface1 px-1.5 py-0.5 rounded text-xs font-mono">
                        ollama pull qwen3:8b
                      </code>
                      . Check out the{" "}
                      <Link
                        to="/docs/$"
                        params={{ _splat: "2-ollama-help.mdx" }}
                        className="text-ctp-blue hover:underline"
                      >
                        Ollama tutorial
                      </Link>{" "}
                      for more information.
                    </>
                  ) : (
                    <>
                      Looks like we weren't able to call Ollama. Please make
                      sure Ollama is running. If you haven't already, visit the{" "}
                      <Link
                        to="/docs/$"
                        params={{ _splat: "2-ollama-help.mdx" }}
                        className="text-ctp-blue hover:underline"
                      >
                        Ollama tutorial
                      </Link>{" "}
                      for help with installation and setup.
                    </>
                  )}
                </div>

                <div className="flex justify-end mt-3 gap-2">
                  <Button
                    variant="secondary"
                    onPress={handleRetryAiHelp}
                    isDisabled={isGettingSuggestion}
                    className={`flex items-center gap-1 text-xs px-2 py-1 ${isGettingSuggestion ? "animate-pulse" : ""}`}
                    aria-label="Retry AI help"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{isGettingSuggestion ? "Retrying..." : "Retry"}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    onPress={clearSuggestion}
                    className="flex items-center gap-1 text-xs px-2 py-1"
                    aria-label="Clear error"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Dismiss</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CommandBlock>
    </>
  );
}

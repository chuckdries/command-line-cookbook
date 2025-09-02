import { useState } from "react";
import { Terminal, FileText } from "lucide-react";
import { useTerminalContext } from "../features/Terminal/useTerminalContext";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  dismissEntry,
  selectMostRecentExecution,
} from "../features/Terminal/terminalHistorySlice";
import { Button } from "./DesignSystem/Button";
import { CommandWithAI } from "./shared/CommandWithAI";
import {
  normalizeQuotes,
  copyToClipboard,
  ExecutionResult,
  // highlightCode,
} from "./shared/commandUtils";

interface CodeBlockProps {
  children: string;
  className?: string;
  language?: string;
  isShellInteractive?: boolean;
}

export function CodeBlock({
  children,
  className = "",
  language = "text",
  isShellInteractive = false,
}: CodeBlockProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { runCaptured, setPanelVisible, writeToPty, cwd } =
    useTerminalContext();
  const dispatch = useAppDispatch();

  const code = children.trim();
  const normalizedCode = isShellInteractive ? normalizeQuotes(code) : code;

  // Use the selector to get the most recent execution result for this command (only for shell commands)
  const executionResult = useAppSelector(
    selectMostRecentExecution(normalizedCode),
  );

  console.log("executionResult", executionResult);

  // Convert the execution result to the format expected by CommandWithAI
  const result: ExecutionResult | null = executionResult
    ? {
        output: executionResult.output,
        exitCode: executionResult.exitCode,
        timestamp: executionResult.timestamp,
        duration: executionResult.duration,
      }
    : null;

  // Check if the command is currently running
  const isRunning = executionResult?.isRunning || false;

  const handleExecute = async () => {
    if (!isShellInteractive) return;

    setIsExecuting(true);
    setPanelVisible(true);

    // give the terminal time to resize after opening the panel
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      await runCaptured(normalizedCode);
      // The result will now come from the selector, so we don't need to set local state
    } catch (error) {
      console.log("Error during execution:", error);
      // Note: We don't set a local error result here since the selector will handle it
      // The error will be recorded in the terminal history and picked up by the selector
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(code);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDismiss = () => {
    if (!isShellInteractive) return;
    if (executionResult?.id) {
      console.log("dismissing", executionResult);
      dispatch(dismissEntry(executionResult.id));
    }
  };

  const handleWriteToTerminal = () => {
    if (!isShellInteractive) return;
    setPanelVisible(true);
    writeToPty(normalizedCode);
  };

  // For interactive blocks, use the full CommandWithAI component
  let headerButtons = null;
  if (isShellInteractive) {
    headerButtons = (
      <>
        <Button
          variant="secondary"
          onPress={handleWriteToTerminal}
          className="flex items-center gap-1"
          aria-label="Insert into terminal"
        >
          <FileText className="w-4 h-4" />
          Insert
        </Button>
        <Button
          variant="primary"
          onPress={handleExecute}
          isDisabled={isExecuting || isRunning}
          className="flex items-center gap-1"
        >
          <Terminal className="w-4 h-4" />
          {isExecuting ? "Running..." : isRunning ? "Already Running" : "Run"}
        </Button>
      </>
    );
  }

  return (
    <CommandWithAI
      command={normalizedCode}
      title={language}
      headerButtons={headerButtons}
      className={className}
      copied={copied}
      onCopy={handleCopy}
      result={result}
      onDismissResult={handleDismiss}
      cwd={cwd}
    />
  );
}

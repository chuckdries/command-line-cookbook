import { useState, useEffect } from "react";
import {
  Terminal,
  Package,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  FileText,
} from "lucide-react";
import { useTerminalContext } from "../features/Terminal/useTerminalContext";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectMostRecentExecution, dismissEntry } from "../features/Terminal/terminalHistorySlice";
import { Button } from "./DesignSystem/Button";
import { CommandWithAI } from "./shared/CommandWithAI";
import {
  normalizeQuotes,
  copyToClipboard,
  ExecutionResult,
} from "./shared/commandUtils";
import { invoke } from "@tauri-apps/api/core";

interface InstallBlockProps {
  installCommand: string;
  binaryName: string;
  className?: string;
}

interface BinaryCheckState {
  isInstalled: boolean | null; // null = loading, true = installed, false = not installed
  isChecking: boolean;
  error: string | null;
}

export function InstallBlock({
  installCommand,
  binaryName,
  className = "",
}: InstallBlockProps) {
  const [binaryState, setBinaryState] = useState<BinaryCheckState>({
    isInstalled: null,
    isChecking: true,
    error: null,
  });
  const [copied, setCopied] = useState(false);
  const { setPanelVisible, runCaptured, cwd } = useTerminalContext();
  const dispatch = useAppDispatch();

  const normalizedCommand = normalizeQuotes(installCommand.trim());

  // Use the selector to get the most recent execution result for this command
  const executionResult = useAppSelector(
    selectMostRecentExecution(normalizedCommand),
  );

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
  const isExecuting = executionResult?.isRunning || false;

  const checkBinaryExists = async () => {
    setBinaryState((prev) => ({ ...prev, isChecking: true, error: null }));

    try {
      const exists = await invoke<boolean>("check_binary_exists", {
        binaryName: binaryName.trim(),
      });
      setBinaryState({
        isInstalled: exists,
        isChecking: false,
        error: null,
      });
    } catch (error) {
      setBinaryState({
        isInstalled: null,
        isChecking: false,
        error:
          error instanceof Error ? error.message : "Failed to check binary",
      });
    }
  };

  // Check binary existence on mount
  useEffect(() => {
    checkBinaryExists();
  }, [binaryName]);

  // After any command execution, recheck if binary exists
  useEffect(() => {
    if (executionResult && !executionResult.isRunning) {
      const timer = setTimeout(() => checkBinaryExists(), 200);
      return () => clearTimeout(timer);
    }
  }, [executionResult]);

  const handleWriteToTerminal = () => {
    setPanelVisible(true);
    runCaptured(normalizedCommand);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(normalizedCommand);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDismissResult = () => {
    if (executionResult?.id) {
      dispatch(dismissEntry(executionResult.id));
    }
  };

  const getStatusDisplay = () => {
    if (binaryState.isChecking) {
      return {
        icon: <RefreshCw className="w-4 h-4 animate-spin text-ctp-blue" />,
        text: "Checking installation...",
        color: "text-ctp-blue",
      };
    }

    if (binaryState.error) {
      return {
        icon: <AlertCircle className="w-4 h-4 text-ctp-yellow" />,
        text: "Unable to check installation status",
        color: "text-ctp-yellow",
      };
    }

    if (binaryState.isInstalled === true) {
      return {
        icon: <CheckCircle className="w-4 h-4 text-ctp-green" />,
        text: `${binaryName} is installed`,
        color: "text-ctp-green",
      };
    }

    if (binaryState.isInstalled === false) {
      return {
        icon: <Package className="w-4 h-4 text-ctp-subtext0" />,
        text: `${binaryName} is not installed`,
        color: "text-ctp-subtext0",
      };
    }

    return {
      icon: <Package className="w-4 h-4 text-ctp-subtext0" />,
      text: "Installation status unknown",
      color: "text-ctp-subtext0",
    };
  };

  const status = getStatusDisplay();
  const isAlreadyInstalled = binaryState.isInstalled === true;

  // Determine border color based on installation status and result
  let borderColor = "border-ctp-surface1";
  if (result) {
    borderColor = result.exitCode === 0 ? "border-ctp-green" : "border-ctp-red";
  } else if (isAlreadyInstalled) {
    borderColor = "border-ctp-green";
  }

  const headerButtons = (
    <>
      {!isAlreadyInstalled && (
        <Button
          variant="secondary"
          onPress={handleWriteToTerminal}
          className="flex items-center gap-1"
          aria-label="Write to terminal"
        >
          <FileText className="w-4 h-4" />
          Write
        </Button>
      )}
      <Button
        variant="primary"
        onPress={handleWriteToTerminal}
        isDisabled={isExecuting || isAlreadyInstalled}
        className="flex items-center gap-1"
      >
        <Terminal className="w-4 h-4" />
        {isExecuting ? "Running..." : "Run"}
      </Button>
    </>
  );

  const statusBar = (
    <div className="flex items-center justify-between ml-2">
      <div className={`flex items-center gap-2 text-sm ${status.color}`}>
        {status.icon}
        <span>{status.text}</span>
      </div>
      <div className="flex items-center gap-2">
        {(binaryState.error || binaryState.isInstalled !== null) && (
          <Button
            variant="secondary"
            onPress={checkBinaryExists}
            isDisabled={binaryState.isChecking}
            className="flex items-center gap-1"
            aria-label="Recheck installation status"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                binaryState.isChecking ? "animate-spin" : ""
              }`}
            />
            {binaryState.isChecking ? "Checking..." : "Check Again"}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <CommandWithAI
      command={normalizedCommand}
      title="Installation Command"
      borderColor={borderColor}
      headerButtons={headerButtons}
      statusBar={statusBar}
      className={className}
      copied={!isAlreadyInstalled && copied}
      onCopy={!isAlreadyInstalled ? handleCopy : undefined}
      result={result}
      onDismissResult={handleDismissResult}
      cwd={cwd}
    />
  );
}

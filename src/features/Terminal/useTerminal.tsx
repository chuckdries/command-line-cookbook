import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ITheme, Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { invoke } from "@tauri-apps/api/core";
import { useResizeObserver } from "../../components/useResizeObserver";
import { stripAnsi } from "./ansi";
import { useAppDispatch } from "../../app/hooks";
import {
  recordRun,
  setLatestPrompt,
  startCommand,
} from "./terminalHistorySlice";
export const theme: ITheme = {
  background: "#181825",
  foreground: "#c4b5f2",
};
export function useTerminal() {
  const dispatch = useAppDispatch();
  const termRef = useRef<HTMLDivElement>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const instanceInit = useRef(false);
  const [cwd, setCwd] = useState<string>("");
  const [lastCommand, setLastCommand] = useState<{
    output: string;
    exitCode: number;
  } | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>("");
  const [instance] = useState(
    new Terminal({
      fontFamily: "Jetbrains Mono",
      fontSize: 14,
      theme: theme,
    }),
  );
  const [fitAddon] = useState(new FitAddon());
  const animationFrameRef = useRef<number | null>(null);

  // Streaming parser state
  const collectingRef = useRef<boolean>(false);
  const lastExitCodeRef = useRef<number>(0);
  const pendingCaptureResolveRef = useRef<
    null | ((r: { output: string; exitCode: number }) => void)
  >(null);
  const commandInProgressRef = useRef<boolean>(false);
  // Marker-based capture state
  const startMarkerRef = useRef<ReturnType<Terminal["registerMarker"]> | null>(
    null,
  );
  const promptStartMarkerRef = useRef<ReturnType<
    Terminal["registerMarker"]
  > | null>(null);
  const promptLastLineRef = useRef<string>("");
  const promptFinalizeTimerRef = useRef<number | null>(null);

  // High-level captured details
  const [lastUserPrompt, setLastUserPrompt] = useState<string>("");
  const [lastUserCommand, setLastUserCommand] = useState<string>("");
  const lastUserPromptRef = useRef<string>("");
  const lastUserCommandRef = useRef<string>("");
  const commandStartTimeRef = useRef<string>(""); // Track when command execution starts

  // Prompt parsing state
  const collectingPromptRef = useRef<boolean>(false);
  const promptBufferRef = useRef<string>("");

  const writeToPty = useCallback((data: string) => {
    invoke("async_write_to_pty", { data });
  }, []);

  const writeToTerminal = useCallback(
    (data: string) => {
      instance?.write(data);
    },
    [instance],
  );

  // Helper: send a line to the PTY (appends newline)
  const runCommand = useCallback(
    (cmd: string) => {
      writeToPty(cmd + "\n");
    },
    [writeToPty],
  );

  // Helper: run command and resolve with the next completed command's output
  const runCaptured = useCallback(
    (cmd: string) => {
      if (pendingCaptureResolveRef.current) {
        return Promise.reject(
          new Error("A captured command is already pending"),
        );
      }
      return new Promise<{ output: string; exitCode: number }>((resolve) => {
        // Clear any stale state first
        collectingRef.current = false;
        lastExitCodeRef.current = 0;
        commandInProgressRef.current = false;

        pendingCaptureResolveRef.current = resolve;

        // Handle multiline commands using bracketed paste mode
        // This ensures the entire block executes as one unit by wrapping it in
        // bracketed paste sequences that shells understand
        if (cmd.includes("\n")) {
          // Use bracketed paste mode to send multiline content as a single unit
          // This is the standard way terminal emulators handle multiline pastes
          const bracketedPasteStart = "\x1b[200~"; // Start bracketed paste
          const bracketedPasteEnd = "\x1b[201~"; // End bracketed paste
          const multilineCmd = `${bracketedPasteStart}${cmd}${bracketedPasteEnd}`;
          runCommand(multilineCmd);
        } else {
          runCommand(cmd);
        }
      });
    },
    [runCommand],
  );

  // Handle OSC 133 sequences using xterm.js built-in parser
  const handleOsc133 = useCallback(
    (data: string) => {
      // Shell integration markers
      if (data.startsWith("A")) {
        // Prompt start - mark prompt start in buffer and begin prompt collection
        try {
          promptStartMarkerRef.current = instance.registerMarker(0);
        } catch {
          promptStartMarkerRef.current = null;
        }
        collectingPromptRef.current = true;
        promptBufferRef.current = "";
        if (!pendingCaptureResolveRef.current) {
          collectingRef.current = false;
        }

        // Clear any existing timer
        if (promptFinalizeTimerRef.current) {
          clearTimeout(promptFinalizeTimerRef.current);
          promptFinalizeTimerRef.current = null;
        }

        // If 'B' doesn't arrive quickly (e.g., initial bash prompt), finalize from buffer
        promptFinalizeTimerRef.current = window.setTimeout(() => {
          if (collectingPromptRef.current) {
            const prompt = (promptBufferRef.current || "").trimEnd();
            setCurrentPrompt(prompt);
            setLastUserPrompt(prompt);
            lastUserPromptRef.current = prompt;
            dispatch(setLatestPrompt(prompt));
            const parts = prompt.split("\n");
            promptLastLineRef.current = parts.length
              ? parts[parts.length - 1]
              : "";
            collectingPromptRef.current = false;
            promptStartMarkerRef.current = null;
          }
        }, 200);
      } else if (data.startsWith("B")) {
        // Prompt end / Command input begins
        // zsh: B is emitted by PS1 before the user types → capture prompt between A..B via markers.

        // const wasCollecting = collectingPromptRef.current;
        collectingPromptRef.current = false;
        if (promptFinalizeTimerRef.current) {
          clearTimeout(promptFinalizeTimerRef.current);
          promptFinalizeTimerRef.current = null;
        }
        // if (!wasCollecting) {
        //   // Prompt likely already finalized via timer; avoid recomputing
        //   console.log("B marker received but prompt already finalized");
        //   promptStartMarkerRef.current = null;
        //   return true;
        // }
        try {
          const endMarker = instance.registerMarker(0);
          const startLine = promptStartMarkerRef.current?.line ?? null;
          const endLine = endMarker?.line ?? null;
          const buffer = instance.buffer.active;
          let prompt = "";

          if (startLine !== null && endLine !== null && endLine >= startLine) {
            const lines: string[] = [];
            for (let i = startLine; i <= endLine; i++) {
              const line = buffer.getLine(i);
              if (line) {
                lines.push(line.translateToString(true));
              }
            }
            prompt = lines.join("\n").trimEnd();
          } else {
            // Fallback to streamed buffer if markers unavailable
            prompt = (promptBufferRef.current || "").trimEnd();
          }

          // Only update if we got a meaningful prompt
          if (prompt && prompt !== ">>") {
            setCurrentPrompt(prompt);
            setLastUserPrompt(prompt);
            lastUserPromptRef.current = prompt;
            dispatch(setLatestPrompt(prompt));
            const parts = prompt.split("\n");
            promptLastLineRef.current = parts.length
              ? parts[parts.length - 1]
              : "";
          } else {
            console.warn("Ignoring invalid or empty prompt:", { prompt });
          }
        } catch {
          const prompt = (promptBufferRef.current || "").trimEnd();

          // Only update if we got a meaningful prompt
          if (prompt && prompt !== ">>") {
            setCurrentPrompt(prompt);
            setLastUserPrompt(prompt);
            lastUserPromptRef.current = prompt;
            dispatch(setLatestPrompt(prompt));
            const parts = prompt.split("\n");
            promptLastLineRef.current = parts.length
              ? parts[parts.length - 1]
              : "";
          } else {
            console.warn("Ignoring invalid or empty fallback prompt:", {
              prompt,
            });
          }
        } finally {
          promptStartMarkerRef.current = null;
        }

        // B marker just indicates user can now type - don't start tracking yet
        // We'll start tracking when we get the C marker (command execution)
      } else if (data.startsWith("C")) {
        // Command executed - capture the entered command and start output capture
        // Note: we record timestamps on completion for now
        try {
          // For PowerShell, the command line is typically the current line (0 offset)
          // For other shells, it might be the previous line (-1 offset)
          // Try current line first, then previous line as fallback
          let cmdLineMarker = instance.registerMarker(-1);
          let lineIndex = cmdLineMarker?.line ?? null;
          let lineText = "";

          if (lineIndex !== null) {
            const line = instance.buffer.active.getLine(lineIndex);
            lineText = line?.translateToString(true) ?? "";
          }

          // If current line doesn't look like a command line, try previous line
          const knownPromptLine =
            lastUserPromptRef.current.split("\n").slice(-1)[0] || "";
          if (
            lineText &&
            !lineText.includes(knownPromptLine) &&
            knownPromptLine
          ) {
            // Try previous line instead
            cmdLineMarker = instance.registerMarker(-1);
            lineIndex = cmdLineMarker?.line ?? null;
            if (lineIndex !== null) {
              const line = instance.buffer.active.getLine(lineIndex);
              lineText = line?.translateToString(true) ?? "";
            }
          }

          if (lineIndex !== null && lineText) {
            // Extract command by removing the prompt portion
            let cmd = "";
            if (knownPromptLine && lineText.includes(knownPromptLine)) {
              // Find the prompt in the line and extract everything after it
              const promptIndex = lineText.indexOf(knownPromptLine);
              if (promptIndex !== -1) {
                cmd = lineText
                  .slice(promptIndex + knownPromptLine.length)
                  .trim();
              } else {
                cmd = lineText.trim();
              }
            } else {
              // No known prompt, or prompt doesn't match - this might be a bare command
              // In PowerShell, this could happen if the prompt detection failed
              cmd = lineText.trim();
            }

            setLastUserCommand(cmd);
            lastUserCommandRef.current = cmd;
          }
        } catch (error) {
          console.warn("Failed to extract command (step C):", error);
        }

        // Start collecting output for all commands (captured and interactive)
        try {
          startMarkerRef.current = instance.registerMarker(-1);
        } catch {
          startMarkerRef.current = null;
        }
        collectingRef.current = true;
        lastExitCodeRef.current = 0;
        commandInProgressRef.current = true;
        // Record the start time when command execution begins
        commandStartTimeRef.current = new Date().toISOString();

        // Dispatch startCommand action to track running commands
        if (lastUserCommandRef.current) {
          dispatch(
            startCommand({
              prompt: lastUserPromptRef.current,
              command: lastUserCommandRef.current,
              startedAt: commandStartTimeRef.current,
            }),
          );
        }
      } else if (data.startsWith("D;")) {
        // Command finished with exit code in D;Ps format
        if (
          collectingRef.current &&
          commandInProgressRef.current &&
          pendingCaptureResolveRef.current
        ) {
          collectingRef.current = false;
          commandInProgressRef.current = false;

          // Parse exit code from D;Ps format
          const exitCode = Number(data.substring(2)) || 0;

          // Try to extract output between markers (preferred)
          let output = "";
          try {
            const buffer = instance.buffer.active;
            const startLine = startMarkerRef.current?.line ?? null;
            const endMarker = instance.registerMarker(-1);
            const endLine = endMarker?.line ?? null;

            if (
              startLine !== null &&
              endLine !== null &&
              endLine >= startLine
            ) {
              const lines: string[] = [];
              // Skip the start line to avoid including the command line itself.
              for (let i = startLine + 1; i <= endLine; i++) {
                const line = buffer.getLine(i);
                if (line) {
                  lines.push(line.translateToString(true));
                }
              }
              output = lines.join("\n");
            } else {
              // Fallback to collected buffer
              output = "";
            }
          } catch (error) {
            console.warn(
              "Failed to extract output between markers (step D):",
              error,
            );
            output = "";
          } finally {
            startMarkerRef.current = null;
          }

          const result = {
            output,
            exitCode: exitCode,
          };

          // Resolve the pending captured command
          pendingCaptureResolveRef.current(result);
          pendingCaptureResolveRef.current = null;

          // Also update the general state for other consumers
          setLastCommand(result);
          dispatch(
            recordRun({
              prompt: lastUserPromptRef.current,
              command: lastUserCommandRef.current,
              output,
              exitCode,
              startedAt:
                commandStartTimeRef.current || new Date().toISOString(),
              finishedAt: new Date().toISOString(),
            }),
          );
        } else {
          // This is a command completion we're not tracking, just update general state
          collectingRef.current = false;

          // Parse exit code from D;Ps format
          const exitCode = Number(data.substring(2)) || 0;

          // Always try to extract output via markers for non-captured commands
          let output = "";
          try {
            const buffer = instance.buffer.active;
            const startLine = startMarkerRef.current?.line ?? null;
            const endMarker = instance.registerMarker(-1);
            const endLine = endMarker?.line ?? null;
            if (
              startLine !== null &&
              endLine !== null &&
              endLine >= startLine
            ) {
              const lines: string[] = [];
              for (let i = startLine + 1; i <= endLine; i++) {
                const line = buffer.getLine(i);
                if (line) {
                  lines.push(line.translateToString(true));
                }
              }
              output = lines.join("\n");
            } else {
              output = "";
            }
          } catch {
            output = "";
          } finally {
            startMarkerRef.current = null;
          }

          const result = {
            output,
            exitCode: exitCode,
          };
          setLastCommand(result);
          dispatch(
            recordRun({
              prompt: lastUserPromptRef.current,
              command: lastUserCommandRef.current,
              output,
              exitCode,
              startedAt:
                commandStartTimeRef.current || new Date().toISOString(),
              finishedAt: new Date().toISOString(),
            }),
          );
        }
      }

      return true; // Indicate the sequence was handled
    },
    [instance],
  );

  // Handle OSC 7 sequences for CWD
  const handleOsc7 = useCallback((data: string) => {
    const path = data.replace(/^file:\/\/[^/]+/, "");
    if (path) {
      setCwd(path);
    }

    return true; // Indicate the sequence was handled
  }, []);

  // Process incoming data for plain text collection
  const processIncomingData = useCallback(
    (chunk: string) => {
      // Collect plain text for command output or prompt
      if (chunk && collectingRef.current) {
        // TODO I think I can delete collectingRef
      } else if (chunk && collectingPromptRef.current) {
        promptBufferRef.current += chunk;
      }

      // Always write raw chunk to xterm
      if (chunk) {
        writeToTerminal(chunk);
      }
    },
    [writeToTerminal],
  );

  const onResize = useCallback(() => {
    fitAddon.fit();
    invoke("async_resize_pty", { cols: instance?.cols, rows: instance?.rows });
  }, []);

  useResizeObserver({ ref: termRef, onResize });

  useEffect(() => {
    if (!termRef.current) {
      return;
    }

    if (instanceInit.current) {
      return;
    }
    instanceInit.current = true;

    const readFromPty = async () => {
      const data = (await invoke("async_read_from_pty")) as
        | string
        | null
        | undefined;
      if (typeof data === "string" && data.length > 0) {
        processIncomingData(data);
      }
      animationFrameRef.current = requestAnimationFrame(readFromPty);
    };

    animationFrameRef.current = requestAnimationFrame(readFromPty);
    instance.loadAddon(fitAddon);
    instance.open(termRef.current!);
    instance.onData(writeToPty);

    // Register OSC handlers for shell integration
    instance.parser.registerOscHandler(133, handleOsc133);
    instance.parser.registerOscHandler(7, handleOsc7);

    invoke("async_create_shell");
    // return () => {
    //   if (animationFrameRef.current) {
    //     cancelAnimationFrame(animationFrameRef.current);
    //   }
    //   instance.dispose();
    // };
  }, [writeToPty, writeToTerminal, handleOsc133, handleOsc7]);

  const lastCommandClean = useMemo(
    () =>
      lastCommand
        ? {
            output: stripAnsi(lastCommand.output),
            exitCode: lastCommand.exitCode,
          }
        : null,
    [lastCommand],
  );

  const currentPromptClean = useMemo(
    () => stripAnsi(currentPrompt),
    [currentPrompt],
  );

  return {
    termRef,
    writeToPty,
    runCommand,
    runCaptured,
    panelVisible,
    setPanelVisible,
    cwd,
    lastCommand,
    lastCommandClean,
    currentPrompt,
    currentPromptClean,
    lastUserPrompt,
    lastUserCommand,
  };
}

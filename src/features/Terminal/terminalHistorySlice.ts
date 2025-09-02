import { createSlice, PayloadAction, nanoid, createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export interface TerminalEntry {
  id: string;
  prompt: string;
  command: string;
  output: string;
  exitCode: number;
  startedAt: string; // ISO8601 string
  finishedAt: string; // ISO8601 string
}

export interface RunningCommand {
  id: string;
  prompt: string;
  command: string;
  startedAt: string; // ISO8601 string
}

export interface TerminalHistoryState {
  entries: TerminalEntry[];
  runningCommands: RunningCommand[];
  latestPrompt: string;
}

const initialState: TerminalHistoryState = {
  entries: [],
  runningCommands: [],
  latestPrompt: "",
};

export const terminalHistorySlice = createSlice({
  name: "terminalHistory",
  initialState,
  reducers: {
    recordRun: (state, action: PayloadAction<Omit<TerminalEntry, "id">>) => {
      state.entries.push({ id: nanoid(), ...action.payload });
      // Remove the running command when it completes
      const normalizedCommand = normalizeCommand(action.payload.command);
      state.runningCommands = state.runningCommands.filter(
        (cmd) => normalizeCommand(cmd.command) !== normalizedCommand,
      );
      // keep latest prompt in sync
      state.latestPrompt = action.payload.prompt;
    },
    startCommand: (
      state,
      action: PayloadAction<Omit<RunningCommand, "id">>,
    ) => {
      // Remove any existing running command with the same normalized command
      const normalizedCommand = normalizeCommand(action.payload.command);
      state.runningCommands = state.runningCommands.filter(
        (cmd) => normalizeCommand(cmd.command) !== normalizedCommand,
      );
      // Add the new running command
      state.runningCommands.push({ id: nanoid(), ...action.payload });
    },
    setLatestPrompt: (state, action: PayloadAction<string>) => {
      state.latestPrompt = action.payload;
    },
    dismissEntry: (state, action: PayloadAction<string>) => {
      state.entries = state.entries.filter(
        (entry) => entry.id !== action.payload,
      );
    },
    clearHistory: (state) => {
      state.entries = [];
      state.runningCommands = [];
      state.latestPrompt = "";
    },
  },
});

// Helper function to normalize commands for comparison
const normalizeCommand = (command: string): string => {
  return command.trim().replace(/\s+/g, " ");
};

// Define the return type for the execution result
export interface ExecutionResult {
  id: string;
  output: string;
  exitCode: number;
  timestamp: Date;
  duration: number;
  isRunning: boolean;
}

// Base selectors
const selectTerminalHistory = (state: RootState) => state.terminalHistory;
const selectEntries = createSelector(
  [selectTerminalHistory],
  (terminalHistory) => terminalHistory.entries,
);
const selectRunningCommands = createSelector(
  [selectTerminalHistory],
  (terminalHistory) => terminalHistory.runningCommands,
);

// Memoized selector factory for finding the most recent execution of a specific command
export const selectMostRecentExecution = (() => {
  const selectorCache = new Map<string, ReturnType<typeof createSelector<[typeof selectRunningCommands, typeof selectEntries], ExecutionResult | null>>>();

  return (command: string) => {
    const normalizedCommand = normalizeCommand(command);
    
    // Check if we already have a memoized selector for this command
    if (selectorCache.has(normalizedCommand)) {
      return selectorCache.get(normalizedCommand)!;
    }

    // Create a new memoized selector for this command
    const selector = createSelector(
      [selectRunningCommands, selectEntries],
      (runningCommands, entries): ExecutionResult | null => {
        // First check if there's a running command
        const runningCommand = runningCommands.find(
          (entry) => normalizeCommand(entry.command) === normalizedCommand,
        );

        if (runningCommand) {
          return {
            id: runningCommand.id,
            output: "",
            exitCode: -1, // -1 indicates running
            timestamp: new Date(runningCommand.startedAt),
            duration: Date.now() - new Date(runningCommand.startedAt).getTime(),
            isRunning: true,
          };
        }

        // Find the most recent completed entry that matches the command
        const matchingEntry = entries
          .filter((entry) => normalizeCommand(entry.command) === normalizedCommand)
          .sort(
            (a, b) =>
              new Date(b.finishedAt).getTime() - new Date(a.finishedAt).getTime(),
          )[0];

        if (!matchingEntry) return null;

        // Calculate duration from startedAt to finishedAt
        const startedAt = new Date(matchingEntry.startedAt);
        const finishedAt = new Date(matchingEntry.finishedAt);
        const duration = finishedAt.getTime() - startedAt.getTime();

        return {
          id: matchingEntry.id,
          output: matchingEntry.output,
          exitCode: matchingEntry.exitCode,
          timestamp: finishedAt,
          duration,
          isRunning: false,
        };
      },
    );

    // Cache the selector for future use
    selectorCache.set(normalizedCommand, selector);
    return selector;
  };
})();

export const {
  recordRun,
  startCommand,
  clearHistory,
  setLatestPrompt,
  dismissEntry,
} = terminalHistorySlice.actions;

export default terminalHistorySlice.reducer;

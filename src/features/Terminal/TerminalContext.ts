import { createContext } from "react";

export const TerminalContext = createContext<{
  writeToPty: (data: string) => void;
  panelVisible: boolean;
  setPanelVisible: (visible: boolean) => void;
  cwd: string;
  runCaptured: (
    command: string,
  ) => Promise<{ output: string; exitCode: number }>;
  currentPrompt: string;
  currentPromptClean: string;
  lastUserPrompt: string;
  lastUserCommand: string;
  layout: "horizontal" | "vertical";
  setLayout: (layout: "horizontal" | "vertical") => void;
}>({
  writeToPty: () => {},
  panelVisible: true,
  setPanelVisible: () => {},
  cwd: "",
  runCaptured: async () => ({ output: "", exitCode: 0 }),
  currentPrompt: "",
  currentPromptClean: "",
  lastUserPrompt: "",
  lastUserCommand: "",
  layout: "horizontal",
  setLayout: () => {},
});

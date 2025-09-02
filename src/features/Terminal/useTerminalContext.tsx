import { useContext } from "react";
import { TerminalContext } from "./TerminalContext";

export const useTerminalContext = () => {
  return useContext(TerminalContext);
};

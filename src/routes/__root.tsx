import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useTerminal } from "../features/Terminal/useTerminal";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { TerminalContext } from "../features/Terminal/TerminalContext";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { setLayout, setPanelVisible } from "../features/UI/uiSlice";
import "@xterm/xterm/css/xterm.css";
import { TopNav } from "../components/TopNav";
import { ErrorView } from "../components/ErrorView";

export const Route = createRootRoute({
  component: Root,
  errorComponent: ErrorView,
});

function Root() {
  const {
    termRef,
    writeToPty,
    cwd,
    runCaptured,
    currentPrompt,
    currentPromptClean,
    lastUserPrompt,
    lastUserCommand,
  } = useTerminal();
  const dispatch = useAppDispatch();
  const layout = useAppSelector((s) => s.ui.layout);
  const panelVisible = useAppSelector((s) => s.ui.panelVisible);

  return (
    <>
      <PanelGroup className="flex-1" direction={layout}>
        <Panel id="root-panel" className="flex flex-col">
          <TerminalContext.Provider
            value={{
              writeToPty,
              panelVisible,
              setPanelVisible: (v: boolean) => dispatch(setPanelVisible(v)),
              cwd,
              runCaptured,
              currentPrompt,
              currentPromptClean,
              lastUserPrompt,
              lastUserCommand,
              layout,
              setLayout: (l) => dispatch(setLayout(l)),
            }}
          >
            <div id="root-container" className="flex-1 overflow-auto">
              <TopNav />
              <div id="page-content">
                <Outlet />
              </div>
            </div>
          </TerminalContext.Provider>
        </Panel>

        <PanelResizeHandle
          className={
            panelVisible
              ? "border"
              : "" + "border-ctp-mauve-500 hover:border-ctp-mauve-400"
          }
        />
        <Panel
          className="mocha bg-ctp-mantle"
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
          maxSize={75}
          defaultSize={50}
          hidden={!panelVisible}
        >
          <div className="flex-1 min-h-0 pt-2 pl-2">
            <div ref={termRef} style={{ height: "100%", width: "100%" }} />
          </div>
        </Panel>
      </PanelGroup>
      {/* <TanStackRouterDevtools /> */}
    </>
  );
}

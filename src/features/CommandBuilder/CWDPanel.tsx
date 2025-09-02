import { Switch } from "../../components/DesignSystem/Switch";
import { useTerminalContext } from "../Terminal/useTerminalContext";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { setUseRelativePaths } from "./commandBuilderSlice";

export function CWDPanel() {
  const { cwd } = useTerminalContext();
  const dispatch = useAppDispatch();
  const useRelativePaths = useAppSelector(
    (state) => state.commandBuilder.useRelativePaths
  );

  return (
    <div className="hue-mauve mb-4 border border-ctp-surface1 rounded-xl overflow-hidden bg-ctp-base">
      {/* Header section */}
      <div className="p-3 bg-ctp-surface0/50 border-b border-ctp-surface1 flex items-center justify-between">
        <div className="text-ctp-subtext1">
          Convert absolute paths to relative paths
        </div>
        <div>
          <Switch
            variant="themed"
            isSelected={useRelativePaths}
            onChange={(value) => dispatch(setUseRelativePaths(value))}
          >
            Enable
          </Switch>
        </div>
      </div>

      {/* Content section */}
      {useRelativePaths && (
        <div className="p-2 flex gap-2 bg-ctp-base">
          <div className="text-ctp-subtext1">
            <span className="text-ctp-mauve">{cwd}</span> becomes{" "}
            <span className="text-ctp-mauve">./</span>
          </div>
        </div>
      )}
    </div>
  );
}

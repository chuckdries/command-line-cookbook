import { twMerge } from "tailwind-merge";
import { TokenDef } from "../commandBuilderTypes";
import { TokenInputSwitch } from "./TokenInputSwitch";
import { Switch } from "../../../components/DesignSystem/Switch";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { setTokenEnabled } from "../commandBuilderSlice";
import { MultiValueInput } from "./MultiValueInput";

interface TokenItemProps {
  item: TokenDef;
  name: string;
  className?: string;
}

function TokenInput({ item, name }: Omit<TokenItemProps, "className">) {
  if (item.multivalue) {
    return <MultiValueInput item={item} name={name} />;
  }
  return <TokenInputSwitch item={item} name={name} />;
}

export function TokenItem({ item, name, className }: TokenItemProps) {
  const enabled = useAppSelector(
    (state) => state.commandBuilder.tokenValues[name]?.enabled
  );
  const dispatch = useAppDispatch();
  const setEnabled = (value: boolean) =>
    dispatch(setTokenEnabled({ name, enabled: value }));
  return (
    <div
      className={twMerge(
        "rounded-xl border border-ctp-surface1 overflow-hidden bg-ctp-base",
        className
      )}
    >
      {/* Header section */}
      <div className="p-3 bg-ctp-surface0 border-b border-b-ctp-surface1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-hue h-4 w-4" />
          <pre className="font-mono text-hue">{"{{" + name + "}}"}</pre>
        </div>
        <div className="flex items-center gap-3">
          {item.required === false && (
            <Switch variant="themed" isSelected={enabled} onChange={setEnabled}>
              Enable
            </Switch>
          )}
        </div>
      </div>

      {/* Content section */}
      <div className="p-2 flex flex-col gap-2">
        <div className="text-ctp-subtext1">
          {item.description} {item.required ? "" : "(optional)"}
        </div>
        {item.helpLink && (
          <a
            href={item.helpLink}
            target="_blank"
            rel="noreferrer"
            className="text-ctp-blue hover:underline"
          >
            Learn more
          </a>
        )}
        {enabled && (
          <div className="flex gap-2">
            <TokenInput item={item} name={name} />
          </div>
        )}
      </div>
    </div>
  );
}

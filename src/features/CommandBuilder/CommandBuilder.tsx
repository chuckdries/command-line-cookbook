import { Recipe, TokenDef } from "./commandBuilderTypes";
import { useEffect, useMemo } from "react";
import { template } from "@blakeembrey/template";
import { CWDPanel } from "./CWDPanel";
import { TokenItem } from "./TokenInputs/TokenItem";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useTerminalContext } from "../Terminal/useTerminalContext";
import { toRelativePath } from "../Terminal/useDisplayPath";
import { twMerge } from "tailwind-merge";
import { initTokenValues } from "./commandBuilderSlice";
import { CodeBlock } from "../../components/CodeBlock";

interface CommandBuilderProps {
  onSubmit: (command: string) => void;
  recipe: Recipe;
}

const tokenRegex = /\{\{([^}]+)\}\}/;

// Component to display command template with colored tokens
function CommandTemplateDisplay({
  template,
  tokenColorMap,
}: {
  template: string;
  tokenColorMap: Record<string, (typeof tokenColors)[0]>;
}) {
  const parts = template.split(/({{[^}]+}})/);
  console.log(parts);

  return (
    <pre className="inline text-wrap">
      {parts.map((part, index) => {
        const tokenMatch = part.match(/\{\{([^}]+)\}\}/);
        if (tokenMatch) {
          const tokenName = tokenMatch[1];
          const colors = tokenColorMap[tokenName];
          if (colors) {
            return (
              <span key={index} className={twMerge(colors, "text-hue")}>
                {part}
              </span>
            );
          }
        }
        return part;
      })}
    </pre>
  );
}

// Define color classes for tokens (avoiding string interpolation/concatenation)
const tokenColors: React.HTMLAttributes<HTMLDivElement>["className"][] = [
  // "hue-red",
  // "hue-green",
  "hue-blue",
  "hue-yellow",
  "hue-pink",
  "hue-teal",
  "hue-lavender",
  "hue-peach",
];

export function CommandBuilder({
  onSubmit: _onSubmit,
  recipe,
}: CommandBuilderProps) {
  const useRelativePaths = useAppSelector(
    (state) => state.commandBuilder.useRelativePaths
  );
  const { cwd } = useTerminalContext();

  // map of arg index to any tokens that it uses
  const argsToTokens = useMemo(() => {
    const map: Record<number, string> = {};
    recipe.args.forEach((arg, index) => {
      const match = arg.match(tokenRegex);
      if (match) {
        map[index] = match[1];
      }
    });
    return map;
  }, [recipe]);

  const tokensInUse = useMemo(() => {
    const tokens = Object.values(argsToTokens).flat();
    return tokens.filter((token) => token !== null);
  }, [argsToTokens]);

  // Create token color mapping based on token index
  const tokenColorMap = useMemo(() => {
    const colorMap: Record<string, (typeof tokenColors)[0]> = {};
    tokensInUse.forEach((token, index) => {
      colorMap[token] = tokenColors[index % tokenColors.length];
    });
    return colorMap;
  }, [tokensInUse]);

  const tokenValues = useAppSelector(
    (state) => state.commandBuilder.tokenValues
  );

  const commandTemplate = useMemo(
    () => [recipe.base, ...recipe.args].join(" "),
    [recipe]
  );

  const formattedCommand = useMemo(() => {
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(tokenValues)) {
      const tokenDef = (recipe.tokens as Record<string, TokenDef | undefined>)[key];
      if (!tokenDef) {
        // Skip any stale token values that don't exist on this recipe
        continue;
      }
      const isPath = ["open", "save"].includes(tokenDef.type);
      let val = value.value as string;
      if (isPath) {
        if (useRelativePaths && val !== "") {
          val = toRelativePath(val, cwd);
        }
        if (val.includes(" ")) {
          val = `"${val}"`;
        }
      }
      values[key] = val;
    }

    const argsWithValues = recipe.args.filter((_arg, index) => {
      const token = argsToTokens[index];
      // Always include args that don't have any tokens
      if (!token) return true;
      // For args with tokens, include only if enabled and non-empty
      return (
        tokenValues[token]?.enabled && values[token] && values[token] !== ""
      );
    });
    const commandTemplateFiltered = [recipe.base, ...argsWithValues].join(" ");
    try {
      return template(commandTemplateFiltered)(values);
    } catch (error) {
      console.error(error);
      return null;
    }
  }, [commandTemplate, tokenValues, tokensInUse, useRelativePaths, cwd]);

  const hasTokensThatArePaths = useMemo(() => {
    return tokensInUse.some((token) => {
      const def = recipe.tokens[token as keyof typeof recipe.tokens];
      return ["open", "save"].includes(def.type);
    });
  }, [tokensInUse, recipe]);

  const dispatch = useAppDispatch();
  useEffect(() => {
    const tokenInit: Record<string, TokenDef> = {};
    for (const token of tokensInUse) {
      tokenInit[token] = recipe.tokens[token];
    }
    dispatch(initTokenValues(tokenInit));
  }, [tokensInUse]);

  return (
    <div className="flex flex-col gap-4">
      <div className="">
        <p className="not-prose">Recipe:</p>
        <div className="mocha mt-0 text-ctp-text bg-ctp-mantle rounded-md p-2 px-4">
          <CommandTemplateDisplay
            template={commandTemplate}
            tokenColorMap={tokenColorMap}
          />
        </div>
      </div>
      <div className="w-full not-prose flex flex-col gap-2">
        <p>Arguments:</p>
        {tokensInUse.map((token) => (
          <TokenItem
            key={token}
            item={recipe.tokens[token as keyof typeof recipe.tokens]}
            name={token}
            className={tokenColorMap[token]}
          />
        ))}
      </div>
      {hasTokensThatArePaths && (
        <div className="flex flex-col gap-2">
          <p>Options:</p>
          <CWDPanel />
        </div>
      )}

      {formattedCommand && (
        <>
          <p>Final Command:</p>
          <CodeBlock isShellInteractive={true}>{formattedCommand}</CodeBlock>
        </>
      )}
    </div>
  );
}

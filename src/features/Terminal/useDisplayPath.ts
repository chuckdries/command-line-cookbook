import { useMemo } from "react";
import { useTerminalContext } from "./useTerminalContext";
import { useAppSelector } from "../../app/hooks";
import resolvePath from "@einheit/path-resolve";

function splitPathIntoSegments(path: string): string[] {
  return path.split("/").filter((segment) => segment.length > 0);
}

export function toRelativePath(
  targetAbsolutePath: string,
  fromAbsoluteCwd: string,
): string {
  const targetSegments = splitPathIntoSegments(targetAbsolutePath);
  const fromSegments = splitPathIntoSegments(fromAbsoluteCwd);

  // Find common prefix length
  let common = 0;
  const minLen = Math.min(targetSegments.length, fromSegments.length);
  while (common < minLen && targetSegments[common] === fromSegments[common]) {
    common++;
  }

  const ups = fromSegments.length - common;
  const downs = targetSegments.slice(common).join("/");

  if (ups > 0) {
    const upPath = Array(ups).fill("..").join("/");
    return downs ? `${upPath}/${downs}` : upPath;
  }

  if (downs) {
    return `./${downs}`;
  }

  return ".";
}

export function toAbsolutePath(
  relativePath: string,
  fromAbsoluteCwd: string,
): string {
  if (relativePath.startsWith("/")) {
    return relativePath;
  }
  return resolvePath(fromAbsoluteCwd, relativePath);
}

export function useDisplayPath(
  absolutePath: string,
  _onChange: (path: string) => void,
) {
  const { cwd } = useTerminalContext();
  const useRelative = useAppSelector(
    (state) => state.commandBuilder.useRelativePaths,
  );

  const path = useMemo(() => {
    if (!absolutePath || !absolutePath.startsWith("/")) {
      return absolutePath;
    }
    if (useRelative) {
      return toRelativePath(absolutePath, cwd);
    }
    return absolutePath;
  }, [absolutePath, cwd, useRelative]);

  const onChange = (value: string) => {
    if (useRelative) {
      _onChange(toAbsolutePath(value, cwd));
    } else {
      _onChange(value);
    }
  };

  return {
    path,
    onChange,
  };
}

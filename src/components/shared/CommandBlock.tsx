import { ReactNode } from "react";
import { Copy, CheckCircle } from "lucide-react";
import { Button } from "../DesignSystem/Button";
// import { highlightCode } from "./commandUtils";

interface CommandBlockProps {
  command: string;
  title: string;
  icon?: ReactNode;
  borderColor?: string;
  headerButtons?: ReactNode;
  statusBar?: ReactNode;
  className?: string;
  copied: boolean;
  onCopy?: () => void;
  children?: ReactNode;
}

export function CommandBlock({
  command,
  title,
  icon,
  borderColor = "border-ctp-surface1",
  headerButtons,
  statusBar,
  className = "",
  copied,
  onCopy,
  children,
}: CommandBlockProps) {
  // const highlightedCode = highlightCode(command, "bash");

  return (
    <div
      className={`not-prose shadow shadow-ctp-crust border rounded-xl overflow-hidden bg-ctp-base mb-6 ${borderColor} ${className}`}
    >
      {/* Header with controls */}
      <div className="flex items-center justify-between p-2 bg-ctp-surface0 border-b border-ctp-surface1">
        <div className="flex items-center gap-2 ml-2">
          {icon}
          <span className="text-sm text-ctp-text py-2 border border-transparent">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onCopy && (
            <Button
              variant="secondary"
              onPress={onCopy}
              className="flex items-center gap-1"
              aria-label="Copy command"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-ctp-green" />
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          )}
          {headerButtons}
        </div>
      </div>

      {/* Code block */}
      <div className="relative bg-ctp-mantle inset-shadow-sm inset-shadow-ctp-crust mocha">
        <pre className="p-4 overflow-x-auto text-ctp-mauve-100">
          <code className="text-sm font-mono">{command}</code>
        </pre>
      </div>

      {/* Status bar */}
      {statusBar && (
        <div className="p-2 bg-ctp-surface0 border-t border-ctp-surface1">
          {statusBar}
        </div>
      )}
      {children}
    </div>
  );
}

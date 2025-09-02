import { useEffect, useMemo, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { useResizeObserver } from "./useResizeObserver";
import { theme } from "../features/Terminal/useTerminal";

interface StaticTerminalProps {
  content: string;
  className?: string;
}

export function StaticTerminal({ content, className = "" }: StaticTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddon = useMemo(() => new FitAddon(), []);

  const fit = () => {
    try {
      fitAddon.fit();
    } catch {}
  };

  const adjustHeightToContent = () => {
    const term = termRef.current;
    const container = containerRef.current;
    if (!term || !container) return;

    requestAnimationFrame(() => {
      const rowsEl = term.element?.querySelector('.xterm-rows') as HTMLElement | null;
      if (!rowsEl) return;

      const rowEls = Array.from(rowsEl.children) as HTMLElement[];
      if (rowEls.length === 0) return;

      const rowHeight = Math.ceil(rowEls[0].getBoundingClientRect().height || 0) || 0;

      // Use cursorY+1 to include intentional leading blank lines
      let requiredRows = 1;
      try {
        const buf: any = (term as any).buffer?.active || term.buffer.active;
        const cursorY: number = buf.cursorY || 0;
        requiredRows = Math.max(1, cursorY + 1);
      } catch {}

      if (rowHeight > 0) {
        container.style.height = `${requiredRows * rowHeight}px`;
      }

      try {
        term.resize(term.cols, requiredRows);
      } catch {}
    });
  };

  useResizeObserver({ ref: containerRef, onResize: fit });

  useEffect(() => {
    if (!containerRef.current) return;
    if (termRef.current) return;

    const term = new Terminal({
      fontFamily: "Jetbrains Mono",
      fontSize: 14,
      cursorBlink: false,
      allowProposedApi: true,
      theme,
      disableStdin: true,
      convertEol: false,
    });

    term.loadAddon(fitAddon);
    term.open(containerRef.current);
    termRef.current = term;
    fit();

    return () => {
      try {
        term.dispose();
      } catch {}
      termRef.current = null;
    };
  }, [fitAddon, content]);

  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    // Clear and rewrite on content change
    try {
      term.reset();
    } catch {}
    // Ensure width is fitted before write to compute correct rowHeight
    fit();
    // Write, then size using buffer cursor once flushed
    term.write(content, () => {
      adjustHeightToContent();
    });
  }, [content]);

  return (
    <div ref={containerRef} className={className} />
  );
}



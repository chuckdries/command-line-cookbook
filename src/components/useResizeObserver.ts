import { useEffect } from "react";

export function useResizeObserver({ref, onResize}: {ref: React.RefObject<HTMLDivElement>, onResize: (size: { width: number, height: number }) => void}) {

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      onResize(entries[0].contentRect);
    });
    observer.observe(ref.current as Element);
    return () => observer.disconnect();
  }, [ref]);
}

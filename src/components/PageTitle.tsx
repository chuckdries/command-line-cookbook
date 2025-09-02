import { useEffect, useRef } from "react";
import { useAppDispatch } from "../app/hooks";
import { setPageTitleInView } from "../features/UI/uiSlice";
import {
  createScope,
  createTimeline,
  onScroll,
  Scope,
  TargetsParam,
} from "animejs";

interface PageTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTitle({ children, className }: PageTitleProps) {
  const dispatch = useAppDispatch();
  const scopeRef = useRef<Scope | null>(null);
  const ref = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    // Assume title is in view on mount to prevent navbar title flicker on navigation
    dispatch(setPageTitleInView(true));
    if (!el) return () => void 0;

    // binary visible/invisible
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        dispatch(setPageTitleInView(entry.isIntersecting));
      },
      {
        root: null,
        rootMargin: "-56px 0px 0px 0px", // Account for TopNav height (h-14 = 56px)
        threshold: [0, 1],
      },
    );

    observer.observe(el);

    // anime scope for scroll linked title slide up
    scopeRef.current = createScope({ root: "#root-container" }).add(() => {
      const container = document.getElementById("root-container");
      const tl = createTimeline({
        autoplay: onScroll({
          container: container as TargetsParam,
          enter: -10,
          leave: -10,
          sync: 1,
        }),
      });

      tl.add(
        "#top-nav-scope",
        {
          boxShadow: [
            0,
            " 0 4px 6px -1px var(--tw-shadow-color), 0 2px 4px -2px var(--tw-shadow-color)",
          ],
          // botderColor: ["transparent", "var(--color-ctp-surface2)"],
          backdropFilter: ["blur(0em)", "blur(1em)"],
          ease: "linear",
        },
        0,
      );
      tl.add(
        "#top-nav-title",
        {
          translateY: ["2.5rem", 0],
          ease: "linear",
        },
        0,
      );
    });

    return () => {
      observer.disconnect();
      // On unmount, assume the next page's title is in view to avoid transient show
      dispatch(setPageTitleInView(true));
      scopeRef.current?.revert();
    };
  }, [dispatch]);

  return (
    <h1 id="page-title" ref={ref} className={className}>
      {children}
    </h1>
  );
}

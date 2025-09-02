import { useRef } from "react";
import { twMerge } from "tailwind-merge";

export function TopNavTitle({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const title = useRef(null);

  // useLayoutEffect(() => {
  //   scope.current = createScope({ root }).add((self) => {
  //     // Every anime.js instances declared here are now scopped to <div ref={root}>

  //     // Created a bounce animation loop
  //     if (title.current) {
  //       animate(title.current as TargetsParam, {
  //         translateY: [0, "2rem"],
  //         autoplay: onScroll({
  //           // container: "#root-container",
  //           target: "#page-title",
  //           enter: 40,
  //           leave: 70,
  //           sync: 1,
  //           debug: true,
  //         }),
  //         loop: true,
  //       });
  //     }
  //   });

  //   // Properly cleanup all anime.js instances declared inside the scope
  //   return () => scope.current?.revert();
  // }, []);

  return (
      <h1 id="top-nav-title" ref={title} className={twMerge(className)}>
        {children}
      </h1>
  );
}

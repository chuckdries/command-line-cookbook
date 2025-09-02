import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import {
  ChevronLeft,
  House,
  Settings,
  Eye,
  RotateCwSquare,
} from "lucide-react";
import { Button } from "./DesignSystem/Button";
import { useAppSelector } from "../app/hooks";
import { useContext } from "react";
import { TerminalContext } from "../features/Terminal/TerminalContext";
import { twMerge } from "tailwind-merge";
import { TopNavTitle } from "./TopNavTitle";

export function TopNav() {
  const router = useRouter();
  const { location, matches } = useRouterState({
    select: (s) => ({ location: s.location, matches: s.matches }),
  });
  const pageTitleInView = useAppSelector((s) => s.ui.pageTitleInView);
  const { panelVisible, setPanelVisible, layout, setLayout } =
    useContext(TerminalContext);

  const historyIndex = location.state?.__TSR_index ?? 0;
  const canGoBack = historyIndex > 0;
  const atHome = location.pathname === "/";
  const atSettings = location.pathname === "/settings";

  const currentMatch = matches[matches.length - 1];
  let title: string = "";
  switch (currentMatch?.routeId) {
    case "/docs/$":
      title = currentMatch?.loaderData?.attributes?.title ?? "Docs";
      break;
    case "/recipes/$":
      title = currentMatch?.loaderData?.recipe?.name ?? "Recipe";
      break;
    case "/about":
      title = "About";
      break;
    case "/":
      title = "Welcome to Command Line Cookbook";
      break;
    default: {
      const seg = location.pathname.split("/").filter(Boolean).slice(-1)[0];
      title = seg
        ? seg.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
        : "";
    }
  }

  return (
    <div
      id="top-nav-scope"
      className={twMerge(
        "sticky top-0 z-10 flex items-center h-14 px-3  @container overflow-hidden",
        "border-b transition-colors",
        "bg-ctp-base/70 shadow-ctp-mantle",
        pageTitleInView ? "border-transparent" : "border-ctp-surface1"
      )}
    >
      {/* Left side - Back button */}
      <div className="flex items-center">
        {canGoBack ? (
          <Button
            variant="secondary"
            className="px-2"
            onClick={() => router.history.back()}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="sr-only">Back</span>
          </Button>
        ) : (
          <div className="w-8 h-5" />
        )}
      </div>

      {/* Title - Left aligned with truncation */}
      <div className="flex-1 flex ml-2 min-w-0 mr-4">
        <TopNavTitle
          className={
            "font-semibold text-ctp-text truncate transform transition-all duration-300 ease-out max-w-[500px] "
          }
        >
          {title}
        </TopNavTitle>
      </div>

      {/* Right side - Navigation */}
      <div className="flex items-center gap-2 shrink-0">
        {!atHome && (
          <Link to="/" className="p-2 text-ctp-mauve font-bold hover:underline">
            <House className="w-5 h-5" />
          </Link>
        )}
        {!atSettings && (
          <Link
            to="/settings"
            className="p-2 text-ctp-mauve font-bold hover:underline"
          >
            <Settings className="w-5 h-5" />
          </Link>
        )}
        <Button
          variant="secondary"
          className="px-2"
          onClick={() =>
            setLayout(layout === "horizontal" ? "vertical" : "horizontal")
          }
        >
          <RotateCwSquare className="w-5 h-5" />
        </Button>
        <Button
          variant="secondary"
          className="px-2 flex items-center gap-2"
          onClick={() => setPanelVisible(!panelVisible)}
        >
          <Eye className="w-5 h-5" />
          <span className="hidden @2xl:inline ">
            {panelVisible ? "Hide" : "Show"} terminal
          </span>
        </Button>
      </div>
    </div>
  );
}

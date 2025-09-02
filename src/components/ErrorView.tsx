import { Link } from "@tanstack/react-router";
import { Skull } from "lucide-react";

export function ErrorView({ error }: { error: Error }) {

  return (
    <div className="p-4 lg:p-8 flex flex-col gap-4">
      <h1 className="text-2xl font-bold flex gap-2"><Skull className="w-8 h-8" /> Error</h1>
      <pre className="text-ctp-subtext1 text-wrap wrap-anywhere p-4 bg-ctp-mantle rounded-md">{error.message}</pre>
      <details>
        <summary>Stack Trace</summary>
        <pre className="text-ctp-subtext1 text-wrap wrap-anywhere p-4 bg-ctp-mantle rounded-md">{error.stack}</pre>
      </details>
      <Link className="text-ctp-mauve hover:underline" to="/">
        Go Home
      </Link>
    </div>
  );
}

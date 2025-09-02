import { createFileRoute, notFound } from "@tanstack/react-router";
import { resolveResource } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/plugin-fs";
import fm from "front-matter";
import { processMarkdown } from "../utils/markdownProcessor";
import { MDXProvider } from "@mdx-js/react";
import { CodeBlock } from "../components/CodeBlock";
import { PromptDisplay } from "../components/PromptDisplay";
import { InstallBlock } from "../components/InstallBlock";
import { PageTitle } from "../components/PageTitle";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/docs/$")({
  loader: async ({ params }) => {
    if (!params._splat) {
      throw notFound();
    }
    const docResource = await resolveResource("data/docs/" + params._splat);
    const docText = await readTextFile(docResource);
    const { attributes, body } = fm(docText);
    
    // Process markdown in the loader
    const processedBody = await processMarkdown(body);
    
    return {
      attributes: attributes as Record<string, string>,
      processedBody,
    };
  },
  component: RouteComponent,
});

export const MarkdownContainerClasses = "prose dark:prose-invert prose-blockquote:border-l-ctp-peach prose-blockquote:text-ctp-yellow prose-link:text-ctp-blue pb-8"

function RouteComponent() {
  const { attributes, processedBody } = Route.useLoaderData();

  const components = {
    CodeBlock,
    PromptDisplay,
    InstallBlock,
    Link,
  };

  return (
    <MDXProvider components={components}>
      <div className="p-2 max-w-prose mx-auto">
        <PageTitle className="text-2xl font-bold mb-4">{attributes.title}</PageTitle>
        <div className={MarkdownContainerClasses}>
          {processedBody}
        </div>
      </div>
    </MDXProvider>
  );
}

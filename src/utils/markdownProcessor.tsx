import * as runtime from "react/jsx-runtime";
import { evaluate } from "@mdx-js/mdx";
import remarkFrontmatter from "remark-frontmatter";
import rehypeShellPlugin from "./rehypeShellPlugin";
import rehypeExternalLinksPlugin from "./rehypeExternalLinksPlugin";
import { CodeBlock } from "../components/CodeBlock";
import { PromptDisplay } from "../components/PromptDisplay";
import { InstallBlock } from "../components/InstallBlock";
import { Link } from "@tanstack/react-router";

export async function processMarkdown(markdown: string) {
  const { default: MDXContent } = await evaluate(markdown, {
    ...runtime,
    remarkPlugins: [[remarkFrontmatter, ["yaml", "toml"]]],
    rehypePlugins: [
      rehypeShellPlugin, // Transform all code blocks to CodeBlock components
      rehypeExternalLinksPlugin, // Add target="_blank" to links for Tauri browser opening
    ],
    useMDXComponents: () => ({
      // Provide our custom components
      PromptDisplay,
      CodeBlock,
      InstallBlock,
      Link,
    }),
  });

  return <MDXContent />;
}

import { visit } from "unist-util-visit";
import type { Element } from "hast";
import type { Plugin } from "unified";
import type { Root } from "hast";

// Get current origin, with fallback for test environment
const currentOrigin =
  typeof window !== "undefined"
    ? window.location.origin
    : new URL("http://localhost:3000").origin;

/**
 * Determines if a given URL string is an external link (http/https)
 * @param href The URL string to check
 * @returns true if the URL is external, false otherwise
 */
export function isExternalLink(href: string): boolean {
  try {
    const url = new URL(href);
    return url.origin !== currentOrigin;
  } catch {
    // If both fail, it's not a valid URL
    return false;
  }
}

const rehypeExternalLinksPlugin: Plugin<[], Root> = () => {
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      // Target all anchor tags
      if (node.tagName === "a" && node.properties?.href) {
        const href = node.properties.href as string;

        if (isExternalLink(href)) {
          // Add target="_blank" to open in system browser
          node.properties.target = "_blank";

          // Also add rel="noopener noreferrer" for security
          node.properties.rel = "noopener noreferrer";
        } else {
          // Replace the anchor with our custom Link component
          const linkElement: Element = {
            type: "element",
            tagName: "Link",
            properties: {
              to: href,
            },
            children: node.children,
          };

          // Replace the node in the parent
          if (parent && typeof index === "number") {
            parent.children[index] = linkElement;
          }
        }
      }
    });
  };
};

export default rehypeExternalLinksPlugin;

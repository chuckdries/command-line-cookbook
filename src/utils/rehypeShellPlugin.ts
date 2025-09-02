import { visit } from "unist-util-visit";
import type { Element } from "hast";
import type { Plugin } from "unified";
import type { Root } from "hast";

const rehypeShellPlugin: Plugin<[], Root> = () => {
  // Return the transformer function that takes a tree
  return (tree: Root) => {
    visit(tree, "element", (node: Element, index, parent) => {
      // Look for pre > code elements
      if (
        node.tagName === "pre" &&
        node.children.length === 1 &&
        node.children[0].type === "element" &&
        node.children[0].tagName === "code"
      ) {
        const codeElement = node.children[0] as Element;
        const className = codeElement.properties?.className as
          | string[]
          | undefined;

        // Extract language from className
        let language = "text";
        if (className) {
          const langClass = className.find(
            (cls) =>
              typeof cls === "string" && cls.startsWith("language-")
          );
          if (langClass) {
            language = langClass.replace("language-", "");
          }
        }

        if (codeElement.children.length > 0) {
          // Extract the code content
          const textNode = codeElement.children[0];
          const code = textNode.type === "text" ? textNode.value : "";

          // Check if the code contains the interactive marker and strip it
          const interactiveMarker = "# @interactive";
          const isShellInteractive = code.includes(interactiveMarker);
          const cleanCode = isShellInteractive 
            ? code.replace(interactiveMarker, "").trim()
            : code;

          // Replace the pre/code with our custom CodeBlock component
          const codeBlockElement: Element = {
            type: "element",
            tagName: "CodeBlock",
            properties: {
              language,
              isShellInteractive,
            },
            children: [
              {
                type: "text",
                value: cleanCode,
              },
            ],
          };

          // Replace the node in the parent
          if (parent && typeof index === "number") {
            parent.children[index] = codeBlockElement;
          }
        }
      }
    });
  };
};

export default rehypeShellPlugin;

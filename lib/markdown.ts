import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

/**
 * The replacement for Astro's `render()`.
 *
 * Content bodies come out of the API loader as raw markdown, so the site needs
 * its own pipeline. It is deliberately the same shape as the one the theme
 * configured — GFM in, slugged headings with anchors out — because the course
 * content was written against it.
 */

/** Minimal hast, enough to walk without pulling in another dependency. */
interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

/**
 * MDX treats `{/* ... *\/}` as a comment and never renders it. Plain markdown
 * has no such syntax, so once a body is parsed as markdown the comment becomes
 * visible text — which is how a STARTER_CONTENT marker ends up printed on the
 * page. Stripped at render time only: the API's `body` is the source as
 * authored, and the emitter keeps them.
 */
export function stripMdxComments(body: string): string {
  return body.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "");
}

/**
 * Prefix root-relative URLs with the deployment base path.
 *
 * `<Link>` and `next/image` do this themselves, but this HTML is injected as a
 * string and nothing touches it. Without this, every in-body link like
 * `[the assessment page](/assessments/)` 404s on GitHub Pages while working
 * perfectly on localhost — the exact failure the link gate exists to catch.
 */
function rehypeBasePath(basePath: string) {
  return () => (tree: HastNode) => {
    if (!basePath) return;
    const walk = (node: HastNode) => {
      const props = node.properties;
      if (props) {
        for (const key of ["href", "src"] as const) {
          const value = props[key];
          // Leave protocol-relative (`//host`) and absolute URLs alone.
          if (typeof value === "string" && value.startsWith("/") && !value.startsWith("//")) {
            props[key] = `${basePath}${value}`;
          }
        }
      }
      for (const child of node.children ?? []) walk(child);
    };
    walk(tree);
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  // Raw HTML is dropped rather than passed through: these bodies are also
  // served as JSON to consumers we do not control, so the site should not be
  // the only thing standing between authored HTML and a page.
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings, {
    behavior: "append",
    // aria-hidden with tabindex="-1" is the combination axe accepts: the anchor
    // is skipped by assistive tech and by the tab order, so it is neither a
    // link without a name nor a focusable hidden element.
    properties: { className: ["heading-anchor"], ariaHidden: "true", tabIndex: -1 },
    content: { type: "text", value: "#" },
  })
  .use(rehypeBasePath(process.env.NEXT_PUBLIC_BASE_PATH ?? ""))
  .use(rehypeStringify);

/** Render a content body to HTML, ready for `dangerouslySetInnerHTML`. */
export async function renderMarkdown(body: string): Promise<string> {
  const file = await processor.process(stripMdxComments(body));
  return String(file);
}

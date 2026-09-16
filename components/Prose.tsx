import { renderMarkdown } from "@/lib/markdown";

/**
 * A content body, rendered from markdown.
 *
 * This is the replacement for Astro's `<Content />`. It carries no typographic
 * classes at all, and that is the point: rendered markdown arrives as bare
 * `<h2>`, `<p>`, `<ul>` with nothing to hook a utility onto, so the element
 * defaults in globals.css are what style it. Adding a `prose` class here would
 * mean maintaining two typographic systems that have to agree.
 *
 * The wrapper is one element rather than a fragment so the grid sees a single
 * child in the text column; inside it, ordinary block flow takes over.
 */
export async function Prose({ body }: { body: string }) {
  const html = await renderMarkdown(body);
  return (
    <div
      // biome-ignore lint/security/noDangerouslySetInnerHtml: our own content, parsed from src/content at build time by lib/markdown.ts, which drops raw HTML rather than passing it through.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

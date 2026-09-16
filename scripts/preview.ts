#!/usr/bin/env bun
// Serves the built site the way GitHub Pages will.
//
// `bunx serve dist` does not do this. The production build bakes /<repo>/ into
// every URL, so mounting dist/ at the root returns 200 on the HTML and 404s
// every stylesheet, script and image behind it — a page that looks broken in a
// way that has nothing to do with the code. This mounts dist/ under the same
// base path the build used, which is the whole point of a preview: the last
// chance to see what the deploy will look like before it is public.
//
// It is also the only way to exercise site search locally. Pagefind indexes the
// exported HTML, so the index does not exist under `next dev` at all.
//
// Deliberately Bun's own server rather than a package: no network fetch on
// every run, and the routing rules below are small enough to read.
import { existsSync, statSync } from "node:fs";
import { join, normalize, resolve } from "node:path";
import { resolveBasePath } from "../lib/base-path.ts";

const DIST = resolve("dist");
const BASE = resolveBasePath();
const PORT = Number(process.env.PORT ?? 3000);

if (!existsSync(DIST)) {
  console.error("No dist/ to preview — run `bun run build` first.");
  process.exit(1);
}

/**
 * A request path to a file on disk, or null if it escapes dist/.
 *
 * `trailingSlash: true` means a route is a directory holding index.html, so
 * that mapping is applied here rather than left to the caller. The traversal
 * check is not theatre: the path comes off the wire, and a preview server that
 * will happily read ../../.env is a bad habit to build even locally.
 */
function resolveFile(pathname: string): string | null {
  const decoded = decodeURIComponent(pathname);
  const candidate = resolve(join(DIST, normalize(decoded)));
  if (candidate !== DIST && !candidate.startsWith(`${DIST}/`)) return null;

  if (existsSync(candidate) && statSync(candidate).isDirectory()) {
    const index = join(candidate, "index.html");
    return existsSync(index) ? index : null;
  }
  return existsSync(candidate) ? candidate : null;
}

const server = Bun.serve({
  port: PORT,
  fetch(request) {
    const { pathname } = new URL(request.url);

    // Everything lives under the base path, so the bare root is a wrong turn
    // rather than a page. Pages itself 404s here; a redirect is friendlier and
    // costs nothing, since this server has no other tenant.
    if (BASE && !(pathname === BASE || pathname.startsWith(`${BASE}/`))) {
      return Response.redirect(new URL(`${BASE}/`, request.url), 302);
    }

    const sitePath = BASE ? pathname.slice(BASE.length) || "/" : pathname;
    const file = resolveFile(sitePath);
    if (file) return new Response(Bun.file(file));

    // The same 404 page the deployed site serves, at the status the deployed
    // site serves it with.
    const notFound = join(DIST, "404.html");
    return existsSync(notFound)
      ? new Response(Bun.file(notFound), { status: 404 })
      : new Response("Not found", { status: 404 });
  },
});

console.log(`Preview: http://localhost:${server.port}${BASE}/`);
console.log("Serving dist/ exactly as GitHub Pages will. Ctrl-C to stop.");

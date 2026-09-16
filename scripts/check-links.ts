#!/usr/bin/env bun
/**
 * Fail the build on an internal link that will 404 on the live site.
 *
 * This is the gate for the one failure this repo is most exposed to. GitHub
 * Pages serves a project repo under `https://<owner>.github.io/<repo>/`, so
 * every internal URL needs a `/<repo>` prefix that nothing local requires:
 * `next dev` serves at the domain root, so a link written as `/people/` works
 * perfectly on a laptop and is broken for every marker. There is no way to
 * notice by looking.
 *
 * So the check is deliberately two-sided. A root-relative URL that does not
 * start with the base path is an error even though the file it names exists,
 * because under the sub-path the browser will ask the domain root for it. And
 * a URL that does carry the base path still has to name a file the export
 * actually wrote, which is what catches a renamed route or a typo'd slug.
 *
 * The base path comes from lib/base-path.ts — the same function next.config.ts
 * uses — so this cannot pass a site whose links point somewhere else.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { JSDOM } from "jsdom";
import { resolveBasePath } from "../lib/base-path.ts";

export interface Finding {
  /** The page the link was found on, as a site path. */
  page: string;
  /** The URL exactly as it was written in the HTML. */
  url: string;
  problem: string;
}

/**
 * Every URL the browser would follow or fetch, as authored.
 *
 * Parsed rather than pattern-matched because the interesting cases are the
 * ones a regex gets wrong: a `>` inside an attribute, a `srcset` holding four
 * URLs and their descriptors, an attribute the minifier left unquoted.
 */
export function extractUrls(html: string): string[] {
  const { document } = new JSDOM(html).window;
  const urls: string[] = [];

  for (const el of document.querySelectorAll("[href], [src], [action], [poster]")) {
    for (const attr of ["href", "src", "action", "poster"]) {
      const value = el.getAttribute(attr);
      if (value !== null) urls.push(value);
    }
  }

  // "a.avif 1x, b.avif 2x" — the descriptor is not part of the URL.
  for (const el of document.querySelectorAll("[srcset], [imagesrcset]")) {
    for (const attr of ["srcset", "imagesrcset"]) {
      const value = el.getAttribute(attr);
      if (value === null) continue;
      for (const candidate of value.split(",")) {
        const url = candidate.trim().split(/\s+/)[0];
        if (url) urls.push(url);
      }
    }
  }

  return urls;
}

/**
 * Whether this URL is ours to resolve.
 *
 * Off-site URLs are somebody else's uptime, and checking them would make the
 * build fail when an unrelated server is down. Bare fragments resolve within
 * the page the browser already has.
 */
export function isInternal(raw: string): boolean {
  const url = raw.trim();
  if (!url || url.startsWith("#")) return false;
  // Protocol-relative (//host/path) and any scheme: mailto, tel, data, http(s).
  if (url.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(url)) return false;
  return true;
}

/** Drop the query and fragment, and decode %20 and friends. */
export function bareUrl(raw: string): string {
  const path = raw.trim().replace(/[?#].*$/, "");
  try {
    return decodeURIComponent(path);
  } catch {
    // A malformed escape is a broken link, but the existence check below says
    // so more usefully than a thrown URIError would.
    return path;
  }
}

/** Resolve a possibly-relative URL against the page it was written on. */
export function siteAbsolute(url: string, pageUrl: string): string {
  if (url.startsWith("/")) return url;
  // A file URL base keeps this to path arithmetic: no host to invent, `..` is
  // resolved against the page's directory, and `..` above the root collapses
  // the way a browser collapses it rather than escaping the export.
  return new URL(url, `file://${pageUrl}`).pathname;
}

/** The files, relative to the export root, that could satisfy a site path. */
export function candidatePaths(sitePath: string): string[] {
  const path = sitePath.replace(/^\/+/, "");
  // `trailingSlash: true`, so a route is a directory with an index.html. The
  // other two forms are for assets and for the extensionless files Next also
  // emits.
  if (path === "" || path.endsWith("/")) return [`${path}index.html`];
  return [path, `${path}.html`, `${path}/index.html`];
}

/**
 * Check one page's links.
 *
 * `exists` is injected so the whole decision is testable without an export on
 * disk — which matters, because the cases worth asserting are the ones where a
 * file exists and the link is still wrong.
 */
export function checkPage(
  html: string,
  pageUrl: string,
  basePath: string,
  exists: (path: string) => boolean,
): Finding[] {
  const findings: Finding[] = [];

  for (const raw of extractUrls(html)) {
    if (!isInternal(raw)) continue;
    const sitePath = siteAbsolute(bareUrl(raw), pageUrl);

    if (basePath && !(sitePath === basePath || sitePath.startsWith(`${basePath}/`))) {
      findings.push({
        page: pageUrl,
        url: raw,
        problem: `missing the ${basePath} base path, so it resolves to the domain root`,
      });
      continue;
    }

    const local = basePath ? sitePath.slice(basePath.length) : sitePath;
    if (!candidatePaths(local).some(exists)) {
      findings.push({ page: pageUrl, url: raw, problem: "nothing was exported at that path" });
    }
  }

  return findings;
}

/** Every .html file under `dir`, as paths relative to it. */
function htmlFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current).sort()) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".html")) out.push(relative(dir, full).replaceAll("\\", "/"));
    }
  };
  walk(dir);
  return out;
}

async function main() {
  const dist = resolve("dist");
  const basePath = resolveBasePath();

  if (!existsSync(dist)) {
    console.error("No dist/ to check. Run the build first.");
    process.exit(1);
  }

  const exists = (path: string) => existsSync(join(dist, path));
  const pages = htmlFiles(dist);
  const findings: Finding[] = [];

  for (const file of pages) {
    const route = file.replace(/(^|\/)index\.html$/, "$1");
    findings.push(
      ...checkPage(
        await Bun.file(join(dist, file)).text(),
        `${basePath}/${route}`,
        basePath,
        exists,
      ),
    );
  }

  // Pagefind's bundle is fetched from JavaScript, so no link on any page points
  // at it and the loop above cannot see it. Get the base path wrong here and
  // search does not error — it returns no results for every query, forever.
  if (!exists("pagefind/pagefind.js")) {
    findings.push({
      page: "(search)",
      url: `${basePath}/pagefind/pagefind.js`,
      problem: "the Pagefind bundle is missing, so site search will return nothing",
    });
  }

  if (findings.length > 0) {
    console.error(`Broken internal links (${findings.length}):\n`);
    for (const f of findings) {
      console.error(`  ${f.page}\n    ${f.url} — ${f.problem}`);
    }
    process.exit(1);
  }

  console.log(`Links OK: ${pages.length} pages checked against base path "${basePath || "/"}".`);
}

if (import.meta.main) await main();

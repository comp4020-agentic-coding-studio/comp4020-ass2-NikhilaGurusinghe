import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";
import { resolveBasePath } from "./lib/base-path";

// Where this site will be served from, which is not the same answer in both
// places it runs.
//
// GitHub Pages serves a project repo under https://<owner>.github.io/<repo>/,
// and that prefix is Pages routing the request, not a choice Next makes. The
// framework has to know it at build time or every asset URL and internal link
// points at the domain root: invisible locally, total on the live URL. So the
// production build keeps it.
//
// The dev server has no such prefix imposed on it, and inheriting one only
// moved the home page off http://localhost:3000 for no benefit. So dev serves
// at the root and the deployed site is unchanged.
//
// The condition is written to fail safe. Next loads this file in the build
// process and again in each export worker, and a worker that reported an
// unexpected phase must still get the real base path — an unprefixed
// production build looks fine locally and ships a site with no CSS. Hence
// "dev, else the real thing" rather than "prod, else empty".
//
// One consequence worth knowing: a hand-written absolute link like
// <a href="/sessions/"> now works in dev and 404s in production. That was
// always a bug; it is just no longer visible locally. scripts/check-links.ts
// runs over the built site and fails on exactly this, which is why that gate
// exists and why it is not optional.
export default function config(phase: string): NextConfig {
  const basePath = phase === PHASE_DEVELOPMENT_SERVER ? "" : resolveBasePath();

  return {
    // A fully static site, exported to dist/. `output: "export"` plus a distDir
    // other than .next makes Next put build intermediates in .next/ and the
    // static site in dist/ — which is what spec/data-integrity.test.ts reads and
    // what the Pages workflow uploads, so both keep working untouched.
    output: "export",
    distDir: "dist",

    // Matches Astro's `trailingSlash: "always"`, so every route keeps the URL it
    // already had and no existing link has to change.
    trailingSlash: true,

    basePath,

    // Static export has no image optimisation server. Note this means next/image
    // emits a single src and no srcset, so images must be static imports: a
    // string src is NOT rewritten with basePath and would 404 under the sub-path.
    images: { unoptimized: true },

    // Client components can't read next.config, and Pagefind's bundlePath has to
    // carry the sub-path or every search silently returns nothing. Inlined at
    // build time, so it tracks the value above rather than restating it.
    env: { NEXT_PUBLIC_BASE_PATH: basePath },
  };
}

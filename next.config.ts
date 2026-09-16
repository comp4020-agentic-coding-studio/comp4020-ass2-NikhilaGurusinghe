import type { NextConfig } from "next";
import { gitOrigin, resolveDeployment } from "./scripts/pages-base";

// Where this site will be served from. Unchanged in spirit from the Astro
// config it replaces: GitHub Pages serves a project repo under a sub-path, and
// the framework has to know that path at build time or every asset URL and
// internal link points at the domain root. Invisible locally, total on the
// live URL.
//
// Resolved at module scope because Next evaluates this file in the build
// process and again in each export worker, and gitOrigin() shells out to git.
const { base } = resolveDeployment(process.env, gitOrigin);

// resolveDeployment speaks Astro's dialect, where the domain root is "/".
// Next rejects a basePath of "/" and wants "" for that case, with no trailing
// slash on anything else.
const basePath = base === "/" ? "" : base.replace(/\/+$/, "");

const nextConfig: NextConfig = {
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
  // carry the sub-path or every search silently returns nothing.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;

import { gitOrigin, resolveDeployment } from "../scripts/pages-base";

/**
 * The sub-path this build is served from, in Next's dialect.
 *
 * `resolveDeployment` speaks Astro's, where the domain root is "/". Next
 * rejects a basePath of "/" and wants "" for that case, with no trailing slash
 * on anything else.
 *
 * This conversion lives here rather than inline in next.config.ts because
 * three things now need the same answer: the config that rewrites every link,
 * the link gate that checks the rewriting actually happened, and the a11y gate
 * that has to find the files those links point at. If they disagree, the gate
 * passes a site that 404s — the one failure this whole arrangement exists to
 * prevent.
 */
export function resolveBasePath(env: Record<string, string | undefined> = process.env): string {
  const { base } = resolveDeployment(env, gitOrigin);
  return base === "/" ? "" : base.replace(/\/+$/, "");
}

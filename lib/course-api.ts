import { resolve } from "node:path";
import { courseMeta } from "@/src/course-config";
import { SITE_TIMEZONE } from "@/src/lib/dates";
import { courseApiCollections } from "./collections";
import type { CourseCollection } from "./course-content";
import { readCourseNodes, writeCourseApi } from "./course-content";
import type { GraphError, ResolvedGraph } from "./course-graph";
import { resolveGraph } from "./course-graph";

/**
 * Every option the course API is emitted with, in one place.
 *
 * Under Astro these lived in the `courseGraph()` integration block in
 * astro.config.ts. Next has no equivalent hook, so the emitter runs as a build
 * step (scripts/emit-course-api.ts) and the dangling-ref gate reads the same
 * settings from here. Two copies of this configuration would be two chances for
 * the published API and the gate that checks it to disagree.
 */

/** Matches Astro's `config.srcDir`, which is what the emitter walked before. */
const SRC_DIR = resolve(process.cwd(), "src");

/**
 * The zone the site's bare frontmatter dates are read in. Emitted verbatim;
 * dates are never rewritten to a UTC offset, which would bake in one side of a
 * DST transition.
 *
 * Defined with the formatter that reads it, so the zone the API tells consumers
 * to use and the zone the pages actually print cannot drift apart.
 */
export const API_TIMEZONE = SITE_TIMEZONE;

/**
 * Where the catalogue expects to find this course. Deliberately not the
 * GitHub Pages URL: that moves with the repo, and the catalogue entry should
 * not.
 */
export const CANONICAL_URL = `https://courses.slop.university/${courseMeta.code}/`;

/**
 * All five collections default to `src/content/<key>`. Under Astro `policies`
 * was a page (`src/pages/policies/`) that the emitter was pointed at with an
 * explicit `dir`; here it is content like everything else, because in the App
 * Router a `src/pages/` directory is a second router and Next refuses to build
 * with both.
 */
export const apiCollections: CourseCollection[] = courseApiCollections.map((key) => ({ key }));

/** Read and resolve the whole content graph, errors included. */
export async function loadCourseGraph(): Promise<ResolvedGraph> {
  return resolveGraph(await readCourseNodes(SRC_DIR, apiCollections));
}

/** Render graph errors the way the Astro integration did, capped like it too. */
export function formatGraphErrors(errors: GraphError[]): string {
  const lines = errors.slice(0, 20).map((e) => `  ${e.type}: ${e.detail}`);
  if (errors.length > 20) lines.push(`  ... and ${errors.length - 20} more`);
  return `Course graph has ${errors.length} error(s):\n${lines.join("\n")}`;
}

/** Write `<dist>/api/**` exactly as the Astro build did. */
export async function emitCourseApi(distPath: string) {
  return writeCourseApi(SRC_DIR, distPath, apiCollections, API_TIMEZONE, courseMeta, CANONICAL_URL);
}

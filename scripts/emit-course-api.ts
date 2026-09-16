#!/usr/bin/env bun
/**
 * Write dist/api/** after the Next export.
 *
 * This was an Astro integration hook (`astro:build:done`). Next has no
 * equivalent, and the API is not a route: it is a build artefact with a
 * published contract, asserted byte-for-byte in spec/course-api.test.ts. Making
 * it a build step rather than a route handler also keeps it out of the
 * bundler's reach, so the emitted JSON depends on nothing but the content files.
 */
import { emitCourseApi, formatGraphErrors } from "../lib/course-api.ts";

const { graph, filesWritten } = await emitCourseApi("dist");

// Written before the check, as the integration did: when a ref is broken it is
// easier to see why from the emitted graph than from the error alone.
if (graph.errors.length > 0) {
  console.error(formatGraphErrors(graph.errors));
  process.exit(1);
}

console.log(
  `Generated course API: ${graph.nodes.length} nodes, ${graph.edges.length} edges, ${filesWritten} files.`,
);

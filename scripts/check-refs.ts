#!/usr/bin/env bun
/**
 * Fail the build on a broken `related:` reference.
 *
 * Astro's courseGraph() integration raised these from `astro:build:done`, which
 * meant waiting for a full site build to be told about a typo. This runs first
 * instead, in about a second. emit-course-api.ts checks again afterwards on the
 * same graph, so the gate cannot be skipped by running the steps out of order —
 * this copy is for the feedback loop, not the guarantee.
 */
import { formatGraphErrors, loadCourseGraph } from "../lib/course-api.ts";

const graph = await loadCourseGraph();

if (graph.errors.length > 0) {
  console.error(formatGraphErrors(graph.errors));
  process.exit(1);
}

console.log(`Course graph OK: ${graph.nodes.length} nodes, ${graph.edges.length} edges.`);

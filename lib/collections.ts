/**
 * Which content collections exist, and which of them are wired into the graph.
 *
 * Deliberately dependency-free. These lists are read by the API emitter and the
 * dangling-ref gate, which run as plain Bun scripts outside the bundler, so
 * anything imported here has to survive without Next: no image imports, no
 * `next/*`, no JSX. src/site-config.ts re-exports them for the site itself.
 */

/** Collections that participate in the related-content graph: their entries can
 *  reference each other, and every reference becomes an edge in the API. */
export const graphCollections = ["sessions", "assessments", "lectures", "people"] as const;

/** Every collection the generated API covers. `policies` is in the API but not
 *  the graph — it is a standalone page that assessments link to, with no
 *  references of its own. Miss it and the emitted contract loses a node. */
export const courseApiCollections = [...graphCollections, "policies"] as const;

export type GraphCollection = (typeof graphCollections)[number];
export type ApiCollection = (typeof courseApiCollections)[number];

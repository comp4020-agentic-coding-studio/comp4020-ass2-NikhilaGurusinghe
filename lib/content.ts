import { z } from "zod";
import { loadCourseGraph } from "./course-api";
import type { ContentNode } from "./course-graph";
import { symmetriseRelated } from "./course-graph";

/**
 * Typed access to the content collections, for the pages.
 *
 * Astro validated frontmatter through `defineCollection` schemas and handed
 * pages a typed entry. The loader underneath this has no such step — it is the
 * API emitter's, and it deliberately keeps frontmatter raw — so the schemas
 * move here and run over the loaded nodes instead. They are the same rules:
 * a week is 1–12, criterion weights sum to 100, a photo needs alt text.
 *
 * Validation stays strict and fails the build, because the alternative is a
 * page that renders a missing date as "Invalid Date" and nobody notices until
 * a marker does.
 */

const weekSchema = z.coerce.number().int().min(1).max(12);

/**
 * Dates stay strings, exactly as authored and as the API publishes them. They
 * are only turned into a Date at the point of formatting, in the site's
 * timezone — see src/lib/dates.ts. Parsing them here would mean two
 * representations of the same day and a standing chance of them disagreeing.
 */
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "use a bare YYYY-MM-DD date, read in the site timezone");

/** Assessments carry a time and an offset, since a deadline is a moment. */
const dateTime = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?([+-]\d{2}:\d{2}|Z)?)?$/,
    "use YYYY-MM-DD or a full ISO datetime with an offset",
  );

const teacherRefs = z.array(z.string().min(1)).min(1);

const weightedMarking = z
  .object({
    mode: z.literal("weighted"),
    criteria: z
      .array(z.object({ name: z.string().trim().min(1), weight: z.number().positive() }))
      .min(1),
  })
  .superRefine((marking, ctx) => {
    const total = marking.criteria.reduce((sum, criterion) => sum + criterion.weight, 0);
    if (total !== 100) {
      ctx.addIssue({
        code: "custom",
        path: ["criteria"],
        message: `criterion weights sum to ${total}, not 100`,
      });
    }
  });

const holisticMarking = z.object({
  mode: z.literal("holistic"),
  description: z.string().trim().min(40),
});

export const markingSchema = z.discriminatedUnion("mode", [weightedMarking, holisticMarking]);

/** `.loose()` throughout: extra frontmatter is allowed and reaches the API. */
const sessionMeta = z
  .object({ week: weekSchema, date: dateOnly, teachers: teacherRefs.optional() })
  .loose();

const assessmentMeta = z
  .object({
    week: weekSchema,
    due: dateTime,
    weight: z.coerce.number().positive().max(100),
    marking: markingSchema.optional(),
  })
  .loose();

const lectureMeta = z
  .object({
    week: weekSchema,
    date: dateOnly,
    teachers: teacherRefs.optional(),
    slides: z
      .string()
      .regex(/^\/decks\/[a-z0-9-]+\/$/, "point at a deck route like /decks/week-01/")
      .optional(),
  })
  .loose();

const personMeta = z
  .object({
    role: z.string().trim().min(1),
    contact: z.string().trim().min(1).optional(),
    affiliation: z.string().trim().min(1).optional(),
    email: z.email().optional(),
    url: z.url().optional(),
    photo: z.string().trim().min(1).optional(),
    photoAlt: z.string().trim().optional(),
  })
  .loose()
  .superRefine((person, ctx) => {
    if (person.photo && !person.photoAlt) {
      ctx.addIssue({
        code: "custom",
        path: ["photoAlt"],
        message: "describe the photo when one is supplied",
      });
    }
  });

const policyMeta = z.object({}).loose();

const META_SCHEMAS = {
  sessions: sessionMeta,
  assessments: assessmentMeta,
  lectures: lectureMeta,
  people: personMeta,
  policies: policyMeta,
} as const;

export type SessionMeta = z.infer<typeof sessionMeta>;
export type AssessmentMeta = z.infer<typeof assessmentMeta>;
export type LectureMeta = z.infer<typeof lectureMeta>;
export type PersonMeta = z.infer<typeof personMeta>;
export type Marking = z.infer<typeof markingSchema>;

/** A loaded node with its collection's metadata validated and typed. */
export interface Entry<M> extends Omit<ContentNode, "meta"> {
  meta: M;
  /** Declared refs plus incoming ones, matching the API's `related`. */
  relatedIds: string[];
}

export interface CourseContent {
  sessions: Entry<SessionMeta>[];
  assessments: Entry<AssessmentMeta>[];
  lectures: Entry<LectureMeta>[];
  people: Entry<PersonMeta>[];
  policies: Entry<Record<string, unknown>>[];
  /** Every entry by id, for resolving `related` and `teachers` refs. */
  byId: Map<string, Entry<Record<string, unknown>>>;
}

type MetaSchema = (typeof META_SCHEMAS)[keyof typeof META_SCHEMAS];
type LoadedEntry = Entry<Record<string, unknown>>;

/**
 * Parse one node's meta, or fail the build saying which file and which field.
 *
 * Returns the widened entry: which schema applies is decided at runtime from
 * `node.type`, so there is no type here to preserve. The narrowing happens once,
 * in `of<M>()`, where the collection name and its metadata type are written
 * down together.
 */
function validate(node: ContentNode, schema: MetaSchema, relatedIds: string[]): LoadedEntry {
  const parsed = schema.safeParse(node.meta);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  ${["meta", ...i.path].join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid frontmatter in ${node.id}:\n${issues}`);
  }
  return { ...node, meta: parsed.data, relatedIds };
}

/**
 * Loaded once per process. The static export renders every route in one build,
 * and re-walking the content tree for each of them would be the slowest thing
 * the build does.
 */
let cached: Promise<CourseContent> | undefined;

export function getCourseContent(): Promise<CourseContent> {
  cached ??= load();
  return cached;
}

async function load(): Promise<CourseContent> {
  const graph = await loadCourseGraph();
  if (graph.errors.length > 0) {
    // check-refs.ts reports these properly before the build starts; reaching
    // here means the build was run some other way.
    throw new Error(graph.errors.map((e) => `${e.type}: ${e.detail}`).join("\n"));
  }

  const related = symmetriseRelated(graph);
  const byType = new Map<string, LoadedEntry[]>();
  const byId = new Map<string, LoadedEntry>();

  for (const node of graph.nodes) {
    const schema = META_SCHEMAS[node.type as keyof typeof META_SCHEMAS] ?? policyMeta;
    const entry = validate(node, schema, related.get(node.id) ?? node.related);
    if (!byType.has(node.type)) byType.set(node.type, []);
    byType.get(node.type)?.push(entry);
    byId.set(node.id, entry);
  }

  // Astro got this from `reference("people")`. `teachers:` is not a graph edge
  // — the API proves it, people nodes have no incoming ones — so the graph's
  // dangling-ref check never sees these refs. Without this, a mistyped teacher
  // silently renders as a session with nobody teaching it.
  const missing: string[] = [];
  for (const entry of byId.values()) {
    const teachers = entry.meta.teachers;
    if (!Array.isArray(teachers)) continue;
    for (const ref of teachers) {
      const id = String(ref).includes("/") ? String(ref) : `people/${ref}`;
      if (!byId.has(id)) missing.push(`  ${entry.id} has teacher "${ref}" which does not exist`);
    }
  }
  if (missing.length > 0) {
    throw new Error(`Unresolved teacher refs:\n${missing.join("\n")}`);
  }

  const of = <M>(type: string): Entry<M>[] => (byType.get(type) ?? []) as unknown as Entry<M>[];
  const byWeek = <M extends { week: number }>(entries: Entry<M>[]) =>
    [...entries].sort((a, b) => a.meta.week - b.meta.week || a.slug.localeCompare(b.slug));

  return {
    sessions: byWeek(of<SessionMeta>("sessions")),
    assessments: byWeek(of<AssessmentMeta>("assessments")),
    lectures: byWeek(of<LectureMeta>("lectures")),
    // People have no natural order, so they get a stable one.
    people: of<PersonMeta>("people").sort((a, b) => a.title.localeCompare(b.title)),
    policies: of<Record<string, unknown>>("policies"),
    byId,
  };
}

/**
 * Resolve an entry's `relatedIds` to the entries they name.
 *
 * Silently drops an id with no entry, which is safe only because
 * scripts/check-refs.ts has already failed the build on a dangling ref — the
 * gate is what makes this the right shape rather than a swallowed error.
 */
export function resolveRelated(
  content: CourseContent,
  entry: Entry<Record<string, unknown>> | { relatedIds: string[] },
): Entry<Record<string, unknown>>[] {
  return entry.relatedIds.flatMap((id) => {
    const target = content.byId.get(id);
    return target ? [target] : [];
  });
}

/** Resolve a `teachers:` list to the people entries it names. */
export function resolveTeachers(
  content: CourseContent,
  teachers: string[] | undefined,
): Entry<PersonMeta>[] {
  if (!teachers) return [];
  return teachers.flatMap((ref) => {
    const entry = content.byId.get(ref.includes("/") ? ref : `people/${ref}`);
    return entry ? [entry as Entry<PersonMeta>] : [];
  });
}

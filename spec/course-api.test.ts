import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

/**
 * The published /api contract.
 *
 * A catalogue outside this repo ingests these files, so their shape is an
 * interface, not an implementation detail: key order, which fields vanish when
 * empty, and whether a date survives as the string somebody authored are all
 * things a consumer can depend on and none of them are visible on the rendered
 * site. Nothing here would fail loudly in a browser, which is exactly why it is
 * asserted.
 *
 * Read with spec/fixtures/golden-api/, captured from the last Astro build
 * before the port.
 */

const API_DIR = resolve("dist/api");
const GOLDEN_DIR = resolve("spec/fixtures/golden-api");

// Key order is part of the contract because the files are served as-is and
// diffed by consumers. Optional keys are marked; everything else is required.
const NODE_KEYS = [
  "id",
  "type",
  "title",
  ["description"],
  "tags",
  "related",
  "links",
  ["spec"],
  "meta",
  "timezone",
  "body",
] as const;

const INDEX_ENTRY_KEYS = [
  "id",
  "type",
  "title",
  ["description"],
  "tags",
  "related",
  ["spec"],
  ["meta"],
] as const;

type KeySpec = readonly (string | readonly [string])[];

/** Assert `keys` is `spec` with any subset of the optional entries dropped. */
function expectKeyOrder(keys: string[], spec: KeySpec, where: string) {
  const required = spec.filter((k): k is string => typeof k === "string");
  const allowed = spec.map((k) => (typeof k === "string" ? k : k[0]));

  for (const key of required) {
    expect(keys, `${where} is missing required key "${key}"`).toContain(key);
  }
  for (const key of keys) {
    expect(allowed, `${where} has unexpected key "${key}"`).toContain(key);
  }
  // Order: the keys present must appear in the contract's sequence.
  const positions = keys.map((k) => allowed.indexOf(k));
  const sorted = [...positions].sort((a, b) => a - b);
  expect(positions, `${where} keys are out of contract order: ${keys.join(", ")}`).toEqual(sorted);
}

function jsonFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".json")) out.push(full);
    }
  };
  walk(dir);
  return out.sort();
}

interface ApiNode {
  id: string;
  type: string;
  related: string[];
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

interface CourseApi {
  schemaVersion: number;
  canonicalUrl: string;
  course: Record<string, unknown>;
  timezone: string;
  nodes: ApiNode[];
  edges: { from: string; to: string }[];
}

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const index = read(join(API_DIR, "index.json")) as CourseApi;
const nodeFiles = jsonFiles(API_DIR).filter((f) => f !== join(API_DIR, "index.json"));

describe("/api/index.json", () => {
  it("declares the contract version and the course record", () => {
    expect(Object.keys(index)).toEqual([
      "schemaVersion",
      "canonicalUrl",
      "course",
      "timezone",
      "nodes",
      "edges",
    ]);
    expect(index.schemaVersion).toBe(1);
    expect(Object.keys(index.course)).toEqual([
      "code",
      "title",
      "session",
      "year",
      "level",
      "startDate",
      "endDate",
      "description",
      "tags",
      "learningOutcomes",
    ]);
  });

  it("points at the catalogue, not wherever this repo happens to deploy", () => {
    // A GitHub Pages URL moves with the repo; the catalogue entry must not.
    expect(index.canonicalUrl).toMatch(/^https:\/\/courses\.slop\.university\/[A-Z]+\d{4}\/$/);
    expect(index.canonicalUrl).not.toContain("github.io");
  });

  it("gives every entry the index shape, without the per-node fields", () => {
    expect(index.nodes.length).toBeGreaterThan(0);
    for (const node of index.nodes) {
      expectKeyOrder(Object.keys(node), INDEX_ENTRY_KEYS, `index entry ${node.id}`);
    }
  });

  it("drops meta and spec entirely rather than emitting them empty", () => {
    for (const node of index.nodes) {
      if ("meta" in node) expect(Object.keys(node.meta ?? {}).length).toBeGreaterThan(0);
      if ("spec" in node) expect((node.spec as string[]).length).toBeGreaterThan(0);
    }
  });
});

describe("/api/<type>/<slug>.json", () => {
  it("writes one file per indexed node, and no others", () => {
    const fromFiles = nodeFiles
      .map((f) =>
        relative(API_DIR, f)
          .replace(/\.json$/, "")
          .replaceAll("\\", "/"),
      )
      .sort();
    expect(fromFiles).toEqual(index.nodes.map((n) => n.id).sort());
  });

  it("always carries links, meta, timezone and body", () => {
    for (const file of nodeFiles) {
      const node = read(file) as ApiNode;
      expectKeyOrder(Object.keys(node), NODE_KEYS, `node ${node.id}`);
      // meta and links stay even when empty here, unlike in the index.
      expect(node.links, `${node.id} must carry links`).toBeInstanceOf(Array);
      expect(node.meta, `${node.id} must carry meta`).toBeInstanceOf(Object);
      expect(typeof node.body, `${node.id} must carry body`).toBe("string");
    }
  });

  it("agrees with the index on every shared field", () => {
    for (const entry of index.nodes) {
      const node = read(join(API_DIR, `${entry.id}.json`)) as ApiNode;
      for (const key of ["id", "type", "title", "description", "tags", "related", "spec"]) {
        if (key in entry) expect(node[key], `${entry.id}.${key}`).toEqual(entry[key]);
      }
    }
  });
});

describe("the content graph", () => {
  it("only draws edges between nodes that exist, and never to itself", () => {
    const ids = new Set(index.nodes.map((n) => n.id));
    for (const edge of index.edges) {
      expect(ids.has(edge.from), `edge from unknown node ${edge.from}`).toBe(true);
      expect(ids.has(edge.to), `edge to unknown node ${edge.to}`).toBe(true);
      expect(edge.from).not.toBe(edge.to);
    }
  });

  it("symmetrises related, so one node answers 'what relates to this?'", () => {
    const byId = new Map(index.nodes.map((n) => [n.id, n]));
    for (const edge of index.edges) {
      expect(byId.get(edge.to)?.related, `${edge.to} should list ${edge.from} back`).toContain(
        edge.from,
      );
      expect(byId.get(edge.from)?.related).toContain(edge.to);
    }
  });

  it("keeps edges directed by declaration, so a teacher is not a graph edge", () => {
    // `teachers:` is frontmatter, and lands in meta. Only `related:` makes
    // edges. If this ever fails, every person has become a hub in the graph.
    const declared = index.edges.filter((e) => e.to.startsWith("people/"));
    expect(declared).toEqual([]);
  });
});

describe("dates", () => {
  // The trap this guards: YAML 1.1 parsers coerce an unquoted `2027-02-22`
  // into a Date, which JSON.stringify then writes as
  // "2027-02-22T00:00:00.000Z" — a different day in half the world's
  // timezones. yaml@2 is YAML 1.2, which has no implicit timestamp type, so
  // authored dates stay strings. Swap the parser and this is what breaks.
  it("emits dates exactly as they were authored", () => {
    for (const file of nodeFiles) {
      const node = read(file) as ApiNode;
      for (const [key, value] of Object.entries(node.meta ?? {})) {
        if (typeof value !== "string") continue;
        expect(value, `${node.id}.meta.${key} was coerced through a Date`).not.toMatch(
          /T00:00:00\.000Z$/,
        );
      }
    }
  });

  it("names the timezone the bare dates should be read in", () => {
    expect(index.timezone).toBe("Australia/Canberra");
    expect(() => new Intl.DateTimeFormat("en", { timeZone: index.timezone })).not.toThrow();
  });
});

/**
 * Byte-for-byte against the pre-port Astro build.
 *
 * This is the proof that the Bun emitter is a port and not a rewrite, and it is
 * the reason the fixture is committed. It is scoped to the starter content on
 * purpose: Assignment 2 requires that content to be replaced (check-evidence.ts
 * enforces it), and when it is, these files *should* differ. The comparison
 * then stops applying and the structural contract above carries on doing the
 * work. If you want the byte check back after rewriting the course, re-capture
 * the fixture from a build you trust.
 */
describe("golden contract", () => {
  const golden = jsonFiles(GOLDEN_DIR).map((f) => relative(GOLDEN_DIR, f).replaceAll("\\", "/"));
  const current = jsonFiles(API_DIR).map((f) => relative(API_DIR, f).replaceAll("\\", "/"));
  const sameNodes = golden.length === current.length && golden.every((f, i) => f === current[i]);

  it.skipIf(!sameNodes)("reproduces the Astro build exactly", () => {
    for (const name of golden) {
      expect(
        readFileSync(join(API_DIR, name), "utf8"),
        `${name} differs from the Astro-generated original`,
      ).toBe(readFileSync(join(GOLDEN_DIR, name), "utf8"));
    }
  });
});

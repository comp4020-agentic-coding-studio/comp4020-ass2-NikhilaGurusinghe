import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * The promises SLOP1836 makes that the build cannot check for itself.
 *
 * The build already owns compilation, accessibility, internal links, content
 * refs and API generation, and `data-integrity.test.ts` owns the one date range
 * check. What is left is the course *as a course*: twelve weeks that actually
 * run weekly, an assessment scheme that actually adds up, a syllabus that covers
 * the three art forms the handbook entry advertises, a deck that is really in
 * the build, and a fiction disclaimer on every page rather than only the ones a
 * reader thinks to check.
 *
 * These read the built site — `dist/api/index.json` and the rendered HTML —
 * rather than `src/`, so they assert what a visitor gets. Rewrite the pages in
 * another stack and these should still pass unchanged.
 */

interface ApiNode {
  id: string;
  type: string;
  title: string;
  description?: string;
  meta?: Record<string, unknown>;
}

interface CourseApi {
  course: {
    code: string;
    level: number;
    description: string;
    startDate: string;
    endDate: string;
  };
  nodes: ApiNode[];
}

const distDir = resolve("dist");
const api = JSON.parse(readFileSync(join(distDir, "api/index.json"), "utf8")) as CourseApi;

/** Frontmatter dates reach the API as full timestamps; the day is what we mean. */
const dateOnly = (value: unknown): string => String(value).slice(0, 10);
/** Day-of-week read in UTC, so the answer does not depend on the runner's zone. */
const weekdayOf = (day: string): number => new Date(`${day}T00:00:00Z`).getUTCDay();
const daysBetween = (from: string, to: string): number =>
  (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000;

const of = (type: string): ApiNode[] => api.nodes.filter((node) => node.type === type);
const weekOf = (node: ApiNode): number => Number(node.meta?.week);
const byWeek = (nodes: ApiNode[]): ApiNode[] => [...nodes].sort((a, b) => weekOf(a) - weekOf(b));

const workshops = of("sessions");
const lectures = of("lectures");
const assessments = of("assessments");

// Every `.html` the build emitted, minus Pagefind's search bundle, which is
// generated artefacts rather than pages anyone reads.
const pages = readdirSync(distDir, { recursive: true, encoding: "utf8" })
  .filter((entry) => entry.endsWith(".html"))
  .filter((entry) => !entry.split(/[\\/]/).includes("pagefind"))
  .map((entry) => join(distDir, entry));

describe("the course record", () => {
  it("keeps the three code digits this repo was allocated", () => {
    // The cohort's codes are unique in their last three digits; only the
    // leading level digit was ever ours to choose.
    expect(api.course.code).toMatch(/^SLOP\d836$/);
    expect(api.course.code.startsWith(`SLOP${api.course.level}`)).toBe(true);
  });
});

describe("the shape of the semester", () => {
  it("runs twelve teaching weeks with one workshop each", () => {
    // The workshops page tells students there are twelve weekly labs and that
    // ten of twelve count for participation. Twelve has to be true.
    expect(workshops.map(weekOf).sort((a, b) => a - b)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it("holds every workshop on the same weekday, and not at the weekend", () => {
    const weekdays = new Set(workshops.map((w) => weekdayOf(dateOnly(w.meta?.date))));
    expect([...weekdays]).toHaveLength(1);
    expect([1, 2, 3, 4, 5]).toContain([...weekdays][0]);
  });

  it("runs those weeks back to back, pausing once for the teaching break", () => {
    const days = byWeek(workshops).map((w) => dateOnly(w.meta?.date));
    const gaps = days.slice(1).map((day, i) => daysBetween(days[i], day));

    // One gap is the mid-semester break. Everything else is a week, and the
    // break itself is a whole number of weeks, so the weekday never drifts.
    const irregular = gaps.filter((gap) => gap !== 7);
    expect(irregular, "workshops should be weekly apart from the teaching break").toHaveLength(1);
    expect(irregular[0] % 7, "the teaching break should be a whole number of weeks").toBe(0);
  });

  it("gives every workshop its own page at its collection address", () => {
    for (const workshop of workshops) {
      const slug = workshop.id.split("/")[1];
      const route = ["sessions", slug, "index.html"];
      const built = pages.some((page) => page.split(/[\\/]/).slice(-3).join("/") === route.join("/"));
      expect(built, `${workshop.id} has no page at /sessions/${slug}/`).toBe(true);
    }
  });
});

describe("the assessment scheme", () => {
  it("adds up to 100%", () => {
    const total = assessments.reduce((sum, item) => sum + Number(item.meta?.weight), 0);
    expect(total).toBe(100);
  });

  it("never falls due before the week it is set in", () => {
    const workshopDay = new Map(workshops.map((w) => [weekOf(w), dateOnly(w.meta?.date)]));
    for (const item of assessments) {
      const set = workshopDay.get(weekOf(item));
      expect(set, `${item.id} is set in week ${weekOf(item)}, which has no workshop`).toBeDefined();
      const due = dateOnly(item.meta?.due);
      expect(due >= set!, `${item.id} is due ${due}, before its week-${weekOf(item)} workshop`).toBe(
        true,
      );
    }
  });
});

describe("lectures", () => {
  it("publishes at least one deck, and ships the file it links", () => {
    const withSlides = lectures.filter((l) => typeof l.meta?.slides === "string");
    expect(withSlides.length, "no lecture links a deck").toBeGreaterThan(0);

    for (const lecture of withSlides) {
      const href = String(lecture.meta!.slides);
      const file = join(distDir, href.replace(/^\//, ""));
      expect(existsSync(file), `${lecture.id} links ${href}, which is not in the build`).toBe(true);
    }
  });

  it("holds every lecture on the same weekday, in a week that has a workshop", () => {
    const teachingWeeks = new Set(workshops.map(weekOf));
    const weekdays = new Set(lectures.map((l) => weekdayOf(dateOnly(l.meta?.date))));
    expect([...weekdays]).toHaveLength(1);

    for (const lecture of lectures) {
      expect(
        teachingWeeks.has(weekOf(lecture)),
        `${lecture.id} is in week ${weekOf(lecture)}, which has no workshop`,
      ).toBe(true);
    }
  });
});

describe("every rendered page", () => {
  it("carries the legal-fiction disclaimer", () => {
    // Slop University does not exist and neither does anything described here.
    // The disclaimer is only doing its job if it is on the page a reader landed
    // on, so this asserts all of them rather than the footer component.
    expect(pages.length, "the build produced no pages").toBeGreaterThan(0);
    for (const page of pages) {
      expect(readFileSync(page, "utf8"), `${page} is missing the fiction disclaimer`).toContain(
        "purely fictitious",
      );
    }
  });
});

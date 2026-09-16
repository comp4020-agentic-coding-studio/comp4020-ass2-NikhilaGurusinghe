#!/usr/bin/env bun
/**
 * Fail the build on an accessibility violation in the exported HTML.
 *
 * Runs axe-core over every page the export wrote, in jsdom. That is the whole
 * reason it can be a build gate: no browser to drive, no server to start, so
 * it costs about a second and runs on every build rather than when somebody
 * remembers.
 *
 * What it cannot see, and what therefore is not covered:
 *
 * jsdom has no layout engine. It computes no boxes, so `color-contrast` cannot
 * be evaluated — axe reports it as incomplete, not passing — and neither can
 * anything about overlap, reflow, or target size. Those are exactly the
 * failures that show up at the two viewports this site is marked at, so they
 * stay a matter of looking at the rendered page in a real browser. This gate
 * catches the other kind: the image with no alt text, the heading level that
 * skips, the control whose only label is a colour, the landmark that is
 * missing. Structural mistakes, which are invisible in a screenshot and
 * cheaply provable here.
 *
 * best-practice tags are included on purpose. `region` and `heading-order` are
 * not WCAG failures, but a page whose content sits outside any landmark is
 * genuinely worse to navigate by screen reader, and neither rule has ever
 * fired on correct markup here.
 */
import { existsSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import axe from "axe-core";
import { JSDOM } from "jsdom";

/** WCAG 2.1 AA, which is the ANU's stated standard, plus axe's own advice. */
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"];

export interface PageViolation {
  page: string;
  id: string;
  impact: string;
  help: string;
  helpUrl: string;
  /** The offending markup, trimmed to something readable in a CI log. */
  nodes: string[];
}

/** Run axe over one page's HTML. Exported so a spec can hand it known-bad markup. */
export async function auditHtml(html: string, page: string): Promise<PageViolation[]> {
  const dom = new JSDOM(html, {
    // Gives us window.eval for injecting axe, without running the page's own
    // scripts: those are Next's hydration bundles, which have no business
    // executing here and would only fail noisily in a DOM with no layout.
    runScripts: "outside-only",
    pretendToBeVisual: true,
    // axe checks link and iframe URLs, and a relative URL needs some origin to
    // resolve against. Never fetched.
    url: "https://example.test/",
  });

  try {
    dom.window.eval(axe.source);
    // axe now lives on the jsdom window, which is typed without it. Borrowing
    // the imported module's type is honest — it is the same script, evaluated
    // in there so that document queries and getComputedStyle resolve against
    // this page — and it keeps the results typed rather than `any`.
    const { axe: inWindow } = dom.window as unknown as { axe: typeof axe };
    const results = await inWindow.run(dom.window.document, {
      resultTypes: ["violations"],
      runOnly: { type: "tag", values: TAGS },
      rules: {
        // Not skipped because it does not matter — it is the single most
        // common real failure — but because jsdom cannot compute it and a
        // rule that can never fire is worse than an honest gap. Checked in
        // the browser instead.
        "color-contrast": { enabled: false },
      },
    });

    return results.violations.map((v) => ({
      page,
      id: v.id,
      impact: v.impact ?? "unknown",
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.map((n) => n.html.replace(/\s+/g, " ").slice(0, 160)),
    }));
  } finally {
    // jsdom keeps timers and a fake event loop alive; without this the script
    // exports cleanly but the process hangs at the end of the build.
    dom.window.close();
  }
}

/** Every .html file under `dir`, as paths relative to it. */
function htmlFiles(dir: string): string[] {
  const out: string[] = [];
  const walk = (current: string) => {
    for (const entry of readdirSync(current).sort()) {
      const full = join(current, entry);
      if (statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith(".html")) out.push(relative(dir, full).replaceAll("\\", "/"));
    }
  };
  walk(dir);
  return out;
}

async function main() {
  const dist = resolve("dist");
  if (!existsSync(dist)) {
    console.error("No dist/ to check. Run the build first.");
    process.exit(1);
  }

  const pages = htmlFiles(dist);
  const violations: PageViolation[] = [];

  for (const file of pages) {
    violations.push(...(await auditHtml(await Bun.file(join(dist, file)).text(), file)));
  }

  if (violations.length > 0) {
    console.error(`Accessibility violations (${violations.length}):\n`);
    for (const v of violations) {
      console.error(`  ${v.page}\n    ${v.id} (${v.impact}): ${v.help}\n    ${v.helpUrl}`);
      for (const node of v.nodes) console.error(`      ${node}`);
    }
    process.exit(1);
  }

  console.log(`Accessibility OK: ${pages.length} pages, no axe violations.`);
}

if (import.meta.main) await main();

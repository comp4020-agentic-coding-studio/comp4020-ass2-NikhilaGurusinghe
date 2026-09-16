import { describe, expect, it } from "bun:test";
import { auditHtml } from "../scripts/check-a11y.ts";
import {
  bareUrl,
  candidatePaths,
  checkPage,
  extractUrls,
  isInternal,
  siteAbsolute,
} from "../scripts/check-links.ts";

/**
 * The gates, checked against the failures they exist to catch.
 *
 * A build gate that cannot fail is worse than no gate: it reports "Links OK"
 * on every build and everybody stops reading the line. So each of these hands
 * the gate markup that is definitely wrong and asserts it says so. The cases
 * are the specific mistakes this site is exposed to, not a sample of possible
 * ones.
 */

const BASE = "/comp4020-ass2-NikhilaGurusinghe";

/** An export containing exactly one route and one asset. */
const exported = (paths: string[]) => {
  const set = new Set(paths);
  return (path: string) => set.has(path);
};

const page = (body: string) => `<!doctype html><html lang="en"><head><title>t</title></head>
<body>${body}</body></html>`;

describe("check-links: what counts as a URL", () => {
  it("reads every attribute a browser would follow or fetch", () => {
    const urls = extractUrls(
      page(`
        <a href="/a/">a</a>
        <img src="/b.avif" srcset="/b-1x.avif 1x, /b-2x.avif 2x">
        <form action="/search/"></form>
        <video poster="/c.jpg"></video>
        <link rel="preload" imagesrcset="/d.avif 1x">
      `),
    );
    expect(urls).toEqual(
      expect.arrayContaining([
        "/a/",
        "/b.avif",
        "/b-1x.avif",
        "/b-2x.avif",
        "/search/",
        "/c.jpg",
        "/d.avif",
      ]),
    );
  });

  it("splits srcset on the comma, not the descriptor", () => {
    // The trap: naively taking the attribute gives "/b-1x.avif 1x, /b-2x.avif 2x"
    // as one URL, which exists nowhere and fails a passing build.
    const urls = extractUrls(page(`<img src="/x.avif" srcset="/b-1x.avif 1x, /b-2x.avif 2x">`));
    expect(urls).not.toContain("/b-1x.avif 1x");
    expect(urls).toContain("/b-2x.avif");
  });

  it("leaves other people's servers alone", () => {
    for (const url of [
      "https://anu.edu.au/",
      "//cdn.example.com/x.js",
      "mailto:someone@anu.edu.au",
      "tel:+61260000000",
      "data:image/gif;base64,R0lGOD",
      "#main-content",
      "",
    ]) {
      expect(isInternal(url), `${url} should not be checked`).toBe(false);
    }
    expect(isInternal("/sessions/")).toBe(true);
    expect(isInternal("../people/")).toBe(true);
  });

  it("resolves a URL down to the path that names a file", () => {
    expect(bareUrl("/sessions/?q=1#week-3")).toBe("/sessions/");
    expect(bareUrl("/decks/week%2001/")).toBe("/decks/week 01/");
    // Resolved against the page's directory, as a browser would: the trailing
    // slash on a route means `..` climbs out of week-01, not out of sessions.
    expect(siteAbsolute("../people/", "/repo/sessions/week-01/")).toBe("/repo/sessions/people/");
    expect(siteAbsolute("../../people/", "/repo/sessions/week-01/")).toBe("/repo/people/");
    expect(siteAbsolute("/people/", "/repo/sessions/week-01/")).toBe("/people/");
  });

  it("knows a route is a directory and an asset is a file", () => {
    expect(candidatePaths("/people/")).toEqual(["people/index.html"]);
    expect(candidatePaths("/")).toEqual(["index.html"]);
    expect(candidatePaths("/_next/static/x.css")).toContain("_next/static/x.css");
  });
});

describe("check-links: the base-path failure", () => {
  // This is the whole point of the gate. Every one of these links names a file
  // that exists in the export; they are still broken, because the browser will
  // ask github.io for it rather than github.io/<repo>.
  const exists = exported(["people/index.html", "logo.avif"]);

  it("fails a root-relative link that skipped the base path", () => {
    const findings = checkPage(page(`<a href="/people/">People</a>`), `${BASE}/`, BASE, exists);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.problem).toContain("base path");
  });

  it("fails an asset that skipped it too, not just a link", () => {
    const findings = checkPage(page(`<img src="/logo.avif" alt="">`), `${BASE}/`, BASE, exists);
    expect(findings).toHaveLength(1);
  });

  it("passes the same links once they carry it", () => {
    const html = page(`<a href="${BASE}/people/">People</a><img src="${BASE}/logo.avif" alt="">`);
    expect(checkPage(html, `${BASE}/`, BASE, exists)).toEqual([]);
  });

  it("still fails a prefixed link that points at nothing", () => {
    // A renamed route or a typo'd slug: the prefix is right, the target is gone.
    const findings = checkPage(
      page(`<a href="${BASE}/teachers/">Staff</a>`),
      `${BASE}/`,
      BASE,
      exists,
    );
    expect(findings).toHaveLength(1);
    expect(findings[0]?.problem).toContain("nothing was exported");
  });

  it("resolves a relative link against the page it is on", () => {
    // Two levels up from a week page, because `trailingSlash: true` makes
    // /sessions/week-01/ a directory. A relative link is also the one form
    // that needs no base path of its own — it inherits the page's.
    const findings = checkPage(
      page(`<a href="../../people/">People</a>`),
      `${BASE}/sessions/week-01/`,
      BASE,
      exists,
    );
    expect(findings).toEqual([]);
  });

  it("fails a relative link that climbs out of the site", () => {
    const findings = checkPage(
      page(`<a href="../../../people/">People</a>`),
      `${BASE}/sessions/week-01/`,
      BASE,
      exists,
    );
    expect(findings).toHaveLength(1);
  });

  it("asks for nothing when the site is served from the domain root", () => {
    // A user/org repo, or a dev build: basePath is "" and a bare /people/ is right.
    expect(checkPage(page(`<a href="/people/">People</a>`), "/", "", exists)).toEqual([]);
  });
});

describe("check-a11y", () => {
  it("catches an image with no alt text", async () => {
    const found = await auditHtml(page(`<main><img src="/x.avif"></main>`), "test");
    expect(found.map((v) => v.id)).toContain("image-alt");
  });

  it("catches content sitting outside every landmark", async () => {
    const found = await auditHtml(page(`<h1>Week 1</h1><p>Body text.</p>`), "test");
    expect(found.map((v) => v.id)).toContain("region");
  });

  it("catches a heading level that skips", async () => {
    const found = await auditHtml(page(`<main><h1>A</h1><h3>B</h3></main>`), "test");
    expect(found.map((v) => v.id)).toContain("heading-order");
  });

  it("catches a page with no language set", async () => {
    const found = await auditHtml(
      `<!doctype html><html><head><title>t</title></head><body><main><p>x</p></main></body></html>`,
      "test",
    );
    expect(found.map((v) => v.id)).toContain("html-has-lang");
  });

  it("passes markup that is actually fine", async () => {
    const found = await auditHtml(
      page(`<main><h1>Week 1</h1><img src="/x.avif" alt="A lecture theatre"></main>`),
      "test",
    );
    expect(found).toEqual([]);
  });

  it("is honest about not checking colour contrast", async () => {
    // Black on near-black, which is the most obvious contrast failure there is.
    // jsdom computes no boxes so axe cannot judge it, and the rule is disabled
    // rather than left to report "incomplete" forever. If this ever starts
    // failing, jsdom grew a layout engine and the gate should stop apologising:
    // re-enable color-contrast and delete this test.
    const found = await auditHtml(
      page(`<main style="background:#000"><p style="color:#111">Unreadable.</p></main>`),
      "test",
    );
    expect(found.map((v) => v.id)).not.toContain("color-contrast");
  });
});

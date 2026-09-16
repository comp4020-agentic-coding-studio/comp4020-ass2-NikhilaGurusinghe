# COMP4020 course-site template

A starter template for course-website prototypes in **COMP4020 / COMP8020
Agentic Coding Studio**. The course provisions a repo from this template for
each deliverable that uses it --- you don't create it yourself. The `start`
course skill clones it for you; from there, design your course and deploy the
site to GitHub Pages.

It ships as a working course website for **Slop University**, the course's
running fictional institution, wearing the Slop identity. The structure is real
and the content is placeholder.

## This repo's stack differs from the shipped template

The template arrived as an Astro build on the `astro-theme-university` package,
with pnpm, Vitest and [astromotion](https://github.com/ANUcybernetics/astromotion)
slide decks. **This repo has been ported to Next.js and Bun.** The port was
deliberate and it is a divergence from the platform the template calls fixed, so
it is recorded here rather than left for a marker to discover:

| Was                            | Is now                                     |
| ------------------------------ | ------------------------------------------ |
| Astro 5 (`astro.config.ts`)    | Next.js 16, App Router (`next.config.ts`)  |
| pnpm                           | Bun (package manager **and** script runner) |
| Vitest                         | `bun:test`                                 |
| `astro-theme-university` CSS   | Tailwind CSS v4 over the same `--at-*` tokens |
| astromotion `.deck.mdx` decks  | PDFs in `public/decks/`                    |
| Astro's built-in search        | Pagefind, run over the exported site       |

Three things were held constant on purpose, because they are the contract with
the rest of the course rather than implementation detail:

- **The generated `/api` JSON.** A real Astro build was captured first and its
  output committed to `spec/fixtures/golden-api/`; `spec/course-api.test.ts`
  asserts the Bun emitter reproduces it byte for byte.
- **Every URL.** `trailingSlash: true` and the same route shapes, so no link
  that worked before is broken now.
- **The four build gates.** Dangling refs, base-path-correct internal links,
  axe accessibility and the Pagefind index all still fail the build.

Everything below describes the platform as it now stands.

## Your brief and spec

The
[course website](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/)
publishes this deliverable's brief and spec, and this repo's name tells you
which deliverable applies. Read both before you plan or build.

## CI and Pages only turn on when you ship

Your repo starts private, and both CI jobs (`check` and `deploy`) are gated on
it being public. While private, a push to `main` runs nothing in CI ---
`bun run check` (below) is your feedback loop until then. When you're ready, the
course's `/ship` skill flips the repo public, turns on GitHub Pages, and
dispatches the deploy for you; there's nothing to configure in the Pages
settings yourself. From that point, every push to `main` builds and deploys, and
the deploy step prints your live URL and checks it returns 200.

## What gets marked

The deployed site is the deliverable, assessed live in Chrome at two fixed
viewports --- see the course website's
[assessment page](https://comp.anu.edu.au/courses/comp4020-agentic-coding-studio/topics/assessment/#marking-environment)
for the details.

## Quick start

```sh
mise install        # supported path: install the template's Bun and Node
bun install
bun run dev             # local dev server, at http://localhost:3000/<repo>/
bun run check           # types, lint, build integrity and the course spec
bun run check:evidence  # final submission gate
```

`mise` is what tutor support reproduces runtime problems with; any other manager
is fine if you match the versions in `mise.toml`.

Both runtimes are installed, and the split is narrow: **Bun runs everything this
repo owns** --- the package manager, every script in `scripts/`, every test.
Node is there because `next build` segfaults under `bunx --bun`, and because the
Pagefind CLI is a Node package. If you are adding a script, it goes on Bun.

The dev server serves the site under its base path (see below), so the address
is `http://localhost:3000/<repo>/`; the bare `http://localhost:3000` is a 404.
Site search is the one thing `next dev` cannot serve --- Pagefind indexes the
exported HTML, which doesn't exist yet --- so use `bun run build && bun run
preview` to exercise it.

## What's here

- `src/content/` --- structured Markdown for `sessions`, `assessments`,
  `lectures`, `people` and `policies`, validated against the zod schemas in
  `lib/content.ts`. The small placeholder set is a working example; replace it
  incrementally and keep the checks green.
- `src/course-config.ts` --- the validated course record: SLOP code, title,
  description, tags, level, session and dates. The home page, navigation and
  JSON API all read it.
- `src/site-config.ts` --- site name, navigation, licence, and the Slop
  branding.
- `app/` --- the routes. `app/layout.tsx` is the root frame (nav, footer, skip
  link, theme script); `app/globals.css` holds the brand tokens, the page-frame
  grid and the bare-element defaults that style rendered Markdown.
- `components/` --- the shared pieces. `components/PageLayout.tsx` is the
  per-page frame every route renders through; site-wide styling goes in
  `app/globals.css` on top of the brand tokens.
- `lib/` --- the content loader, the Markdown pipeline, the API shape and the
  base-path resolver. Deliberately free of `next/*` imports where the build
  scripts need to import it too.
- `public/decks/` --- slide decks, as PDFs. See **Slides** below.
- `src/assets/images/` --- starter home/social artwork. Replace it with
  course-specific work, or make a deliberate image-free treatment;
  `bun run check:evidence` will not pass the placeholders.
- `spec/` --- the shipped course-data baseline (`data-integrity.test.ts`), the
  golden `/api` contract (`course-api.test.ts`) and the build-gate tests; the
  spec tests you write live alongside them.
- `.githooks/pre-commit` --- blocks any commit that contains something shaped
  like an API key, so your COMP4020 key can't end up in a public repo. Installed
  automatically by `bun install`.
- `PROCESS.md`, `spec/README.md` and `reflections/README.md` --- each says what
  it is for. `CLAUDE.md` is your harness, and it carries no rules until you
  write them.

The rest of this file is the platform: the content model, the naming of teaching
sessions, the slide decks, the base path, the link-preview card, the checks and
the generated course API.

## The content model

Content is Markdown with frontmatter under `src/content/`, in five collections
declared in `lib/collections.ts` and schema'd in `lib/content.ts`: `sessions`,
`assessments`, `lectures` and `people` are the graph collections; `policies` is
in the API but carries no `related:` edges of its own. Sessions and lectures
carry dates and, optionally, structured teacher references; assessments carry
due dates, weights and an optional marking model; people are the cast list.

Those four graph collections stay, because the programs and courses page reads
them. A collection of your own is declared the same way: add it to
`graphCollections` in `lib/collections.ts` if it should carry `related:` edges
and appear in the API, give it a schema in `lib/content.ts`, and give it routes
under `app/`.

The collection key is the whole address. `sessions/getting-started` is the file
`src/content/sessions/getting-started.md`, the page
`/sessions/getting-started/`, the JSON at `/api/sessions/getting-started.json`,
and the ref other pages use to link to it. Those four agree by construction, so
renaming one means renaming all of them.

`related:` frontmatter connects nodes. Entries are refs ---
`<collection>/<slug>`, or a bare slug for the same collection --- and the link
renders on both pages, so declare it on whichever side is convenient. **The
build fails on a ref that doesn't resolve** (`scripts/check-refs.ts`, which runs
before Next does), which is the point: a dangling link is caught before it
ships, not after.

`src/course-config.ts` is the single source for the course record. Its strict
schema validates the `SLOPxxxx` code and level, title, 80--300 character
description, one to three tags, session label, year and teaching period. It
feeds the home page, navigation and `/api/index.json`, so do not restate those
facts. Change the record's dates alongside the placeholder sessions, lectures
and assessments that use them.

The code arrives part-filled. Its last three digits were allocated to this repo
and no other course in the cohort has them, so keep them; the first digit is the
level, and it's yours to choose on the usual ANU scheme --- 1 to 4 for
undergraduate, 6 or 8 for postgraduate. The level doesn't affect your mark.

Two orthogonal flags live in every graph collection's schema. `published: false`
removes an entry from the production build entirely (no page, no listing, no
graph edge) while leaving it visible in `bun run dev`, so you can stage content.
`draft: true` keeps the page visible and marks it as not yet final.

The schemas validate the keys they declare and pass through the ones they don't:
a key you invent in a node's frontmatter survives validation and lands in that
node's `meta` object in the generated API. The reserved names are `title`,
`description`, `tags`, `related`, `links`, `spec` and `published`.

## Naming teaching sessions

Keep the collection key, refs and URL as `sessions`: the programs and courses
page reads those names. Choose what students see --- Labs, Studios, Workshops,
Crits, or something else --- with `sessionLabels` in `src/site-config.ts`.

## Slides

A deck is a PDF at `public/decks/<slug>.pdf`. The route at `app/decks/[slug]/`
builds a page around it: the browser's own PDF viewer in an `<iframe>`, plus a
download link that is present at every width. Below 40rem the frame is not
rendered at all --- a 16:9 slide on a 390px screen is a postage stamp --- and
the download link becomes the whole page.

There is no slide library, no CDN and nothing to compile, which is the trade
this makes against the astromotion decks it replaces: you lose markdown
authoring and gain a file that opens offline, in any reader, at any size.
Author the slides wherever you like and export to PDF.

`public/` is copied verbatim, so these URLs are strings rather than imports and
the base path has to go on by hand --- `app/decks/[slug]/page.tsx` does this,
and the link gate reads `<iframe src>` so a mistake here still fails the build.

A deck is not a content-collection entry, so it has no `related:` edges. A
lecture points at one with its `slides:` frontmatter key (`/decks/week-01/`),
and the lecture page renders the link.

Nothing checks whether a slide fits or stays legible; that only shows up in a
browser, at the two marking viewports.

## The base path

The site deploys to `https://<owner>.github.io/<repo>/`, so every internal URL
carries a `/<repo>/` prefix. `next.config.ts` derives it at config time from
`GITHUB_REPOSITORY` (in CI) or the `origin` remote (locally), via
`lib/base-path.ts` and `scripts/pages-base.ts`. Its tests in
`scripts/pages-base.test.ts` are template-maintainer tests, not part of your
course spec.

Nothing to configure --- but the prefix is applied by the framework, not by the
browser, so it only lands where the framework is looking:

- `<Link href="/sessions/">` and `next/image` with a **static import** get it.
- A bare `<a href="/sessions/">`, or an `<img src="/foo.png">` pointing at
  `public/`, does **not**. It works on `localhost` and 404s on the live site.

`scripts/check-links.ts` reads `href`, `src`, `action`, `poster` and `srcset`
across every exported page and fails the build on any internal URL missing the
prefix, so the compiler won't catch this but the build will.

## The link-preview card

The image people see when a link to the site is shared comes from `socialImage:`
in `src/site-config.ts`, and `socialImageAlt:` describes it. Both are
placeholders, and the picture is 1200x630. `app/layout.tsx` turns it into the
`og:image` metadata. Because the static export has no image optimisation
server, this is served as-authored rather than re-encoded --- so keep the source
in a format scrapers decode, which in practice means PNG or JPEG.

## The checks

`bun run check` runs type checking, Biome, the production build and a
deliberately small course-content test suite. The tests in `spec/` assert what
the site actually built, so `bun run test` builds first and works on its own;
there is only ever the one ordering. `bun run check:evidence` is the extra gate
before you ship: process citations, the required reflection and, for Assignment
2, every tracked `STARTER_CONTENT` fragment and unchanged key imagery. Remove a
fragment's marker when you replace that fragment. CI adds the secret scan and
the deploy.

`bun run build` is itself a chain of checks, in this order:

1. `scripts/check-refs.ts` --- fails on a dangling content ref, before Next runs
   at all, so a bad ref is a one-line error rather than a build-time stack.
2. `next build` --- the static export into `dist/`.
3. `scripts/emit-course-api.ts` --- writes the versioned `/api` JSON.
4. `pagefind --site dist` --- builds the search index over the exported HTML.
5. `scripts/check-links.ts` --- every internal URL respects the base path.
6. `scripts/check-a11y.ts` --- axe over every rendered page (WCAG 2.1 AA plus
   best-practice; `color-contrast` is off because jsdom has no layout engine, so
   check contrast in a browser).

`spec/data-integrity.test.ts` checks the one cross-page course fact the build
cannot: dated material stays inside the teaching period.

Run a gate on its own with `bun run check:links` or `bun run check:a11y`; both
read `dist/`, so build first.

## The generated course API

Every build emits a versioned `dist/api/index.json` and per-entry JSON. This is
platform plumbing rather than an API-design exercise. The future SlopU programs
and courses page will use the course record and content nodes to filter and
display published courses, including their canonical
`courses.slop.university/SLOPxxxx/` path. The integration emits and validates
this contract during the build; do not hand-edit generated JSON.

The shape is not ours to change. `spec/fixtures/golden-api/` holds what the
original Astro build emitted, captured before the port, and
`spec/course-api.test.ts` asserts the current emitter still reproduces it. If
you change the emitter and that test fails, the test is right.

See the course site for how the checks map to each week of the course.

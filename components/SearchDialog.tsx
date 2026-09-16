"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Icon } from "./Icon";

/**
 * Site search, over the Pagefind index the build writes into dist/pagefind/.
 *
 * Pagefind indexes the exported HTML after Next has written it, so its bundle
 * does not exist at compile time and must not be bundled: the import is a
 * runtime path with the bundler-ignore comments on it, which is the documented
 * way to load Pagefind from a framework. That also means search is the one
 * feature `next dev` cannot serve — there is no export to index — so a failed
 * load says so plainly instead of leaving an input that silently does nothing.
 *
 * Every result URL needs the deployment sub-path put back on it. Pagefind
 * indexes dist/, whose directories have no /<repo> prefix — that prefix only
 * exists inside the links Next wrote — so its `url` comes back as /sessions/…
 * and would send a visitor to the domain root. The build's link gate cannot
 * catch this one: these URLs are assembled in the browser.
 */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

interface PagefindResult {
  id: string;
  data: () => Promise<{ url: string; excerpt: string; meta: { title?: string } }>;
}

interface Pagefind {
  search: (query: string) => Promise<{ results: PagefindResult[] }>;
}

interface Hit {
  id: string;
  url: string;
  title: string;
  excerpt: string;
}

/** At most this many hits are shown; the dialog is a jump list, not a results page. */
const MAX_HITS = 8;

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const pagefindRef = useRef<Promise<Pagefind> | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [status, setStatus] = useState("");
  const resultsId = useId();

  // Loaded on first use rather than on mount: the index is a few hundred
  // kilobytes and most visitors never open this.
  const loadPagefind = useCallback(() => {
    pagefindRef.current ??= import(
      /* webpackIgnore: true */ /* turbopackIgnore: true */ `${BASE}/pagefind/pagefind.js`
    ) as Promise<Pagefind>;
    return pagefindRef.current;
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setHits([]);
      setStatus("");
      return;
    }

    // Debounced, because Pagefind loads an index chunk per query and a fast
    // typist would ask for six of them on the way to one word.
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const pagefind = await loadPagefind();
        const { results } = await pagefind.search(trimmed);
        const top = await Promise.all(
          results.slice(0, MAX_HITS).map(async (r) => [r, await r.data()] as const),
        );
        if (cancelled) return;
        setHits(
          top.map(([r, data]) => ({
            id: r.id,
            url: `${BASE}${data.url}`,
            title: data.meta.title ?? data.url,
            excerpt: data.excerpt,
          })),
        );
        setStatus(results.length === 0 ? `Nothing matches “${trimmed}”.` : "");
      } catch {
        if (cancelled) return;
        setHits([]);
        setStatus(
          "Search is unavailable here. It is built from the exported site, so it works on the deployed pages and on a local preview, but not under `next dev`.",
        );
      }
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, open, loadPagefind]);

  return (
    // A real <dialog> rather than a div with role="dialog": the element brings
    // the focus trap, the inert background and Escape-to-close with it. The ref
    // exists only because showModal() is the sole way to get that behaviour.
    <dialog
      ref={dialogRef}
      onClose={onClose}
      aria-label="Search this site"
      className="m-0 mx-auto w-full max-w-[min(36rem,calc(100%-2*var(--at-spacing-md)))] mt-[var(--at-spacing-lg)] bg-transparent p-0 backdrop:bg-black/50 sm:mt-[10vh] sm:max-w-[min(36rem,calc(100%-2*var(--at-spacing-lg)))]"
    >
      <div className="overflow-hidden rounded-[calc(var(--at-border-radius)*5/3)] border border-divider bg-bg-elevated shadow-[var(--at-shadow-lg)]">
        <div className="flex items-center gap-[var(--at-spacing-sm)] border-b border-divider p-[var(--at-spacing-md)]">
          <Icon name="search" className="size-5 shrink-0 text-text-muted" />
          <input
            type="search"
            // Autofocus is right here and nowhere else on the site: the dialog
            // exists only to be typed into, and it is on screen because the
            // reader just asked for it.
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            aria-label="Search"
            aria-controls={resultsId}
            autoComplete="off"
            className="min-w-0 flex-1 border-none bg-transparent p-0 text-base text-text outline-none placeholder:text-text-muted"
          />
          <kbd className="shrink-0 rounded-token border border-divider px-[var(--at-spacing-sm)] py-[var(--at-spacing-xs)] font-mono text-xs leading-none text-text-muted">
            Esc
          </kbd>
        </div>

        <ul
          id={resultsId}
          aria-label="Search results"
          hidden={hits.length === 0}
          className="m-0 max-h-[60vh] list-none overflow-y-auto p-[var(--at-spacing-xs)]"
        >
          {hits.map((hit) => (
            <li key={hit.id}>
              <a
                href={hit.url}
                className="block rounded-token px-[var(--at-spacing-md)] py-[var(--at-spacing-sm)] text-text no-underline transition-colors hover:bg-accent-soft"
              >
                <span className="mb-[var(--at-spacing-xs)] block font-semibold">{hit.title}</span>
                {/* Pagefind wraps the matched words in <mark>; the excerpt is built
                    at index time from this site's own pages. */}
                <span
                  className="block text-sm text-text-secondary [&_mark]:rounded-[calc(var(--at-border-radius)/3)] [&_mark]:bg-accent-soft [&_mark]:px-0.5 [&_mark]:text-brand"
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: see above — our own build output, not user input.
                  dangerouslySetInnerHTML={{ __html: hit.excerpt }}
                />
              </a>
            </li>
          ))}
        </ul>

        <p
          aria-live="polite"
          hidden={!status}
          className="m-0 p-[var(--at-spacing-lg)] text-center text-sm text-text-muted"
        >
          {status}
        </p>
      </div>
    </dialog>
  );
}

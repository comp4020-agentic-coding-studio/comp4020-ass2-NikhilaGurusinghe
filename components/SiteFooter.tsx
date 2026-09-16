import { courseMeta } from "@/src/course-config";
import { siteConfig } from "@/src/site-config";
import { ThemeToggle } from "./ThemeToggle";

/** The licences the theme knows how to name. */
const LICENCES: Record<string, { name: string; url: string }> = {
  "CC-BY-NC-SA-4.0": {
    name: "Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International",
    url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
  },
  "CC-BY-4.0": {
    name: "Creative Commons Attribution 4.0 International",
    url: "https://creativecommons.org/licenses/by/4.0/",
  },
  "CC-BY-SA-4.0": {
    name: "Creative Commons Attribution-ShareAlike 4.0 International",
    url: "https://creativecommons.org/licenses/by-sa/4.0/",
  },
};

/**
 * The footer: a licence statement, the course line, and the theme switch.
 *
 * The licence is named from `siteConfig.licence`, so the SPDX identifier in one
 * config line is what decides both the wording and the link. An identifier with
 * no entry above renders as itself rather than as a wrong licence — being
 * unhelpful is recoverable, telling a reader they may reuse work under terms
 * the author did not choose is not.
 */
export function SiteFooter() {
  const licence = LICENCES[siteConfig.licence];

  return (
    <footer className="band border-t border-divider">
      <div className="py-[var(--at-spacing-2xl)] text-sm text-text-muted">
        <p className="mb-[var(--at-spacing-md)]">
          Unless otherwise indicated, this site is licensed under a{" "}
          {licence ? (
            <a href={licence.url} rel="license">
              {licence.name}
            </a>
          ) : (
            siteConfig.licence
          )}{" "}
          licence.
        </p>

        <hr />

        <nav
          aria-label="Legal"
          className="flex flex-wrap items-center gap-x-[var(--at-spacing-sm)] gap-y-[var(--at-spacing-xs)]"
        >
          <span>
            {courseMeta.code} · {courseMeta.session} {courseMeta.year}
          </span>
          <span aria-hidden="true">|</span>
          <ThemeToggle />
        </nav>
      </div>
    </footer>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Icon } from "./Icon";
import { THEME_STORAGE_KEY, type Theme } from "./theme-script";

/**
 * Light/dark, stored per browser.
 *
 * The palette is `light-dark()` over an inherited `color-scheme`, so switching
 * themes is one attribute on <html> and every token follows. Setting the
 * attribute is all this does; globals.css maps it to a colour scheme and swaps
 * the two logo inks.
 *
 * Rendered as the system theme until mounted, and the label says which way the
 * switch goes rather than which theme is on — "Switch to dark theme" is a
 * promise about what the click does, which is what a button's name should be.
 * Before mount there is nothing to promise, so the button is not rendered at
 * all: a label that says "dark" on a dark page is worse than a moment's gap.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      return;
    }
    setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }, []);

  if (theme === null) {
    // Same box, no label: the footer row does not reflow when this arrives.
    return <span aria-hidden="true" className="inline-block size-4" />;
  }

  const next: Theme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${next} theme`;

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => {
        document.documentElement.dataset.theme = next;
        try {
          localStorage.setItem(THEME_STORAGE_KEY, next);
        } catch {
          // Private browsing, or storage the user has switched off. The theme
          // still changes; it just will not be there on the next page.
        }
        setTheme(next);
      }}
      className="inline-flex cursor-pointer items-center border-none bg-transparent p-0 leading-none text-text-muted transition-colors hover:text-brand"
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} className="size-4" />
    </button>
  );
}

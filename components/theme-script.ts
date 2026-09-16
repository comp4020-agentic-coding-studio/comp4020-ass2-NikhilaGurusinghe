/**
 * The stored-theme contract, shared by the toggle and the head script.
 *
 * Two readers, one key. The script below runs before the first paint; the
 * toggle in ThemeToggle.tsx runs after hydration. If they disagreed about the
 * key or the values, a reader who chose dark would get a flash of the light
 * page on every navigation — the exact failure this file exists to prevent.
 */

export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "at-theme";

/**
 * Stamp the stored theme on <html> before anything renders.
 *
 * Inlined into <head> as a blocking script, which is the one place this can
 * go: React has not run yet, and a stored preference applied any later is a
 * visible flash of the wrong palette. Stringified rather than written as a
 * function so nothing bundles or defers it.
 *
 * Silent on failure and silent when nothing is stored — the absence of the
 * attribute is what lets `prefers-color-scheme` decide, which is the right
 * default and the state most readers are in.
 */
export const THEME_SCRIPT = `try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

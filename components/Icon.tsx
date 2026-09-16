/**
 * The five icons the chrome uses, inlined.
 *
 * Carried over from the theme's iconoir set, path data unchanged. Inlined
 * rather than fetched or imported from an icon package for two reasons: five
 * paths do not justify a dependency, and an `<img>` or a sprite sheet would be
 * a second request before the nav can render. `currentColor` throughout, so a
 * button's text colour is the icon's colour and the theme toggle needs no
 * second set.
 *
 * Always `aria-hidden`: every one of these sits inside a control that already
 * has an accessible name, and a second name on the icon would make screen
 * readers announce it twice.
 */

const PATHS = {
  menu: "M3 5h18M3 12h18M3 19h18",
  close: "M6.758 17.243L12.001 12m5.243-5.243L12 12m0 0L6.758 6.757M12.001 12l5.243 5.243",
  search: "m17 17l4 4M3 11a8 8 0 1 0 16 0a8 8 0 0 0-16 0",
  sun: "M12 18a6 6 0 1 0 0-12a6 6 0 0 0 0 12m10-6h1M12 2V1m0 22v-1m8-2l-1-1m1-15l-1 1M4 20l1-1M4 4l1 1m-4 7h1",
  moon: "M3 11.507a9.493 9.493 0 0 0 18 4.219c-8.507 0-12.726-4.22-12.726-12.726A9.49 9.49 0 0 0 3 11.507",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

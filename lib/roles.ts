/**
 * How a person's `role:` is named and ordered on the site.
 *
 * The Astro version carried this table twice — once in PeopleGrid, once in the
 * person detail route — each with the same comment saying not to render the raw
 * lowercase value. A third copy in TeachingTeam did render the raw value, which
 * is how "Tutor" on the listing became "tutor" on a session page. One table
 * fixes that and makes the next role a one-line change.
 */

/** Convenor first, then tutors, then guests: the order a reader expects. */
const ORDER: Record<string, number> = {
  convenor: 0,
  tutor: 1,
  guest: 2,
  other: 3,
};

const LABELS: Record<string, string> = {
  convenor: "Convenor",
  tutor: "Tutor",
  guest: "Guest lecturer",
  // Deliberately blank: "other" is the absence of a role, and printing the word
  // next to a name says less than printing nothing.
  other: "",
};

export function roleLabel(role: unknown): string {
  return typeof role === "string" ? (LABELS[role] ?? "") : "";
}

/** Unknown roles sort last rather than first, so a typo is visible. */
export function roleRank(role: unknown): number {
  return (typeof role === "string" ? ORDER[role] : undefined) ?? 99;
}

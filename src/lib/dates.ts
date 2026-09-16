/**
 * The zone the site's dates are read in.
 *
 * Frontmatter carries two shapes and they are not the same kind of thing. A
 * session's `date: 2027-02-22` is a wall-clock day — it means that Monday, not
 * an instant — while an assessment's `due: 2027-04-12T12:00:00+10:00` is a
 * moment, and the offset in it is part of the value. Both are formatted here,
 * in this zone, so a reader in another one still sees the day the course means.
 *
 * Named rather than offset so that a course running across a DST transition
 * gets the right answer on both sides of it. `lib/course-api.ts` publishes this
 * string as the API's `timezone` field, which is what tells a consumer how to
 * read the bare dates it emits verbatim.
 */
export const SITE_TIMEZONE = "Australia/Canberra";

const longDate = new Intl.DateTimeFormat("en-AU", {
  dateStyle: "long",
  timeZone: SITE_TIMEZONE,
});

/**
 * Format a date-only or date-time value as the day it names, in the site zone.
 *
 * A bare `YYYY-MM-DD` is anchored at UTC midnight before formatting. That is
 * safe precisely because this zone is east of UTC: midnight UTC is the same
 * calendar day here, whatever the offset that week. Anchoring at local midnight
 * instead would need a zone-aware parser for no gain.
 */
export function formatCourseDate(value: Date | string): string {
  if (value instanceof Date) return longDate.format(value);
  // Bare dates only. Anything with a time carries its own offset (the schema in
  // lib/content.ts requires one), so `new Date` reads it without guessing.
  const instant = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value);
  if (Number.isNaN(instant.getTime())) {
    // A page showing "Invalid Date" is the failure this whole arrangement is
    // trying to avoid, and it is quieter than a build that stops.
    throw new Error(`Not a date this site can format: ${value}`);
  }
  return longDate.format(instant);
}

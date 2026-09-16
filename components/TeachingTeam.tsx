import Link from "next/link";
import type { Entry, PersonMeta } from "@/lib/content";
import { roleLabel } from "@/lib/roles";

/**
 * Who teaches this session or lecture.
 *
 * Resolved by the route rather than here: `teachers:` is a list of refs into
 * the people collection, and the loader is the only thing that knows how to
 * turn one into an entry. A session with nobody listed renders no section —
 * an empty "Teaching team" heading is worse than the silence.
 */
export function TeachingTeam({ people }: { people: Entry<PersonMeta>[] }) {
  if (people.length === 0) return null;

  return (
    <section aria-labelledby="teaching-team">
      <h2 id="teaching-team">Teaching team</h2>
      <ul>
        {people.map((person) => {
          const label = roleLabel(person.meta.role);
          return (
            <li key={person.id}>
              <Link href={`/people/${person.slug}/`}>{person.title}</Link>
              {label ? ` — ${label}` : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import Link from "next/link";
import { graphCollections } from "@/lib/collections";
import type { Entry } from "@/lib/content";
import { sessionLabels } from "@/src/site-config";

/**
 * The other pages this one is connected to.
 *
 * Reconstructed rather than ported, like SpecList: the original was in
 * astro-course-university and had no styles in the built stylesheet, so it was
 * semantic markup and nothing else.
 *
 * What it renders is the graph, and the graph is symmetric — `related:` on one
 * side produces an edge on both, which is why a session that never mentions an
 * assessment still lists it. That symmetry is the emitted API's, not this
 * component's: the loader hands over `relatedIds` with the incoming edges
 * already merged in, so the page and `/api/<type>/<slug>.json` cannot disagree
 * about what is related to what.
 *
 * Grouped by collection in the graph's own order, so the sections appear in the
 * same sequence on every page a reader lands on.
 */

const COLLECTION_LABELS: Record<string, string> = {
  sessions: sessionLabels.plural,
  assessments: "Assessment",
  lectures: "Lectures",
  people: "People",
};

export function RelatedContent({ entries }: { entries: Entry<Record<string, unknown>>[] }) {
  const groups = graphCollections
    .map((type) => ({ type, items: entries.filter((entry) => entry.type === type) }))
    .filter((group) => group.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section aria-labelledby="related">
      <h2 id="related">Related</h2>
      {groups.map(({ type, items }) => (
        <div key={type}>
          <h3>{COLLECTION_LABELS[type] ?? type}</h3>
          <ul>
            {items.map((entry) => (
              <li key={entry.id}>
                <Link href={`/${entry.type}/${entry.slug}/`}>{entry.title}</Link>
                {entry.description ? ` — ${entry.description}` : null}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

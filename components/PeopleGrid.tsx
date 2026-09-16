import { Card, CardGrid } from "@/components/Card";
import { getCourseContent } from "@/lib/content";
import { personPhoto } from "@/lib/photos";
import { roleLabel, roleRank } from "@/lib/roles";

/** The teaching team, convenor first, then alphabetically within each role. */
export async function PeopleGrid() {
  const { people } = await getCourseContent();
  const inOrder = [...people].sort(
    (a, b) => roleRank(a.meta.role) - roleRank(b.meta.role) || a.title.localeCompare(b.title),
  );

  return (
    <CardGrid columns={2}>
      {inOrder.map((person) => {
        const label = roleLabel(person.meta.role);
        return (
          <Card
            key={person.id}
            headingLevel="h2"
            title={person.title}
            href={`/people/${person.slug}/`}
            image={personPhoto(person.id, person.meta.photo)}
            imageAlt={person.meta.photoAlt}
          >
            {label ? (
              <p>
                <small>{label}</small>
              </p>
            ) : null}
            {person.description ? <p>{person.description}</p> : null}
          </Card>
        );
      })}
    </CardGrid>
  );
}

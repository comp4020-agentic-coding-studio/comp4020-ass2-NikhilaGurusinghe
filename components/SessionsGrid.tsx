import { Card, CardGrid } from "@/components/Card";
import { getCourseContent } from "@/lib/content";
import { formatCourseDate } from "@/src/lib/dates";

/** Every published session, in teaching order. The loader sorts by week. */
export async function SessionsGrid() {
  const { sessions } = await getCourseContent();

  return (
    <CardGrid columns={2}>
      {sessions.map((session) => (
        <Card
          key={session.id}
          headingLevel="h2"
          title={session.title}
          href={`/sessions/${session.slug}/`}
        >
          {session.description ? <p>{session.description}</p> : null}
          <p>
            <small>
              Week {session.meta.week} · {formatCourseDate(session.meta.date)}
            </small>
          </p>
        </Card>
      ))}
    </CardGrid>
  );
}

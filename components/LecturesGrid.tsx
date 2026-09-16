import { Card, CardGrid } from "@/components/Card";
import { getCourseContent } from "@/lib/content";
import { formatCourseDate } from "@/src/lib/dates";

/**
 * Every published lecture, in the order they are delivered.
 *
 * Sorted by date rather than by week, as the Astro version was. The two agree
 * for a course that runs one lecture a week and stop agreeing the moment one
 * does not, and the date is the one a reader is actually looking for. ISO dates
 * compare correctly as strings, which is one of the reasons they stay strings.
 */
export async function LecturesGrid() {
  const { lectures } = await getCourseContent();
  const inOrder = [...lectures].sort((a, b) => a.meta.date.localeCompare(b.meta.date));

  return (
    <CardGrid columns={2}>
      {inOrder.map((lecture) => (
        <Card
          key={lecture.id}
          headingLevel="h2"
          title={lecture.title}
          href={`/lectures/${lecture.slug}/`}
        >
          {lecture.description ? <p>{lecture.description}</p> : null}
          <p>
            <small>
              Week {lecture.meta.week} · {formatCourseDate(lecture.meta.date)}
            </small>
          </p>
        </Card>
      ))}
    </CardGrid>
  );
}

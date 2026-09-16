import { Card, CardGrid } from "@/components/Card";
import { getCourseContent } from "@/lib/content";
import { formatCourseDate } from "@/src/lib/dates";

/**
 * Every published assessment, in due order. The loader sorts by week.
 *
 * The Astro version gated this whole line on `weight != null`, so an assessment
 * with no weight published no deadline either — two unrelated facts tied to one
 * condition. The weight is what may be missing, so the weight is what the
 * condition covers.
 */
export async function AssessmentsGrid() {
  const { assessments } = await getCourseContent();

  return (
    <CardGrid columns={2}>
      {assessments.map((assessment) => (
        <Card
          key={assessment.id}
          headingLevel="h2"
          title={assessment.title}
          href={`/assessments/${assessment.slug}/`}
        >
          {assessment.description ? <p>{assessment.description}</p> : null}
          <p>
            <small>
              Due {formatCourseDate(assessment.meta.due)}
              {assessment.meta.weight != null ? ` · Weight: ${assessment.meta.weight}%` : ""}
              {assessment.meta.draft ? " · Draft" : ""}
            </small>
          </p>
        </Card>
      ))}
    </CardGrid>
  );
}

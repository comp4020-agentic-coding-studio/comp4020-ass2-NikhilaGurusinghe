import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Callout } from "@/components/Callout";
import { MarkingModel } from "@/components/MarkingModel";
import { PageLayout } from "@/components/PageLayout";
import { Prose } from "@/components/Prose";
import { RelatedContent } from "@/components/RelatedContent";
import { SpecList } from "@/components/SpecList";
import { getCourseContent, resolveRelated } from "@/lib/content";
import { formatCourseDate } from "@/src/lib/dates";

/** One assessment brief. */
export async function generateStaticParams() {
  const { assessments } = await getCourseContent();
  return assessments.map((assessment) => ({ slug: assessment.slug }));
}

async function find(slug: string) {
  const content = await getCourseContent();
  const assessment = content.assessments.find((entry) => entry.slug === slug);
  return assessment ? { content, assessment } : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/assessments/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = await find(slug);
  if (!found) return {};
  return { title: found.assessment.title, description: found.assessment.description };
}

export default async function AssessmentPage({ params }: PageProps<"/assessments/[slug]">) {
  const { slug } = await params;
  const found = await find(slug);
  if (!found) notFound();

  const { content, assessment } = found;

  return (
    <PageLayout title={assessment.title} description={assessment.description}>
      {assessment.meta.draft ? (
        <Callout type="warning">
          <p>
            <strong>Draft.</strong> This brief is still being finalised and may change.
          </p>
        </Callout>
      ) : null}

      <p>
        <strong>Due:</strong> {formatCourseDate(assessment.meta.due)} · <strong>Weight:</strong>{" "}
        {assessment.meta.weight}%
      </p>

      <Prose body={assessment.body} />

      <SpecList spec={assessment.spec}>
        The brief poses the problem and leaves room for a response. The spec is the fixed part: what
        a marker checks. Some lines can be checked mechanically; the rest call for judgement.
      </SpecList>

      {assessment.meta.marking ? <MarkingModel marking={assessment.meta.marking} /> : null}
      <RelatedContent entries={resolveRelated(content, assessment)} />
    </PageLayout>
  );
}

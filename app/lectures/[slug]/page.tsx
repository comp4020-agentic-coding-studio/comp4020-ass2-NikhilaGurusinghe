import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageLayout } from "@/components/PageLayout";
import { Prose } from "@/components/Prose";
import { RelatedContent } from "@/components/RelatedContent";
import { TeachingTeam } from "@/components/TeachingTeam";
import { getCourseContent, resolveRelated, resolveTeachers } from "@/lib/content";
import { formatCourseDate } from "@/src/lib/dates";

/** One lecture. */
export async function generateStaticParams() {
  const { lectures } = await getCourseContent();
  return lectures.map((lecture) => ({ slug: lecture.slug }));
}

async function find(slug: string) {
  const content = await getCourseContent();
  const lecture = content.lectures.find((entry) => entry.slug === slug);
  return lecture ? { content, lecture } : null;
}

const pageTitle = (week: number, title: string) => `Week ${week}: ${title}`;

export async function generateMetadata({
  params,
}: PageProps<"/lectures/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = await find(slug);
  if (!found) return {};
  return {
    title: pageTitle(found.lecture.meta.week, found.lecture.title),
    description: found.lecture.description,
  };
}

export default async function LecturePage({ params }: PageProps<"/lectures/[slug]">) {
  const { slug } = await params;
  const found = await find(slug);
  if (!found) notFound();

  const { content, lecture } = found;

  return (
    <PageLayout
      title={pageTitle(lecture.meta.week, lecture.title)}
      description={lecture.description}
    >
      <p>
        <strong>{formatCourseDate(lecture.meta.date)}</strong>
      </p>

      {/* `slides:` is validated as a /decks/<slug>/ route, so <Link> can carry
          the base path. A bare <a> here would be the sub-path bug again. */}
      {lecture.meta.slides ? (
        <p>
          <Link href={lecture.meta.slides}>Open the slides</Link>
        </p>
      ) : null}

      <Prose body={lecture.body} />

      <TeachingTeam people={resolveTeachers(content, lecture.meta.teachers)} />
      <RelatedContent entries={resolveRelated(content, lecture)} />
    </PageLayout>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageLayout } from "@/components/PageLayout";
import { Prose } from "@/components/Prose";
import { RelatedContent } from "@/components/RelatedContent";
import { SpecList } from "@/components/SpecList";
import { TeachingTeam } from "@/components/TeachingTeam";
import { getCourseContent, resolveRelated, resolveTeachers } from "@/lib/content";
import { formatCourseDate } from "@/src/lib/dates";
import { sessionLabels } from "@/src/site-config";

/**
 * One teaching session.
 *
 * `generateStaticParams` is what makes this route exist in a static export —
 * there is no server to answer for a slug that was not listed here, so this
 * list and src/content/sessions/ are the same thing by construction.
 */
export async function generateStaticParams() {
  const { sessions } = await getCourseContent();
  return sessions.map((session) => ({ slug: session.slug }));
}

async function find(slug: string) {
  const content = await getCourseContent();
  const session = content.sessions.find((entry) => entry.slug === slug);
  return session ? { content, session } : null;
}

const pageTitle = (week: number, title: string) =>
  `Week ${week} ${sessionLabels.singular}: ${title}`;

export async function generateMetadata({
  params,
}: PageProps<"/sessions/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const found = await find(slug);
  if (!found) return {};
  return {
    title: pageTitle(found.session.meta.week, found.session.title),
    description: found.session.description,
  };
}

export default async function SessionPage({ params }: PageProps<"/sessions/[slug]">) {
  const { slug } = await params;
  const found = await find(slug);
  if (!found) notFound();

  const { content, session } = found;

  return (
    <PageLayout
      title={pageTitle(session.meta.week, session.title)}
      description={session.description}
    >
      <p>
        <strong>{formatCourseDate(session.meta.date)}</strong>
      </p>

      <Prose body={session.body} />

      <SpecList spec={session.spec}>
        What you bring to the session. Written so a reader can tell whether it has been met without
        asking you.
      </SpecList>

      <TeachingTeam people={resolveTeachers(content, session.meta.teachers)} />
      <RelatedContent entries={resolveRelated(content, session)} />
    </PageLayout>
  );
}

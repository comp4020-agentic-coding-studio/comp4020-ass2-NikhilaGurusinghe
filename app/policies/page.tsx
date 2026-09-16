import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageLayout } from "@/components/PageLayout";
import { Prose } from "@/components/Prose";
import { getCourseContent } from "@/lib/content";

/**
 * The course-wide policy page.
 *
 * A single page rather than a collection route, because that is what it is:
 * `policies` is in the API but not the graph, and it has exactly one entry.
 * Reading it through the loader anyway means the page title, the API node and
 * the frontmatter stay one fact.
 *
 * One wart to clear when the real policy page is written: the starter body
 * opens with its own `# Policies and support`, because under Astro this file
 * was a standalone page whose body *was* the page. Routed through PageLayout it
 * is now the second <h1> on the document. Deleting that line from the markdown
 * is the fix — it is left in place only because the byte-exact golden API
 * fixture pins this body, and spending that proof on a duplicate heading in
 * placeholder prose is the worse trade. Replace the content and both go away.
 */
async function find() {
  const { policies } = await getCourseContent();
  return policies.find((entry) => entry.slug === "index") ?? null;
}

export async function generateMetadata(): Promise<Metadata> {
  const policy = await find();
  if (!policy) return {};
  return { title: policy.title, description: policy.description };
}

export default async function PoliciesPage() {
  const policy = await find();
  if (!policy) notFound();

  return (
    <PageLayout title={policy.title} description={policy.description}>
      <Prose body={policy.body} />
    </PageLayout>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageLayout } from "@/components/PageLayout";
import { Prose } from "@/components/Prose";
import { getCourseContent } from "@/lib/content";
import { personPhoto } from "@/lib/photos";
import { roleLabel } from "@/lib/roles";

/** One person. */
export async function generateStaticParams() {
  const { people } = await getCourseContent();
  return people.map((person) => ({ slug: person.slug }));
}

async function find(slug: string) {
  const { people } = await getCourseContent();
  return people.find((entry) => entry.slug === slug) ?? null;
}

export async function generateMetadata({ params }: PageProps<"/people/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const person = await find(slug);
  if (!person) return {};
  return { title: person.title, description: person.description };
}

export default async function PersonPage({ params }: PageProps<"/people/[slug]">) {
  const { slug } = await params;
  const person = await find(slug);
  if (!person) notFound();

  const photo = personPhoto(person.id, person.meta.photo);
  const label = roleLabel(person.meta.role);

  return (
    <PageLayout
      title={person.title}
      description={person.description}
      // The schema requires alt text whenever a photo is given, so this cannot
      // be an unlabelled portrait — but it still has to be narrowed here.
      hero={photo ? { src: photo, alt: person.meta.photoAlt ?? "" } : undefined}
    >
      <dl>
        {label ? (
          <>
            <dt>Role</dt>
            <dd>{label}</dd>
          </>
        ) : null}
        {person.meta.affiliation ? (
          <>
            <dt>Affiliation</dt>
            <dd>{person.meta.affiliation}</dd>
          </>
        ) : null}
        {person.meta.email ? (
          <>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${person.meta.email}`}>{person.meta.email}</a>
            </dd>
          </>
        ) : null}
        {person.meta.url ? (
          <>
            <dt>Web</dt>
            <dd>
              <a href={person.meta.url}>{person.meta.url}</a>
            </dd>
          </>
        ) : null}
        {/* `contact:` is optional in the schema, and the Astro version printed
            the term regardless — a "Contact" heading over an empty definition,
            which reads as a missing detail rather than an absent one. */}
        {person.meta.contact ? (
          <>
            <dt>Contact</dt>
            <dd>{person.meta.contact}</dd>
          </>
        ) : null}
      </dl>

      <Prose body={person.body} />
    </PageLayout>
  );
}

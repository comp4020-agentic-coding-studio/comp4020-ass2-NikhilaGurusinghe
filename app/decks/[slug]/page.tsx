import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageLayout } from "@/components/PageLayout";
import { getCourseContent } from "@/lib/content";

/**
 * A lecture's slide deck, embedded as a PDF.
 *
 * This replaces the Reveal.js decks the Astro starter built from markdown in
 * `src/decks/`. A deck is now a file in `public/decks/<slug>.pdf` and this route
 * is the page around it: the same `/decks/<slug>/` URL the lectures already
 * link to and the API already publishes, so nothing downstream had to change.
 *
 * The embed is a plain `<iframe>`, which is the browser's own PDF viewer — no
 * library, no worker, nothing to load from a CDN a marker's network may block.
 * It is also useless on a phone, where a 720x405 page renders as a postage
 * stamp, so below 40rem the frame is not rendered at all and the download link
 * is the whole page. That link is present at every width regardless: a PDF the
 * reader can keep is the thing being offered here, and an embed that fails to
 * paint should not be able to take it away.
 *
 * `public/` is copied verbatim, so these URLs are strings rather than imports
 * and the base path has to go on by hand. Every other link on the site gets it
 * from `<Link>` or `next/image`; this is the one place that would silently
 * point at the domain root, which is why check-links reads iframe sources too.
 */

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** `/decks/week-01/` → `week-01`. The schema has already checked the shape. */
const deckSlug = (slides: string) => slides.replace(/^\/decks\/|\/$/g, "");

export async function generateStaticParams() {
  const { lectures } = await getCourseContent();
  return lectures
    .filter((lecture) => typeof lecture.meta.slides === "string")
    .map((lecture) => ({ slug: deckSlug(lecture.meta.slides as string) }));
}

async function find(slug: string) {
  const { lectures } = await getCourseContent();
  return (
    lectures.find(
      (lecture) =>
        typeof lecture.meta.slides === "string" && deckSlug(lecture.meta.slides) === slug,
    ) ?? null
  );
}

export async function generateMetadata({ params }: PageProps<"/decks/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const lecture = await find(slug);
  if (!lecture) return {};
  return {
    title: `${lecture.title}: slides`,
    description: `The slide deck for week ${lecture.meta.week}, ${lecture.title}.`,
  };
}

export default async function DeckPage({ params }: PageProps<"/decks/[slug]">) {
  const { slug } = await params;
  const lecture = await find(slug);
  if (!lecture) notFound();

  const file = `${BASE}/decks/${slug}.pdf`;
  const title = `${lecture.title}: slides`;

  return (
    <PageLayout
      title={title}
      description={`The slide deck for week ${lecture.meta.week}. It is a PDF, so it reads the same offline as it does here.`}
    >
      <p>
        <a href={file}>Download the PDF</a> ·{" "}
        <Link href={`/lectures/${lecture.slug}/`}>Back to the lecture</Link>
      </p>

      <div className="hidden sm:block">
        <iframe
          title={title}
          src={`${file}#view=FitH`}
          className="aspect-video w-full border border-divider bg-bg-alt"
        />
      </div>

      <p className="text-text-secondary sm:hidden">
        The embedded viewer is left off at this width — a slide is wider than the screen and reads
        as a postage stamp. Download the file and read it in a PDF viewer instead.
      </p>
    </PageLayout>
  );
}

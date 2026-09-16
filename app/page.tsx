import { Card, CardGrid } from "@/components/Card";
import { PageLayout } from "@/components/PageLayout";
import heroImage from "@/src/assets/images/hero-home.avif";
import { courseMeta } from "@/src/course-config";
import { sessionLabels } from "@/src/site-config";

// STARTER_CONTENT: replace the hero artwork and its alt text below, then
// remove this comment.
const hero = {
  src: heroImage,
  alt: "A lecture theatre reduced to flat gold and black shapes, rows of seats sweeping past the frame, in a two-ink risograph print",
};

export default function Home() {
  return (
    <PageLayout
      title={`${courseMeta.code}: ${courseMeta.title}`}
      description={courseMeta.description}
      hero={hero}
    >
      <ul aria-label="Course tags" className="mt-0 mb-8 flex list-none flex-wrap gap-2 p-0">
        {courseMeta.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-full bg-bg-alt px-[0.65rem] py-1 text-[0.9rem] text-text-secondary"
          >
            {tag}
          </li>
        ))}
      </ul>

      {/* STARTER_CONTENT: replace the authored page below, then remove this comment. */}
      <h2>What you will do</h2>
      <p>
        Say what a student spends their time on — the making, reading, arguing or measuring that
        fills the weeks. Name the artefact they walk out with.
      </p>

      <h2>Who it is for</h2>
      <p>
        Say who this is aimed at and what they need to already know. Be specific enough that someone
        can rule themselves in or out without emailing you.
      </p>

      <h2>Where to go next</h2>
      <CardGrid columns={2}>
        <Card title={sessionLabels.plural} href="/sessions/">
          <p>The weekly schedule and what happens in each teaching session.</p>
        </Card>
        <Card title="Assessment" href="/assessments/">
          <p>What is marked, what it is worth, and when it is due.</p>
        </Card>
        <Card title="People" href="/people/">
          <p>Who teaches the course and how to reach them.</p>
        </Card>
      </CardGrid>
    </PageLayout>
  );
}

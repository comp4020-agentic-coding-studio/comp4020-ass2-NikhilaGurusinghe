import type { Metadata } from "next";
import { LecturesGrid } from "@/components/LecturesGrid";
import { PageLayout } from "@/components/PageLayout";

const description = "What is covered, week by week, and which topics each lecture draws on.";

export const metadata: Metadata = { title: "Lectures", description };

export default function LecturesIndex() {
  return (
    <PageLayout title="Lectures" description={description}>
      <p>
        Every lecture the course claims to run gets a dated page and a teaching-team reference. A
        course decides how many lectures it needs; one of them carries a real deck.{" "}
        <code>related:</code> connects lectures to the sessions and assessments they feed.
      </p>
      <LecturesGrid />
    </PageLayout>
  );
}

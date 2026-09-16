import type { Metadata } from "next";
import { AssessmentsGrid } from "@/components/AssessmentsGrid";
import { PageLayout } from "@/components/PageLayout";

const description =
  "Every piece of graded work in the course, what it is worth, and when it is due.";

export const metadata: Metadata = { title: "Assessment", description };

export default function AssessmentsIndex() {
  return (
    <PageLayout title="Assessment" description={description}>
      <p>Weights should sum to 100.</p>
      <AssessmentsGrid />
    </PageLayout>
  );
}

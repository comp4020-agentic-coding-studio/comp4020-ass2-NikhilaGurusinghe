import type { Metadata } from "next";
import { PageLayout } from "@/components/PageLayout";
import { PeopleGrid } from "@/components/PeopleGrid";

const description = "Who teaches the course, and how to reach them.";

export const metadata: Metadata = { title: "People", description };

export default function PeopleIndex() {
  return (
    <PageLayout title="People" description={description}>
      <PeopleGrid />
    </PageLayout>
  );
}

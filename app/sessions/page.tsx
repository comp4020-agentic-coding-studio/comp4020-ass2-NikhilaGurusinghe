import type { Metadata } from "next";
import { PageLayout } from "@/components/PageLayout";
import { SessionsGrid } from "@/components/SessionsGrid";
import { sessionLabels } from "@/src/site-config";

const description = `The twelve-week teaching schedule: what happens in each ${sessionLabels.singular.toLowerCase()}, what to prepare, and what leaves the room.`;

export const metadata: Metadata = { title: sessionLabels.plural, description };

export default function SessionsIndex() {
  return (
    <PageLayout title={sessionLabels.plural} description={description}>
      <p>
        The internal collection and URL stay <code>sessions</code>. Set the visible singular and
        plural names once in <code>src/site-config.ts</code> and use the language your course
        deserves everywhere readers see it.
      </p>
      <SessionsGrid />
    </PageLayout>
  );
}

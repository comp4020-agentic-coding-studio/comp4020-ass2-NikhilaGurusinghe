import Link from "next/link";
import { PageLayout } from "@/components/PageLayout";
import { sessionLabels } from "@/src/site-config";

/**
 * Replaces Next's built-in 404, which is not usable on this site for two
 * reasons. It puts its content in a bare `<div>` with no landmark, which is an
 * axe violation the a11y gate correctly fails the build on. And a 404 on a
 * course site is not an error page so much as a wrong turn: a student who
 * followed a stale link from a forum post needs a way back in, not "This page
 * could not be found."
 *
 * `<Link>` rather than `<a>` deliberately — it is what carries the GitHub Pages
 * base path. A hand-written `href="/"` here would send every lost visitor to
 * the domain root, which is somebody else's site.
 */
export const metadata = {
  title: "Page not found",
  description: "That page does not exist, or it has moved since you last looked.",
};

export default function NotFound() {
  return (
    <PageLayout
      title="Page not found"
      description="That address does not match anything on this site. The link may be from an earlier version of the course."
    >
      <p>Try one of these instead:</p>
      <ul>
        <li>
          <Link href="/">The course home page</Link>
        </li>
        <li>
          <Link href="/sessions/">{sessionLabels.plural}</Link>, week by week
        </li>
        <li>
          <Link href="/assessments/">Assessment</Link>, with weights and due dates
        </li>
        <li>
          <Link href="/people/">People</Link>, and how to reach them
        </li>
      </ul>
      <p>Or use the search button in the bar above.</p>
    </PageLayout>
  );
}

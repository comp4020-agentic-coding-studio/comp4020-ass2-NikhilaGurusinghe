import Link from "next/link";

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
export default function NotFound() {
  return (
    <main>
      <h1>Page not found</h1>
      <p>
        That address does not match anything on this site. The link may be from an earlier version
        of the course.
      </p>
      <p>
        <Link href="/">Back to the course home page</Link>
      </p>
    </main>
  );
}

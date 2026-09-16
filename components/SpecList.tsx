import type { ReactNode } from "react";

/**
 * The `spec:` block from frontmatter: the checkable part of a brief.
 *
 * Reconstructed rather than ported. The original lived in
 * astro-course-university, which this port drops, and it had no styles of its
 * own in the built stylesheet — so what it rendered was plain semantic markup,
 * and that is what this is. The list stays a list because that is what it is:
 * an unordered set of conditions, each one true or false on its own.
 *
 * `children` is the standing explanation of what a spec is for, passed by each
 * route because the wording differs between a session and an assessment. An
 * entry with no spec renders nothing at all, heading included.
 */
export function SpecList({ spec, children }: { spec: string[]; children?: ReactNode }) {
  if (spec.length === 0) return null;

  return (
    <section aria-labelledby="spec">
      <h2 id="spec">Spec</h2>
      {children ? <p className="text-text-secondary">{children}</p> : null}
      <ul>
        {spec.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
    </section>
  );
}

import type { Marking } from "@/lib/content";

/**
 * How an assessment is marked, in whichever of the two modes it declares.
 *
 * `weighted` gets a criterion table — the schema has already proved the weights
 * sum to 100, so the table cannot publish a total that is not a whole mark.
 * `holistic` gets the prose statement instead. Both are the author's words; the
 * component's only job is to give them a heading a reader can jump to.
 */
export function MarkingModel({ marking }: { marking: Marking }) {
  return (
    <section aria-labelledby="how-marked">
      <h2 id="how-marked">How it is marked</h2>

      {marking.mode === "holistic" ? (
        <p>{marking.description}</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Criterion</th>
              <th scope="col">Weight</th>
            </tr>
          </thead>
          <tbody>
            {marking.criteria.map((criterion) => (
              <tr key={criterion.name}>
                <td>{criterion.name}</td>
                <td>{criterion.weight}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

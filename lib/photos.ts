import type { StaticImageData } from "next/image";
import idrisFenn from "@/src/content/people/idris-fenn.avif";
import marisolQuaye from "@/src/content/people/marisol-quaye.avif";

/**
 * Person photographs, as static imports.
 *
 * Astro resolved `photo: ./idris-fenn.avif` itself, because its content
 * collections know which file the frontmatter came from. Nothing does that
 * here: the loader reads the markdown with `node:fs` and hands the page the
 * string as authored. Handing that string to `next/image` would produce a `src`
 * with no base path and no hashed filename — a 404 on the live site and a
 * working image on a laptop, which is the failure mode this repo is most
 * exposed to.
 *
 * So the mapping is explicit. Adding a person means adding a line here, and
 * forgetting to is a build error rather than a broken picture: `personPhoto`
 * throws when an entry declares a photo this table does not know about.
 */

const PHOTOS: Record<string, StaticImageData> = {
  "people/idris-fenn": idrisFenn,
  "people/marisol-quaye": marisolQuaye,
};

export function personPhoto(id: string, photo: unknown): StaticImageData | undefined {
  if (typeof photo !== "string" || photo === "") return undefined;

  const image = PHOTOS[id];
  if (!image) {
    throw new Error(
      `${id} declares photo "${photo}" but lib/photos.ts has no import for it. ` +
        `Add one keyed by "${id}" — a bare string src is not rewritten with the base path.`,
    );
  }
  return image;
}

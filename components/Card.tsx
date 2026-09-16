import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The card grid, and the cards in it.
 *
 * The geometry is the theme's, and the one part worth explaining is the
 * subgrid. Each card spans two implicit rows of the grid and adopts them as its
 * own, so every card's image band ends on the same line and every card's text
 * starts on the same line — regardless of how long the titles are. Without it,
 * a two-line title in one card pushes its body down and the row reads as
 * ragged. A card with no image takes both rows for its body instead.
 *
 * `auto-fill` with a `min(100%, …)` floor is what makes this work at 390px:
 * the track never demands more width than the container has, so the grid drops
 * to one column instead of overflowing.
 */

export function CardGrid({ columns = 2, children }: { columns?: 2 | 3; children: ReactNode }) {
  return (
    <div
      className={`my-[var(--at-spacing-xl)] grid gap-[var(--at-spacing-lg)] ${
        columns === 3
          ? "grid-cols-[repeat(auto-fill,minmax(min(100%,16rem),1fr))]"
          : "grid-cols-[repeat(auto-fill,minmax(min(100%,20rem),1fr))]"
      }`}
    >
      {children}
    </div>
  );
}

interface CardProps {
  title: string;
  href: string;
  /** h2 inside a listing, h3 under a section heading. The default matches the
   *  theme's, and every caller that sits under an <h2> passes "h2" explicitly. */
  headingLevel?: "h2" | "h3";
  image?: StaticImageData;
  imageAlt?: string;
  children?: ReactNode;
}

export function Card({
  title,
  href,
  headingLevel: Heading = "h3",
  image,
  imageAlt,
  children,
}: CardProps) {
  return (
    <Link
      href={href}
      className="group relative row-span-2 grid grid-rows-subgrid gap-0 overflow-hidden border border-divider text-text no-underline transition-[background-color,box-shadow] duration-150 hover:bg-accent-soft hover:shadow-[var(--at-shadow-sm)]"
    >
      {image ? (
        <div className="relative aspect-video overflow-hidden leading-none">
          <Image
            src={image}
            // Empty alt is correct here and only here: the card is one link
            // whose accessible name is its title, so describing the picture
            // again would read the same card twice.
            alt={imageAlt ?? ""}
            fill
            sizes="(min-width: 40rem) 20rem, 100vw"
            className="object-cover outline -outline-offset-1 outline-black/8 transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>
      ) : null}

      <div
        className={`p-[var(--at-spacing-md)] [&>*:last-child]:mb-0 ${image ? "" : "row-[1/-1]"}`}
      >
        <Heading className="mt-0 mb-[var(--at-spacing-xs)] text-[1.125rem]">{title}</Heading>
        {children}
      </div>
    </Link>
  );
}

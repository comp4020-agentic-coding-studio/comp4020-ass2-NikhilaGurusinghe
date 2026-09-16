import Image, { type StaticImageData } from "next/image";
import type { ReactNode } from "react";

/**
 * The page frame every route renders into: optional hero, then `<main>`.
 *
 * This is the Astro `ContentLayout` with the chrome taken out — the nav and
 * footer are in the root layout now, where Next wants them. What is left is the
 * part that differs per page, and it has exactly two shapes, both reproduced
 * from the built site rather than guessed:
 *
 *   with a hero — the <h1> lives inside the hero, over the image, and the
 *                 description is the first thing in <main>;
 *   without one — <main> opens with the <h1> and the description follows it.
 *
 * Only the home page and the people pages take the first branch. Keeping both
 * here, rather than letting each route assemble its own, is what stops the two
 * from drifting: a heading that moves between the hero and the main region
 * changes the document outline, and the a11y gate reads that outline.
 */

export interface HeroImage {
  src: StaticImageData;
  alt: string;
}

interface PageLayoutProps {
  title: string;
  description?: string;
  hero?: HeroImage;
  children?: ReactNode;
}

export function PageLayout({ title, description, hero, children }: PageLayoutProps) {
  return (
    <>
      {hero ? <Hero title={title} image={hero} /> : null}

      <main
        id="main"
        className="inset-band content-start py-[var(--at-spacing-xl)] [overflow-wrap:break-word] min-h-[calc(100dvh-var(--at-nav-height))]"
      >
        {hero ? null : <h1>{title}</h1>}
        {description ? <p className="text-[1.25rem] text-text-secondary">{description}</p> : null}
        {children}
      </main>
    </>
  );
}

/**
 * A full-bleed image with the page title set over it.
 *
 * Three nested grids, and each one earns its place. The section spans the page
 * frame's full width; the gradient overlay spans it too, so the darkening runs
 * edge to edge; and both pass the frame's columns down by subgrid so the title
 * still starts on the same left edge as the body text below it. Take the
 * subgrid away and the title floats free of every other line on the page.
 *
 * `fill` rather than intrinsic dimensions because these are AVIF files and
 * Turbopack cannot read their size — see app/page.tsx. The section's own
 * `min-height` is what gives the image a box to fill.
 *
 * The `aria-label` is load-bearing, not decoration. An unnamed `<section>` is
 * not a landmark, so the <h1> inside it would be page content sitting outside
 * every landmark on the page — which is exactly what the axe `region` rule
 * fails a build on. Naming the section promotes it to one. The Astro original
 * labelled it with the same string, so this is a port and not an invention.
 */
function Hero({ title, image }: { title: string; image: HeroImage }) {
  return (
    <section aria-label={title} className="band relative min-h-[20rem] overflow-hidden">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="100vw"
        priority
        className="object-cover outline -outline-offset-1 outline-black/8"
      />

      <div className="band relative min-h-full content-end bg-[linear-gradient(#00000026,#0009_50%,#000c)]">
        <h1 className="m-0 max-w-[20ch] py-[var(--at-spacing-2xl)] text-[clamp(2rem,5vw,4.5rem)] tracking-[-0.02em] text-white [text-shadow:0_1px_2px_#0000008c,0_2px_24px_#00000073] [text-wrap:balance] animate-hero-fade-up after:mt-[var(--at-spacing-md)] after:block after:h-1 after:w-16 after:rounded-[calc(var(--at-border-radius)/3)] after:bg-brand after:animate-hero-fade-up-delayed after:content-['']">
          {title}
        </h1>
      </div>
    </section>
  );
}

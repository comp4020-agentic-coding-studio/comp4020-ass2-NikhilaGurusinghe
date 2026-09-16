import type { StaticImageData } from "next/image";
import slopCrest from "./assets/brand/slop-crest.svg";
import slopLogo from "./assets/brand/slop-horizontal-gold-black.svg";
import slopLogoDark from "./assets/brand/slop-horizontal-gold-white.svg";
import socialImage from "./assets/images/card.png";
import { courseMeta } from "./course-config";

// The underlying collection and URL remain `sessions`; these labels are the
// language students see. Change them to Studios, Tutorials, Expeditions, etc.
export const sessionLabels = {
  singular: "Session",
  plural: "Sessions",
} as const;

/** Collections that participate in the related-content graph: their entries can
 *  reference each other, and every reference becomes an edge in the API. */
export const graphCollections = ["sessions", "assessments", "lectures", "people"] as const;

/** Every collection the generated API covers. `policies` is in the API but not
 *  the graph — it is a standalone page that assessments link to, with no
 *  references of its own. Miss it and the emitted contract loses a node. */
export const courseApiCollections = [...graphCollections, "policies"] as const;

export type GraphCollection = (typeof graphCollections)[number];
export type ApiCollection = (typeof courseApiCollections)[number];

export interface NavLink {
  text: string;
  href: string;
}

export interface SiteConfig {
  name: string;
  links: NavLink[];
  licence: string;
  socialImage: StaticImageData;
  socialImageAlt: string;
  /** The wide horizontal lockup, for the nav bar on light backgrounds. */
  logo: StaticImageData;
  logoDark: StaticImageData;
  /** Below 640px the wide lockup wraps the nav bar, so the crest stands in.
   *  Its gold outline reads on both the cream and the dark background, so one
   *  mark serves both themes — and doubles as the favicon. */
  logoCompact: StaticImageData;
  favicon: StaticImageData;
}

export const siteConfig: SiteConfig = {
  name: "Slop University",

  links: [
    { text: "Lectures", href: "/lectures/" },
    { text: sessionLabels.plural, href: "/sessions/" },
    { text: "Assessment", href: "/assessments/" },
    { text: "People", href: "/people/" },
    { text: "Policies", href: "/policies/" },
  ],

  licence: "CC-BY-NC-SA-4.0",
  socialImage,
  socialImageAlt: `A preview card for ${courseMeta.code}: ${courseMeta.title}`,

  logo: slopLogo,
  logoDark: slopLogoDark,
  logoCompact: slopCrest,
  favicon: slopCrest,
};

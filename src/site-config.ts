import { defineSiteConfig } from "astro-theme-university/types";
import { slopBranding } from "astro-theme-slop";
import { courseMeta } from "./course-config";

// The underlying collection and URL remain `sessions`; these labels are the
// language students see. Change them to Studios, Tutorials, Expeditions, etc.
export const sessionLabels = {
  singular: "Workshop",
  plural: "Workshops",
} as const;

export const graphCollections = ["sessions", "assessments", "lectures", "people"];

export const courseApiCollections = [
  ...graphCollections.map((key) => ({ key })),
  { key: "policies", dir: "pages/policies" },
];

export const siteConfig = defineSiteConfig({
  ...slopBranding,
  name: "Slop University",

  links: [
    { text: "Lectures", href: "/lectures/" },
    { text: sessionLabels.plural, href: "/sessions/" },
    { text: "Assessment", href: "/assessments/" },
    { text: "People", href: "/people/" },
    { text: "Policies", href: "/policies/" },
  ],

  licence: "CC-BY-NC-SA-4.0",

  meta: [
    "This is a work of fiction. Names, characters, businesses, events, and " +
      "incidents depicted on this website are purely fictitious and the " +
      "products of the author’s imagination. Any similarity to actual " +
      "persons, living or dead, or to actual events is purely coincidental.",
  ],

  socialImage: "/src/assets/images/card.png",
  socialImageAlt: `A preview card for ${courseMeta.code}: ${courseMeta.title}`,
});

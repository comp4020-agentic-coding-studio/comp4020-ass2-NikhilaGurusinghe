import type { Metadata } from "next";
import { Public_Sans, Roboto_Mono } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { THEME_SCRIPT } from "@/components/theme-script";
import { courseMeta } from "@/src/course-config";
import { siteConfig } from "@/src/site-config";
import "./globals.css";

// The theme's --at-font-body and --at-font-mono read these variable names, so
// they are load-bearing: rename one and the site silently falls back to the
// system stack. next/font self-hosts the files at build time, which matters for
// a static export — no request to Google Fonts from the deployed page.
const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
});

// `template` rather than a per-page string: every route sets a bare title and
// the course code arrives on the end of it, which is what a browser tab and a
// shared link need in order to be told apart from another course's.
export const metadata: Metadata = {
  title: {
    default: `${courseMeta.code}: ${courseMeta.title}`,
    template: `%s · ${courseMeta.code}`,
  },
  description: courseMeta.description,
  openGraph: {
    siteName: siteConfig.name,
    type: "website",
    images: [{ url: siteConfig.socialImage.src, alt: siteConfig.socialImageAlt }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${publicSans.variable} ${robotoMono.variable}`}>
      <head>
        {/* Before anything paints. A stored theme applied after hydration is a
            visible flash of the wrong palette on every single navigation, and
            this is a static export, so every navigation is a full page load. */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a constant string from components/theme-script.ts; nothing here is interpolated at runtime. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        {/* First in the tab order and invisible until it is focused: the way
            past a nav bar for somebody who does not use a mouse. */}
        <a
          href="#main"
          className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-[var(--at-spacing-sm)] focus-visible:left-[var(--at-spacing-sm)] focus-visible:z-101 focus-visible:rounded-token focus-visible:border focus-visible:border-brand focus-visible:bg-bg-elevated focus-visible:px-[var(--at-spacing-md)] focus-visible:py-[var(--at-spacing-xs)] focus-visible:text-brand focus-visible:no-underline"
        >
          Skip to main content
        </a>

        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

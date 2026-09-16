import type { Metadata } from "next";
import { Public_Sans, Roboto_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Slop University",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${publicSans.variable} ${robotoMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}

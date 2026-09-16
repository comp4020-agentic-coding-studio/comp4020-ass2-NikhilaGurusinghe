"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { siteConfig } from "@/src/site-config";
import { Icon } from "./Icon";
import { SearchDialog } from "./SearchDialog";

/**
 * The masthead: brand lockup, the five section links, and the search trigger.
 *
 * A client component because two things here need state that CSS cannot hold —
 * the mobile menu's `aria-expanded`, and the search dialog. The alternative, a
 * checkbox hiding behind a label, gives a screen reader a checkbox where the
 * page has a menu button, so it is not really an alternative.
 *
 * The disclosure animates on `grid-template-rows` rather than `height`, which
 * is what lets a list of unknown height slide open without a measured pixel
 * value anywhere. Above 40rem the wrapper becomes `display: contents` and the
 * list is simply a row in the bar: one markup tree, two layouts, no duplicated
 * nav for a screen reader to read twice.
 */
const trimSlash = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path);

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const menuId = useId();
  // Compared without its trailing slash. `trailingSlash: true` means the links
  // are written "/people/" while the router reports "/people", and a mismatch
  // here does not break anything visible — it silently drops `aria-current`,
  // which is exactly the kind of failure nobody notices.
  const pathname = trimSlash(usePathname());

  // A link inside the open menu navigates, and on a static export that is a
  // real page load — but during a client-side transition the menu would
  // otherwise stay open over the new page.
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the signal, not a value this effect reads.
  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <nav aria-label="Main" className="band sticky top-0 z-100 bg-bg">
      <div className="flex flex-wrap items-center gap-x-[var(--at-spacing-sm)] py-[var(--at-spacing-xl)] sm:gap-x-[var(--at-spacing-lg)]">
        <Link
          href="/"
          className="whitespace-nowrap text-[1.125rem] font-semibold text-text no-underline sm:translate-x-[calc(-1*var(--at-content-inset)+var(--at-logo-offset-x))]"
        >
          {/* Two lockups, not one with a filter: the gold stays gold in both
              themes and only the second ink changes. Which one shows is decided
              in globals.css, where the forced-theme override also lives. */}
          <span className="hidden sm:block">
            <Image
              src={siteConfig.logo}
              alt={siteConfig.name}
              className="logo-light h-10 w-auto"
              priority
            />
            <Image
              src={siteConfig.logoDark}
              alt={siteConfig.name}
              className="logo-dark h-10 w-auto"
              priority
            />
          </span>
          {/* Below 40rem the wide lockup would wrap the bar onto three rows, so
              the crest stands in. It reads on both grounds, hence one file. */}
          <span className="block sm:hidden">
            <Image
              src={siteConfig.logoCompact}
              alt={siteConfig.name}
              className="h-10 w-auto"
              priority
            />
          </span>
        </Link>

        <button
          type="button"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label="Menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="ms-auto inline-flex size-10 cursor-pointer items-center justify-center rounded-token border border-divider bg-transparent p-0 text-text transition-colors hover:border-brand sm:hidden"
        >
          <Icon name={menuOpen ? "close" : "menu"} className="size-5" />
        </button>

        <div
          className={`order-3 grid w-full transition-[grid-template-rows] duration-300 sm:contents ${
            menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <ul
            id={menuId}
            className={`m-0 flex list-none flex-col gap-[var(--at-spacing-xs)] overflow-hidden p-0 sm:ms-auto sm:w-auto sm:flex-row sm:gap-[var(--at-spacing-sm)] sm:overflow-visible ${
              menuOpen ? "py-[var(--at-spacing-sm)] sm:py-0" : ""
            }`}
          >
            {siteConfig.links.map((link) => {
              const current = pathname === trimSlash(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? "page" : undefined}
                    className={`block whitespace-nowrap rounded-token p-[var(--at-spacing-sm)] text-sm no-underline transition-colors hover:bg-accent-soft hover:text-text sm:px-[var(--at-spacing-sm)] sm:py-[var(--at-spacing-xs)] ${
                      current ? "text-brand" : "text-text-secondary"
                    }`}
                  >
                    {link.text}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          type="button"
          aria-label="Search (Cmd+K)"
          title="Search (Cmd+K)"
          onClick={() => setSearchOpen(true)}
          className="inline-flex size-10 cursor-pointer items-center justify-center rounded-token border border-divider bg-transparent p-0 text-text transition-colors hover:border-brand"
        >
          <Icon name="search" className="size-5" />
        </button>
      </div>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  );
}

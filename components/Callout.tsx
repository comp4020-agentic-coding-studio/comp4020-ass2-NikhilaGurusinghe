import type { ReactNode } from "react";

/**
 * An aside that has to be read: a draft warning, a deadline change, a caveat.
 *
 * Each variant rebinds `--at-accent` and `--at-accent-soft` locally rather than
 * setting a colour, so the rule and the wash always come from the same pair and
 * a new variant is two lines. Deliberately not a `role="alert"` or a
 * `role="note"`: the colour is decoration on top of text that already says what
 * it means, which is the only version that survives being read aloud.
 */

const VARIANTS = {
  info: "[--at-accent:var(--at-info)] [--at-accent-soft:var(--at-info-soft)]",
  tip: "[--at-accent:var(--at-success)] [--at-accent-soft:var(--at-success-soft)]",
  warning: "[--at-accent:var(--at-warning)] [--at-accent-soft:var(--at-warning-soft)]",
  error: "[--at-accent:var(--at-error)] [--at-accent-soft:var(--at-error-soft)]",
} as const;

export type CalloutType = keyof typeof VARIANTS;

export function Callout({
  type,
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`my-[var(--at-spacing-md)] border-t border-t-[var(--at-accent)] bg-accent-soft p-[var(--at-spacing-md)] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 ${type ? VARIANTS[type] : ""}`}
    >
      {title ? <p className="mb-[var(--at-spacing-xs)] font-semibold">{title}</p> : null}
      {children}
    </div>
  );
}

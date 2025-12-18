import type { Summary } from "@/lib/schemas";

const badgeBase =
  "inline-flex items-center px-4 py-2 border-3 text-label font-sans font-semibold uppercase tracking-label";

export function formatEnumLabel(value: string) {
  return value.replace(/_/g, " ");
}

export function statusBadgeClass(status: string) {
  if (status === "completed") return `${badgeBase} border-ink bg-ink text-paper`;
  if (status === "active") return `${badgeBase} border-accent-red bg-accent-red text-paper`;
  return `${badgeBase} border-ink bg-paper text-ink`;
}

export function sentimentBadgeClass(sentiment: Summary["sentiment"] | string) {
  if (sentiment === "negative") return `${badgeBase} border-accent-red text-accent-red`;
  if (sentiment === "positive") return `${badgeBase} border-ink bg-ink text-paper`;
  return `${badgeBase} border-ink text-ink`;
}

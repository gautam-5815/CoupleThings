const FALLBACK_URL = "https://couplethings.app";

/**
 * Environment variables arrive from wherever someone pasted them, and a
 * stray byte-order mark or line ending is invisible in a dashboard. An
 * unusable value must not take the whole build down, so it is cleaned and
 * checked here, once, and anything hopeless falls back.
 */
function readSiteUrl(raw: string | undefined): string {
  const cleaned = raw?.replace(/^﻿/, "").replace(/\\[rn]/g, "").trim();
  if (!cleaned) return FALLBACK_URL;
  try {
    return new URL(cleaned).origin;
  } catch {
    return FALLBACK_URL;
  }
}

export const site = {
  name: "Couple Things",
  tagline: "A letter only one person can open.",
  description:
    "Write your partner a private five-page letter — photos, music, your own words and one last question — and send it as a single secret link. Free, no account, nothing public.",
  url: readSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
} as const;

/** Public pages that belong in the sitemap. Experiences never do. */
export const publicRoutes = [
  { path: "/", changeFrequency: "monthly", priority: 1 },
  { path: "/apology-website", changeFrequency: "monthly", priority: 0.8 },
  { path: "/anniversary-website", changeFrequency: "monthly", priority: 0.8 },
  { path: "/love-letter", changeFrequency: "monthly", priority: 0.8 },
  { path: "/how-it-works", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
] as const;

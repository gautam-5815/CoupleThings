export const site = {
  name: "Couple Things",
  tagline: "A letter only one person can open.",
  description:
    "Write your partner a private five-page letter — photos, music, your own words and one last question — and send it as a single secret link. Free, no account, nothing public.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://couplethings.app",
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

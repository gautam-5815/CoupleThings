import type { MetadataRoute } from "next";
import { publicRoutes, site } from "@/lib/site";

/** Only public marketing pages. A letter is never listed here. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return publicRoutes.map((route) => ({
    url: `${site.url}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}

import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blogs", "/blogs/*", "/download", "/integrations"],
        // Disallow admin, API routes, and private pages
        disallow: ["/admin", "/api/*", "/splash"],
      },
    ],
    sitemap: "https://plexi.lazyhideout.tech/sitemap.xml",
  };
}

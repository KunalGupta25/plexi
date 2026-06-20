import type { MetadataRoute } from "next";

const BASE_URL = "https://plexi.lazyhideout.tech";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/materials`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/ai`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/blogs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/download`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/integrations`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contribute`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Dynamic blog pages
  let blogRoutes: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${BASE_URL}/api/blogs`, {
      next: { revalidate: 3600 }, // re-fetch at most once per hour
    });
    if (res.ok) {
      const blogs = await res.json();
      blogRoutes = blogs.map((blog: { _id?: string; id?: string; updatedAt?: string }) => ({
        url: `${BASE_URL}/blogs/${blog._id ?? blog.id}`,
        lastModified: blog.updatedAt ? new Date(blog.updatedAt) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
    }
  } catch {
    // Sitemap generation fails gracefully — blogs just won't appear
  }

  return [...staticRoutes, ...blogRoutes];
}

import type { MetadataRoute } from 'next';

const BASE_URL = 'https://hubnest.in';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Public marketing pages
  const marketingPages = [
    { path: '', priority: 1.0, changeFrequency: 'weekly' as const },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/blog', priority: 0.7, changeFrequency: 'daily' as const },
    { path: '/changelog', priority: 0.6, changeFrequency: 'weekly' as const },
    { path: '/careers', priority: 0.6, changeFrequency: 'weekly' as const },
    { path: '/integrations', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/help-center', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/docs', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/privacy', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/compliance', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/press', priority: 0.5, changeFrequency: 'monthly' as const },
  ];

  return marketingPages.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}

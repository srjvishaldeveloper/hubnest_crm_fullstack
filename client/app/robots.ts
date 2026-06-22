import type { MetadataRoute } from 'next';

const BASE_URL = 'https://hubnest.in';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/blog',
          '/changelog',
          '/careers',
          '/integrations',
          '/help-center',
          '/docs',
          '/privacy',
          '/compliance',
          '/press',
        ],
        disallow: [
          '/admin/',
          '/super-admin/',
          '/marketing/',
          '/sales-manager/',
          '/sales-executive/',
          '/support/',
          '/finance/',
          '/dashboard/',
          '/auth/',
          '/public/form/',
          '/api/',
          '/_next/',
        ],
      },
      {
        // Block AI training crawlers from app sections
        userAgent: ['GPTBot', 'CCBot', 'Google-Extended', 'Anthropic-AI', 'ClaudeBot'],
        disallow: ['/admin/', '/super-admin/', '/marketing/', '/finance/', '/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}

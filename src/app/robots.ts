import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/constants/site';

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/track-order'],
        disallow: ['/admin/', '/checkout/', '/order-confirmation/', '/api/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

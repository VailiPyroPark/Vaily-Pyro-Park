import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/constants/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = getSiteUrl();
  const now = new Date();

  return [
    {
      url: `${siteUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/track-order`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];
}

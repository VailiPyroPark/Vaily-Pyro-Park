import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vaili Pyro Park - Sivakasi Diwali Crackers Online 2026',
    short_name: 'Vaili Pyro Park',
    description:
      'Buy genuine Sivakasi Diwali crackers, sparklers, ground chakkars, flower pots, rockets & fancy aerial shots at direct factory rates.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#f59e0b',
    icons: [
      {
        src: '/favicon-48x48.png',
        sizes: '48x48',
        type: 'image/png',
      },
      {
        src: '/favicon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/favicon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/favicon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '500x500',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}

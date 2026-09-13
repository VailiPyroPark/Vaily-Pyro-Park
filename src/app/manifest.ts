import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vaili Pyro Park Admin Console',
    short_name: 'VPP Admin',
    description: 'Sivakasi Fireworks Direct Factory Admin & Order Operations',
    start_url: '/admin',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#f59e0b',
    icons: [
      {
        src: '/logo.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}

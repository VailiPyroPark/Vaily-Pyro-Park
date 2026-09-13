import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Poppins } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { JsonLd } from '@/components/seo/JsonLd';
import { getSiteUrl } from '@/lib/constants/site';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800', '900'],
  variable: '--font-poppins',
  display: 'swap',
});

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Vaili Pyro Park | Buy Sivakasi Diwali Crackers Online 2026',
    template: '%s | Vaili Pyro Park',
  },
  description:
    'Buy genuine Sivakasi Diwali crackers, sparklers, ground chakkars, flower pots, rockets, fancy aerial shots & gift boxes at direct factory rates. Instant order booking and quick delivery across Tamil Nadu & India.',
  keywords: [
    'Online Crackers Sivakasi',
    'Sivakasi Fireworks Price List 2026',
    'Diwali Crackers Online Purchase 2026',
    'Best Quality Crackers Sivakasi',
    'Buy Crackers Online Tamil Nadu',
    'Sivakasi Direct Factory Crackers',
    'Sivakasi Wholesale Crackers',
    'Diwali Fireworks Shopping',
    'Flower Pots Crackers Online',
    'Aerial Fancy Shots Sivakasi',
    'Sparklers Ground Chakkars Sivakasi',
    'Diwali Crackers Gift Box 2026',
    'வைலி பைரோ பார்க்',
    'சிவகாசி பட்டாசு ஆன்லைன்',
    'பட்டாசு விலை பட்டியல் 2026',
  ],
  authors: [{ name: 'Vaili Pyro Park', url: siteUrl }],
  creator: 'Vaili Pyro Park',
  publisher: 'Vaili Pyro Park',
  applicationName: 'Vaili Pyro Park',
  category: 'ecommerce',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  verification: {
    google: 'mQP3pW7ATHeb8mBTwBKOXMlo1s4YHkSGbsI7uFdTFc0',
  },
  openGraph: {
    title: 'Vaili Pyro Park | Sivakasi Diwali Crackers Online 2026',
    description:
      'Buy genuine Sivakasi Diwali fireworks at direct factory prices. Instant quick-add ordering, authentic quality, and safe home delivery across Tamil Nadu and India.',
    url: siteUrl,
    siteName: 'Vaili Pyro Park',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 800,
        height: 800,
        alt: 'Vaili Pyro Park Sivakasi Fireworks & Crackers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vaili Pyro Park | Buy Sivakasi Diwali Crackers Online 2026',
    description:
      'Genuine Sivakasi fireworks at factory direct rates. Sparklers, chakkars, pots, rockets & gift boxes with instant tracking.',
    images: ['/logo.png'],
    creator: '@VailiPyroPark',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <JsonLd />
      </head>
      <body className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen" suppressHydrationWarning>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
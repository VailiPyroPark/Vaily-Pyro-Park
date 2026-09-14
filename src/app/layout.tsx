import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Poppins } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { StoreSettingsProvider } from '@/context/StoreSettingsContext';
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
    'Buy genuine Sivakasi Diwali crackers 2026 at direct factory rates. Sparklers, chakkars, pots, aerial shots & gift boxes. Fast doorstep delivery across India.',
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
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  verification: {
    google: 'mQP3pW7ATHeb8mBTwBKOXMlo1s4YHkSGbsI7uFdTFc0',
  },
  openGraph: {
    title: 'Vaili Pyro Park | Buy Sivakasi Diwali Crackers Online 2026',
    description:
      'Buy genuine Sivakasi Diwali crackers 2026 at direct factory rates. Sparklers, chakkars, pots, aerial shots & gift boxes with safe doorstep delivery.',
    url: siteUrl,
    siteName: 'Vaili Pyro Park',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Vaili Pyro Park Sivakasi Fireworks & Crackers',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vaili Pyro Park | Buy Sivakasi Diwali Crackers Online 2026',
    description:
      'Genuine Sivakasi fireworks at direct factory rates. Sparklers, chakkars, pots, rockets & gift boxes with instant tracking.',
    images: ['/og-image.png'],
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
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="application-name" content="Vaili Pyro Park" />
        <meta name="apple-mobile-web-app-title" content="Vaili Pyro Park" />
        <meta property="og:site_name" content="Vaili Pyro Park" />
        <JsonLd />
      </head>
      <body className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen" suppressHydrationWarning>
        <StoreSettingsProvider>
          <CartProvider>{children}</CartProvider>
        </StoreSettingsProvider>
      </body>
    </html>
  );
}
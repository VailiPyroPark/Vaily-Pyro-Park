import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Poppins } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';

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

export const metadata: Metadata = {
  title: 'Vaili Pyro Park | Online Sivakasi Crackers Shopping 2026',
  description:
    'Purchase genuine Sivakasi Diwali crackers, sparklers, flower pots, rockets, and aerial shots at direct factory prices with instant quick-add ordering.',
  keywords: [
    'Online Crackers Sivakasi',
    'Sivakasi Fireworks Price List 2026',
    'Diwali Crackers Online Purchase',
    'Best Quality Crackers Sivakasi',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakarta.variable} ${poppins.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased text-slate-900 bg-slate-50 min-h-screen" suppressHydrationWarning>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
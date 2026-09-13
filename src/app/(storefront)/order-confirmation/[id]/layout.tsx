import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Order Confirmed | Vaili Pyro Park',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function OrderConfirmationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

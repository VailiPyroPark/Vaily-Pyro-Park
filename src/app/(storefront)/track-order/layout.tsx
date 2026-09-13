import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Track Order Status | Sivakasi Crackers Delivery',
  description:
    'Check real-time delivery status, tracking number, and transport parcel details for your Sivakasi Diwali crackers order with Vaili Pyro Park.',
  alternates: {
    canonical: '/track-order',
  },
  openGraph: {
    title: 'Track Order Status | Vaili Pyro Park',
    description:
      'Check real-time delivery status and transport details for your Sivakasi Diwali crackers order.',
    url: '/track-order',
  },
};

export default function TrackOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

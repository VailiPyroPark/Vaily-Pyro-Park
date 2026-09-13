import React from 'react';
import { getSiteUrl } from '@/lib/constants/site';

export const JsonLd: React.FC = () => {
  const siteUrl = getSiteUrl();

  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    name: 'Vaili Pyro Park',
    alternateName: ['வைலி பைரோ பார்க்', 'VPP Sivakasi Fireworks'],
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    image: `${siteUrl}/logo.png`,
    description:
      'Direct Sivakasi factory prices on Diwali crackers, sparklers, ground chakkars, flower pots, rockets, fancy aerial shots & gift boxes. Fast doorstep delivery across Tamil Nadu & India.',
    telephone: '+91-99521-08746',
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash on Delivery, UPI, Net Banking, Bank Transfer',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Direct Factory Outlet, Sivakasi',
      addressLocality: 'Sivakasi',
      addressRegion: 'Tamil Nadu',
      postalCode: '626123',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '9.4533',
      longitude: '77.7946',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        opens: '08:00',
        closes: '22:00',
      },
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Vaili Pyro Park',
    alternateName: 'வைலி பைரோ பார்க்',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I purchase genuine Sivakasi Diwali crackers online?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can browse our transparent direct factory price list at Vaili Pyro Park, choose your sparklers, chakkars, flower pots, and aerial shots, meet the regional minimum order amount, and place your order with immediate confirmation and WhatsApp receipt sharing.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is the minimum order value for Sivakasi crackers delivery?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The minimum order requirements are: Tamil Nadu: ₹3,000; South Indian states (Karnataka, Kerala, Andhra Pradesh, Telangana): ₹4,000; Rest of India: ₹5,000.',
        },
      },
      {
        '@type': 'Question',
        name: 'Are the fireworks sourced directly from Sivakasi factories?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. 100% of all fireworks and crackers supplied by Vaili Pyro Park are produced and packed in licensed Sivakasi fireworks factories ensuring premium burst quality and strict safety standards.',
        },
      },
      {
        '@type': 'Question',
        name: 'How can I track my Sivakasi crackers order?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'You can easily check your delivery status on our dedicated Track Order page anytime by entering your Order ID or phone number.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
};

import React from 'react';
import { getSiteUrl } from '@/lib/constants/site';

export const JsonLd: React.FC = () => {
  const siteUrl = getSiteUrl().replace(/\/$/, '');
  const canonicalUrl = `${siteUrl}/`;

  // 1. WebSite Schema (Official Google format to establish site name and Sitelinks Search Box)
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteUrl}/#website`,
    name: 'Vaili Pyro Park',
    alternateName: [
      'Vaili Pyro Park Sivakasi',
      'VPP Sivakasi',
      'Vaili Crackers',
      'Vaili Pyro Park Online Crackers',
      'வைலி பைரோ பார்க்',
    ],
    url: canonicalUrl,
    inLanguage: ['en-IN', 'ta-IN'],
    description:
      'Official website of Vaili Pyro Park, Sivakasi. Buy genuine Diwali crackers and fireworks online at direct factory wholesale rates with doorstep delivery across India.',
    publisher: {
      '@id': `${siteUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  // 2. Organization Schema (Establishes brand identity, logo, and verified contact points)
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: 'Vaili Pyro Park',
    legalName: 'Vaili Pyro Park Fireworks',
    alternateName: ['வைலி பைரோ பார்க்', 'VPP'],
    url: canonicalUrl,
    logo: `${siteUrl}/logo.png`,
    image: `${siteUrl}/og-image.png`,
    description:
      'Licensed Sivakasi fireworks manufacturer and direct factory outlet offering Diwali crackers online with wholesale transparent pricing.',
    telephone: '+91-99521-08746',
    email: 'support@vailipyropark.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '142/A Bypass Road, Sivakasi Industrial Estate',
      addressLocality: 'Sivakasi',
      addressRegion: 'Tamil Nadu',
      postalCode: '626123',
      addressCountry: 'IN',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+91-99521-08746',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['en', 'ta'],
      },
    ],
  };

  // 3. Store / LocalBusiness Schema (For local map and store search snippets)
  const storeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Store',
    '@id': `${siteUrl}/#store`,
    name: 'Vaili Pyro Park',
    alternateName: ['வைலி பைரோ பார்க்', 'VPP Sivakasi Fireworks'],
    url: canonicalUrl,
    logo: `${siteUrl}/logo.png`,
    image: `${siteUrl}/og-image.png`,
    parentOrganization: {
      '@id': `${siteUrl}/#organization`,
    },
    description:
      'Direct Sivakasi factory prices on Diwali crackers, sparklers, ground chakkars, flower pots, rockets, fancy aerial shots & gift boxes. Fast doorstep delivery across Tamil Nadu & India.',
    telephone: '+91-99521-08746',
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'Cash on Delivery, UPI, Net Banking, Bank Transfer',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '142/A Bypass Road, Sivakasi Industrial Estate',
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

  // 4. SiteNavigationElement Schema (Enables Google Rich Sitelinks in Search)
  const navigationSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: [
      {
        '@type': 'SiteNavigationElement',
        position: 1,
        name: 'Fireworks Price List 2026',
        description: 'Direct factory wholesale price list of Sivakasi crackers with instant quick-add ordering.',
        url: `${siteUrl}/#catalog`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 2,
        name: 'Track Your Order',
        description: 'Real-time live parcel tracking for your booked Sivakasi fireworks.',
        url: `${siteUrl}/track-order`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 3,
        name: 'Sparklers & Chakkars',
        description: 'Standard electric sparklers, color sparklers, and ground chakkars.',
        url: `${siteUrl}/#catalog`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 4,
        name: 'Flower Pots & Fountains',
        description: 'Colorful flower pots, giant fountains, and crackling sparkle pots.',
        url: `${siteUrl}/#catalog`,
      },
      {
        '@type': 'SiteNavigationElement',
        position: 5,
        name: 'Fancy Aerial Shots & Sky Rockets',
        description: 'Multi-color repeater aerial shots, sound rockets, and night sky fancy crackers.',
        url: `${siteUrl}/#catalog`,
      },
    ],
  };

  // 5. BreadcrumbList Schema (Produces clean breadcrumb links in search results)
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: canonicalUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Diwali Crackers Catalog 2026',
        item: `${siteUrl}/#catalog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'Order Tracking',
        item: `${siteUrl}/track-order`,
      },
    ],
  };

  // 6. FAQPage Schema (Enables expandable FAQ Rich Snippets in Google Search)
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
          text: 'The minimum order requirement for Tamil Nadu (Home State) is ₹3,000, and for other Indian states is ₹5,000. All orders include safe packing and direct lorry transport dispatch from Sivakasi.',
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
          text: 'You can easily check your delivery status on our dedicated Track Order page anytime by entering your Order ID or 10-digit phone number.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(navigationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
};

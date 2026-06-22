import type { Metadata, Viewport } from 'next';
import { Inter, Instrument_Serif } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { ThemeProvider } from '../components/shared/ThemeProvider';
import GoogleProvider from '../components/shared/GoogleProvider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: '400',
  display: 'swap',
});

const BASE_URL = 'https://hubnest.in';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#080E1A' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'HubNest CRM — Smart CRM for Growing Businesses',
    template: '%s | HubNest CRM',
  },
  description:
    'HubNest CRM is an all-in-one platform for managing leads, automating campaigns across WhatsApp, Email & Meta, tracking invoices, and growing revenue — built for sales, marketing, and support teams.',
  keywords: [
    'CRM software India',
    'lead management CRM',
    'WhatsApp CRM',
    'marketing automation',
    'sales CRM',
    'email campaigns',
    'invoice management',
    'HubNest CRM',
    'multi-tenant CRM',
    'SMB CRM',
    'CRM for agencies',
    'automation builder',
  ],
  authors: [{ name: 'SRJ Global Tech', url: BASE_URL }],
  creator: 'SRJ Global Tech',
  publisher: 'SRJ Global Tech',
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
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: BASE_URL,
    siteName: 'HubNest CRM',
    title: 'HubNest CRM — Smart CRM for Growing Businesses',
    description:
      'Manage leads, automate campaigns on WhatsApp, Email & Meta, track invoices, and scale revenue — all in one platform.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HubNest CRM Dashboard Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HubNest CRM — Smart CRM for Growing Businesses',
    description:
      'All-in-one CRM with WhatsApp automation, AI insights, and invoicing — built for teams that ship.',
    images: ['/og-image.png'],
    creator: '@HubNestCRM',
    site: '@HubNestCRM',
  },
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32x32.png',
  },
  manifest: '/site.webmanifest',
  category: 'technology',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${instrumentSerif.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        <Script
          id="theme-script"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (saved === 'dark' || (!saved && prefersDark)) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.classList.remove('light');
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.classList.add('light');
                }
              } catch (_) {}
            `,
          }}
        />
        {/* JSON-LD Organization schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'HubNest CRM',
              url: BASE_URL,
              applicationCategory: 'BusinessApplication',
              operatingSystem: 'Web',
              description:
                'All-in-one CRM platform for managing leads, automating campaigns, tracking invoices, and scaling revenue.',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'INR',
                description: '14-day free trial, no credit card required',
              },
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: '4.9',
                reviewCount: '1200',
                bestRating: '5',
              },
              author: {
                '@type': 'Organization',
                name: 'SRJ Global Tech',
                url: BASE_URL,
              },
            }),
          }}
        />
        {/* JSON-LD FAQ schema */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'What is HubNest CRM and who is it for?',
                  acceptedAnswer: { '@type': 'Answer', text: 'HubNest CRM is an all-in-one customer relationship and marketing platform built for growing teams combining lead management, automated campaigns, AI-driven insights, invoicing, and team collaboration.' },
                },
                {
                  '@type': 'Question',
                  name: 'Is there a free trial?',
                  acceptedAnswer: { '@type': 'Answer', text: 'Yes. HubNest offers a 14-day free trial on all paid plans with no credit card required.' },
                },
                {
                  '@type': 'Question',
                  name: 'What channels does HubNest support for campaigns?',
                  acceptedAnswer: { '@type': 'Answer', text: 'Email (SMTP), WhatsApp Business API, SMS (Twilio), Meta/Facebook Ads, Instagram DM, Push Notifications, and custom HTTP webhooks.' },
                },
                {
                  '@type': 'Question',
                  name: 'Can I automate marketing and sales workflows?',
                  acceptedAnswer: { '@type': 'Answer', text: 'Yes. The Automation Builder lets you visually wire together triggers, conditions, AI nodes, and actions connecting WhatsApp, Email, Meta Ads, Webhooks, Slack, Discord, and more.' },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full bg-background text-foreground transition-colors duration-200">
        <ThemeProvider>
          <GoogleProvider>
            {children}
          </GoogleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

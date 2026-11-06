import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import { RegisterServiceWorker } from '@/components/pwa/RegisterServiceWorker';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://kindredmarketplace.com'),
  title: {
    default: 'Kindred · A better way to connect',
    template: '%s · Kindred',
  },
  description:
    'Families and independent home caregivers, connected directly. Every caregiver is background-checked, ID-verified, insured and experienced. Gainesville, Florida.',
  applicationName: 'Kindred',
  // Pre-launch previews (NEXT_PUBLIC_NOINDEX=1) stay out of search engines.
  robots: process.env.NEXT_PUBLIC_NOINDEX === '1' ? { index: false, follow: false } : undefined,
  appleWebApp: {
    capable: true,
    title: 'Kindred',
    statusBarStyle: 'default',
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: 'Kindred',
    description: 'A better way to connect.',
    type: 'website',
    siteName: 'Kindred',
  },
};

export const viewport: Viewport = {
  themeColor: '#FBFAF6',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-cream text-ink antialiased">
        {/* Sticky banner — only renders when an admin is impersonating someone */}
        <Suspense fallback={null}>
          <ImpersonationBanner />
        </Suspense>
        {children}
        <RegisterServiceWorker />
        <InstallPrompt />
      </body>
    </html>
  );
}

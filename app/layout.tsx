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

const SPLASH = [
  { url: '/splash/splash-1320x2868.png', media: '(device-width: 440px) and (device-height: 956px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { url: '/splash/splash-1290x2796.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { url: '/splash/splash-1206x2622.png', media: '(device-width: 402px) and (device-height: 874px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { url: '/splash/splash-1179x2556.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { url: '/splash/splash-1170x2532.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { url: '/splash/splash-1284x2778.png', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { url: '/splash/splash-1125x2436.png', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { url: '/splash/splash-1242x2688.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)' },
  { url: '/splash/splash-828x1792.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
  { url: '/splash/splash-750x1334.png', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
  { url: '/splash/splash-640x1136.png', media: '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2) and (orientation: portrait)' },
];

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
    // iPhone launch screen (installed app): the K on cream, in the exact spot
    // where the loading animation starts, so it flows straight into it.
    startupImage: SPLASH,
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

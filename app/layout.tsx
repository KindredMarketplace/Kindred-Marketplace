import type { Metadata } from 'next';
import { Inter, Fraunces, JetBrains_Mono } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import ImpersonationBanner from '@/components/ImpersonationBanner';

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
  title: 'Kindred — Compassionate care, when you need it most',
  description:
    'A Florida-first marketplace connecting families with vetted Certified Nursing Assistants.',
  openGraph: {
    title: 'Kindred',
    description: 'Compassionate care, when you need it most.',
    type: 'website',
  },
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
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import './globals.css';

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
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="bg-cream text-stone-900 antialiased">{children}</body>
    </html>
  );
}

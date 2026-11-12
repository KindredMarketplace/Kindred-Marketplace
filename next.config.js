/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

// Content Security Policy. Next.js needs 'unsafe-inline' for its own bootstrap
// scripts (no nonce middleware yet); everything else is locked to this site,
// Supabase, Google Fonts, Stripe's hosted checkout / billing pages, and the
// OpenFreeMap map tiles (the map draws in a blob: web worker).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://fibrhkrdyadnuebwovac.supabase.co https://images.unsplash.com",
  "media-src 'self' blob: https://fibrhkrdyadnuebwovac.supabase.co",
  `connect-src 'self' https://fibrhkrdyadnuebwovac.supabase.co wss://fibrhkrdyadnuebwovac.supabase.co https://tiles.openfreemap.org${isDev ? ' ws:' : ''}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=()' },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // The service worker must never be cached by the browser's HTTP cache.
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }] },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fibrhkrdyadnuebwovac.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Retired areas (Oct–Nov 2026 platform reset). Code lives in /_archive.
  async redirects() {
    return [
      { source: '/business', destination: '/', permanent: false },
      { source: '/business/:path*', destination: '/', permanent: false },
      { source: '/for-business', destination: '/', permanent: false },
      { source: '/become-a-cna', destination: '/apply', permanent: false },
      { source: '/become-a-cna/:path*', destination: '/apply', permanent: false },
      { source: '/training-partners', destination: '/caregiver-resources', permanent: false },
      { source: '/insurance-billing', destination: '/pricing', permanent: false },
      { source: '/client/billing', destination: '/client/membership', permanent: false },
      { source: '/cna/earnings', destination: '/cna/membership', permanent: false },
      { source: '/cna/earnings/:path*', destination: '/cna/membership', permanent: false },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // for document uploads
    },
  },
};

module.exports = nextConfig;

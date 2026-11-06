/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // for document uploads
    },
  },
};

module.exports = nextConfig;
